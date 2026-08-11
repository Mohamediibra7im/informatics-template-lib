<div align="center">

# Informatics Template Lib (ITL)

**A competitive programming template library**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Copy, paste, and ace your next contest.

[Getting Started](#getting-started) · [Features](#features) · [Tech Stack](#tech-stack)

</div>

---

## Overview

Informatics Template Lib (ITL) is a modern web application for organizing and sharing competitive programming templates. Built for speed — find the right algorithm template in seconds, copy it, and focus on solving problems. It ships with user accounts, a public contribution + review workflow, a live contest calendar, and a password-gated admin dashboard. Slate dark theme throughout.

## Features

| Feature | Description |
|---------|-------------|
| **Fuzzy Search** | Find templates instantly with intelligent fuzzy matching (Fuse.js) |
| **Multi-language** | Templates in C++, Python, Java, Rust, Go, and more |
| **Syntax Highlighting** | Beautiful code blocks powered by Shiki |
| **Markdown + Math Notes** | Rich algorithm explanations with LaTeX via `$$` (KaTeX) |
| **User Accounts** | Register, verify email, save/customize templates, collections, progress, CP handles |
| **Contribute** | Logged-in users submit new templates or edit requests for admin review |
| **Contest Calendar** | Live upcoming contests from Codeforces, AtCoder, LeetCode, CodeChef |
| **CP Profiles** | Codeforces stats widget |
| **Admin Panel** | Full CRUD for templates/categories, contribution review, version history + revert |
| **Responsive** | Works on desktop and mobile |

## Tech Stack

```
├── Framework     Next.js 16 (App Router + Turbopack)
├── Language      TypeScript 5
├── Runtime       Bun
├── Database      Neon Postgres (Serverless)
├── ORM           Drizzle ORM
├── UI            Radix UI + Tailwind CSS 4 (dark slate)
├── Auth          jose (JWT sessions) + scrypt hashing
├── Search        Fuse.js (Fuzzy Search)
├── Math          KaTeX (LaTeX Rendering)
├── Code          Shiki (highlighting) + Monaco (admin editor)
├── Email         Nodemailer (SMTP)
└── Font          JetBrains Mono
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1+ (or Node.js 18+)
- A [Neon](https://neon.tech) Postgres database (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/Mohamediibra7im/informatics-template-lib.git
cd informatics-template-lib

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
```

Edit `.env` (see `.env.example` for the full list):

```env
DATABASE_URL=postgresql://username:password@ep-xxx.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=your-long-random-secret          # signs user + admin sessions
ADMIN_PASSWORD=your-secure-admin-password
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# SMTP_* for account verification + contribution emails (optional in dev)
```

> `JWT_SECRET` and `ADMIN_PASSWORD` are required in production — the app refuses to start without them.

### Database Setup

```bash
bun run db:generate   # generate migrations from src/db/schema.ts (reads .env)
bun run db:migrate    # apply migrations to Neon
```

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── proxy.ts                # middleware (auth gate) — NOT middleware.ts
├── app/                    # Next.js App Router
│   ├── (auth)/             # login / register / verify
│   ├── dashboard/          # logged-in user area
│   ├── admin/              # admin panel (password-gated)
│   ├── api/                # API routes (auth, users, admin, contests, ...)
│   ├── category/ · categories/
│   ├── template/ · templates/
│   └── contribute/         # contribution flow (login required)
├── components/             # React components (+ ui/, forms/, terminal/)
├── db/                     # schema.ts (source of truth) + index.ts (getDb)
└── lib/                    # auth, email, contests, codeforces, history, utils
```

See [`PROJECT_GUIDE.md`](PROJECT_GUIDE.md) for architecture, data model, API surface, and gotchas.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Production build (also full typecheck) |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:generate` | Generate migrations |
| `bun run db:migrate` | Run migrations |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ for competitive programmers

</div>
