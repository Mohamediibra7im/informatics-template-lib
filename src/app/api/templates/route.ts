import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { templates, templateCodes } from "@/db/schema";
import { asc, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json([]);

  try {
    const { searchParams } = new URL(request.url);
    const includeCodes = searchParams.get("includeCodes") === "true";

    const allTemplates = await db
      .select({
        id: templates.id,
        title: templates.title,
        slug: templates.slug,
        categoryId: templates.categoryId,
        notes: templates.notes,
      })
      .from(templates)
      .orderBy(asc(templates.title))
      .limit(500);

    if (!includeCodes) {
      return NextResponse.json(allTemplates);
    }

    const ids = allTemplates.map((t) => t.id);
    const allCodes = ids.length
      ? await db
          .select({
            templateId: templateCodes.templateId,
            language: templateCodes.language,
            code: templateCodes.code,
          })
          .from(templateCodes)
          .where(inArray(templateCodes.templateId, ids))
      : [];

    const codesMap = new Map<number, { language: string; code: string }[]>();
    for (const c of allCodes) {
      if (!codesMap.has(c.templateId)) {
        codesMap.set(c.templateId, []);
      }
      codesMap.get(c.templateId)!.push({ language: c.language, code: c.code });
    }

    const result = allTemplates.map((t) => ({
      ...t,
      codes: codesMap.get(t.id) || [],
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error fetching public templates:", err);
    return NextResponse.json([]);
  }
}
