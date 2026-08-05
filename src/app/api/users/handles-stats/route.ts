import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";
import { getCfSolvedForAllTime } from "@/lib/codeforces";

export const dynamic = "force-dynamic";

// In-memory cache per handle to prevent hitting rate limits
interface CacheEntry {
  data: Record<string, unknown>;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 1000 * 10; // 10 seconds cache to avoid double-fetching

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const [profile] = await db
    .select({
      codeforcesHandle: userProfiles.codeforcesHandle,
      atcoderHandle: userProfiles.atcoderHandle,
      leetcodeHandle: userProfiles.leetcodeHandle,
      codechefHandle: userProfiles.codechefHandle,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.userId))
    .limit(1);

  if (!profile) {
    return NextResponse.json({
      codeforces: { handle: null, rating: null, rank: null, solved: null, active: false },
      atcoder: { handle: null, rating: null, rank: null, solved: null, active: false },
      leetcode: { handle: null, rating: null, rank: null, solved: null, active: false },
      codechef: { handle: null, rating: null, rank: null, solved: null, active: false },
    });
  }

  const cfHandle = profile.codeforcesHandle;
  const acHandle = profile.atcoderHandle;
  const lcHandle = profile.leetcodeHandle;
  const ccHandle = profile.codechefHandle;

  const cacheKey = `${cfHandle || ""}:${acHandle || ""}:${lcHandle || ""}:${ccHandle || ""}`;
  const now = Date.now();
  if (!forceRefresh && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    if (now - entry.timestamp < CACHE_DURATION) {
      return NextResponse.json(entry.data);
    }
  }

  interface ProfileResult {
    handle: string | null;
    rating: number | null;
    rank: string | null;
    solved: number | null;
    active: boolean;
  }

  const results: {
    codeforces: ProfileResult;
    atcoder: ProfileResult;
    leetcode: ProfileResult;
    codechef: ProfileResult;
  } = {
    codeforces: { handle: cfHandle, rating: null, rank: null, solved: null, active: !!cfHandle },
    atcoder: { handle: acHandle, rating: null, rank: null, solved: null, active: !!acHandle },
    leetcode: { handle: lcHandle, rating: null, rank: null, solved: null, active: !!lcHandle },
    codechef: { handle: ccHandle, rating: null, rank: null, solved: null, active: !!ccHandle },
  };

  // ── 1. Codeforces ──
  if (cfHandle) {
    try {
      // The profile page's "solved for all time" counter matches what users
      // see on codeforces.com. The API's distinct-AC count is lower (it excludes
      // acmsguru / deleted-contest problems), so we prefer the profile number
      // and fall back to the API count below.
      const [infoRes, statusRes, profileSolved] = await Promise.all([
        fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(cfHandle)}`, {
          signal: AbortSignal.timeout(8000),
        }),
        fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(cfHandle)}`, {
          signal: AbortSignal.timeout(8000),
        }),
        getCfSolvedForAllTime(cfHandle),
      ]);

      const infoData = await infoRes.json();
      const statusData = await statusRes.json();

      if (infoData.status === "OK" && infoData.result?.[0]) {
        const user = infoData.result[0];
        results.codeforces.rating = user.rating ?? null;
        results.codeforces.rank = user.rank ?? null;
        results.codeforces.active = true;
      }

      if (statusData.status === "OK" && Array.isArray(statusData.result)) {
        const solvedProblems = new Set<string>();
        for (const sub of statusData.result) {
          if (sub.verdict === "OK" && sub.problem) {
            solvedProblems.add(`${sub.problem.contestId}_${sub.problem.index}`);
          }
        }
        results.codeforces.solved = solvedProblems.size;
      }

