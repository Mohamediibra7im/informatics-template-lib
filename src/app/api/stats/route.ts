import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { count } from "drizzle-orm";

// Public, no auth. Total registered users — consumed by external sites (portfolio).
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=300, s-maxage=3600",
};

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const [row] = await db.select({ value: count() }).from(users);
    // Shape { count } matches the portfolio's ProjectUsers consumer (reads data.count).
    return NextResponse.json({ count: row?.value ?? 0 }, { headers: CORS });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
