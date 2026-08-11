import { ImageResponse } from "next/og";
import { OG_SIZE, OG, loadOgFonts, OgShell, OgHeader, OgChip, OgFooter } from "@/lib/og";

export const alt = "ITL Documentation | Complete Guide to Competitive Programming Templates";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 3600;

const TOC = [
  "Getting Started",
  "Browsing Templates",
  "Copy & Use",
  "User Accounts",
  "Dashboard Overview",
  "My Templates",
  "Collections",
  "Progress Tracking",
  "Statistics",
  "Contributing",
  "Contest Calendar",
  "Public Profile",
];

export default async function DocsOpengraphImage() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <OgShell accent={OG.muted}>
        <OgHeader right={<OgChip label="DOCS / V1.0" accent={OG.bright} />} />

        {/* Main Content Area */}
        <div style={{ display: "flex", width: "100%", height: "390px", alignItems: "center", justifyContent: "space-between" }}>
          {/* Left Block: Title, Description & Badges */}
          <div style={{ display: "flex", flexDirection: "column", width: "43%", gap: "16px" }}>
            {/* Terminal Prompt Tag */}
            <div style={{ fontSize: "13px", color: "rgba(155, 168, 171, 0.7)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: OG.muted, fontWeight: "bold" }}>$</span>
              <span>man itl.docs</span>
              <span style={{ display: "flex", width: "8px", height: "16px", backgroundColor: OG.muted, marginLeft: "2px" }} />
            </div>

            {/* Main Title */}
            <div
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: OG.bright,
                lineHeight: "1.05",
                letterSpacing: "-1px",
                display: "flex",
                textShadow: "0 0 20px rgba(155, 168, 171, 0.25)",
              }}
            >
              DOCUMENTATION
            </div>

            {/* Glowing Accent Line */}
            <div
              style={{
                height: "3px",
                width: "100px",
                background: "linear-gradient(90deg, #9BA8AB 0%, rgba(155, 168, 171, 0.1) 100%)",
                display: "flex",
              }}
            />

            {/* Description */}
            <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", display: "flex", lineHeight: "1.5", maxWidth: "98%" }}>
              Master competitive programming workflows — optimized algorithm templates, complexity benchmarks, and real-time contest tools.
            </div>

            {/* Feature Chips */}
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              {["12 SECTIONS", "CONTEST READY", "C++20 OPTIMIZED"].map((t, idx) => (
                <div
                  key={t}
                  style={{
                    fontSize: "10.5px",
                    fontWeight: "bold",
                    color: idx === 0 ? OG.bright : OG.muted,
                    backgroundColor: idx === 0 ? "rgba(155, 168, 171, 0.15)" : "rgba(155, 168, 171, 0.05)",
                    border: `1px solid ${idx === 0 ? "rgba(155, 168, 171, 0.4)" : "rgba(155, 168, 171, 0.2)"}`,
                    padding: "4px 8px",
                    display: "flex",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right Block: Futuristic Window Table of Contents */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "53%",
              backgroundColor: OG.panel,
              border: "1px solid rgba(155, 168, 171, 0.3)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.85)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            {/* Terminal Title Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 18px",
                backgroundColor: "rgba(155, 168, 171, 0.08)",
                borderBottom: "1px solid rgba(155, 168, 171, 0.2)",
                fontSize: "11px",
                fontWeight: "bold",
              }}
            >
              {/* Window Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: OG.red, display: "flex" }} />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#eab308", display: "flex" }} />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#22c55e", display: "flex" }} />
                <span style={{ marginLeft: "10px", color: OG.bright, letterSpacing: "1px" }}>documentation_index.json</span>
              </div>
              <span style={{ display: "flex", color: "rgba(155, 168, 171, 0.45)", letterSpacing: "1px" }}>~/docs</span>
            </div>

            {/* Grid of Sections */}
            <div style={{ display: "flex", flexWrap: "wrap", padding: "16px 18px" }}>
              {TOC.map((label, i) => {
                const isActive = i === 0 || i === 2;
                return (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      width: "50%",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 4px",
                      fontSize: "13.5px",
                    }}
                  >
                    <span
                      style={{
                        color: isActive ? OG.bright : OG.dark,
                        fontWeight: "bold",
                        fontSize: "12px",
                        display: "flex",
                      }}
                    >
                      [{String(i + 1).padStart(2, "0")}]
                    </span>
                    <span
                      style={{
                        color: isActive ? OG.bright : "rgba(255,255,255,0.7)",
                        fontWeight: isActive ? "bold" : "normal",
                        display: "flex",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <OgFooter prompt="$ cat /docs/readme.md" caption="Informatics Template Lib" />
      </OgShell>
    ),
    { ...OG_SIZE, fonts }
  );
}
