# Plainpage

> **Write clearly. Share simply.**

Plainpage is a document workspace for notes, project briefs, and team updates. It combines a Tiptap rich-text editor, Supabase authentication and storage, file import, and document sharing with owner, editor, and viewer roles.

## Features

- Create, rename, search, and delete documents; browse your documents and shared work in grid or list view.
- Write with bold, italic, underline, headings, and lists. Edits autosave after an 800 ms debounce, with save status and retry feedback.
- Navigate document headings using an outline that follows the editor selection.
- Import `.txt`, `.md`, and `.docx` files up to 2 MB. Imported content is converted to editable document content and sanitized.
- Share documents with registered teammates as editors or viewers. Owners manage access and deletion.
- Explore a public landing page with an editable example, feature navigation, and reduced-motion-aware animation. Example drafts stay in the current browser and are separate from workspace documents.
- Sign in or create an account using email and password. The authentication screens include password visibility controls, confirmation feedback, and motion that respects reduced-motion preferences.

## Authentication

Authentication uses Supabase Auth through `@supabase/ssr`. The server verifies sessions with `supabase.auth.getUser()`, and `src/proxy.ts` refreshes session cookies before routes render.

- Sign-in authenticates an existing account; failed login never creates an account.
- Sign-up uses Supabase's configured email-confirmation policy. When confirmation is required, users must follow the email link before signing in.
- Confirmation codes are exchanged at `/auth/callback`; return destinations are restricted to this site. Invalid links lead back to the login screen with an error message.
- Supabase rate limits are respected. There is no admin-account provisioning fallback, magic-link login tab, or legacy JWT session authentication.
- Verified Auth users are synchronized into the `public.users` profile table.

The optional SQL seed creates sample database profiles and documents, **not Supabase Auth credentials**. Seed profiles alone cannot sign in, and there is no default application password. Use real Auth accounts for testing sharing; profile IDs must match their Auth user IDs.

## Local setup

### 1. Install dependencies

Use Node.js 20.9 or newer and run these commands from the project directory:

```sh
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in values from your Supabase project. Keep `.env.local` out of version control.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for authentication. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous API key for authentication. |
| `SUPABASE_URL` | Server database project URL; use the same project as the public URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role key for database operations. Never expose it to the browser. |

`SESSION_SECRET` and `DEMO_PASSWORD` are no longer used.

### 3. Configure the database and Auth

1. Run `supabase/schema.sql` in the Supabase SQL editor to create the `users`, `documents`, and `shares` tables and indexes.
2. Enable email/password authentication in Supabase Auth and choose your email-confirmation policy.
3. Configure the Auth Site URL for your environment and allow its confirmation callback URL, such as `http://localhost:3000/auth/callback`. Add the production callback URL when deploying.
4. Create accounts through Plainpage's Create account screen. Confirm their emails if required by your Supabase settings.

`supabase/seed.sql` is optional sample data, not an authentication setup step. Do not run it against production unless you intend to add those sample records.

### 4. Start the application

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000). Signed-out visitors see the landing page; authenticated users see their workspace. The public landing page is also available at `/welcome`, and account access is at `/login`.

### 5. Validate changes

```sh
npm test
npm run lint
npm run build
```

The current suite contains **95 tests across eight files**, covering document permissions, import parsing, authentication validation and route/session safeguards, proxy route matching and cookie refresh, editor outlines, landing drafts, and section selection. Authentication route tests use mocked Supabase responses; they do not verify email delivery or live Supabase configuration.

For a production server, build first and then run `npm start`.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page when signed out; workspace when signed in. |
| `/welcome` | Public product overview and editable browser-local example. |
| `/login` | Email/password sign-in and sign-up. |
| `/documents` | Personal document library. |
| `/shared` | Documents shared with the current user. |
| `/docs/[id]` | Document editor with role-based access. |
| `/auth/callback` | Supabase email-confirmation code exchange. |

## Technology

- Next.js 16 App Router, React 19, TypeScript, Cache Components, and request Proxy.
- Tailwind CSS 4, daisyUI, Geist typography, Lucide icons, and GSAP motion.
- Tiptap rich-text editing.
- Supabase Postgres and Supabase Auth with `@supabase/ssr`.
- Zod request validation; `mammoth`, `marked`, and `sanitize-html` for imports.
- Vitest and ESLint for automated checks.

## Current limits and deployment checks

- **Concurrent editing:** saves use last-write-wins behavior. Live multi-cursor editing and merge conflict resolution are not implemented.
- **Database access:** server routes enforce application-level permissions. The supplied schema does not define RLS policies; review database grants and policies separately before deployment. Server service-role operations bypass RLS.
- **Customer reviews:** the landing page collects review text into a local download. It does not submit, store, or publish testimonials.
- **Live validation:** local tests and builds do not establish production availability, successful live login, or confirmation-email delivery. Verify these against your configured Supabase project and deployed origin.

No production URL is asserted by this README; use the URL of your verified deployment.
