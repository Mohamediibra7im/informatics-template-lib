import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userTemplates, templates, userCollections, userCollectionMembers, userCollectionItems, users } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  // 1. Find all collection IDs owned by the user or where user is a collaborator
  const ownedColl = await db
    .select({ id: userCollections.id })
    .from(userCollections)
    .where(eq(userCollections.userId, session.userId));

  const memberColl = await db
    .select({ id: userCollectionMembers.collectionId })
    .from(userCollectionMembers)
    .where(eq(userCollectionMembers.userId, session.userId));

  const allCollIds = Array.from(
    new Set([...ownedColl.map((c) => c.id), ...memberColl.map((m) => m.id)])
  );

  let sharedUserIds: number[] = [session.userId];
  let collectionTemplateIds: number[] = [];

  if (allCollIds.length > 0) {
    const collOwners = await db
      .select({ userId: userCollections.userId })
      .from(userCollections)
      .where(inArray(userCollections.id, allCollIds));

    const collMembers = await db
      .select({ userId: userCollectionMembers.userId })
      .from(userCollectionMembers)
      .where(inArray(userCollectionMembers.collectionId, allCollIds));

    sharedUserIds = Array.from(
      new Set([
        session.userId,
        ...collOwners.map((o) => o.userId),
        ...collMembers.map((m) => m.userId),
      ])
    );

    const collItems = await db
      .select({ templateId: userCollectionItems.templateId })
      .from(userCollectionItems)
      .where(inArray(userCollectionItems.collectionId, allCollIds));

    collectionTemplateIds = Array.from(new Set(collItems.map((i) => i.templateId)));
  }

  // 2. Fetch custom templates created by the current user OR collection collaborators
  const items = await db
    .select({
      id: userTemplates.id,
      userId: userTemplates.userId,
      username: users.username,
      templateId: userTemplates.templateId,
      templateTitle: templates.title,
      templateSlug: templates.slug,
      customCode: userTemplates.customCode,
      language: userTemplates.language,
      updatedAt: userTemplates.updatedAt,
    })
    .from(userTemplates)
    .innerJoin(templates, eq(userTemplates.templateId, templates.id))
    .innerJoin(users, eq(userTemplates.userId, users.id))
    .where(inArray(userTemplates.userId, sharedUserIds))
    .orderBy(desc(userTemplates.updatedAt));

  const templateMap = new Map<
    number,
    (typeof items)[0] & { isShared: boolean; updatedBy: string }
  >();

  for (const item of items) {
    const isCurrentUser = item.userId === session.userId;
    const isInSharedCollection = collectionTemplateIds.includes(item.templateId);

    if (isCurrentUser) {
      templateMap.set(item.templateId, {
        ...item,
        isShared: false,
        updatedBy: item.username,
      });
    } else if (isInSharedCollection && !templateMap.has(item.templateId)) {
      templateMap.set(item.templateId, {
        ...item,
        isShared: true,
        updatedBy: item.username,
      });
    }
  }

  return NextResponse.json({ templates: Array.from(templateMap.values()) });
}

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId, customCode, language } = await request.json();

  if (!templateId || !customCode?.trim()) {
    return NextResponse.json({ error: "templateId and customCode are required" }, { status: 400 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  // Upsert: check if an entry already exists
  const existing = await db
    .select()
    .from(userTemplates)
    .where(and(eq(userTemplates.userId, session.userId), eq(userTemplates.templateId, templateId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userTemplates)
      .set({ customCode: customCode.trim(), language: language || "cpp", updatedAt: new Date() })
      .where(eq(userTemplates.id, existing[0].id));

    return NextResponse.json({ success: true, action: "updated" });
  }

  await db.insert(userTemplates).values({
    userId: session.userId,
    templateId,
    customCode: customCode.trim(),
    language: language || "cpp",
  });

  return NextResponse.json({ success: true, action: "created" });
}
