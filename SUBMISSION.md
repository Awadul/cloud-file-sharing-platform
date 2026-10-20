# Submission

## Live URL

[https://ajaia-docs.vercel.app](https://ajaia-docs.vercel.app) *(updated after deployment)*

## User Accounts & Authentication

Ajaia Docs supports real user login and auto-provisioned registration:
- **Any Email Sign-In / Registration**: Enter any email address to sign in or register instantly.
- **Seeded Team Accounts**: For fast multi-role verification, 1-click select pills are provided on the login page:

**Default password for seeded accounts**: `demo123`

| User  | Email            | Default Role in Seed Docs |
|-------|------------------|---------------------------|
| Alice | `alice@demo.test`| Document Owner (3 docs)   |
| Bob   | `bob@demo.test`  | Document Owner & Editor   |
| Carol | `carol@demo.test`| Teammate (Independent)    |

## Walkthrough Video

[YouTube / Loom link] *(fill in after recording)*

## What Is Included

### Source Code
- Next.js App Router application with TypeScript strict mode
- All API route handlers in `src/app/api/`
- React components in `src/components/`
- Pure logic in `src/lib/` (access control, import, session, DB client, schemas, errors)
- Database schema and seed in `supabase/`

### Documentation
- `README.md` — local setup, stack, supported formats, known limitations
- `docs/architecture.md` — stack decisions, auth model, deliberate cuts, security checklist
- `docs/ai_workflow.md` — AI tools used, what was changed, verification approach

### Tests
```bash
npm test
```
- `tests/access.test.ts` — role matrix, edge cases
- `tests/import.test.ts` — file validation, error codes

## What Works

- **User Authentication**: Sign in with any email address; new accounts auto-provision. Quick-select for seeded team accounts.
- **Document Creation & Editing**: Create documents, inline rename, debounced autosave (800ms) with failure retries and status indicators.
- **Rich Text Formatting**: Bold, italic, underline, H1–H3, bullet lists, numbered lists with accessible active state indicators.
- **File Import**: Multi-format file upload (`.txt`, `.md`, `.docx` up to 2 MB) converted into editable Tiptap documents.
- **Scalable File Sharing**: Share documents with any teammate by email with `Editor` or `Viewer` role. If the invited user is new, their account is provisioned automatically.
- **Access Management**: Instant role upgrades/downgrades and access revocation with confirmation dialog.
- **Document Deletion**: Document owners can delete documents via row kebab action menu with confirmation step.
- **Dual Section Dashboard**: Distinct views for "My documents" and "Shared with me" with role badges, excerpt previews, and timestamps.
- **Role Enforcement**: Viewers receive read-only mode in the editor; server-side gate enforces permissions on every request.
- **Responsive Layout**: Midnight Space Navy rail, sticky on desktop, mobile slide-over drawer with hamburger toggle, and responsive table scrolling.

## Deliberate Cuts

| Feature | Status | Reason |
|---|---|---|
| Real-time multi-cursor collaboration | Cut | Out of scope for this timebox; documented as last-write-wins |
| Version history & diffing | Cut | Stored snapshot history is beyond the initial milestone |
| Export to Markdown | Cut | Stretch goal; core editing, sharing, and UX prioritized |
| Images/tables in imports | Sanitized | Security-first approach; complex tables sanitized out |

## What I Would Build Next (2–4 hours)

1. **Export to Markdown / PDF** — `@tiptap/html` + `turndown` converter
2. **Supabase Row Level Security (RLS)** — Add database-level RLS policies as defense-in-depth
3. **Real-time Presence** — WebSockets or Supabase Realtime channel for live viewer/editor presence avatars
