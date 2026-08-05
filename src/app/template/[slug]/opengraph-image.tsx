import { ImageResponse } from "next/og";
import { getDb } from "@/db";
import { templates, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export const alt = "CP-Base Template | Competitive Programming";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 3600;

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://cp-base.vercel.app");

async function loadFont(weight: number): Promise<ArrayBuffer | null> {
  try {
    const name = weight === 700 ? "Bold" : "Regular";
    const res = await fetch(`${baseUrl}/fonts/JetBrainsMono-${name}.ttf`);
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function TemplateOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [fontRegular, fontBold] = await Promise.all([
    loadFont(400),
    loadFont(700),
  ]);

  const fonts = [];
  if (fontRegular) {
    fonts.push({
      name: "JetBrains Mono",
      data: fontRegular,
      style: "normal" as const,
      weight: 400 as const,
    });
  }
  if (fontBold) {
    fonts.push({
      name: "JetBrains Mono",
      data: fontBold,
      style: "normal" as const,
      weight: 700 as const,
    });
  }

  // Fetch template data
  let templateTitle = slug.replace(/-/g, " ");
  let templateDesc = "";
  let templateTags: string[] = [];
  let categoryName = "";
  let categoryColor = "#9BA8AB";

  try {
    const db = getDb();
    if (db) {
      const [tmpl] = await db
        .select()
        .from(templates)
        .where(eq(templates.slug, slug));
      if (tmpl) {
        templateTitle = tmpl.title;
        templateDesc = tmpl.description || "";
        templateTags = tmpl.tags || [];

        const [cat] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, tmpl.categoryId));
        if (cat) {
          categoryName = cat.name;
          categoryColor = cat.color || "#9BA8AB";
        }
      }
    }
  } catch (err) {
    console.error("Error fetching template data for OG:", err);
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#06141B",
          fontFamily: "JetBrains Mono, monospace",
          padding: "50px",
          color: "#9BA8AB",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glows */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${categoryColor}22 0%, ${categoryColor}00 70%)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            left: "-120px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(74, 92, 106, 0.08) 0%, rgba(74, 92, 106, 0) 70%)",
            display: "flex",
          }}
        />

        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            display: "flex",
          }}
        >
          {[10, 25, 40, 55, 70, 85].map((pct) => (
            <div
              key={pct}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: 0,
                bottom: 0,
                width: "1px",
                backgroundColor: "#9BA8AB",
                display: "flex",
              }}
            />
          ))}
          {[12, 30, 48, 65, 82].map((pct) => (
            <div
              key={pct}
              style={{
                position: "absolute",
                top: `${pct}%`,
                left: 0,
                right: 0,
                height: "1px",
                backgroundColor: "#9BA8AB",
                display: "flex",
              }}
            />
          ))}
        </div>

        {/* Frame border */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            right: "16px",
            bottom: "16px",
            border: "1px solid rgba(155, 168, 171, 0.15)",
            pointerEvents: "none",
            display: "flex",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            borderBottom: "1px solid rgba(155, 168, 171, 0.2)",
            paddingBottom: "15px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                backgroundColor: "#9BA8AB",
                color: "#06141B",
                padding: "3px 10px",
                fontSize: "15px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                boxShadow: "0 0 10px rgba(155, 168, 171, 0.5)",
              }}
            >
              CP
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#CCD0CF",
                letterSpacing: "4px",
                display: "flex",
              }}
            >
              BASE
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {categoryName && (
              <div
                style={{
                  fontSize: "11px",
                  color: categoryColor,
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  display: "flex",
                  border: `1px solid ${categoryColor}44`,
                  backgroundColor: `${categoryColor}11`,
                  padding: "2px 10px",
                }}
              >
                {categoryName.toUpperCase()}
              </div>
            )}

          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "90%",
            height: "380px",
            gap: "12px",
          }}
        >
          {/* Prompt line */}
          <div
            style={{
              fontSize: "12px",
              color: "rgba(155, 168, 171, 0.5)",
              display: "flex",
              gap: "6px",
            }}
          >
            <span style={{ color: "#9BA8AB", fontWeight: "bold" }}>$</span>
            <span>cat templates/{slug}</span>
          </div>

          {/* Template title */}
          <div
            style={{
              fontSize: "52px",
              fontWeight: "bold",
              color: "#CCD0CF",
              lineHeight: "1.15",
              letterSpacing: "-0.5px",
              display: "flex",
              textShadow: "0 0 12px rgba(255,255,255,0.15)",
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            {templateTitle.length > 40
              ? templateTitle.slice(0, 37) + "..."
              : templateTitle}
          </div>

          {/* Description */}
          {templateDesc && (
            <div
              style={{
                fontSize: "18px",
                color: "rgba(255,255,255,0.6)",
                display: "flex",
                lineHeight: "1.4",
                maxWidth: "90%",
                marginTop: "4px",
              }}
            >
              {templateDesc.length > 120
                ? templateDesc.slice(0, 117) + "..."
                : templateDesc}
            </div>
          )}

          {/* Tags */}
          {templateTags.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "8px",
                flexWrap: "wrap",
              }}
            >
              {templateTags.slice(0, 6).map((tag) => (
                <div
                  key={tag}
                  style={{
                    fontSize: "12px",
                    color: "#9BA8AB",
                    backgroundColor: "rgba(155, 168, 171, 0.06)",
                    border: "1px solid rgba(155, 168, 171, 0.2)",
                    padding: "3px 12px",
                    display: "flex",
                  }}
                >
                  #{tag}
                </div>
              ))}
              {templateTags.length > 6 && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  +{templateTags.length - 6} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            borderTop: "1px solid rgba(155, 168, 171, 0.15)",
            paddingTop: "15px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "rgba(155, 168, 171, 0.5)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span>$ ./compile.sh --optimize</span>
            <span
              style={{
                display: "flex",
                width: "7px",
                height: "13px",
                backgroundColor: "#9BA8AB",
                marginLeft: "6px",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.15)",
              display: "flex",
            }}
          >
            cp-base {new Date().getFullYear()}
          </div>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