      // Prefer the profile's "solved for all time" counter when available.
      if (profileSolved !== null) {
        results.codeforces.solved = profileSolved;
        results.codeforces.active = true;
      }
    } catch (err) {
      console.error("Error fetching CF stats in personalization:", err);
    }
  }

  // ── 2. AtCoder ──
  if (acHandle) {
    try {
      const [infoRes, htmlRes] = await Promise.all([
        fetch(`https://kenkoooo.com/atcoder/atcoder-api/v2/user_info?user=${encodeURIComponent(acHandle)}`, {
          headers: { "User-Agent": "cp-templates-hub" },
          signal: AbortSignal.timeout(8000),
        }),
        fetch(`https://atcoder.jp/users/${encodeURIComponent(acHandle)}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
          },
          signal: AbortSignal.timeout(8000),
        }),
      ]);

      const infoData = infoRes.ok ? await infoRes.json() : null;
      const htmlData = htmlRes.ok ? await htmlRes.text() : null;

      if (infoData && typeof infoData.accepted_count === "number") {
        results.atcoder.solved = infoData.accepted_count;
        results.atcoder.active = true;
      }

      if (htmlData) {
        const match = htmlData.match(/Rating<\/th>\s*<td>[\s\S]*?<span[^>]*>\s*(\d+)/i);
        if (match?.[1]) {
          const rating = parseInt(match[1], 10);
          results.atcoder.rating = rating;
          results.atcoder.active = true;

          if (rating < 400) results.atcoder.rank = "gray";
          else if (rating < 800) results.atcoder.rank = "brown";
          else if (rating < 1200) results.atcoder.rank = "green";
          else if (rating < 1600) results.atcoder.rank = "cyan";
          else if (rating < 2000) results.atcoder.rank = "blue";
          else if (rating < 2400) results.atcoder.rank = "yellow";
          else if (rating < 2800) results.atcoder.rank = "orange";
          else results.atcoder.rank = "red";
        }
      }
    } catch (err) {
      console.error("Error fetching AtCoder stats in personalization:", err);
    }
  }

  // ── 3. LeetCode ──
  if (lcHandle) {
    try {
      const apiBase = "https://alfa-leetcode-api.onrender.com";
      const [solvedRes, contestRes] = await Promise.all([
        fetch(`${apiBase}/${encodeURIComponent(lcHandle)}/solved`, { signal: AbortSignal.timeout(10000) }),
        fetch(`${apiBase}/${encodeURIComponent(lcHandle)}/contest`, { signal: AbortSignal.timeout(10000) }),
      ]);

      if (solvedRes.ok) {
        const solvedData = await solvedRes.json();
        if (typeof solvedData.solvedProblem === "number") {
          results.leetcode.solved = solvedData.solvedProblem;
          results.leetcode.active = true;
        }
      }

      if (contestRes.ok) {
        const contestData = await contestRes.json();
        let ratingVal = null;
        if (typeof contestData.contestRating === "number") {
          ratingVal = Math.round(contestData.contestRating);
          results.leetcode.rating = ratingVal;
          results.leetcode.active = true;
        }
        if (typeof contestData.contestGlobalRanking === "number") {
          let badge = "";
          if (ratingVal !== null) {
            if (ratingVal >= 2190) badge = "Guardian";
            else if (ratingVal >= 1850) badge = "Knight";
          }
          const pct = contestData.contestTopPercentage?.toFixed(1) ?? "?";
          results.leetcode.rank = badge ? `${badge} (Top ${pct}%)` : `Top ${pct}%`;
        }
      }
    } catch (err) {
      console.error("Error fetching LeetCode stats in personalization:", err);
    }
  }

  // ── 4. CodeChef ──
  if (ccHandle) {
    try {
      const res = await fetch(`https://www.codechef.com/users/${encodeURIComponent(ccHandle)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const html = await res.text();
        const ratingMatch = html.match(/class="rating-number"[^>]*>\s*(\d+)/i);
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : null;

        const solvedMatch = html.match(/Total Problems Solved:\s*(\d+)/i);
        const solved = solvedMatch ? parseInt(solvedMatch[1], 10) : null;

        if (rating !== null) {
          results.codechef.rating = rating;
          results.codechef.active = true;

          let rank = "1★";
          if (rating >= 2500) rank = "7★";
          else if (rating >= 2200) rank = "6★";
          else if (rating >= 2000) rank = "5★";
          else if (rating >= 1800) rank = "4★";
          else if (rating >= 1600) rank = "3★";
          else if (rating >= 1400) rank = "2★";

          results.codechef.rank = rank;
        }
        if (solved !== null) {
          results.codechef.solved = solved;
          results.codechef.active = true;
        }
      }
    } catch (err) {
      console.error("Error fetching CodeChef stats in personalization:", err);
    }
  }

  // Cache results if valid handles exist
  if (cfHandle || acHandle || lcHandle || ccHandle) {
    cache.set(cacheKey, { data: results, timestamp: now });
  }

  return NextResponse.json(results);
}
