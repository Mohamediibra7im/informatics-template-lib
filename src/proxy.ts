import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET is not set. Refusing to verify sessions with a default secret in production."
      );
    }
    return "itl-default-secret-change-me";
  }
  return secret;
}

const JWT_SECRET = new TextEncoder().encode(resolveJwtSecret());

async function hasValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

async function hasValidAdmin(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin API: everything under /api/admin requires a valid admin session,
  // except the login/logout endpoints that mint and clear it. Returns 401
  // JSON (not a redirect) so API clients get a machine-readable failure.
  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/login" || pathname === "/api/admin/logout") {
      return NextResponse.next();
    }
    if (await hasValidAdmin(request.cookies.get("admin_session")?.value)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin pages
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    if (await hasValidAdmin(request.cookies.get("admin_session")?.value)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Account-required areas: dashboard and the contribution forms need a valid
  // session. The /contribute landing page is public — it renders its own
  // logged-out message with login/register actions — so only its subpaths
  // (/contribute/new, /contribute/edit) are gated here.
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/contribute/")) {
    if (await hasValidSession(request.cookies.get("cp_session")?.value)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/contribute/:path*",
  ],
};
