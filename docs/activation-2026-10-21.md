# Plainpage activation — 2026-10-21

## Activated

- Supabase project: Ajaia-Project (`sendtdqvmudegrzamngt`).
- Applied `supabase/migrations/20261021_product_tiers.sql` in a transaction; registered migration `20261021 / product_tiers`.
- Existing data counts preserved: 5 users, 12 documents, 4 shares. All five profiles match verified Auth identities.
- Added revision checks, history, trash, invitations, reviews, outbox, AI quota, aggregate analytics and private image metadata/storage.
- Enabled RLS on all application tables; removed direct anonymous/authenticated browser-role access. Server service-role access verified.
- Private `document-images` bucket verified.
- Set `PLAINPAGE_PRODUCT_TIERS=true` in local `.env.local` and started the application on port 3000.
- Supabase Site URL remains `http://localhost:3000`. Saved exact redirect URLs `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/callback?next=/reset-password`.

## Evidence

Live SQL transaction tests passed for revision conflicts, version restoration, approval, approval invalidation after edits, and trash save protection. Test records were rolled back. `node scripts/verify-activation.mjs` passed service-role access, anonymous denial for all 11 tables, RPC availability/access restriction and private bucket checks. The dashboard showed no Advisor issues after migration.

A pre-migration JSON data snapshot exists in `plainpage_backups.activation_snapshots` under `20261021_product_tiers`, restricted from browser roles. It contains the original users/documents/shares only. This same-database snapshot is not an independent disaster-recovery backup and excludes Auth and Storage objects.

## Still requires configuration

- Sharing/review email: verified sender, Resend credentials, cron secret and scheduler. Supabase authentication email is separate; no delivery test was performed.
- Sentry credentials and staging verification.
- Optional OpenAI credentials/model and provider spending limits.
- Optional aggregate analytics flag.
- Independent database/Auth/Storage backup coverage and a tested restore.
- Public deployment origin and its Supabase callback URLs. No hosted deployment or hosting environment variables were changed.

Browser verification of the local application was unavailable because its URL was blocked by the browser security policy. Database activation was verified directly; no claim of a completed browser login or account-deletion trial is made.
