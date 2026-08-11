import { ImageResponse } from "next/og";
import { getDb } from "@/db";
import { templates, categories, templateCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OG_SIZE, OG, loadOgFonts, OgShell, OgHeader, OgChip, OgFooter } from "@/lib/og";

export const alt = "ITL Template | Competitive Programming";
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
  let accent = OG.bright;
  let languages: string[] = [];
  let sampleCode = "";

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
          accent = cat.color || OG.bright;
        }

        const codes = await db
          .select({ language: templateCodes.language, code: templateCodes.code })
          .from(templateCodes)
          .where(eq(templateCodes.templateId, tmpl.id));
        languages = [...new Set(codes.map((c) => c.language))];
        if (codes.length > 0 && codes[0].code) {
          sampleCode = codes[0].code;
        }
      }
    }
  } catch (err) {
    console.error("Error fetching template data for OG:", err);
  }

  const shownTitle = title.length > 36 ? title.slice(0, 33) + "..." : title;
  const shownDesc = description.length > 100 ? description.slice(0, 97) + "..." : description;

  const defaultSnippet = [
    "// Competitive Programming Template",
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    "    ios_base::sync_with_stdio(false);",
    "    cin.tie(NULL);",
    "    return 0;",
    "}",
  ];

  const codeLines = sampleCode
    ? sampleCode.split("\n").filter((l) => l.trim().length > 0).slice(0, 8)
    : defaultSnippet;

  const mainLang = languages[0] || "cpp";

  return new ImageResponse(
    (
      <OgShell accent={accent}>
        <OgHeader
          right={
            <>
              {complexity ? <OgChip label={`O(${complexity})`} accent={OG.bright} /> : null}
              {categoryName ? <OgChip label={categoryName} accent={accent} /> : null}
            </>
          }
        />

        {/* Main Content Area */}
        <div style={{ display: "flex", width: "100%", height: "390px", alignItems: "center", justifyContent: "space-between" }}>
          {/* Left Block: Information, Title, Badges & Tags */}
          <div style={{ display: "flex", flexDirection: "column", width: "48%", gap: "16px" }}>
            {/* Tagline Prompt */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", width: "6px", height: "14px", backgroundColor: accent }} />
              <span style={{ fontSize: "12px", color: accent, fontWeight: "bold", letterSpacing: "2.5px" }}>
                // {categoryName ? categoryName.toUpperCase() : "ALGORITHM TEMPLATE"}
              </span>
            </div>

            {/* Template Title */}
            <div
              style={{
                fontSize: "44px",
                fontWeight: "bold",
                color: OG.bright,
                lineHeight: "1.1",
                letterSpacing: "-0.5px",
                display: "flex",
                textShadow: "0 0 16px rgba(255,255,255,0.15)",
              }}
            >
              {shownTitle}
            </div>

            {/* Description */}
            {shownDesc ? (
              <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", display: "flex", lineHeight: "1.45", maxWidth: "98%" }}>
                {shownDesc}
              </div>
            ) : null}

            {/* Complexity & Languages Strip */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
              {complexity ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: "11px",
                    fontWeight: "bold",
                    color: OG.bright,
                    backgroundColor: "rgba(155, 168, 171, 0.15)",
                    border: "1px solid rgba(155, 168, 171, 0.3)",
                    padding: "3px 10px",
                  }}
                >
                  O({complexity})
                </div>
              ) : null}

              {languages.map((lang) => (
                <div
                  key={lang}
                  style={{
                    display: "flex",
                    fontSize: "11px",
                    fontWeight: "bold",
                    color: accent,
                    backgroundColor: "rgba(155, 168, 171, 0.05)",
                    border: `1px solid ${accent}44`,
                    padding: "3px 10px",
                  }}
                >
                  {lang.toUpperCase()}
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#22c55e",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  padding: "3px 10px",
                }}
              >
                VERIFIED
              </div>
            </div>

            {/* Tags Strip */}
            {tags.length > 0 ? (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {tags.slice(0, 5).map((tag) => (
                  <div key={tag} style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", display: "flex" }}>
                    #{tag}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Right Block: Live Code Terminal Preview Window */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "48%",
              backgroundColor: OG.panel,
              border: `1px solid ${accent}44`,
              boxShadow: "0 25px 50px rgba(0,0,0,0.85)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            {/* Titlebar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                backgroundColor: "rgba(155, 168, 171, 0.08)",
                borderBottom: "1px solid rgba(155, 168, 171, 0.2)",
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: OG.red, display: "flex" }} />
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#eab308", display: "flex" }} />
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#22c55e", display: "flex" }} />
              </div>
              <div style={{ fontSize: "11px", color: OG.bright, fontWeight: "bold", display: "flex" }}>
                {slug}.{mainLang === "python" ? "py" : mainLang === "java" ? "java" : "cpp"}
              </div>
              <div style={{ fontSize: "10px", color: accent, display: "flex" }}>
                {mainLang.toUpperCase()}
              </div>
            </div>

            {/* Code Body */}
            <div
              style={{
                display: "flex",
                padding: "16px 14px",
                fontSize: "11.5px",
                lineHeight: "1.65",
                backgroundColor: OG.bg,
              }}
            >
              {/* Line Numbers */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  color: "rgba(155, 168, 171, 0.25)",
                  textAlign: "right",
                  paddingRight: "10px",
                  borderRight: "1px solid rgba(155, 168, 171, 0.1)",
                }}
              >
                {codeLines.map((_, idx) => (
                  <span key={idx}>{String(idx + 1).padStart(2, "0")}</span>
                ))}
              </div>

              {/* Code Snippet Lines */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  paddingLeft: "12px",
                  color: "rgba(255,255,255,0.85)",
                  overflow: "hidden",
                }}
              >
                {codeLines.map((line, idx) => (
                  <div key={idx} style={{ display: "flex", whiteSpace: "pre" }}>
                    <span style={{ color: line.startsWith("//") || line.startsWith("#") ? "rgba(155,168,171,0.5)" : OG.bright }}>
                      {line.length > 42 ? line.slice(0, 40) + "..." : line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <OgFooter
          prompt={`$ ./compile.sh --template=${slug}`}
          caption={`itl/${categoryName ? categoryName.toLowerCase().replace(/\s+/g, "-") : "template"}`}
        />
      </OgShell>
    ),
    { ...OG_SIZE, fonts }
  );
}
