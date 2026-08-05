import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getSessionFromCookie } from "@/lib/auth";
import { sendNewContributionNotification } from "@/lib/email";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Sign in to view contributions" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const rows = await db
      .select({
        id: schema.contributions.id,
        type: schema.contributions.type,
        status: schema.contributions.status,
        title: schema.contributions.title,
        editReason: schema.contributions.editReason,
        adminNote: schema.contributions.adminNote,
        createdAt: schema.contributions.createdAt,
        reviewedAt: schema.contributions.reviewedAt,
        templateId: schema.contributions.templateId,
        templateTitle: schema.templates.title,
        templateSlug: schema.templates.slug,
      })
      .from(schema.contributions)
      .leftJoin(schema.templates, eq(schema.contributions.templateId, schema.templates.id))
      .where(eq(schema.contributions.userId, session.userId))
      .orderBy(desc(schema.contributions.createdAt));

    return NextResponse.json({ contributions: rows });
  } catch (err) {
    console.error("Error fetching contributions:", err);
    return NextResponse.json({ error: "Failed to fetch contributions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  // Contributions are tied to an account: identity comes from session + profile
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Sign in to contribute" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { type } = body;

  if (!type || !["new", "edit"].includes(type)) {
    return NextResponse.json({ error: "Invalid contribution type" }, { status: 400 });
  }

  // Fetch user profile for full Display Name and default Codeforces handle
  let contributorName = session.username;
  let defaultCfHandle: string | null = null;

  try {
    const [profile] = await db
      .select({
        name: schema.userProfiles.name,
        codeforcesHandle: schema.userProfiles.codeforcesHandle,
      })
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, session.userId))
      .limit(1);

    if (profile?.name?.trim()) {
      contributorName = profile.name.trim();
    }
    if (profile?.codeforcesHandle?.trim()) {
      defaultCfHandle = profile.codeforcesHandle.trim();
    }
  } catch {
    // Non-blocking profile lookup catch
  }

  const contributorCfHandle = body.contributorCfHandle?.trim() || defaultCfHandle;
  const contributorEmail = session.email;

  if (type === "new") {
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Template title is required" }, { status: 400 });
    }
    if (!body.codes || !Array.isArray(body.codes) || body.codes.length === 0) {
      return NextResponse.json({ error: "At least one code block is required" }, { status: 400 });
    }

    const slug =
      body.slug?.trim() ||
      body.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const [row] = await db
      .insert(schema.contributions)
      .values({
        type: "new",
        userId: session.userId,
        contributorName,
        contributorEmail,
        contributorCfHandle,
        title: body.title.trim(),
        slug,
        description: body.description?.trim() || "",
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        tags: Array.isArray(body.tags) ? body.tags : [],
        complexity: body.complexity?.trim() || null,
        notes: body.notes?.trim() || null,
        codes: body.codes,
      })
      .returning();

    // Best-effort admin notification; never block the submission on email.
    await sendNewContributionNotification(
      contributorName,
      "new",
      body.title.trim(),
      contributorCfHandle
    ).catch((err) => console.error("New contribution email failed:", err));

    return NextResponse.json({ id: row.id, message: "Submission received" }, { status: 201 });
  }

  if (type === "edit") {
    if (!body.templateId) {
      return NextResponse.json({ error: "Template ID is required for edit requests" }, { status: 400 });
    }
    if (!body.editReason?.trim()) {
      return NextResponse.json({ error: "Edit reason is required" }, { status: 400 });
    }

    const [row] = await db
      .insert(schema.contributions)
      .values({
        type: "edit",
        userId: session.userId,
        contributorName,
        contributorEmail,
        contributorCfHandle,
        templateId: Number(body.templateId),
        editReason: body.editReason.trim(),
        editCodes: body.editCodes || null,
        editNotes: body.editNotes?.trim() || null,
      })
      .returning();

    // Best-effort admin notification; never block the submission on email.
    const [tmpl] = await db
      .select({ title: schema.templates.title })
      .from(schema.templates)
      .where(eq(schema.templates.id, Number(body.templateId)))
      .limit(1);
    await sendNewContributionNotification(
      contributorName,
      "edit",
      tmpl?.title || `Template #${body.templateId}`,
      contributorCfHandle,
      body.editReason.trim()
    ).catch((err) => console.error("New contribution email failed:", err));

    return NextResponse.json({ id: row.id, message: "Edit request received" }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
