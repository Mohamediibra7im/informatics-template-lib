import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users, userProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const list = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        calendarToken: users.calendarToken,
        codeforcesHandle: userProfiles.codeforcesHandle,
        atcoderHandle: userProfiles.atcoderHandle,
        leetcodeHandle: userProfiles.leetcodeHandle,
        codechefHandle: userProfiles.codechefHandle,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .orderBy(desc(users.createdAt));

    return NextResponse.json(list);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || !Number.isFinite(Number(id))) {
    return NextResponse.json({ error: "Valid user id is required" }, { status: 400 });
  }

  try {
    await db.delete(users).where(eq(users.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
