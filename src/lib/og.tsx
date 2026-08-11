/**
 * Shared building blocks for the `opengraph-image.tsx` route handlers.
 * Slate palette + JetBrains Mono + the terminal chrome (glows, grid, frame,
 * header, footer) that every ITL OG card wears, so each route only has to
 * describe its own middle section.
 */
import type { ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

// Slate palette (mirrors the app's dark theme).
export const OG = {
  bg: "#06141B",
  panel: "#11212D",
  muted: "#9BA8AB",
  bright: "#CCD0CF",
  dark: "#4A5C6A",
  red: "#ef4444",
};

export const ogBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://itl-hub.vercel.app");

export async function loadOgFonts() {
  const load = async (weight: 400 | 700) => {
    try {
      const name = weight === 700 ? "Bold" : "Regular";
      const res = await fetch(`${ogBaseUrl}/fonts/JetBrainsMono-${name}.ttf`);
      if (!res.ok) return null;
      return res.arrayBuffer();
    } catch {
      return null;
    }
  };
  const [regular, bold] = await Promise.all([load(400), load(700)]);
  const fonts: {
    name: string;
    data: ArrayBuffer;
    style: "normal";
    weight: 400 | 700;
  }[] = [];
  if (regular) fonts.push({ name: "JetBrains Mono", data: regular, style: "normal", weight: 400 });
  if (bold) fonts.push({ name: "JetBrains Mono", data: bold, style: "normal", weight: 700 });
  return fonts.length ? fonts : undefined;
}

/** Absolute-positioned background: two glows, a faint grid, and a double frame. */
export function OgBackdrop({ accent = OG.muted }: { accent?: string }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex" }}>
      <div
        style={{
          position: "absolute",
          top: "-140px",
          right: "-140px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}26 0%, ${accent}00 70%)`,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-140px",
          left: "-140px",
          width: "460px",
          height: "460px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74, 92, 106, 0.10) 0%, rgba(74, 92, 106, 0) 70%)",
          display: "flex",
        }}
      />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03, display: "flex" }}>
        {[10, 25, 40, 55, 70, 85].map((pct) => (
          <div
            key={`v${pct}`}
            style={{ position: "absolute", left: `${pct}%`, top: 0, bottom: 0, width: "1px", backgroundColor: OG.muted, display: "flex" }}
          />
        ))}
        {[12, 30, 48, 65, 82].map((pct) => (
          <div
            key={`h${pct}`}
            style={{ position: "absolute", top: `${pct}%`, left: 0, right: 0, height: "1px", backgroundColor: OG.muted, display: "flex" }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          right: "16px",
          bottom: "16px",
          border: "1px solid rgba(155, 168, 171, 0.15)",
          display: "flex",
        }}
      />
    </div>
  );
}

export function OgHeader({ right }: { right?: ReactNode }) {
  return (
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
            backgroundColor: OG.muted,
            color: OG.bg,
            padding: "3px 10px",
            fontSize: "14px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 0 12px rgba(155, 168, 171, 0.4)",
          }}
        >
          ITL
        </div>
        <div style={{ fontSize: "16px", fontWeight: "bold", color: OG.bright, letterSpacing: "3px", display: "flex" }}>
          INFORMATICS TEMPLATE LIB
        </div>
      </div>
      {right ? <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>{right}</div> : <div style={{ display: "flex" }} />}
    </div>
  );
}

/** A boxed uppercase chip, tinted by `accent` — handy for the header right slot. */
export function OgChip({ label, accent = OG.muted }: { label: string; accent?: string }) {
  return (
    <div
      style={{
        fontSize: "11px",
        color: accent,
        fontWeight: "bold",
        letterSpacing: "1px",
        display: "flex",
        border: `1px solid ${accent}44`,
        backgroundColor: `${accent}11`,
        padding: "2px 10px",
      }}
    >
      {label.toUpperCase()}
    </div>
  );
}

/** Prompt line on the left, muted caption on the right. */
export function OgFooter({ prompt, caption }: { prompt: string; caption?: string }) {
  return (
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
      <div style={{ fontSize: "13px", color: "rgba(155, 168, 171, 0.6)", display: "flex", alignItems: "center" }}>
        <span>{prompt}</span>
        <span style={{ display: "flex", width: "7px", height: "13px", backgroundColor: OG.muted, marginLeft: "6px" }} />
      </div>
      <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.2)", display: "flex" }}>
        {caption ?? `itl ${new Date().getFullYear()}`}
      </div>
    </div>
  );
}

/** Root frame every OG shares: fixed size, slate bg, mono font, backdrop chrome. */
export function OgShell({ accent, children }: { accent?: string; children: ReactNode }) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: OG.bg,
        fontFamily: "JetBrains Mono, monospace",
        padding: "50px",
        color: OG.muted,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <OgBackdrop accent={accent} />
      {children}
    </div>
  );
}
