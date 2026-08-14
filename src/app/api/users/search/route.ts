import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { or, ilike, ne, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  // Find registered users matching username or email, excluding requester
  const searchPattern = `%${q}%`;
  const results = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        ne(users.id, session.userId),
        or(
          ilike(users.username, searchPattern),
          ilike(users.email, searchPattern)
        )
      )
    )
    .limit(8);

  return NextResponse.json({ users: results });
}
