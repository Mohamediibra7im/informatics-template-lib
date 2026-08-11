import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userCollections, userCollectionItems } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { collectionId, templateIds } = await request.json();
    if (!collectionId || !Array.isArray(templateIds) || templateIds.length === 0) {
      return NextResponse.json({ error: "Collection ID and template IDs are required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

    // Verify ownership of the collection
    const [collection] = await db
      .select()
      .from(userCollections)
      .where(and(eq(userCollections.id, collectionId), eq(userCollections.userId, session.userId)));

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Fetch existing items to avoid duplicates
    const existing = await db
      .select({ templateId: userCollectionItems.templateId })
      .from(userCollectionItems)
      .where(
        and(
          eq(userCollectionItems.collectionId, collectionId),
          inArray(userCollectionItems.templateId, templateIds)
        )
      );

    const existingIds = new Set(existing.map((e) => e.templateId));
    const newTemplateIds = templateIds.filter((id: number) => !existingIds.has(id));

    if (newTemplateIds.length > 0) {
      await db.insert(userCollectionItems).values(
        newTemplateIds.map((templateId: number) => ({
          collectionId,
          templateId,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      addedCount: newTemplateIds.length,
      alreadyInCollection: existingIds.size,
    });
  } catch (err) {
    console.error("Error batch adding templates to collection:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
