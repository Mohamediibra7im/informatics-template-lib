import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { contributions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Full contribution owned by the signed-in user, used to pre-fill the contribute
// form for a resubmission. Only exposed while status is "changes_requested" so
// this can't be used to read arbitrary past submissions.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const contributionId = Number(id);
  if (!Number.isInteger(contributionId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(contributions)
    .where(
      and(
        eq(contributions.id, contributionId),
        eq(contributions.userId, session.userId),
        eq(contributions.status, "changes_requested")
      )
    )
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}
