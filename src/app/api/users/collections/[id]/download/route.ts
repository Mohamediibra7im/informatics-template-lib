import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  userCollections,
  userCollectionItems,
  templates,
  categories,
  userTemplates,
  templateCodes,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";
import JSZip from "jszip";

function sanitizeFileName(name: string): string {
  const sanitized = name.replace(/[/\\?%*:|"<>]/g, "_").trim().replace(/^\.+/, "");
  return sanitized || "file";
}

function isCppLanguage(lang: string): boolean {
  const normalized = lang.trim().toLowerCase();
  return normalized === "cpp" || normalized === "c++" || normalized === "cplusplus";
}

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

  // 1. Verify user owns the collection
  const [collection] = await db
    .select()
    .from(userCollections)
    .where(and(eq(userCollections.id, collectionId), eq(userCollections.userId, session.userId)))
    .limit(1);

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  // 2. Fetch collection items with template and category data
  const items = await db
    .select({
      templateId: templates.id,
      templateTitle: templates.title,
      templateSlug: templates.slug,
      categoryName: categories.name,
    })
    .from(userCollectionItems)
    .innerJoin(templates, eq(userCollectionItems.templateId, templates.id))
    .leftJoin(categories, eq(templates.categoryId, categories.id))
    .where(eq(userCollectionItems.collectionId, collectionId));

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Collection has no templates to download" },
      { status: 400 }
    );
  }

  const templateIds = items.map((item) => item.templateId);

  // 3. Fetch user custom code overrides for C++
  const userCustomCodes = await db
    .select({
      templateId: userTemplates.templateId,
      customCode: userTemplates.customCode,
      language: userTemplates.language,
    })
    .from(userTemplates)
    .where(
      and(
        eq(userTemplates.userId, session.userId),
        inArray(userTemplates.templateId, templateIds)
      )
    );

  // 4. Fetch default template codes for C++
  const defaultCodes = await db
    .select({
      templateId: templateCodes.templateId,
      code: templateCodes.code,
      language: templateCodes.language,
    })
    .from(templateCodes)
    .where(inArray(templateCodes.templateId, templateIds));

  // Build maps for efficient lookup
  const userCodeMap = new Map<number, string>();
  for (const uc of userCustomCodes) {
    if (isCppLanguage(uc.language) && uc.customCode.trim()) {
      userCodeMap.set(uc.templateId, uc.customCode);
    }
  }

  const defaultCodeMap = new Map<number, string>();
  for (const dc of defaultCodes) {
    if (isCppLanguage(dc.language) && dc.code.trim()) {
      defaultCodeMap.set(dc.templateId, dc.code);
    }
  }

  // 5. Build ZIP file using JSZip
  const zip = new JSZip();
  const rootFolderName = sanitizeFileName(collection.name);
  const rootFolder = zip.folder(rootFolderName) || zip;

  let addedCount = 0;
  const pathTracker = new Map<string, number>();

  for (const item of items) {
    // Resolve C++ code: custom code override first, then default code
    const cppCode = userCodeMap.get(item.templateId) || defaultCodeMap.get(item.templateId);
    if (!cppCode) {
      // Skip templates without C++ code
      continue;
    }

    const categoryFolder = sanitizeFileName(item.categoryName || "Uncategorized");
    const baseTitle = sanitizeFileName(item.templateTitle || item.templateSlug || "template");

    // Track path collisions within the category folder
    const pathKey = `${categoryFolder}/${baseTitle}`.toLowerCase();
    const count = (pathTracker.get(pathKey) || 0) + 1;
    pathTracker.set(pathKey, count);

    const fileName = count === 1 ? `${baseTitle}.cpp` : `${baseTitle}_${count}.cpp`;
    const targetFolder = rootFolder.folder(categoryFolder);

    if (targetFolder) {
      targetFolder.file(fileName, cppCode);
      addedCount++;
    }
  }

  if (addedCount === 0) {
    return NextResponse.json(
      { error: "No C++ codes found in this collection" },
      { status: 404 }
    );
  }

  const zipContent = await zip.generateAsync({ type: "uint8array" });
  const sanitizedArchiveName = `${rootFolderName.replace(/\s+/g, "_")}.zip`;

  return new NextResponse(Buffer.from(zipContent), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${sanitizedArchiveName}"`,
    },
  });
}
