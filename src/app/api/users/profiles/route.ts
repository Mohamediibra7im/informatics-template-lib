import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromCookie, getVerificationToken } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  let [profile] = await db
    .select({
      id: userProfiles.id,
      userId: userProfiles.userId,
      name: userProfiles.name,
      bio: userProfiles.bio,
      avatarUrl: userProfiles.avatarUrl,
      codeforcesHandle: userProfiles.codeforcesHandle,
      atcoderHandle: userProfiles.atcoderHandle,
      leetcodeHandle: userProfiles.leetcodeHandle,
      codechefHandle: userProfiles.codechefHandle,
      ratingGoal: userProfiles.ratingGoal,
      updatedAt: userProfiles.updatedAt,
      calendarToken: users.calendarToken,
    })
    .from(userProfiles)
    .innerJoin(users, eq(userProfiles.userId, users.id))
    .where(eq(userProfiles.userId, session.userId))
    .limit(1);

  if (!profile) {
    // Upsert default profile row if missing
    await db.insert(userProfiles).values({ userId: session.userId }).onConflictDoNothing();
    [profile] = await db
      .select({
        id: userProfiles.id,
        userId: userProfiles.userId,
        name: userProfiles.name,
        bio: userProfiles.bio,
        avatarUrl: userProfiles.avatarUrl,
        codeforcesHandle: userProfiles.codeforcesHandle,
        atcoderHandle: userProfiles.atcoderHandle,
        leetcodeHandle: userProfiles.leetcodeHandle,
        codechefHandle: userProfiles.codechefHandle,
        ratingGoal: userProfiles.ratingGoal,
        updatedAt: userProfiles.updatedAt,
        calendarToken: users.calendarToken,
      })
      .from(userProfiles)
      .innerJoin(users, eq(userProfiles.userId, users.id))
      .where(eq(userProfiles.userId, session.userId))
      .limit(1);
  }

  return NextResponse.json({
    profile: profile
      ? { ...profile, verificationToken: await getVerificationToken(session.userId) }
      : null,
  });
}

export async function PUT(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  // Ensure row exists
  await db.insert(userProfiles).values({ userId: session.userId }).onConflictDoNothing();

  await db
    .update(userProfiles)
    .set({
      name: body.name !== undefined ? body.name?.trim() || null : undefined,
      bio: body.bio !== undefined ? body.bio?.trim() || null : undefined,
      avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl?.trim() || null : undefined,
      codeforcesHandle: body.codeforcesHandle !== undefined ? body.codeforcesHandle?.trim() || null : undefined,
      atcoderHandle: body.atcoderHandle !== undefined ? body.atcoderHandle?.trim() || null : undefined,
      leetcodeHandle: body.leetcodeHandle !== undefined ? body.leetcodeHandle?.trim() || null : undefined,
      codechefHandle: body.codechefHandle !== undefined ? body.codechefHandle?.trim() || null : undefined,
      ratingGoal: body.ratingGoal !== undefined ? body.ratingGoal?.trim() || null : undefined,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, session.userId));

  return NextResponse.json({ success: true });
}
