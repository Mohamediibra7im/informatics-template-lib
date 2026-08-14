import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userCollections, userCollectionMembers, users } from "@/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const collectionId = parseInt(id, 10);
  if (isNaN(collectionId)) {
    return NextResponse.json({ error: "Invalid collection ID" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  // 1. Fetch collection and check access
  const [collection] = await db
    .select({
      id: userCollections.id,
      name: userCollections.name,
      ownerId: userCollections.userId,
      ownerUsername: users.username,
      ownerEmail: users.email,
    })
    .from(userCollections)
    .innerJoin(users, eq(userCollections.userId, users.id))
    .where(eq(userCollections.id, collectionId))
    .limit(1);

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  // Check if user is owner or member
  const isOwner = collection.ownerId === session.userId;
  const [membership] = await db
    .select()
    .from(userCollectionMembers)
    .where(
      and(
        eq(userCollectionMembers.collectionId, collectionId),
        eq(userCollectionMembers.userId, session.userId)
      )
    )
    .limit(1);

  if (!isOwner && !membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Fetch all collaborators
  const collaborators = await db
    .select({
      memberId: userCollectionMembers.id,
      userId: users.id,
      username: users.username,
      email: users.email,
      role: userCollectionMembers.role,
      addedAt: userCollectionMembers.createdAt,
    })
    .from(userCollectionMembers)
    .innerJoin(users, eq(userCollectionMembers.userId, users.id))
    .where(eq(userCollectionMembers.collectionId, collectionId));

  return NextResponse.json({
    isOwner,
    owner: {
      id: collection.ownerId,
      username: collection.ownerUsername,
      email: collection.ownerEmail,
    },
    collaborators,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const collectionId = parseInt(id, 10);
  if (isNaN(collectionId)) {
    return NextResponse.json({ error: "Invalid collection ID" }, { status: 400 });
  }

  const { usernameOrEmail, role } = await request.json();
  const queryStr = usernameOrEmail?.trim();
  if (!queryStr) {
    return NextResponse.json({ error: "Username or email is required" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  // 1. Check if collection exists and requester is owner (or member)
  const [collection] = await db
    .select()
    .from(userCollections)
    .where(eq(userCollections.id, collectionId))
    .limit(1);

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const isOwner = collection.userId === session.userId;
  if (!isOwner) {
    return NextResponse.json(
      { error: "Only the collection owner can invite team members" },
      { status: 403 }
    );
  }

  // 2. Find target user by username or email
  const [targetUser] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(
      or(
        ilike(users.username, queryStr),
        ilike(users.email, queryStr)
      )
    )
    .limit(1);

  if (!targetUser) {
    return NextResponse.json(
      { error: `No registered user found with username or email "${queryStr}"` },
      { status: 404 }
    );
  }

  // 3. Prevent inviting owner
  if (targetUser.id === collection.userId) {
    return NextResponse.json(
      { error: "This user is already the owner of the collection" },
      { status: 400 }
    );
  }

  // 4. Check if user is already a member
  const existing = await db
    .select()
    .from(userCollectionMembers)
    .where(
      and(
        eq(userCollectionMembers.collectionId, collectionId),
        eq(userCollectionMembers.userId, targetUser.id)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: `@${targetUser.username} is already a member of this collection` },
      { status: 400 }
    );
  }

  // 5. Add user to collection members
  const [newMember] = await db
    .insert(userCollectionMembers)
    .values({
      collectionId,
      userId: targetUser.id,
      role: role === "viewer" ? "viewer" : "editor",
      invitedBy: session.userId,
    })
    .returning();

  return NextResponse.json({
    success: true,
    member: {
      memberId: newMember.id,
      userId: targetUser.id,
      username: targetUser.username,
      email: targetUser.email,
      role: newMember.role,
      addedAt: newMember.createdAt,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const collectionId = parseInt(id, 10);
  if (isNaN(collectionId)) {
    return NextResponse.json({ error: "Invalid collection ID" }, { status: 400 });
  }

  const { memberUserId } = await request.json();
  if (!memberUserId) {
    return NextResponse.json({ error: "memberUserId is required" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  // 1. Fetch collection details
  const [collection] = await db
    .select()
    .from(userCollections)
    .where(eq(userCollections.id, collectionId))
    .limit(1);

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  // Requester must be owner OR removing themselves
  const isOwner = collection.userId === session.userId;
  const isSelfRemove = memberUserId === session.userId;

  if (!isOwner && !isSelfRemove) {
    return NextResponse.json(
      { error: "Only collection owners or members themselves can remove access" },
      { status: 403 }
    );
  }

  // 2. Remove member
  await db
    .delete(userCollectionMembers)
    .where(
      and(
        eq(userCollectionMembers.collectionId, collectionId),
        eq(userCollectionMembers.userId, memberUserId)
      )
    );

  return NextResponse.json({ success: true });
}
