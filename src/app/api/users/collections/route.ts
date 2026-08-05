import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userCollections, userCollectionItems } from "@/db/schema";
import { and, eq, count } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const collections = await db
    .select({
      id: userCollections.id,
      name: userCollections.name,
      description: userCollections.description,
      createdAt: userCollections.createdAt,
      itemCount: count(userCollectionItems.id),
    })
    .from(userCollections)
    .leftJoin(userCollectionItems, eq(userCollections.id, userCollectionItems.collectionId))
    .where(eq(userCollections.userId, session.userId))
    .groupBy(userCollections.id);

  return NextResponse.json({ collections });
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

  return NextResponse.json({ success: true, collection: { ...collection, itemCount: 0 } });
}

export async function DELETE(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Collection id is required" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

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
    .where(and(eq(userCollections.id, id), eq(userCollections.userId, session.userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

  return NextResponse.json({ success: true, collection: updated });
}
