import { ImageResponse } from "next/og";
import { OG_SIZE, OG, loadOgFonts, OgShell, OgHeader, OgChip, OgFooter } from "@/lib/og";

export const alt = "Informatics Template Lib | Ultimate Competitive Programming Library & Contest Sync";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 3600;

export default async function OpengraphImage() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <OgShell accent={OG.muted}>
        {/* Header Bar */}
        <OgHeader
          right={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "1px solid rgba(155, 168, 171, 0.3)",
                  backgroundColor: "rgba(155, 168, 171, 0.06)",
                  padding: "3px 10px",
                }}
              >
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    boxShadow: "0 0 8px rgba(34, 197, 94, 0.8)",
                    display: "flex",
                  }}
                />
                <span
                  style={{
                    fontSize: "10px",
                    color: OG.bright,
                    letterSpacing: "1px",
                    fontWeight: "bold",
                  }}
                >
                  SYSTEM_OPERATIONAL
                </span>
              </div>
              <OgChip label="V1.0.0" accent={OG.bright} />
            </div>
          }
        />

        {/* Core Layout Split */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            height: "370px",
          }}
        >
          {/* Left Column: Headline, Diagnostics & Filter Chips */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "46%",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: OG.muted,
                  fontWeight: "bold",
                  letterSpacing: "3px",
                  display: "flex",
                }}
              >
                {"// TEMPLATE LIBRARY & CONTEST SYNC"}
              </div>
              <div
                style={{
                  fontSize: "42px",
                  fontWeight: "bold",
                  color: OG.bright,
                  lineHeight: "1.1",
                  letterSpacing: "-0.5px",
                  display: "flex",
                  textShadow: "0 0 20px rgba(155, 168, 171, 0.2)",
                }}
              >
                Competitive Programming Vault
              </div>
            </div>

            {/* Diagnostic Window Box */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(155, 168, 171, 0.2)",
                backgroundColor: "rgba(6, 20, 27, 0.6)",
                padding: "14px 16px",
                gap: "8px",
                borderRadius: "3px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid rgba(155, 168, 171, 0.15)",
                  paddingBottom: "4px",
                  marginBottom: "2px",
                  fontSize: "9.5px",
                  fontWeight: "bold",
                  color: "rgba(155, 168, 171, 0.5)",
                  letterSpacing: "1.5px",
                }}
              >
                SYSTEM DIAGNOSTIC REPORT
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "rgba(155, 168, 171, 0.6)" }}>OS_KERNEL</span>
                <span style={{ color: OG.bright, fontWeight: "bold" }}>itl-v1.0.sh</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "rgba(155, 168, 171, 0.6)" }}>ALGORITHMS</span>
                <span style={{ color: OG.bright }}>SegmentTree, DSU, Dijkstra, Flow</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "rgba(155, 168, 171, 0.6)" }}>COMPLEXITY</span>
                <span style={{ color: OG.muted, fontWeight: "bold" }}>O(1) / O(log N)</span>
              </div>
            </div>

            {/* Language Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["C++20", "Python", "Java", "Codeforces", "AtCoder", "LeetCode"].map((lang) => (
                <div
                  key={lang}
                  style={{
                    fontSize: "10.5px",
                    fontWeight: "bold",
                    color: OG.muted,
                    backgroundColor: "rgba(155, 168, 171, 0.05)",
                    border: "1px solid rgba(155, 168, 171, 0.2)",
                    padding: "3px 10px",
                    display: "flex",
                  }}
                >
                  {`$ grep '${lang}'`}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Code Terminal Window */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "50%",
              backgroundColor: OG.panel,
              border: "1px solid rgba(155, 168, 171, 0.3)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.85)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            {/* Terminal Titlebar */}
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
                dijkstra.cpp
              </div>
              <div style={{ fontSize: "10px", color: "rgba(155, 168, 171, 0.4)", display: "flex" }}>
                C++20
              </div>
            </div>

            {/* Code Body */}
            <div
              style={{
                display: "flex",
                padding: "16px 14px",
                fontSize: "12px",
                lineHeight: "1.7",
                backgroundColor: OG.bg,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  color: "rgba(155, 168, 171, 0.25)",
                  textAlign: "right",
                  paddingRight: "12px",
                  borderRight: "1px solid rgba(155, 168, 171, 0.1)",
                }}
              >
                {Array.from({ length: 8 }).map((_, idx) => (
                  <span key={idx}>{String(idx + 1).padStart(2, "0")}</span>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  paddingLeft: "14px",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                <div style={{ display: "flex" }}>
                  <span style={{ color: OG.red }}>vector</span>
                  <span style={{ color: OG.bright }}>&lt;</span>
                  <span style={{ color: OG.dark }}>int</span>
                  <span style={{ color: OG.bright }}>&gt; dist(N, INF);</span>
                </div>
                <div style={{ display: "flex" }}>
                  <span style={{ color: OG.dark }}>priority_queue</span>
                  <span style={{ color: OG.bright }}>
                    &lt;pii, vector&lt;pii&gt;, greater&lt;pii&gt;&gt; pq;
                  </span>
                </div>
                <div style={{ display: "flex" }}>
                  <span style={{ color: OG.bright }}>dist[src] = 0;</span>
                </div>
                <div style={{ display: "flex" }}>
                  <span style={{ color: OG.bright }}>pq.push({"{"}0, src{"}"});</span>
                </div>
                <div style={{ display: "flex" }}>
                  <span style={{ color: OG.red }}>while</span>
                  <span style={{ color: OG.bright }}> (!pq.empty()) {"{"}</span>
                </div>
                <div style={{ display: "flex", paddingLeft: "16px" }}>
                  <span style={{ color: OG.bright }}>
                    auto [d, u] = pq.top(); pq.pop();
                  </span>
                </div>
                <div style={{ display: "flex", paddingLeft: "16px" }}>
                  <span style={{ color: OG.red }}>if</span>
                  <span style={{ color: OG.bright }}> (d &gt; dist[u]) </span>
                  <span style={{ color: OG.red }}>continue</span>
                  <span style={{ color: OG.bright }}>;</span>
                </div>
                <div style={{ display: "flex" }}>
                  <span style={{ color: OG.bright }}>{"}"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <OgFooter prompt="$ itl --status" caption="Informatics Template Lib" />
      </OgShell>
    ),
    {
      width: OG_SIZE.width,
      height: OG_SIZE.height,
      fonts,
    }
  );
}
