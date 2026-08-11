import { ImageResponse } from "next/og";
import { getDb } from "@/db";
import { users, userProfiles } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { OG_SIZE, OG, loadOgFonts, OgShell, OgHeader, OgChip, OgFooter } from "@/lib/og";

export const alt = "ITL Profile";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 3600;

// Pull avatar bytes into a data URI so a slow/dead avatar host can't make the
// whole card fail to render — fall back to a monogram instead.
async function loadAvatar(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/png";
    const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
}

export default async function ProfileOpengraphImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const fonts = await loadOgFonts();

  let decoded = username;
  try {
    decoded = decodeURIComponent(username);
  } catch {
    /* keep raw */
  }
  decoded = decoded.trim();

  let displayName = decoded;
  let handleName = decoded;
  let bio = "";
  let avatarUrl: string | null = null;
  const links: { label: string; value: string }[] = [];
  let ratingGoal = "";
  let found = false;

  try {
    const db = getDb();
    if (db) {
      // Resolve the same way the profile page does: username, display name, or CF handle.
      const [row] = await db
        .select({
          username: users.username,
          name: userProfiles.name,
          bio: userProfiles.bio,
          avatarUrl: userProfiles.avatarUrl,
          codeforcesHandle: userProfiles.codeforcesHandle,
          atcoderHandle: userProfiles.atcoderHandle,
          leetcodeHandle: userProfiles.leetcodeHandle,
          codechefHandle: userProfiles.codechefHandle,
          ratingGoal: userProfiles.ratingGoal,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(
          or(
            sql`LOWER(${users.username}) = LOWER(${decoded})`,
            sql`LOWER(${userProfiles.name}) = LOWER(${decoded})`,
            sql`LOWER(${userProfiles.codeforcesHandle}) = LOWER(${decoded})`
          )
        )
        .limit(1);

      if (row) {
        found = true;
        handleName = row.username;
        displayName = row.name?.trim() || row.username;
        bio = row.bio?.trim() || "";
        avatarUrl = row.avatarUrl;
        ratingGoal = row.ratingGoal?.trim() || "";
        if (row.codeforcesHandle) links.push({ label: "CF", value: row.codeforcesHandle });
        if (row.atcoderHandle) links.push({ label: "AtCoder", value: row.atcoderHandle });
        if (row.leetcodeHandle) links.push({ label: "LeetCode", value: row.leetcodeHandle });
        if (row.codechefHandle) links.push({ label: "CodeChef", value: row.codechefHandle });
      }
    }
  } catch (err) {
    console.error("Error fetching profile for OG:", err);
  }

  const avatarData = await loadAvatar(avatarUrl);
  const monogram = (displayName[0] || "?").toUpperCase();
  const shortBio =
    bio.length > 128 ? bio.slice(0, 125) + "..." : bio || (found ? "" : "");

  return new ImageResponse(
    (
      <OgShell accent={OG.muted}>
        <OgHeader right={<OgChip label="Profile" />} />

        {/* Identity card */}
        <div style={{ display: "flex", width: "100%", height: "380px", alignItems: "center", gap: "52px" }}>
          {/* Avatar */}
          <div style={{ display: "flex", position: "relative", width: "232px", height: "232px" }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "232px",
                height: "232px",
                borderRadius: "14px",
                border: `2px solid ${OG.muted}`,
                backgroundColor: OG.panel,
                boxShadow: "0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(155, 168, 171, 0.14)",
                overflow: "hidden",
              }}
            >
              {avatarData ? (
                <img src={avatarData} alt={displayName} width={232} height={232} style={{ objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "118px", fontWeight: "bold", color: OG.bright, display: "flex" }}>{monogram}</span>
              )}
            </div>
            {/* status dot */}
            <div
              style={{
                position: "absolute",
                bottom: "6px",
                right: "6px",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                border: `3px solid ${OG.bg}`,
                boxShadow: "0 0 12px rgba(34,197,94,0.7)",
                display: "flex",
              }}
            />
          </div>

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", width: "60%", gap: "12px" }}>
            <div style={{ fontSize: "12px", color: "rgba(155, 168, 171, 0.55)", display: "flex", gap: "8px", letterSpacing: "1px" }}>
              <span style={{ color: OG.muted, fontWeight: "bold" }}>$</span>
              <span>whoami --profile</span>
            </div>
            <div
              style={{
                fontSize: "58px",
                fontWeight: "bold",
                color: OG.bright,
                lineHeight: "1.02",
                letterSpacing: "-1.5px",
                display: "flex",
                textShadow: "0 0 14px rgba(255,255,255,0.14)",
              }}
            >
              {displayName.length > 20 ? displayName.slice(0, 19) + "…" : displayName}
            </div>

            {/* handle + gradient accent rule */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", color: OG.dark, fontWeight: "bold", display: "flex" }}>@{handleName}</span>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  height: "2px",
                  background: `linear-gradient(90deg, ${OG.muted}66 0%, ${OG.muted}00 100%)`,
                }}
              />
            </div>

            {shortBio ? (
              <div style={{ fontSize: "18px", color: "rgba(255,255,255,0.62)", display: "flex", lineHeight: "1.45", maxWidth: "97%", marginTop: "2px" }}>
                {shortBio}
              </div>
            ) : (
              <div style={{ fontSize: "18px", color: "rgba(255,255,255,0.3)", display: "flex", marginTop: "2px" }}>
                {"// competitive programmer on ITL"}
              </div>
            )}

            {/* CP profile handles + goal */}
            {(links.length > 0 || ratingGoal) ? (
              <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginTop: "12px" }}>
                {links.map((l) => (
                  <div
                    key={l.label}
                    style={{
                      display: "flex",
                      fontSize: "14px",
                      color: OG.bright,
                      backgroundColor: OG.panel,
                      border: "1px solid rgba(155, 168, 171, 0.28)",
                      padding: "6px 14px",
                      gap: "8px",
                    }}
                  >
                    <span style={{ color: OG.dark, fontWeight: "bold", display: "flex" }}>{l.label}</span>
                    <span style={{ display: "flex" }}>{l.value}</span>
                  </div>
                ))}
                {ratingGoal ? (
                  <div
                    style={{
                      display: "flex",
                      fontSize: "14px",
                      color: OG.bg,
                      backgroundColor: OG.muted,
                      padding: "6px 14px",
                      gap: "8px",
                      fontWeight: "bold",
                      boxShadow: "0 0 16px rgba(155, 168, 171, 0.35)",
                    }}
                  >
                    <span style={{ display: "flex" }}>GOAL</span>
                    <span style={{ display: "flex" }}>{ratingGoal}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <OgFooter prompt="$ cat ~/profile/public.json" caption={`itl/@${handleName}`} />
      </OgShell>
    ),
    { ...OG_SIZE, fonts }
  );
}
