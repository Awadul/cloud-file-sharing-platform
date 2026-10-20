# Architecture Note

## What I Built and Why

### Goal

Ship a focused, working collaborative document editor that demonstrates full stack judgment under time pressure. I chose depth over breadth: every feature in scope works end-to-end rather than having more features that partially work.

---

## Stack Decisions

| Decision | Why | Tradeoff |
|---|---|---|
| Next.js App Router | Single deployment unit, server components for initial data, route handlers for API | App Router has async params/cookies — verified against Next.js 16 docs before writing routes |
| Tiptap JSON in Postgres `jsonb` | Round-trips formatting exactly; easy to inspect and test | Not directly portable — export needs a converter |
| Supabase + service role key | Fastest correct path; one central place to audit access | Not defense in depth — RLS would be the next hardening step |
| JWT session auth with auto-provisioning | Real registration for any email, plus 1-click select for seeded team accounts | Password verified against shared demo key or 4+ chars; OAuth/magic links would be next step |
| Auto-provisioning on share | Allows sharing documents with any teammate email immediately | Unregistered users gain access automatically upon first login |
| Last write wins | Real-time sync is out of scope in this timebox | Concurrent editors can overwrite — documented limitation |
| Server-side import | Keeps parsing libraries (`mammoth`, `marked`) off the client bundle | Needs buffer handling in Vercel; client-side fallback documented in code |
| No global state library | Two pages, React state is sufficient | Revisit if real-time is added |

---

## Authorization Architecture

All authorization flows through a single function in `lib/access.ts`:

```
getAccess(userId, doc, shares) → Role
```

Every route handler:
1. Reads the session cookie (never trusts client-supplied user IDs)
2. Loads the document and its share rows from the database
3. Calls `getAccess` to determine the role
4. Returns 404 for `none` (no existence leakage), 403 for insufficient role

The browser never talks to Supabase directly. The service role key exists only in server environment variables.

---

## Deliberate Cuts

| Cut | Reason |
|---|---|
| Real-time collaboration | Out of scope; documented as last-write-wins |
| Comments, version history | Beyond the timebox |
| Images/tables in imports | Sanitized out — safe default |
| PDF / Markdown export | Stretch goal, not attempted |
| Conflict resolution | Documented limitation |

---

## Security Checklist

- Session cookie: `httpOnly`, `secure` in production, `sameSite=lax`, signed with `SESSION_SECRET`
- Constant-time compare for demo password (`timingSafeEqual`)
- Every document route calls `getAccess` — verifiable via grep for `from('documents')`
- Imported HTML sanitized with `sanitize-html` before storage
- File validation checks extension, MIME prefix, and size — never trusts filename for storage
- No secrets in git — `.env.example` has names only

---

## Performance Notes

- Dashboard list excludes `content` column — only `id, title, updated_at, owner_id`
- Indexes on `documents(owner_id)` and `shares(user_id)`
- Autosave debounced to 800ms, payload is Tiptap JSON delta only
- Editor dynamically imported to keep dashboard bundle lean
