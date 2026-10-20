# AI Running Scratch Log

Running engineering and decision log kept across implementation slices. Serves as source material for `ai_workflow.md`.

---

## Slice 0: Repo, Schema, Seed & Setup
- **Goal**: Initialize Next.js project with App Router, TypeScript strict mode, configure Tailwind CSS, create Supabase schema/seed scripts, and define baseline configurations.
- **Actions**:
  - Initialized Next.js App Router project with TypeScript strict mode.
  - Setup `@tailwindcss/postcss` and Tailwind v4.
  - Configured `@supabase/supabase-js`, `zod`, `jose`, `mammoth`, `marked`, `sanitize-html`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, and `vitest`.
  - Added database migrations: `supabase/schema.sql` (users, documents, shares with foreign keys, indexes, cascades) and `supabase/seed.sql` (Alice, Bob, Carol seeded UUIDs).
  - Configured `.env.example` with required environment variable keys.
- **Verification**: Verified project structure, packages installed cleanly, schema SQL syntax verified.

---

## Slice 1: Authentication, Session Management & Dashboard
- **Goal**: Implement mocked authentication, signed JWT session cookies, `/login` page with 3-user picker, session-gated `/` dashboard, and document creation.
- **Actions**:
  - Implemented `src/lib/session.ts` using `jose` (`SignJWT` & `jwtVerify`) with `httpOnly`, `sameSite: 'lax'`, `secure` in production.
  - Added constant-time password comparison (`crypto.timingSafeEqual`) in `src/app/api/login/route.ts` checking against `DEMO_PASSWORD`.
  - Created `/login` with clean, accessible UI (user select dropdown for Alice, Bob, Carol, password field, inline error messaging).
  - Built `/api/me` and `/api/logout` endpoints.
  - Built `/api/documents` GET (lists owned and shared documents, omitting heavy `content` column for performance) and POST (creates new empty document).
  - Built `/` dashboard displaying two separate, explicit sections: "My documents" and "Shared with me", each with role and owner badges (`Owner`, `Editor`, `Viewer`), last updated timestamp, upload button, and new document button.
- **Verification**: Tested login flow with demo accounts, checked session cookie signing, verified separate lists for owned vs shared documents.

---

## Slice 2: Tiptap Editor, Toolbar, Autosave & Title Rename
- **Goal**: Rich-text document editor with sticky toolbar, debounced autosave, inline title rename, and save status indication.
- **Actions**:
  - Created `src/components/Editor.tsx` and `src/components/Toolbar.tsx` with Tiptap StarterKit + Underline.
  - Implemented formatting controls: Bold, Italic, Underline, H1, H2, H3, Bullet list, Numbered list. Added accessible `aria-label` and `aria-pressed` states.
  - Handled `onMouseDown={(e) => e.preventDefault()}` on toolbar buttons to avoid stealing focus from editor selection.
  - Implemented autosave debounced to 800ms targeting `PATCH /api/documents/[id]`. Status cycles: "Saving...", "Saved", and "Save failed, retrying" with fixed backoff `[1000, 3000, 8000]` ms.
  - Implemented inline borderless title input saving on blur or Enter.
  - Added `beforeunload` warning when unsaved changes are pending.
- **Verification**: Verified editor formatting, JSON content persistence, debounce behavior, and responsive styling.

---

## Slice 3: Sharing Dialog & Access Control Gate
- **Goal**: Authorization layer with single gate, sharing modal, role changes, and removal.
- **Actions**:
  - Implemented pure authorization gate in `src/lib/access.ts` (`getAccess(userId, doc, shares)` returning `'owner' | 'editor' | 'viewer' | 'none'`).
  - Added role permission rules: Read (owner, editor, viewer), Edit/Rename (owner, editor), Share/Delete (owner only).
  - Implemented `GET`, `POST`, and `DELETE` on `/api/documents/[id]/shares`.
  - Gated all document endpoints behind `getAccess`; returned 404 for `'none'` to prevent document existence leakage, 403 for insufficient role.
  - Built `src/components/ShareDialog.tsx` modal with focus trap, Escape key dismiss, inline email search, role select (`editor` / `viewer`), immediate role updating, and inline confirm step for removing access.
  - Implemented viewer mode on `/docs/[id]`: disables editing (`editable: false`), hides toolbar, renders "View only" badge, and preserves selectable/copyable text.
- **Verification**: Comprehensive unit test suite in `tests/access.test.ts` covering all role transitions, ownership edge cases, self-share prevention.

---

## Slice 4: File Import (.txt, .md, .docx)
- **Goal**: Multi-format document import directly into new editable documents.
- **Actions**:
  - Implemented `src/lib/import.ts` with validation: accepts `.txt`, `.md`, `.docx`, enforces MIME and max 2 MB limit (returns 415 for unsupported types, 413 for oversized files).
  - Built format parsers:
    - `.txt`: blank-line paragraph splitter into Tiptap doc structure.
    - `.md`: `marked` parser converted to sanitized HTML.
    - `.docx`: `mammoth.convertToHtml` converted to sanitized HTML.
  - Stored sanitized imported HTML payloads in Tiptap JSON format with fallback client-side hydration, avoiding Node runtime DOM dependencies on serverless runtimes.
  - Built `src/components/UploadButton.tsx` with native file input, loading spinner, and toast notifications.
- **Verification**: Unit tests in `tests/import.test.ts` testing paragraph splits, markdown conversion, file size rejection, and unsupported extension handling.

---

## Slice 5: Tests, Validation & Error Hardening
- **Goal**: Strict Zod validation, universal error responses, comprehensive test suite.
- **Actions**:
  - Standardized error helper in `src/lib/errors.ts` (`apiError(code, message, status)` and `ApiError` class).
  - Zod schemas in `src/lib/schemas.ts` for all request payloads (`LoginSchema`, `CreateDocSchema`, `PatchDocSchema`, `ShareSchema`).
  - Fixed TypeScript typing and Zod issue reporting across all route handlers.
  - 34 automated unit tests running under Vitest for `lib/access.ts` and `lib/import.ts`.
- **Verification**: `npm test` runs 34 tests with 100% pass rate. `npx tsc --noEmit` checks with 0 errors.

---

## Slice 6: Documentation & Submission Assets
- **Goal**: Complete submission documentation, architecture rationale, and operational notes.
- **Actions**:
  - `README.md`: Setup guide, local environment guide, database migration instructions, stack overview, supported formats, limitations.
  - `SUBMISSION.md`: Verification checklist, demo account details, feature completion status, intentional cuts, roadmap.
  - `docs/architecture.md`: In-depth system design, authorization pattern, architectural tradeoffs, security checklist, performance decisions.
  - `docs/ai_workflow.md`: AI tooling review, human vs. model division of labor, verification patterns.
  - `docs/ai_log.md`: Chronological slice progress log.
