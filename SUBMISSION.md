# Submission

## Live URL

[https://ajaia-docs.vercel.app](https://ajaia-docs.vercel.app) *(updated after deployment)*

## Demo Credentials

**Shared password**: `[fill in before submission]`

| User  | Email            |
|-------|-----------------|
| Alice | alice@demo.test |
| Bob   | bob@demo.test   |
| Carol | carol@demo.test |

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

- Login with any of the 3 seeded accounts
- Create documents, rename inline, autosave with retry
- Rich text: bold, italic, underline, H1–H3, bullet list, numbered list
- Upload `.txt`, `.md`, `.docx` (max 2 MB) → becomes editable document
- Share by email with editor or viewer role
- Change role after sharing (immediate save)
- Remove access with confirm step
- Dashboard: two separate sections (My documents / Shared with me) with role badges
- Viewer role: read-only enforced on both UI and server
- 404 and 403 error pages for document routes

## What Is Incomplete / Intentionally Cut

| Feature | Status | Reason |
|---|---|---|
| Real-time collaboration | Cut | Out of scope; documented as last-write-wins |
| Real auth (signup/reset) | Cut | Mocked auth serves demo; stated clearly |
| Version history | Cut | Beyond timebox |
| Export to Markdown | Not attempted | Stretch goal; core features took priority |
| Image/table import | Cut | Sanitized out — safe default |

## What I Would Build Next (2–4 hours)

1. **Export to Markdown** — stretch goal, `@tiptap/html` + `turndown`
2. **Supabase Row Level Security** — add RLS policies as a defense-in-depth layer
3. **Delete document** — button with confirm dialog, already wired server-side
4. **Better mobile layout** — toolbar scrolling, responsive tables
5. **Real-time presence** — WebSocket or Supabase Realtime for multi-user awareness
