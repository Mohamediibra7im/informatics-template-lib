import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { templates, templateCodes, categories } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam) return NextResponse.json([]);

  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  if (ids.length === 0) return NextResponse.json([]);

  return fetchBatchTemplates(ids);
}

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json([]);
    }
    const cleanIds = ids.map((n) => Number(n)).filter((n) => !isNaN(n));
    return fetchBatchTemplates(cleanIds);
  } catch {
    return NextResponse.json([]);
  }
}

async function fetchBatchTemplates(ids: number[]) {
  const db = getDb();
  if (!db) return NextResponse.json([]);

  try {
    const tmpls = await db
      .select({
        id: templates.id,
        title: templates.title,
        slug: templates.slug,
        description: templates.description,
        categoryId: templates.categoryId,
        complexity: templates.complexity,
        tags: templates.tags,
        notes: templates.notes,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(templates)
      .leftJoin(categories, eq(templates.categoryId, categories.id))
      .where(inArray(templates.id, ids));

    const codes = await db
      .select({
        templateId: templateCodes.templateId,
        language: templateCodes.language,
        code: templateCodes.code,
      })
      .from(templateCodes)
      .where(inArray(templateCodes.templateId, ids));

    const codesMap = new Map<number, { language: string; code: string }[]>();
    for (const c of codes) {
      if (!codesMap.has(c.templateId)) {
        codesMap.set(c.templateId, []);
      }
      codesMap.get(c.templateId)!.push({ language: c.language, code: c.code });
    }

    // Preserve requested ordering
    const tmplMap = new Map(tmpls.map((t) => [t.id, t]));
    const orderedResult = ids
      .map((id) => tmplMap.get(id))
      .filter(Boolean)
      .map((t) => ({
        ...t!,
        codes: codesMap.get(t!.id) || [],
      }));

    return NextResponse.json(orderedResult);
  } catch (err) {
    console.error("Error fetching batch templates:", err);
    return NextResponse.json([]);
  }
}
