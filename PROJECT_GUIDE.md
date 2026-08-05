# CP-Base — Project Guide (for AI agents & new devs)

> Read this first. It's the fast-path map of the whole project: stack, conventions,
> data model, API surface, features, gotchas. Keep it updated when you change architecture.

---

## 1. What this is

**CP-Base** is a **competitive-programming template library** (slate dark theme) with:
- A curated library of algorithm/data-structure **templates** (multi-language code + Markdown notes).
- **Categories** to organize templates.
- A **live contest calendar** (Codeforces, AtCoder, LeetCode, CodeChef).
- **CP profile** widget (Codeforces stats).
- **User accounts** (register + email verification, login, personal dashboard): saved/customized templates, collections, learning progress, per-user CP handles, likes, and an iCal calendar feed.
- A **public contribution system** (submit new templates / request edits) — now **requires a logged-in account** — with admin review + email.
- **Template version history** with revert.
- An interactive **CLI console** overlay (backtick key) plus light retro flourishes (matrix/dot background, optional sound fx).
- An **admin dashboard** (password-gated, signed session) to manage everything.

Single deploy target: **Vercel**. Data: **Neon Postgres** (serverless).

---

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | **Next.js 16.2.9** (App Router, Turbopack) |
| Runtime/pkg mgr | **Bun** |
| React | 19.2 |
| DB | **Neon Postgres** via `@neondatabase/serverless` |
| ORM | **Drizzle** (`drizzle-orm` + `drizzle-kit`) |
| Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`), `tw-animate-css`; **dark-only slate palette** |
| UI prims | Radix UI + `@base-ui/react` + shadcn-style wrappers in `src/components/ui` |
| Icons | `lucide-react`, `react-icons` |
| Animation | `framer-motion` / `motion` |
| Search | `fuse.js` (fuzzy) |
| Auth | `jose` (JWT sessions, user + admin) + `scrypt` password hashing (`src/lib/auth.ts`) |
| Syntax highlight | `shiki` |
| Code editor | `@monaco-editor/react` (admin source editing) |
| Math | `katex` |
| Code format | `@wasm-fmt/clang-format` |
| Email | `nodemailer` (SMTP) — verification + contribution review emails |
| Toasts | `sonner` |

There is **no test runner**. Verify with `bun run build` (full typecheck) + `bun run lint`.

---

## 3. ⚠️ Critical gotchas (read before coding)

1. **This is NOT the Next.js in your training data.** Next 16 has breaking changes. When unsure about an API, read `node_modules/next/dist/`. Heed deprecation notices.
2. **Middleware is `src/proxy.ts`, not `middleware.ts`.** Next 16 renamed it. It exports `async proxy(request)` + `config.matcher`.
3. **`params`/`searchParams` are async.** Route/page params are `Promise` — `const { slug } = await params;`. Wrap `searchParams`-reading client trees in `<Suspense>`.
4. **Route handlers that read `searchParams`/DB and need freshness must be dynamic.** Add `export const dynamic = "force-dynamic";` (e.g. history route) + `no-store` fetches.
5. **Notes render from the DB, NOT `.md` files.** Template display reads `templates.notes`. A legacy `templates_notes/*.md` file store (`/api/admin/notes`) is still loaded/saved by the admin edit page, but the `templates_notes/` dir is now **untracked** (git-ignored) and the public template page ignores it. Don't reintroduce md-file rendering on public pages.
6. **DB writes go to a live Neon instance.** Migrations are additive; still be careful. `bun run db:generate` then `bun run db:migrate` (both read `.env`).
7. **`/api/admin/*` IS auth-gated now.** `proxy.ts` matches `/api/admin/:path*` and returns **401 JSON** unless a valid signed admin session is present (except `login`/`logout`). It also gates `/admin/*` (redirect to login), and `/dashboard/*` + `/contribute/*` subpaths behind a **user** session. The `/contribute` landing page stays public.
8. **The app is dark-only.** `<html class="dark">` is hardcoded in `layout.tsx`; `theme-provider.tsx` forces `dark` and its `useTheme()` returns a constant. Don't add a light-mode toggle expecting the old multi-theme system — it's gone.
9. **`JWT_SECRET` and `ADMIN_PASSWORD` are mandatory in production** — the app throws at startup if unset (no insecure defaults). Dev falls back to placeholders.

---

## 4. Commands

```bash
bun install
bun run dev            # dev server (Turbopack)
bun run build          # production build (use to typecheck the whole app)
bun run start          # prod server
bun run lint
bun run db:generate    # generate a Drizzle migration from schema.ts (reads .env)
bun run db:migrate     # apply migrations to Neon (reads .env)
npx tsc --noEmit       # fast typecheck
```

Migrations live in `drizzle/`. Config: `drizzle.config.ts` (schema `./src/db/schema.ts`, dialect postgres). There is **no `db:seed`** (removed).

---

## 5. Environment variables

```
DATABASE_URL=postgresql://...neon.tech/neondb    # required
JWT_SECRET=...                                    # required (prod throws if unset) — signs user + admin sessions
ADMIN_PASSWORD=...                                # required (prod throws) — admin login password
NEXT_PUBLIC_SITE_URL=https://cp-base.vercel.app   # canonical URL (metadata/sitemap/emails)

# Email (nodemailer SMTP) — account verification + contribution approval/rejection
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=app-password
SMTP_FROM="CP-Base <noreply@cp-base.net>"

# Optional profile widget handle (default in code)
CODEFORCES_HANDLE=...
```

`.env.example` documents the required set. Emails no-op (logged, non-blocking) if SMTP unset. Note: `db:generate`/`db:migrate` read `.env` (not `.env.local`).

---

## 6. Directory map

```
src/
  proxy.ts                      # middleware (auth gate) — NOT middleware.ts
  db/
    index.ts                    # getDb() lazy Neon+Drizzle singleton; exports { schema }
    schema.ts                   # ALL tables + relations (source of truth)
  lib/
    auth.ts                     # scrypt hashing, JWT user+admin sessions, cookie helpers, verification tokens
    email.ts                    # nodemailer transporter: verification + approval/rejection emails
    codeforces.ts               # Codeforces API helpers (profile stats)
    contests.ts                 # multi-platform contest fetchers
    template-history.ts         # snapshotTemplate(db, templateId, reason, contributionId?)
    format-code.ts              # clang-format wasm wrapper
    theme-presets.ts            # legacy color presets (mostly unused post dark-only refactor)
    utils.ts                    # cn() etc.
  app/
    layout.tsx                  # root layout (hardcoded dark), fonts, Providers, JSON-LD
    metadata.ts                 # site-wide SEO/OG metadata
    page.tsx                    # homepage (hero, profiles, contests, categories) — sections toggleable
    templates/page.tsx          # full templates listing + search
    template/[slug]/page.tsx    # template detail (code tabs, notes, contributors)
    template/[slug]/opengraph-image.tsx
    category/[slug]/page.tsx    # category page
    categories/page.tsx         # all categories
    (auth)/                     # login / register / verify pages
    dashboard/                  # logged-in user dashboard (saved templates, collections, progress, handles)
    contribute/                 # contribution flow (subpaths require login)
      page.tsx                  #   landing (public; new vs edit)
      new/page.tsx              #   submit new template form
      edit/page.tsx             #   request edit on existing template (pre-fills code+notes)
    admin/
      login/page.tsx
      (dashboard)/layout.tsx
      (dashboard)/page.tsx      # dashboard: templates/categories/contributions/sections/stats/users tabs
      (dashboard)/templates/new/page.tsx
      (dashboard)/templates/[id]/edit/page.tsx   # Monaco source editor + History tab (revert/delete)
    api/                        # see §10
    icon.tsx apple-icon.tsx opengraph-image.tsx manifest.ts robots.ts sitemap.ts not-found.tsx
  components/                   # see §7
    ui/                         # shadcn-style primitives
    forms/  terminal/           # form + retro-terminal building blocks
```

---

## 7. Key components

- `providers.tsx` — wraps `ThemeProvider` + `AuthProvider` + `Toaster`, mounts `CyberDotGrid`, `RetroSettings`, `CliConsole`, and global click sound.
- `theme-provider.tsx` — `useTerminalTheme()` context: **effect toggles only** (`sound`, `reduceMotion`, `compact`, `lineNumbers`, `matrix`/`bgStyle`) + sound fx `playClick/playBeep/playSuccess/playBoot`. Forces `dark`; also exports a constant `useTheme()`. No color-theme switching.
- `auth-provider.tsx` — client auth context; hydrates the current user from `/api/auth/me`.
- `cli-console.tsx` / `cli-banner.tsx` — backtick-toggled terminal overlay with commands.
- `nav-bar.tsx` — top nav (Categories, Templates, Contribute, account menu), fuzzy search, mobile sheet.
- `footer.tsx` — system-monitor footer.
- `contest-calendar.tsx` — per-platform tabbed calendar; data from `/api/contests`.
- `cp-profiles.tsx` / `hero-section.tsx` / `landing-sandbox.tsx` — homepage widgets.
- `template-card.tsx` / `templates-list.tsx` / `search-command.tsx` / `search-input.tsx` — listing + Fuse search.
- `code-block.tsx` / `language-tabs.tsx` / `template-code-section.tsx` — Shiki-highlighted multi-language code with copy; line numbers via CSS counters.
- `template-personalization.tsx` — per-user customized code / progress / collections on the template page.
- `contributor-chips.tsx` — Contributors panel (see §9).
- `math-renderer.tsx` — Markdown + KaTeX (handles `%%MATH_BLOCK%%` / inline placeholders, incl. table cells).
- `markdown-editor.tsx` — notes editor (admin).
- `like-button.tsx` — like counter → `/api/templates/like`.
- Eye-candy: `matrix-rain.tsx`, `cyber-dot-grid.tsx`, `particle-field.tsx`, `animated-counter.tsx`, `retro-settings.tsx`.

---

## 8. Database schema (`src/db/schema.ts`)

All access via `getDb()` from `src/db`. `getDb()` returns `null` if `DATABASE_URL` unset — **always null-check**.

### Content
**`categories`** — id, name, slug(unique), description, icon, color, order, hidden.

**`templates`** — id, title, slug(unique), description, categoryId→categories(cascade), tags[], complexity, notes, createdAt, updatedAt, hidden, copyCount, likeCount, **contributorName**, **contributorCfHandle** (primary/legacy credit; full list derived from `contributions`).

**`templateCodes`** — id, templateId→templates(cascade), language, code. One row per language tab.

**`siteSettings`** — key(pk), value. Homepage section toggles: `show_hero_section`, `show_profiles_section`, `show_contests_section`, `show_categories_section` (string `"false"` disables).

**`contributions`** — public submissions/edit-requests:
- type `"new" | "edit"`, status `"pending" | "approved" | "rejected"`.
- contributor: contributorName, contributorEmail, contributorCfHandle.
- for `new`: title, slug, description, categoryId, tags[], complexity, notes, codes(jsonb `[{language,code}]`).
- for `edit`: templateId→templates, editReason, editCodes(jsonb), editNotes.
- adminNote, createdAt, reviewedAt. On approve of `new`, `templateId` is set to the created template.

**`templateHistory`** — version snapshots for revert: id, templateId→templates(cascade), **contributionId** (links snapshot to the triggering contribution), full field snapshot + codes(jsonb), reason, createdAt.

### Accounts
**`users`** — id, username(unique), email(unique), passwordHash (scrypt `salt:hash`), calendarToken, handleVerifyToken, emailVerified, verificationCode, verificationExpires, verificationAttempts, createdAt.

**`userProfiles`** — 1:1 with users: codeforces/atcoder/leetcode/codechef handles, ratingGoal, updatedAt.

**`userTemplates`** — per-user customized code (userId, templateId, customCode, language).

**`userCollections`** / **`userCollectionItems`** — named collections of templates.

**`userProgress`** — per (user, template) learning status (default `"learning"`).

**`templateLikes`** — one row per (user, template) (unique). `templates.likeCount` is kept in sync so anonymous likes (no row) and account likes share one counter.

Relations are defined for all FKs (see bottom of `schema.ts`).

---

## 9. Features & flows

### User accounts
- **Register** (`POST /api/auth/register`): creates a user, generates a 6-digit `verificationCode` (1-hour expiry), emails it via `sendVerificationEmail`.
- **Verify** (`POST /api/auth/verify`): constant-time (`safeEqual`) code check with attempt counting + expiry; sets `emailVerified`. `POST /api/auth/resend` re-issues a code.
- **Login/logout** (`POST /api/auth/login|logout`): scrypt-verified; mints the `cp_session` JWT (`{ userId, username, email }`, 7-day) via `createSession`/`setSessionCookie`. `GET /api/auth/me` returns the current user.
- **Dashboard** (`/dashboard`, gated): manage CP handles (`userProfiles`), saved/customized templates, collections, progress, likes, and an iCal feed (`/api/users/calendar-feed`).

### Templates & categories
- Public: homepage, `/templates` (Fuse search), `/category/[slug]`, `/template/[slug]`.
- Admin CRUD via dashboard + `/api/admin/templates` & `/api/admin/categories`.
- `template/[slug]` shows code tabs, notes (Markdown+KaTeX from DB), like button, a **Contributors** panel, and per-user personalization when logged in.

### Contributors (GitHub-style)
- The full contributor list is **derived from approved `contributions`** for that `templateId` (deduped by name+handle, oldest-first). `type:"new"` → **creator**, `type:"edit"` → editor.
- **Avatars**: real Codeforces photo (batched `user.info`, filters placeholder) when a handle exists; otherwise a deterministic DiceBear identicon. Named handles link to `codeforces.com/profile/<handle>`.
- Legacy fallback: if no contribution rows, uses `templates.contributorName/CfHandle`.

### Contribution system (**requires login**)
The `/contribute` landing is public; `/contribute/new` and `/contribute/edit` are gated by the user session (proxy).
1. `/contribute/new` → template fields + multi-language code + notes → `POST /api/contributions`.
2. `/contribute/edit` → search/select template (loads code **and current notes pre-filled**), give edit reason, modify → `POST /api/contributions`.
3. Admin dashboard **Contributions tab**: filter by status, pending badge, expandable detail, **approve**/**reject** (with note) → `PUT /api/admin/contributions`.
   - Approve `new`: inserts template (+codes), sets credit, **auto-uniquifies slug** on collision, emails contributor.
   - Approve `edit`: **snapshots current version** (linked to the contribution), applies code/notes, updates credit, emails.
   - Reject: emails contributor with optional admin note.
