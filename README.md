# Ajaia Docs

A lightweight collaborative document editor built for the Ajaia Full Stack Product Engineer assessment.

## Live URL

[https://ajaia-docs.vercel.app](https://ajaia-docs.vercel.app) *(updated after deployment)*

## Demo Accounts

All three accounts share the same password. See SUBMISSION.md for credentials.

| Name  | Email            |
|-------|-----------------|
| Alice | alice@demo.test |
| Bob   | bob@demo.test   |
| Carol | carol@demo.test |

## Local Setup

### 1. Clone and install

```bash
cd ajaia-docs
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable                  | Description                              |
|---------------------------|------------------------------------------|
| `SUPABASE_URL`            | Your Supabase project URL                |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only)         |
| `SESSION_SECRET`          | Long random string for JWT signing       |
| `DEMO_PASSWORD`           | Shared password for all seeded accounts  |

### 3. Database setup

Run these in your Supabase SQL editor:

```sql
-- Schema
-- (copy contents of supabase/schema.sql)

-- Seed
-- (copy contents of supabase/seed.sql)
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run tests

```bash
npm test
```

Tests cover `lib/access.ts` and `lib/import.ts` (pure logic, no database required).

## Supported File Formats

| Format | Extension | Notes                              |
|--------|-----------|------------------------------------|
| Plain text | `.txt` | Split on blank lines into paragraphs |
| Markdown | `.md` | Converted via `marked`             |
| Word | `.docx` | Converted via `mammoth`            |

Max file size: **2 MB**

## Stack

- **Framework**: Next.js 16 App Router, TypeScript strict
- **Styling**: Tailwind CSS v4
- **Editor**: Tiptap (`@tiptap/react`, StarterKit, Underline)
- **Database**: Supabase Postgres (service role, server-only)
- **Auth**: Mocked — signed JWT cookie via `jose` (intentionally simplified for review)
- **Validation**: Zod
- **Import**: `mammoth` (docx), `marked` (md), `sanitize-html`
- **Tests**: Vitest

## Known Limitations

- **Last write wins**: Two editors typing simultaneously can overwrite each other. Real-time sync is out of scope.
- **Mocked auth**: All three users share a single demo password. Production would use proper auth.
- **No RLS**: Authorization is enforced at the application layer via `lib/access.ts`. Supabase Row Level Security would be the next security hardening step.
