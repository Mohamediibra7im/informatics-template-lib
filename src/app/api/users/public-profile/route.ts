import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users, userProfiles } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("username") || searchParams.get("handle") || searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  const term = query.trim();

  try {
    const [res] = await db
      .select({
        id: users.id,
        username: users.username,
        name: userProfiles.name,
        bio: userProfiles.bio,
        avatarUrl: userProfiles.avatarUrl,
        codeforcesHandle: userProfiles.codeforcesHandle,
        atcoderHandle: userProfiles.atcoderHandle,
        leetcodeHandle: userProfiles.leetcodeHandle,
        codechefHandle: userProfiles.codechefHandle,
        ratingGoal: userProfiles.ratingGoal,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(
        or(
          sql`LOWER(${users.username}) = LOWER(${term})`,
          sql`LOWER(${userProfiles.name}) = LOWER(${term})`,
          sql`LOWER(${userProfiles.codeforcesHandle}) = LOWER(${term})`
        )
      )
      .limit(1);

    if (!res) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: res });
  } catch (err) {
    console.error("Error fetching public profile:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
