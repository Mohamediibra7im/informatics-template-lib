import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── Config ──────────────────────────────────────────────────────

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET is not set. Refusing to sign sessions with a default secret in production."
      );
    }
    return "cp-base-default-secret-change-me";
  }
  return secret;
}

function resolveAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_PASSWORD is not set. Refusing to run the admin gate with a default password in production."
      );
    }
    return "admin";
  }
  return password;
}

const JWT_SECRET = new TextEncoder().encode(resolveJwtSecret());
const SESSION_COOKIE = "cp_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const ADMIN_MAX_AGE = 60 * 60 * 24; // 1 day

// ─── Password Hashing ────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const supplied = scryptSync(password, salt, 64);
  // timingSafeEqual throws if lengths differ (e.g. corrupt/legacy hash).
  if (hashBuffer.length !== supplied.length) return false;
  return timingSafeEqual(hashBuffer, supplied);
}

// Constant-time comparison of two short ASCII strings (e.g. verification codes).
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// ─── JWT Session ─────────────────────────────────────────────────

export interface SessionPayload {
  userId: number;
  username: string;
  email: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(JWT_SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Admin Session ───────────────────────────────────────────────

// Constant-time check of a supplied admin password against the configured
// one. Never compares the raw password against a cookie value.
export function checkAdminPassword(supplied: string): boolean {
  return safeEqual(supplied, resolveAdminPassword());
}

// Signed, opaque admin token — the cookie no longer carries the password.
export async function createAdminSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_MAX_AGE}s`)
    .sign(JWT_SECRET);
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

// ─── Cookie Helpers ──────────────────────────────────────────────

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

// ─── Calendar Token ──────────────────────────────────────────────

export function generateCalendarToken(): string {
  return randomBytes(32).toString("hex");
}

// ─── Handle Verification Token ───────────────────────────────────

// Generates a fresh, unpredictable token for proving ownership of an
// external competitive-programming handle. Stored per-user in the DB.
export function generateVerificationToken(): string {
  return `CPB-${randomBytes(6).toString("hex").toUpperCase()}`;
}

// Returns the user's handle-verification token, lazily creating and
// persisting one on first use. Returns null if the DB is unavailable.
export async function getVerificationToken(userId: number): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  const [user] = await db
    .select({ token: users.handleVerifyToken })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.token) return user.token;

  const token = generateVerificationToken();
  await db
    .update(users)
    .set({ handleVerifyToken: token })
    .where(eq(users.id, userId));

  return token;
}
