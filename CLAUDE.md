# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CP-Base is a competitive-programming template library: a curated set of algorithm/data-structure templates (multi-language code + Markdown/KaTeX notes), organized into categories, with a live contest calendar, Codeforces profile widgets, user accounts, and a password-gated admin dashboard. Next.js 16 App Router, Neon Postgres via Drizzle, deployed on Vercel. Package manager is **Bun**.

## Commands

```bash
bun install
bun run dev            # dev server (Turbopack)
bun run build          # production build — use this to typecheck the WHOLE app
bun run start          # prod server
bun run lint           # eslint (flat config, next core-web-vitals + typescript)
bun run db:generate    # generate a Drizzle migration from src/db/schema.ts
bun run db:migrate     # apply migrations to Neon (reads .env)
npx tsc --noEmit       # fast typecheck without a full build
```

- There is **no test suite and no test runner** — verification is `bun run build` (full typecheck) + `bun run lint`.
- `db:generate`/`db:migrate` load env from `.env` (via `bun --env-file=.env`), not `.env.local`. Migrations live in `drizzle/`. After any `schema.ts` change: `db:generate` → `db:migrate` → `bun run build`.
- DB writes hit a **live Neon instance**; migrations are additive but there is no local DB.

## Next.js 16 gotchas (this is NOT the Next.js in your training data)

1. **Middleware is `src/proxy.ts`, not `middleware.ts`.** Next 16 renamed it — it exports `async proxy(request)` + `config.matcher`. Do not create a `middleware.ts`.
2. **`params` and `searchParams` are async** — `const { slug } = await params;`. Wrap `searchParams`-reading client trees in `<Suspense>`.
3. Route handlers/pages needing freshness must opt out of caching: `export const dynamic = "force-dynamic";` (and `no-store` fetches). The template-history route depends on this to avoid stale reverts.
4. When unsure about a Next API, read `node_modules/next/dist/` rather than assuming pre-16 behavior.

## Auth model (read before touching routes)

Two independent JWT sessions, both signed with `JWT_SECRET` via `jose` (see `src/lib/auth.ts`; the middleware re-implements verification inline because it runs on the edge). Enforcement is centralized in `src/proxy.ts` — the matcher covers `/api/admin/:path*`, `/admin/:path*`, `/dashboard/:path*`, `/contribute/:path*`.

- **User session** — cookie `cp_session`, payload `{ userId, username, email }`, 7-day expiry. Passwords are scrypt-hashed (`hashPassword`/`verifyPassword`, salt:hash format). Gates `/dashboard/*` and the contribution **subpaths** `/contribute/new` + `/contribute/edit` (the `/contribute` landing page is public). Auth routes under `/api/auth/*`; account data under `/api/users/*`.
- **Admin session** — cookie `admin_session`, an opaque signed token with `{ role: "admin" }`, 1-day expiry. The cookie no longer carries the raw password; `POST /api/admin/login` checks `ADMIN_PASSWORD` in constant time (`checkAdminPassword`) then mints the token. **All `/api/admin/*` routes are gated** by the proxy (401 JSON), except `login`/`logout`.

> ⚠️ `PROJECT_GUIDE.md` predates this: it claims `/api/admin/*` is unauthenticated and that contribution forms are fully public/no-auth. That is **stale** — both are now gated. Trust the code and this file over `PROJECT_GUIDE.md` §3.7 / §9 / §12 on auth.

## Architecture

### Data layer (`src/db/`)
- `index.ts` exports `getDb()` — a lazy Neon+Drizzle singleton that **returns `null` when `DATABASE_URL` is unset**. Every consumer must null-check and return a 500 `{ error }`.
- `schema.ts` is the single source of truth for all tables + relations. Core content tables: `categories`, `templates` (+ `templateCodes`, one row per language tab), `contributions`, `templateHistory`, `siteSettings` (homepage section toggles as string values). User tables: `users`, `userProfiles` (external CP handles + verification), `userTemplates` (per-user customized code), `userCollections`/`userCollectionItems`, `userProgress`, `templateLikes` (one row per user+template; the aggregate `templates.likeCount` is kept in sync so anonymous and account likes share one counter).

### Contribution + history flow (the non-obvious core)
- Public users submit new templates or edit requests via `/contribute/*` → `POST /api/contributions` (status `pending`). Admin reviews in the dashboard Contributions tab → `PUT /api/admin/contributions` (approve/reject, emails the contributor via `src/lib/email.ts` nodemailer; emails no-op if SMTP unset).
- Approving an **edit** first snapshots the template's prior state into `templateHistory` (via `snapshotTemplate` in `src/lib/template-history.ts`, best-effort, never blocks), then applies changes. Approving a **new** inserts the template and auto-uniquifies the slug on collision.
- Deleting an approved **edit** contribution (`DELETE /api/admin/contributions`) **auto-reverts** the template to its pre-edit snapshot (delete newest-first for clean results). This snapshot/revert coupling is the reason the history route must be `force-dynamic`.
- The template page's Contributors panel is **derived from approved `contributions`** for that `templateId` (deduped, oldest-first: `type:"new"` = creator, `type:"edit"` = editor), falling back to the `templates.contributorName/CfHandle` columns only when no rows exist.

### Theming (`src/components/theme-provider.tsx` + `providers.tsx`)
The app is **dark-only** on a slate palette: `<html>` in `layout.tsx` hardcodes `class="dark"`, `theme-provider.tsx` forces `documentElement` to `dark` in an effect, and its exported `useTheme()` returns `{ resolvedTheme: "dark" }` as a constant. `next-themes` is vestigial — only `ui/sonner.tsx` reads it. `useTerminalTheme()` exposes retro *effect* toggles only — `sound`, `reduceMotion`, `compact`, `lineNumbers`, `matrix`/`bgStyle`, and Web-Audio sound fx (`playClick/playBeep/playSuccess/playBoot`). No color-theme switching remains.

> ⚠️ `README.md` and `PROJECT_GUIDE.md` describe an older "terminal / CRT green-on-black, multi-color themes" system and a `db:seed` script — both were **removed** (see git history: theme refactor to slate dark, dropped seed). Ignore those parts.

### External data (all fetched live, no fallback)
- `GET /api/contests?platform=` aggregates Codeforces (JSON API), AtCoder (HTML scrape), LeetCode (GraphQL), CodeChef (JSON) in parallel, each with independent `.catch(() => [])`.
- `GET /api/profiles` + `src/lib/codeforces.ts` pull Codeforces `user.info`/`user.status`.

## Environment variables

Required: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`. In production the app **throws at startup** if `JWT_SECRET` or `ADMIN_PASSWORD` is missing (no insecure defaults); in dev it falls back to placeholders. Also: `NEXT_PUBLIC_SITE_URL` (metadata/OG/emails), and SMTP_* for contribution emails. See `.env.example`.

## Conventions

- Pages are server components by default; interactive pieces are `"use client"` and read `useTerminalTheme()` for sound/effects.
- Validate public POSTs (`/api/contributions`, auth routes) server-side, defensively.
- API responses use `NextResponse.json`; DB-missing → 500 `{ error }`, validation → 400, not found → 404. Do not leak internal error details in responses.
- Match the surrounding file's density and idiom when editing.

`PROJECT_GUIDE.md` has deeper detail on individual components, API routes, and flows — useful, but verify its auth/theme/seed claims against the code, which have moved on.
