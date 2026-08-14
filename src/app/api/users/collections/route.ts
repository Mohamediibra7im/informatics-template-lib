import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userCollections, userCollectionItems, userCollectionMembers, users } from "@/db/schema";
import { and, eq, count, inArray } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  // 1. Find collection IDs owned by the user
  const owned = await db
    .select({ id: userCollections.id })
    .from(userCollections)
    .where(eq(userCollections.userId, session.userId));

  // 2. Find collection IDs where user is a team collaborator
  const memberships = await db
    .select({ id: userCollectionMembers.collectionId })
    .from(userCollectionMembers)
    .where(eq(userCollectionMembers.userId, session.userId));

  const allIds = Array.from(
    new Set([...owned.map((c) => c.id), ...memberships.map((m) => m.id)])
  );

  if (allIds.length === 0) {
    return NextResponse.json({ collections: [] });
  }

  // 3. Fetch detailed collections with item counts and owner username
  const collections = await db
    .select({
      id: userCollections.id,
      name: userCollections.name,
      description: userCollections.description,
      ownerId: userCollections.userId,
      ownerUsername: users.username,
      createdAt: userCollections.createdAt,
      itemCount: count(userCollectionItems.id),
    })
    .from(userCollections)
    .innerJoin(users, eq(userCollections.userId, users.id))
    .leftJoin(userCollectionItems, eq(userCollections.id, userCollectionItems.collectionId))
    .where(inArray(userCollections.id, allIds))
    .groupBy(userCollections.id, users.username);

  // 4. Fetch team member counts for each collection
  const memberCounts = await db
    .select({
      collectionId: userCollectionMembers.collectionId,
      memberCount: count(userCollectionMembers.id),
    })
    .from(userCollectionMembers)
    .where(inArray(userCollectionMembers.collectionId, allIds))
    .groupBy(userCollectionMembers.collectionId);

  const memberCountMap = new Map(memberCounts.map((m) => [m.collectionId, Number(m.memberCount)]));

  const collectionsWithMetadata = collections.map((c) => ({
    ...c,
    isOwner: c.ownerId === session.userId,
    memberCount: (memberCountMap.get(c.id) || 0) + 1, // +1 includes owner
  }));

  return NextResponse.json({ collections: collectionsWithMetadata });
}

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const [collection] = await db
    .insert(userCollections)
    .values({
      userId: session.userId,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .returning();

  return NextResponse.json({
    success: true,
    collection: {
      ...collection,
      isOwner: true,
      ownerId: session.userId,
      ownerUsername: session.username,
      itemCount: 0,
      memberCount: 1,
    },
  });
}

export async function DELETE(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Collection id is required" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  // Only the owner can delete the collection
  await db
    .delete(userCollections)
    .where(and(eq(userCollections.id, id), eq(userCollections.userId, session.userId)));

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, description } = await request.json();
  if (!id) return NextResponse.json({ error: "Collection id is required" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  // Check if owner or member
  const [collection] = await db
    .select()
    .from(userCollections)
    .where(eq(userCollections.id, id))
    .limit(1);

  if (!collection) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

  const isOwner = collection.userId === session.userId;
  const [membership] = await db
    .select()
    .from(userCollectionMembers)
    .where(and(eq(userCollectionMembers.collectionId, id), eq(userCollectionMembers.userId, session.userId)))
    .limit(1);

  if (!isOwner && !membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: { name?: string; description?: string | null } = {};
  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: "Collection name cannot be empty" }, { status: 400 });
    updateData.name = name.trim();
  }
  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }

  const [updated] = await db
    .update(userCollections)
    .set(updateData)
    .where(eq(userCollections.id, id))
    .returning();

  return NextResponse.json({ success: true, collection: updated });
}
