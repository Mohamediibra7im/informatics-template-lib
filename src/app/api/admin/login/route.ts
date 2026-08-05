import { NextResponse } from "next/server";
import { checkAdminPassword, createAdminSession } from "@/lib/auth";

// In-memory brute-force throttle. Keyed by client IP: after MAX_ATTEMPTS failed
// tries inside WINDOW_MS, the IP is locked out until the window rolls over.
// Note: per-instance only (serverless may run several) — a first line of
// defense, not a substitute for an edge/WAF rate limit.
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: Request): string {
  // Prefer x-real-ip: on Vercel the platform sets it to the true client IP.
  // x-forwarded-for is client-appendable, so its first hop can be spoofed to
  // rotate past the throttle — use it only as a fallback.
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

function checkThrottle(ip: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) return { limited: false, retryAfter: 0 };
  if (entry.count >= MAX_ATTEMPTS) {
    return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { limited: false, retryAfter: 0 };
}

function recordFailure(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
  // Opportunistic cleanup so the map can't grow unbounded.
  if (attempts.size > 5000) {
    for (const [key, val] of attempts) {
      if (now > val.resetAt) attempts.delete(key);
    }
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  const throttle = checkThrottle(ip);
  if (throttle.limited) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfter) } }
    );
  }

  const { password } = await request.json();

  if (typeof password !== "string" || !checkAdminPassword(password)) {
    recordFailure(ip);
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Successful login clears the failure counter for this IP.
  attempts.delete(ip);

  const token = await createAdminSession();
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}
