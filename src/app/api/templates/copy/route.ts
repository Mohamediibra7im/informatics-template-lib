import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
    }

    await db
      .update(schema.templates)
      .set({
        copyCount: sql`${schema.templates.copyCount} + 1`,
      })
      .where(eq(schema.templates.id, Number(templateId)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
