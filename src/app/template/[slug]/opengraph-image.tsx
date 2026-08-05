import { ImageResponse } from "next/og";
import { getDb } from "@/db";
import { templates, categories, templateCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OG_SIZE, OG, loadOgFonts, OgShell, OgHeader, OgChip, OgFooter } from "@/lib/og";

export const alt = "CP-Base Template | Competitive Programming";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 3600;

export default async function TemplateOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fonts = await loadOgFonts();

  let title = slug.replace(/-/g, " ");
  let description = "";
  let tags: string[] = [];
  let complexity = "";
  let categoryName = "";
  let accent = OG.muted;
  let languages: string[] = [];

  try {
    const db = getDb();
    if (db) {
      const [tmpl] = await db.select().from(templates).where(eq(templates.slug, slug));
      if (tmpl) {
        title = tmpl.title;
        description = tmpl.description || "";
        tags = tmpl.tags || [];
        complexity = tmpl.complexity || "";

        const [cat] = await db.select().from(categories).where(eq(categories.id, tmpl.categoryId));
        if (cat) {
          categoryName = cat.name;
          accent = cat.color || OG.muted;
        }

        const codes = await db
          .select({ language: templateCodes.language })
          .from(templateCodes)
          .where(eq(templateCodes.templateId, tmpl.id));
        languages = [...new Set(codes.map((c) => c.language))];
      }
    }
  } catch (err) {
    console.error("Error fetching template data for OG:", err);
  }

  const shownTitle = title.length > 42 ? title.slice(0, 39) + "..." : title;
  const shownDesc = description.length > 120 ? description.slice(0, 117) + "..." : description;

  return new ImageResponse(
    (
      <OgShell accent={accent}>
        {/* Oversized watermark glyph, tinted by the category */}
        <div
          style={{
            position: "absolute",
            right: "30px",
            bottom: "-40px",
            fontSize: "300px",
            fontWeight: "bold",
            color: `${accent}0f`,
            lineHeight: 1,
            display: "flex",
          }}
        >
          {"{}"}
        </div>

        <OgHeader
          right={
            <>
              {complexity ? <OgChip label={complexity} accent={OG.dark} /> : null}
              {categoryName ? <OgChip label={categoryName} accent={accent} /> : null}
            </>
          }
        />

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "380px", justifyContent: "center", gap: "26px" }}>
          {/* Title block with category accent bar */}
          <div style={{ display: "flex", gap: "26px" }}>
            <div style={{ display: "flex", width: "8px", backgroundColor: accent, borderRadius: "2px", boxShadow: `0 0 18px ${accent}` }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "94%" }}>
              <div style={{ fontSize: "13px", color: `${accent}`, fontWeight: "bold", letterSpacing: "3px", display: "flex" }}>
                {"// ALGORITHM TEMPLATE"}
              </div>
              <div
                style={{
                  fontSize: "60px",
                  fontWeight: "bold",
                  color: OG.bright,
                  lineHeight: "1.1",
                  letterSpacing: "-1px",
                  display: "flex",
                  textShadow: "0 0 14px rgba(255,255,255,0.14)",
                }}
              >
                {shownTitle}
              </div>
              {shownDesc ? (
                <div style={{ fontSize: "19px", color: "rgba(255,255,255,0.6)", display: "flex", lineHeight: "1.45", maxWidth: "92%" }}>
                  {shownDesc}
                </div>
              ) : null}
            </div>
          </div>

          {/* Metadata strip: complexity + languages */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingLeft: "34px", flexWrap: "wrap" }}>
            {complexity ? (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  fontSize: "14px",
                  color: OG.bright,
                  backgroundColor: OG.panel,
                  border: "1px solid rgba(155, 168, 171, 0.25)",
                  padding: "5px 14px",
                }}
              >
                <span style={{ color: OG.dark, fontWeight: "bold", display: "flex" }}>O</span>
                <span style={{ display: "flex" }}>{complexity}</span>
              </div>
            ) : null}
            {languages.slice(0, 5).map((lang) => (
              <div
                key={lang}
                style={{
                  display: "flex",
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: OG.muted,
                  backgroundColor: "rgba(155, 168, 171, 0.05)",
                  border: "1px solid rgba(155, 168, 171, 0.2)",
                  padding: "5px 14px",
                }}
              >
                {lang}
              </div>
            ))}
          </div>

          {/* Tags */}
          {tags.length > 0 ? (
            <div style={{ display: "flex", gap: "10px", paddingLeft: "34px", flexWrap: "wrap" }}>
              {tags.slice(0, 6).map((tag) => (
                <div key={tag} style={{ fontSize: "13px", color: `${accent}cc`, display: "flex" }}>
                  #{tag}
                </div>
              ))}
              {tags.length > 6 ? (
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", display: "flex" }}>+{tags.length - 6}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        <OgFooter prompt="$ ./compile.sh --optimize" caption={`cp-base/${categoryName ? categoryName.toLowerCase() : "template"}`} />
      </OgShell>
    ),
    { ...OG_SIZE, fonts }
  );
}
