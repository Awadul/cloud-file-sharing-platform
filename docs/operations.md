# Plainpage product tier activation

The product-tier migration was applied to the linked live Supabase project on 2026-10-21, and the local application flag is enabled. See [activation record](activation-2026-10-21.md) for verified results and remaining setup. External integrations still require credentials.

## Deployment order

1. Back up the existing database and verify a restore in a separate staging database. Use Supabase-managed backup capabilities appropriate to your project, or `scripts/backup.ps1` with PostgreSQL client tools. The script exports public application tables only. Auth users and private Storage objects need separate managed backup/export coverage. Do not claim recovery readiness until those are tested too.
2. Apply `supabase/migrations/20261021_product_tiers.sql` after the existing schema in staging. It adds revisions, versions, invitations, reviews, an email outbox, AI quotas, aggregate metrics and a private image bucket. RPC execution is restricted to the service role. The migration also enables RLS and removes browser-role grants on the three original application tables.
3. Validate old profile IDs against Auth IDs. Invitations no longer create phantom profiles. Existing seeded or orphan profiles require a deliberate migration; never automatically bind documents using a supplied email without proof of control.
4. Set `PLAINPAGE_PRODUCT_TIERS=true` only after migration and tests pass. Restart the application. This exposes revision checks, history, trash, invitations and reviews. Without the flag, existing document behavior remains in place; do not open collaborative beta access in that mode.
5. In Supabase Auth, allow the production and local `/auth/callback` URLs, including the password-reset callback with `?next=/reset-password`. Configure the actual Site URL and SMTP delivery. Test expired and used reset links.
6. Configure `RESEND_API_KEY`, a verified `MAIL_FROM`, and a strong `CRON_SECRET` for document-sharing/review email. Supabase Auth email remains separate. Run authenticated POST `/api/internal/notifications` on a scheduler. The worker leases batches, retries failures up to five attempts, and uses provider idempotency keys. Monitor exhausted attempts in `notification_outbox`. No scheduler is created by this source change.
7. Optional monitoring: set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`; test a staging error. Payload filtering removes request data, user data, breadcrumbs and exception messages; session replay and performance tracing are not enabled. Review provider retention separately.
8. Optional analytics: set `PLAINPAGE_ANALYTICS=true`. `analytics_daily` stores only event name, UTC database date and count for create/share/review actions. No visitor identity, document ID, text or IP is stored there.
9. Optional AI: set server-only `OPENAI_API_KEY` and `OPENAI_MODEL` to a model enabled for your account. User consent is required for each suggestion. Each attempt reserves one of 20 daily calls atomically, even if the provider later fails; requests have a 20-second timeout and 800-token output cap. Set provider spending limits separately. No automatic rewrites are applied.
10. Review the published Privacy and Terms text with the operator before public launch. Operator: Muhammad Awais Abdullah. Support/privacy: awaisabdullahm79@gmail.com. The text describes configured behavior rather than certifying legal compliance.

## Acceptance checks

- Two editors saving the same revision: one succeeds and one receives 409; the latter can download a local draft and inspect the latest document in another tab.
- Title and content saves serialize through one browser revision queue.
- Restore creates a fresh revision; older approvals cannot finalize it.
- Trash suspends shared access; owner restoration returns the document.
- Invite a new email, register and confirm it, then open the workspace. Access attaches to the verified Auth UUID. An invitation is never an account or a public bearer access token.
- Review requests accept only existing document collaborators. Responses require reviewer membership and current access. All reviewers must approve the same revision before Final.
- Account ZIP export includes owned documents, history and image files (100 MB image cap); account deletion needs the current password and explicit DELETE confirmation. Verify associated database and Storage cleanup in staging.
- Word export preserves supported headings, emphasis, links, lists and tables; Markdown preserves supported structure; PDF uses the browser print layout. Image binary portability in exports is not yet complete.

## Recovery and limitations

Do not roll back to an application version that performs blind writes after enabling revision checks. Back out using a tested maintenance window, keep new tables intact, and preserve user drafts. Local unit tests alone do not prove deployment or delivery. The activation record separately records live database checks; provider delivery, backup scheduling and a full disaster-recovery restore drill remain unverified.

AI API implementation follows the [OpenAI Responses migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses), with explicit input/instructions and `store: false`. This does not override provider retention policies.

The migration adds an Auth deletion trigger so public profile/document cascades commit with the Auth deletion transaction. Test this trigger in staging against existing Auth and database triggers before activation. Account deletion stays disabled until the product-tier flag is enabled.
