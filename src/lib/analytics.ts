import { db } from "./db";
import { platformEnabled } from "./platform";
export async function trackAction(
  event: "document_created" | "document_shared" | "review_requested",
) {
  if (!platformEnabled() || process.env.PLAINPAGE_ANALYTICS !== "true") return;
  // Aggregate named actions only: no user, document, IP or device identifiers.
  await db.rpc("plainpage_analytics", { p_event: event }).then(
    () => undefined,
    () => undefined,
  );
}
