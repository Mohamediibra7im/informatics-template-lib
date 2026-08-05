import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const rows = await db.select().from(categories).orderBy(categories.order);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const body = await request.json();
  const [category] = await db.insert(categories).values({
    name: body.name,
    slug: body.slug,
    description: body.description,
    icon: body.icon || "Code",
    color: body.color || "#3b82f6",
    order: body.order || 0,
    hidden: body.hidden ?? false,
  }).returning();

  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");

  return NextResponse.json(category, { status: 201 });
}

export async function PUT(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const body = await request.json();
  await db.update(categories)
    .set({
      name: body.name,
      slug: body.slug,
      description: body.description,
      icon: body.icon,
      color: body.color,
      order: body.order,
      hidden: body.hidden ?? false,
    })
    .where(eq(categories.id, body.id));

  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.delete(categories).where(eq(categories.id, Number(id)));
  return NextResponse.json({ success: true });
}
