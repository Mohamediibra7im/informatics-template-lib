import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { snapshotTemplate } from "@/lib/template-history";

// A code block must be { language: string, code: string }. Reject anything else
// so a malformed payload can't crash the insert or write junk rows.
function validCodes(codes: unknown): codes is { language: string; code: string }[] {
  return (
    Array.isArray(codes) &&
    codes.every(
      (c) =>
        c && typeof c === "object" &&
        typeof (c as { language?: unknown }).language === "string" &&
        typeof (c as { code?: unknown }).code === "string"
    )
  );
}

export async function GET(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const id = searchParams.get("id");
  const includeCodes = searchParams.get("includeCodes") === "true";

  if (id) {
    const [row] = await db.select().from(schema.templates).where(eq(schema.templates.id, Number(id)));
    if (!row) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    const codes = await db.select().from(schema.templateCodes).where(eq(schema.templateCodes.templateId, Number(id)));
    return NextResponse.json({ ...row, codes });
  }

  const where = categoryId ? eq(schema.templates.categoryId, Number(categoryId)) : undefined;

  const rows = await db.query.templates.findMany({
    where,
    with: { 
      category: true, 
      codes: includeCodes ? true : undefined 
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const body = await request.json();

  if (typeof body.title !== "string" || !body.title.trim() ||
      typeof body.slug !== "string" || !body.slug.trim() ||
      !Number.isFinite(Number(body.categoryId))) {
    return NextResponse.json({ error: "title, slug and categoryId are required" }, { status: 400 });
  }
  if (body.codes !== undefined && !validCodes(body.codes)) {
    return NextResponse.json({ error: "codes must be { language, code } entries" }, { status: 400 });
  }

  const [template] = await db.insert(schema.templates).values({
    title: body.title,
    slug: body.slug,
    description: body.description || "",
    categoryId: Number(body.categoryId),
    tags: body.tags || [],
    complexity: body.complexity || "",
    notes: body.notes || "",
    hidden: body.hidden ?? false,
  }).returning();

  if (body.codes && template) {
    await db.insert(schema.templateCodes).values(
      body.codes.map((c: { language: string; code: string }) => ({
        templateId: template.id,
        language: c.language,
        code: c.code.trimEnd(), // ponytail: strip trailing newlines from code
      }))
    );
  }

  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/template/[slug]", "page");

  return NextResponse.json(template, { status: 201 });
}

export async function PUT(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const body = await request.json();

  if (!Number.isFinite(Number(body.id))) {
    return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
  }
  if (body.codes !== undefined && !validCodes(body.codes)) {
    return NextResponse.json({ error: "codes must be { language, code } entries" }, { status: 400 });
  }

  // Snapshot the existing version before overwriting, so it can be reverted.
  await snapshotTemplate(db, Number(body.id), body.historyReason || "Admin edit");

  const updateFields: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.slug !== undefined) updateFields.slug = body.slug;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.categoryId !== undefined) updateFields.categoryId = body.categoryId;
  if (body.tags !== undefined) updateFields.tags = body.tags;
  if (body.complexity !== undefined) updateFields.complexity = body.complexity;
  if (body.notes !== undefined) updateFields.notes = body.notes;
  if (body.hidden !== undefined) updateFields.hidden = body.hidden;

  await db.update(schema.templates)
    .set(updateFields)
    .where(eq(schema.templates.id, body.id));

  if (body.codes) {
    await db.delete(schema.templateCodes).where(eq(schema.templateCodes.templateId, body.id));
    await db.insert(schema.templateCodes).values(
      body.codes.map((c: { language: string; code: string }) => ({
        templateId: body.id,
        language: c.language,
        code: c.code.trimEnd(), // ponytail: strip trailing newlines from code
      }))
    );
  }

  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/template/[slug]", "page");

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || !Number.isFinite(Number(id))) {
    return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
  }

  await db.delete(schema.templates).where(eq(schema.templates.id, Number(id)));

  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");

  return NextResponse.json({ success: true });
}
