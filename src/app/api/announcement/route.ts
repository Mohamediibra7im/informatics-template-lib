import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  linkText?: string;
  enabled: boolean;
  createdAt: number;
}

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ announcements: [] }, { status: 200 });

  try {
    // 1. Try reading the multi-announcements JSON array
    const multiRow = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "site_announcements"));

    if (multiRow.length > 0 && multiRow[0].value) {
      try {
        const parsed: AnnouncementItem[] = JSON.parse(multiRow[0].value);
        const activeOnly = parsed.filter((item) => item.enabled);
        return NextResponse.json({ announcements: activeOnly });
      } catch (e) {
        console.error("Error parsing site_announcements JSON:", e);
      }
    }

    // 2. Fallback to legacy single announcement setting if present
    const keys = [
      "announcement_enabled",
      "announcement_title",
      "announcement_message",
      "announcement_link",
      "announcement_link_text",
      "announcement_id",
    ];

    const rows = await db
      .select()
      .from(siteSettings)
      .where(inArray(siteSettings.key, keys));

    const settingsMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    if (settingsMap.announcement_enabled === "true" && settingsMap.announcement_title) {
      return NextResponse.json({
        announcements: [
          {
            id: settingsMap.announcement_id || "legacy_announcement",
            title: settingsMap.announcement_title,
            message: settingsMap.announcement_message || "",
            link: settingsMap.announcement_link || "",
            linkText: settingsMap.announcement_link_text || "EXPLORE FEATURE",
            enabled: true,
            createdAt: Date.now(),
          },
        ],
      });
    }

    return NextResponse.json({ announcements: [] });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    return NextResponse.json({ announcements: [] }, { status: 200 });
  }
}
