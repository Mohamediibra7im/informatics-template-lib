import { ImageResponse } from "next/og";
import { OG_SIZE, OG, loadOgFonts, OgShell, OgHeader, OgChip, OgFooter } from "@/lib/og";

export const alt = "CP-Base Documentation | Complete guide to every feature";
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
        <OgHeader right={<OgChip label="Docs" />} />

        {/* Main content */}
        <div style={{ display: "flex", width: "100%", height: "380px", alignItems: "center", gap: "32px" }}>
          {/* Left: title block */}
          <div style={{ display: "flex", flexDirection: "column", width: "42%", gap: "16px" }}>
            <div style={{ fontSize: "13px", color: "rgba(155, 168, 171, 0.6)", display: "flex", gap: "8px" }}>
              <span style={{ color: OG.muted, fontWeight: "bold" }}>$</span>
              <span>man cp-base</span>
              <span style={{ display: "flex", width: "8px", height: "16px", backgroundColor: OG.muted, marginLeft: "2px" }} />
            </div>
            <div
              style={{
                fontSize: "68px",
                fontWeight: "bold",
                color: OG.bright,
                lineHeight: "1.05",
                letterSpacing: "-1px",
                display: "flex",
                textShadow: "0 0 14px rgba(255,255,255,0.12)",
              }}
            >
              DOCS
            </div>
            <div style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", display: "flex", lineHeight: "1.45", maxWidth: "94%" }}>
              The complete guide to every CP-Base feature — from browsing and copying templates to progress tracking and contest sync.
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              {[`${TOC.length} sections`, "always current"].map((t) => (
                <div
                  key={t}
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: OG.muted,
                    backgroundColor: "rgba(155, 168, 171, 0.06)",
                    border: "1px solid rgba(155, 168, 171, 0.2)",
                    padding: "3px 12px",
                    display: "flex",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right: table-of-contents panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "53%",
              backgroundColor: OG.panel,
              border: "1px solid rgba(155, 168, 171, 0.25)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                backgroundColor: "rgba(155, 168, 171, 0.06)",
                borderBottom: "1px solid rgba(155, 168, 171, 0.15)",
                fontSize: "10px",
                fontWeight: "bold",
                letterSpacing: "2px",
                color: "rgba(155, 168, 171, 0.6)",
              }}
            >
              <span style={{ display: "flex" }}>TABLE OF CONTENTS</span>
              <span style={{ display: "flex", color: "rgba(155, 168, 171, 0.35)" }}>~/docs</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", padding: "14px 16px" }}>
              {TOC.map((label, i) => (
                <div key={label} style={{ display: "flex", width: "50%", alignItems: "center", gap: "8px", padding: "5px 0", fontSize: "14px" }}>
                  <span style={{ color: OG.dark, fontWeight: "bold", fontSize: "12px", display: "flex" }}>
                    [{String(i + 1).padStart(2, "0")}]
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.75)", display: "flex" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <OgFooter prompt="$ less documentation.md" caption="cp-base/docs" />
      </OgShell>
    ),
    { ...OG_SIZE, fonts }
  );
}
