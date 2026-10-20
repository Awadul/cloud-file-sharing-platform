# Ajaia Docs

A modern, lightweight collaborative document editor built for teams. Write rich text documents, keep them organized, import existing files, and securely share them with teammates with fine-grained access control.

## Live URL

[https://ajaia-docs.vercel.app](https://ajaia-docs.vercel.app) *(updated after deployment)*

## User Authentication & Accounts

Ajaia Docs supports real user login and registration:
- **Any User Sign-In / Sign-Up**: Enter any email address to sign in. New accounts are automatically provisioned in the database.
- **Pre-Seeded Team Accounts**: For instant testing of multi-user collaboration and permission roles, the login screen includes 1-click quick selection for three accounts:

| Name  | Email            | Default Role in Seed Docs |
|-------|------------------|---------------------------|
| Alice | `alice@demo.test`| Workspace Owner (3 docs)  |
| Bob   | `bob@demo.test`  | Workspace Owner & Editor  |
| Carol | `carol@demo.test`| Teammate (Independent)    |

Default password for seeded accounts: `demo123` (or any 4+ character password for new accounts).

## Local Setup

### 1. Clone and install

```bash
cd ajaia-docs
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and configure your keys:

```bash
cp .env.example .env.local
```

| Variable                  | Description                                |
|---------------------------|--------------------------------------------|
| `SUPABASE_URL`            | Supabase project URL                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only)  |
| `SESSION_SECRET`          | Long random string for JWT cookie signing  |
| `DEMO_PASSWORD`           | Default password for seeded team accounts  |

### 3. Database setup

Run the SQL scripts in your Supabase SQL editor:
1. `supabase/schema.sql` (Creates `users`, `documents`, and `shares` tables with foreign keys and cascade rules)
2. `supabase/seed.sql` (Seeds initial team accounts and sample documents)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run tests

```bash
npm test
```

Runs the Vitest test suite covering pure business logic in `lib/access.ts` (authorization matrix) and `lib/import.ts` (file parsing and validation).

## Features

- **Document Management**: Create new documents, inline rename, delete documents, and organize into "My documents" and "Shared with me".
- **Rich Text Editor**: Powered by Tiptap (Bold, Italic, Underline, H1–H3, Bullet list, Numbered list) with debounced autosave (800ms) and retry logic.
- **Teammate File Sharing**: Share documents by entering any email address as an `Editor` or `Viewer`. Role changes take effect immediately; access can be revoked with a single confirmation.
- **Multi-Format Import**: Upload `.txt`, `.md`, or `.docx` files (up to 2 MB) that instantly convert into editable rich text documents.
- **Responsive Workspace**: Clean SaaS design with Midnight Space Navy rail, sticky navigation on desktop, mobile slide-over drawer, and horizontal scrolling for data tables.

## Supported File Formats

| Format | Extension | Processing Pipeline |
|--------|-----------|---------------------|
| Plain text | `.txt` | Split on blank lines into structured paragraphs |
| Markdown | `.md` | Converted via `marked` to sanitized HTML |
| Word | `.docx` | Converted via `mammoth` to sanitized HTML |

Max file size: **2 MB**

## Technology Stack

- **Framework**: Next.js 16 App Router (React 19), TypeScript strict mode
- **Styling**: Tailwind CSS v4 (Ajaia corporate palette, responsive grid)
- **Editor**: Tiptap (`@tiptap/react`, StarterKit, Underline)
- **Database**: Supabase Postgres (PostgreSQL 17, accessed server-side via `@supabase/supabase-js`)
- **Authentication**: Signed HTTP-only JWT session cookies via `jose`
- **Validation**: Zod schema validation on every API endpoint
- **File Parsing & Sanitization**: `mammoth` (docx), `marked` (md), `sanitize-html`
- **Testing**: Vitest (34 unit tests)

## Known Limitations

- **Last Write Wins**: Real-time multi-cursor collaboration is out of current scope; concurrent edits resolve via last write wins.
- **Application-Level Access Control**: Authorization is verified on every request via `lib/access.ts`. Supabase Row Level Security (RLS) can be added as an additional defense-in-depth layer.
