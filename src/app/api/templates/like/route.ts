import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const body = await request.json();
    const { templateId, action } = body;

    if (!templateId) {
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
    }

    const tid = Number(templateId);
    const isUnlike = action === "unlike";
    const session = await getSessionFromCookie();

    // Logged-in users get a per-user like record so the like shows up in their
    // dashboard and the aggregate counter can't be inflated by repeat clicks.
    if (session) {
      const [existing] = await db
        .select({ id: schema.templateLikes.id })
        .from(schema.templateLikes)
        .where(
          and(
            eq(schema.templateLikes.userId, session.userId),
            eq(schema.templateLikes.templateId, tid)
          )
        )
        .limit(1);

      if (isUnlike) {
        if (existing) {
          await db.delete(schema.templateLikes).where(eq(schema.templateLikes.id, existing.id));
          await db
            .update(schema.templates)
            .set({ likeCount: sql`GREATEST(0, ${schema.templates.likeCount} - 1)` })
            .where(eq(schema.templates.id, tid));
        }
        return NextResponse.json({ success: true, liked: false });
      }

      if (!existing) {
        await db
          .insert(schema.templateLikes)
          .values({ userId: session.userId, templateId: tid })
          .onConflictDoNothing();
        await db
          .update(schema.templates)
          .set({ likeCount: sql`${schema.templates.likeCount} + 1` })
          .where(eq(schema.templates.id, tid));
      }
      return NextResponse.json({ success: true, liked: true });
    }

    // Anonymous visitors: adjust the aggregate counter only. Duplicate-like
    // protection is best-effort via the client's localStorage guard.
    await db
      .update(schema.templates)
      .set({
        likeCount: isUnlike
          ? sql`GREATEST(0, ${schema.templates.likeCount} - 1)`
          : sql`${schema.templates.likeCount} + 1`,
      })
      .where(eq(schema.templates.id, tid));

    return NextResponse.json({ success: true, liked: !isUnlike });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
