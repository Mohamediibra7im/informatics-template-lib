import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json([]);

  try {
    const list = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        icon: categories.icon,
      })
      .from(categories)
      .orderBy(asc(categories.name));

    return NextResponse.json(list);
  } catch (err) {
    console.error("Error fetching categories:", err);
    return NextResponse.json([]);
  }
}
