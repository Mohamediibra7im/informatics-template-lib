import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { categories, templates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TemplateCard } from "@/components/template-card";
import * as LucideIcons from "lucide-react";
import { TerminalBreadcrumb } from "@/components/terminal";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  if (!db) {
    return {
      title: "Category | CP-Base",
      openGraph: { images: ["/opengraph-image"] },
      twitter: { card: "summary_large_image" },
    };
  }

  try {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    if (!category || category.hidden) {
      return {
        title: "Category Not Found | CP-Base",
        openGraph: { images: ["/opengraph-image"] },
        twitter: { card: "summary_large_image" },
      };
    }

    return {
      title: `${category.name} | CP-Base`,
      description: category.description || `Browse competitive programming templates for ${category.name}.`,
      openGraph: {
        title: `${category.name} Templates | CP-Base`,
        description: category.description || `Browse competitive programming templates for ${category.name}.`,
        images: ["/opengraph-image"],
      },
      twitter: {
        card: "summary_large_image",
        title: `${category.name} Templates | CP-Base`,
        description: category.description || `Browse competitive programming templates for ${category.name}.`,
      },
    };
  } catch (err) {
    console.error("Error generating category metadata:", err);
    return {
      title: "Category | CP-Base",
      openGraph: { images: ["/opengraph-image"] },
      twitter: { card: "summary_large_image" },
    };
  }
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }) {
  const { slug } = await params;
  const { q } = await searchParams;
  const db = getDb();
  if (!db) notFound();

  let category;
  let rows;

  try {
    [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    if (!category || category.hidden) notFound();

    rows = await db.query.templates.findMany({
      where: and(eq(templates.categoryId, category.id), eq(templates.hidden, false)),
      with: { category: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    // Filter by search query
    if (q && q.trim()) {
      const query = q.toLowerCase().trim();
      rows = rows.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
  } catch {
    return (
      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 py-8">
        <TerminalBreadcrumb items={[{ label: "home", href: "/" }]} />
        <div className="text-center py-20 border border-border bg-card">
          <div className="text-xs text-error mb-2 animate-blink">[ERR] Something went wrong</div>
          <p className="text-xs text-muted-foreground">Try refreshing or try again later.</p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[category!.icon] ?? LucideIcons.Code;

  return (
    <div className="relative z-10 mx-auto max-w-7xl w-full px-4 py-8">
      {/* Back nav */}
      <div className="mb-8">
        <TerminalBreadcrumb items={[{ label: "home", href: "/" }]} />
      </div>

      {/* Category header */}
      <div className="mb-10 border-b border-border pb-6">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex h-10 w-10 items-center justify-center border shrink-0"
            style={{ borderColor: `${category!.color}44`, color: category!.color, backgroundColor: `${category!.color}08` }}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{category!.name}</h1>
              <span className="text-muted-foreground text-sm">({rows!.length})</span>
            </div>
          </div>
        </div>
        {category!.description && (
          <p className="text-sm text-muted-foreground ml-0 sm:ml-13">{category!.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-4 ml-0 sm:ml-13 text-xs text-muted-foreground">
          <span className="text-primary">$</span>
          <span>ls {category!.slug}/</span>
          <span className="text-border">|</span>
          <span>wc -l</span>
          <span className="text-success">{rows!.length} templates found</span>
        </div>
      </div>

      {/* Templates */}
      {rows!.length === 0 ? (
        <div className="border border-border bg-card p-8">
          <div className="space-y-2 text-xs font-mono">
            <div className="text-muted-foreground"><span className="text-primary">$</span> ls {category!.slug}/</div>
            <div className="text-muted-foreground/40">total 0</div>
            <div className="h-px bg-border my-3" />
            <div className="text-muted-foreground/60">
              {q ? (
                <>
                  <span className="text-warning">[WARN]</span> No templates matching &quot;{q}&quot;
                  <br />
                  <span className="text-muted-foreground/40">Try a different search term.</span>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground/40">No templates in this category yet.</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows!.map((t, i) => (
            <div key={t.id} className={`animate-slide-up stagger-${Math.min(i + 1, 8)} h-full`}>
              <TemplateCard template={t} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

