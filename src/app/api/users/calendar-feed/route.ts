import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchContests, type ContestPlatform } from "@/lib/contests";

export const dynamic = "force-dynamic";

const ALL_PLATFORMS: ContestPlatform[] = ["codeforces", "atcoder", "leetcode", "codechef"];

// ICS text escaping: backslash, semicolon, comma, and newlines are special.
function escapeICS(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// UTC timestamp in iCalendar basic format: YYYYMMDDTHHMMSSZ
function fmtDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.calendarToken, token))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Resolve requested platforms, ignoring unknown values.
  const requested = searchParams.get("platforms")?.split(",").map((p) => p.trim());
  const platforms: ContestPlatform[] = requested?.length
    ? ALL_PLATFORMS.filter((p) => requested.includes(p))
    : ALL_PLATFORMS;

  const contests = await fetchContests(platforms.length ? platforms : ALL_PLATFORMS);

  // Build ICS
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ITL//Contest Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(`ITL Contests (${user.username})`)}`,
  ];

  const dtStamp = fmtDate(new Date());

  for (const contest of contests) {
    const start = new Date(contest.start_time);
    if (isNaN(start.getTime())) continue;
    const end = new Date(start.getTime() + Number(contest.duration || 0) * 1000);

    icsLines.push(
      "BEGIN:VEVENT",
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${fmtDate(start)}`,
      `DTEND:${fmtDate(end)}`,
      `SUMMARY:${escapeICS(`[${contest.site}] ${contest.name}`)}`,
      `URL:${escapeICS(contest.url)}`,
      `DESCRIPTION:${escapeICS(`Contest on ${contest.site}\nLink: ${contest.url}`)}`,
      `UID:${escapeICS(contest.site)}-${start.getTime()}@itl`,
      "END:VEVENT"
    );
  }

  icsLines.push("END:VCALENDAR");

  return new NextResponse(icsLines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=itl-contests.ics",
    },
  });
}
