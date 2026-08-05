import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const rows = await db.select().from(siteSettings);
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json(settings);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const body = await request.json();

    for (const [key, val] of Object.entries(body)) {
      if (typeof val === "string" || typeof val === "boolean") {
        await db
          .insert(siteSettings)
          .values({ key, value: String(val) })
          .onConflictDoUpdate({
            target: siteSettings.key,
            set: { value: String(val) },
          });
      }
    }

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