4. **Delete a contribution** (`DELETE /api/admin/contributions?id=`):
   - Approved **edit** → **auto-reverts** the template to the pre-edit snapshot (takes a safety snapshot first, purges that contributor's snapshot). Delete newest-first for clean results.
   - Approved **new** → keeps the published template, strips the credit.
   - Emails are NOT sent on delete.

### Template history + revert
- Every admin save (`PUT /api/admin/templates`) and every approved edit snapshots the **prior** state into `templateHistory` (best-effort, never blocks).
- Admin edit page → **History tab**: snapshots newest-first, expandable preview, **Revert** (snapshots current first, so revert is undoable), single + **multi-select delete**.
- History API is `no-store` + `force-dynamic` (avoids stale lists that caused wrong-target reverts).

### Contest calendar
- `/api/contests?platform=codeforces|atcoder|leetcode|codechef|all`.
- CF: official JSON API (phase BEFORE). AtCoder: HTML scrape. LeetCode: GraphQL `allContests`. CodeChef: JSON API. All fetched in parallel, independent `.catch(() => [])`, no fallback data.

### CP profiles
- `/api/profiles` — Codeforces `user.info` + `user.status` (`src/lib/codeforces.ts`). Handle from `CODEFORCES_HANDLE` env (default in code).

### Admin auth
- `POST /api/admin/login`: constant-time `ADMIN_PASSWORD` check (`checkAdminPassword`) + **in-memory per-IP brute-force throttle** (best-effort, not a WAF), then mints an opaque signed `admin_session` JWT (`{ role: "admin" }`, 1-day). The cookie no longer carries the password.
- `src/proxy.ts` gates `/admin/*` (redirect to login) **and** `/api/admin/*` (401 JSON), except `login`/`logout`, by verifying the signed token's `role === "admin"`.

### Theming
- Dark-only slate palette. `useTerminalTheme()` toggles retro *effects* (sound, reduced motion, compact, line numbers, matrix/dot background) via CLI console or `retro-settings`. No color themes.

---

## 10. API reference

**Auth (public):**
- `POST /api/auth/register`, `POST /api/auth/verify`, `POST /api/auth/resend`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

**User (session-gated):** under `/api/users/*`
- `profiles` (CP handles), `templates` (customized code), `collections`, `progress`, `likes`, `contributions`, `handles-stats`, `calendar-feed` (iCal).

**Templates/content (public):**
- `POST /api/templates/copy` — increment copyCount.
- `POST /api/templates/like` — like/unlike (syncs `templateLikes` + `likeCount`).
- `GET /api/contests?platform=`, `GET /api/profiles`.
- `POST /api/contributions` — submit new/edit (requires login; validated).

**Admin (proxy-gated, 401 JSON if not admin — except login/logout):**
- `GET/POST/PUT/DELETE /api/admin/templates` — CRUD (PUT snapshots history first).
- `GET/POST/PUT/DELETE /api/admin/templates/history` — list / revert(POST {historyId}) / delete(?id or {ids:[]}).
- `GET/POST/PUT/DELETE /api/admin/categories`.
- `GET /api/admin/contributions` (list), `PUT` (approve/reject), `DELETE` (delete + auto-revert).
- `GET /api/admin/users` — user management.
- `GET/PUT /api/admin/notes` — legacy `.md` note file store (admin edit page; dir untracked).
- `GET/POST /api/admin/settings` — homepage section toggles.
- `POST /api/admin/login`, `POST /api/admin/logout`.

Response convention: `NextResponse.json`; DB-missing → `{ error }` 500; validation → 400; not found → 404; unauthenticated admin/user areas → 401 / redirect. Do not leak internal error details.

---

## 11. Conventions

- **Styling**: dark slate palette, mono fonts, `[ bracketed ]` button labels, `$ command` prompts, borders over shadows, `border`+`bg-*/5` chips, traffic-light dots. Avoid thick single-side accent borders (flagged by the design hook).
- **Client vs server**: pages are server components by default; interactive bits are `"use client"` and use `useTerminalTheme()`/`useAuth()` as needed.
- **Match surrounding code** density and idiom when editing a file.
- **Validation** on public POSTs (auth, contributions) is server-side and defensive; compare secrets/codes in constant time (`safeEqual`, `verifyPassword`).
- After schema changes: `db:generate` → `db:migrate`, then `bun run build` to typecheck.

---

## 12. Known caveats / TODO candidates

- Admin login throttle is **in-memory per instance** — resets on redeploy and isn't shared across serverless instances; treat as defense-in-depth, not a real rate limit.
- Reverting a **mid-stack** edit (older edit with newer edits on top) rolls the template back to before that edit; newer work is preserved only in history, not live.
- Admin edit page still loads/saves notes to the legacy `.md` store (`templates_notes/`, now untracked) in addition to DB; public rendering uses DB only.
- History snapshots only exist from when a template is first edited (no snapshot at creation).
- Contribution `contributionId` history link exists only for contributions approved after that feature landed; older ones fall back to credit-strip on delete.
- `next-themes` remains a dependency but is effectively vestigial (only `ui/sonner.tsx` reads it) since the app is dark-only.

---

_Last updated: keep this current when you change schema, routes, or core flows._
