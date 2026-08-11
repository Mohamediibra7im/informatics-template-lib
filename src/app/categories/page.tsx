import { getDb, schema } from "@/db";
import { eq, sql, and, count } from "drizzle-orm";
import { CategoryCard } from "@/components/category-card";
import { Braces, Terminal } from "lucide-react";
import { TerminalBreadcrumb } from "@/components/terminal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Categories",
  description:
    "Browse all competitive programming algorithm categories — graphs, data structures, math, strings, dynamic programming, and more. Find optimized templates organized by topic.",
  keywords: [
    "competitive programming categories",
    "algorithm categories",
    "data structures",
    "graph algorithms",
    "dynamic programming",
    "itl categories",
  ],
  openGraph: {
    title: "All Categories | Informatics Template Lib",
    description:
      "Browse all competitive programming algorithm categories — graphs, data structures, math, strings, dynamic programming, and more.",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/categories",
  },
};

export default async function CategoriesPage() {
  const db = getDb();

  if (!db) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="border border-border bg-card p-8 max-w-md w-full">
          <div className="text-xs space-y-2 text-left">
            <div className="text-muted-foreground">$ itl --status</div>
            <div className="text-error animate-blink">[ERR] Something went wrong</div>
            <div className="text-muted-foreground">Please try again later.</div>
            <div className="flex items-center gap-1 mt-3">
              <span className="text-primary">$</span>
              <span className="inline-block h-3 w-1.5 bg-primary animate-blink" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  let cats: Awaited<ReturnType<typeof db.query.categories.findMany>> = [];
  const countMap: Record<number, number> = {};
  let totalTemplates = 0;

  try {
    cats = await db.query.categories.findMany({
      where: eq(schema.categories.hidden, false),
      orderBy: (c, { asc }) => [asc(c.order)],
    });

    const categoryCounts = await db
      .select({
        categoryId: schema.templates.categoryId,
        count: count(schema.templates.id),
      })
      .from(schema.templates)
      .where(eq(schema.templates.hidden, false))
      .groupBy(schema.templates.categoryId);

    for (const row of categoryCounts) {
      if (row.categoryId !== null) {
        countMap[row.categoryId] = Number(row.count) || 0;
      }
    }

    totalTemplates = Object.values(countMap).reduce((a, b) => a + b, 0);
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="border border-border bg-card p-8 max-w-md w-full">
          <div className="text-xs space-y-2 text-left">
            <div className="text-muted-foreground">$ itl --status</div>
            <div className="text-error animate-blink">[ERR] Something went wrong</div>
            <div className="text-muted-foreground">Please try again later.</div>
            <div className="flex items-center gap-1 mt-3">
              <span className="text-primary">$</span>
              <span className="inline-block h-3 w-1.5 bg-primary animate-blink" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16">
        {/* Back nav */}
        <div className="mb-8">
          <TerminalBreadcrumb items={[{ label: "home", href: "/" }]} />
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="text-primary">$</span>
            <span className="text-foreground font-bold">ls categories/</span>
            <span className="inline-block h-3 w-1.5 bg-primary animate-blink ml-1" />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Braces className="h-3 w-3" />
              {cats.length} categories
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3 w-3" />
              {totalTemplates} templates
            </span>
          </div>
        </div>

        {/* Category grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((cat, i) => (
            <div key={cat.id} className={`animate-slide-up stagger-${Math.min(i + 1, 8)} h-full`}>
              <CategoryCard category={cat} count={countMap[cat.id] || 0} />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {cats.length === 0 && (
          <div className="border border-border bg-card p-8 text-center">
            <div className="text-xs text-muted-foreground mb-2">[EMPTY] No categories found</div>
            <p className="text-xs text-muted-foreground/60">No categories yet. Check back later.</p>
          </div>
        )}
      </section>
    </div>
  );
}
