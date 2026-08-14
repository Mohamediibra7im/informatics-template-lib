import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userCollectionItems, userCollections, userCollectionMembers, templates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";

async function verifyCollectionAccess(db: any, collectionId: number, userId: number) {
  const [collection] = await db
    .select()
    .from(userCollections)
    .where(eq(userCollections.id, collectionId))
    .limit(1);

  if (!collection) return { hasAccess: false, isOwner: false, collection: null };

  if (collection.userId === userId) {
    return { hasAccess: true, isOwner: true, collection };
  }

  const [membership] = await db
    .select()
    .from(userCollectionMembers)
    .where(
      and(
        eq(userCollectionMembers.collectionId, collectionId),
        eq(userCollectionMembers.userId, userId)
      )
    )
    .limit(1);

  if (membership) {
    return { hasAccess: true, isOwner: false, collection, membership };
  }

  return { hasAccess: false, isOwner: false, collection: null };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const collectionId = parseInt(id, 10);
  if (isNaN(collectionId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { hasAccess, isOwner, collection } = await verifyCollectionAccess(db, collectionId, session.userId);
  if (!hasAccess || !collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await db
    .select({
      id: userCollectionItems.id,
      templateId: userCollectionItems.templateId,
      templateTitle: templates.title,
      templateSlug: templates.slug,
      addedAt: userCollectionItems.addedAt,
    })
    .from(userCollectionItems)
    .innerJoin(templates, eq(userCollectionItems.templateId, templates.id))
    .where(eq(userCollectionItems.collectionId, collectionId));

  return NextResponse.json({ collection: { ...collection, isOwner }, items });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const collectionId = parseInt(id, 10);
  if (isNaN(collectionId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { templateId } = await request.json();
  if (!templateId) return NextResponse.json({ error: "templateId is required" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { hasAccess } = await verifyCollectionAccess(db, collectionId, session.userId);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Prevent duplicates
  const existing = await db
    .select()
    .from(userCollectionItems)
    .where(and(
      eq(userCollectionItems.collectionId, collectionId),
      eq(userCollectionItems.templateId, templateId)
    ))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ success: true, action: "already_exists" });
  }

  await db.insert(userCollectionItems).values({
    collectionId,
    templateId,
  });

  return NextResponse.json({ success: true, action: "added" });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const collectionId = parseInt(id, 10);
  if (isNaN(collectionId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { templateId } = await request.json();
  if (!templateId) return NextResponse.json({ error: "templateId is required" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { hasAccess } = await verifyCollectionAccess(db, collectionId, session.userId);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db
    .delete(userCollectionItems)
    .where(and(
      eq(userCollectionItems.collectionId, collectionId),
      eq(userCollectionItems.templateId, templateId)
    ));

  return NextResponse.json({ success: true });
}
