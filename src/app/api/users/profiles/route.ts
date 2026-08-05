import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromCookie, getVerificationToken } from "@/lib/auth";

// Only accept avatar URLs that point at our UploadThing storage, so a user
// can't store an arbitrary external URL that then renders in an <img> on their
// public profile (tracking beacon / open image relay).
function isAllowedAvatar(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === "utfs.io" || h === "ufs.sh" || h.endsWith(".ufs.sh");
  } catch {
    return false;
  }
}

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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const avatar = body.avatarUrl !== undefined ? body.avatarUrl?.trim() || null : undefined;
  if (avatar && !isAllowedAvatar(avatar)) {
    return NextResponse.json({ error: "avatarUrl must be an UploadThing URL" }, { status: 400 });
  }

  // Ensure row exists
  await db.insert(userProfiles).values({ userId: session.userId }).onConflictDoNothing();

  await db
    .update(userProfiles)
    .set({
      name: body.name !== undefined ? body.name?.trim() || null : undefined,
      bio: body.bio !== undefined ? body.bio?.trim() || null : undefined,
      avatarUrl: avatar,
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
