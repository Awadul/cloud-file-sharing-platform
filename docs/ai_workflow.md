# AI Workflow Note

## Tools Used

- **Antigravity IDE (Google DeepMind)** — primary coding assistant for scaffolding, implementation, and review

---

## Where AI Materially Sped Up Work

1. **Scaffolding boilerplate** — route handler structure, Zod schema definitions, TypeScript types. These follow well-known patterns; AI generated correct first drafts that I reviewed and accepted.
2. **Tiptap integration** — initial `useEditor` setup with correct extension list, `onMouseDown` pattern for toolbar buttons to prevent editor blur.
3. **Session management** — jose JWT setup with correct cookie flags (`httpOnly`, `sameSite`, `secure` in production).
4. **Component structure** — Toast, Badge, DocList, ShareDialog initial drafts that matched the design spec.
5. **Responsive design & sticky navigation**: Handled media queries and flexbox alignment across desktop side-by-side view and mobile drawer navigation.
6. **Production auth & scalable sharing**: Transitioned from hardcoded demo user select to universal email login and auto-provisioning for any teammate email on share.

---

## What I Changed or Rejected

1. **Import pipeline**: The initial draft used `@tiptap/html` `generateJSON` server-side. I changed this to store `_html` in the Tiptap JSON and convert client-side on mount, because `generateJSON` requires a browser-like DOM environment that caused issues on Vercel's Node.js runtime.
2. **Share dialog confirm step**: AI's first draft showed a modal-within-modal for remove confirmation. I simplified it to inline "Remove Bob?" text in the same row — less UI chrome, clearer intent.
3. **Error handling**: AI used generic catch blocks. I replaced with the typed `ApiError` class and a single `apiError()` helper to ensure every route returns the same shape.
4. **Autosave retry**: AI's first draft used exponential backoff with `Math.pow()`. I replaced with fixed delays `[1000, 3000, 8000]` matching the spec exactly.
5. **Button whitespace & height normalization**: Standardized all workspace action buttons to exact height (`h-9`), padding, and strict `whitespace-nowrap` to prevent multiline wrapping.

---

## How I Verified Correctness

1. **Access control**: Read `lib/access.ts` before any route handler. Grepped for every `from('documents')` call to confirm each is behind `getAccess`.
2. **Route behavior**: Tested each endpoint manually (login, create doc, PATCH, share, upload) before moving to the next slice.
3. **Library APIs**: Verified `jose` SignJWT/jwtVerify against installed package types, not memory. Verified Tiptap `useEditor` options against `@tiptap/react` TypeScript types.
4. **Test suite**: Ran `npm test` after each test file was written. All tests pass before commit.
5. **UX**: Opened the app in browser and walked through the reviewer's 4-step test flow from the spec.

---

## Evaluation Note

AI handled pattern-heavy, well-specified work quickly and correctly. I applied judgment at decision points: import strategy, error shape design, simplification of UI flows, and security details (constant-time compare, cookie flags). The spec was detailed enough that AI could implement to it accurately — the PLAN.md and DESIGN.md I wrote upfront were the primary leverage point.
