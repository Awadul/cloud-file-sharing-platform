import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { getAccess } from "@/lib/access";
import { apiError } from "@/lib/errors";

export const platformEnabled = () =>
  process.env.PLAINPAGE_PRODUCT_TIERS === "true";
export async function documentAccess(id: string) {
  const session = await requireSession();
  if (!session)
    return { response: apiError("UNAUTHENTICATED", "Please sign in") };
  if (!platformEnabled())
    return {
      response: apiError(
        "UNAVAILABLE",
        "This feature is awaiting platform setup.",
      ),
    };
  const [{ data: doc }, { data: shares }] = await Promise.all([
    db
      .from("documents")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    db.from("shares").select("user_id,role").eq("document_id", id),
  ]);
  if (!doc) return { response: apiError("NOT_FOUND", "Document not found") };
  const role = getAccess(session.userId, doc, shares ?? []);
  if (role === "none")
    return { response: apiError("NOT_FOUND", "Document not found") };
  return { session, doc, role };
}
export function platformError(message: string) {
  const code = [
    "CONFLICT",
    "FORBIDDEN",
    "NOT_FOUND",
    "RATE_LIMITED",
    "VALIDATION",
  ].find((value) => message.includes(value));
  if (code === "CONFLICT")
    return apiError(
      "CONFLICT",
      "This document changed. Review the latest version before continuing.",
    );
  if (code === "FORBIDDEN")
    return apiError("FORBIDDEN", "You do not have access to this action.");
  if (code === "NOT_FOUND")
    return apiError("NOT_FOUND", "This item is unavailable.");
  if (code === "RATE_LIMITED")
    return apiError("RATE_LIMITED", "Please wait before trying again.");
  if (code === "VALIDATION")
    return apiError(
      "VALIDATION",
      "Check the reviewers, due date, and feedback.",
    );
  return apiError(
    "INTERNAL",
    "The action could not be completed. Please try again.",
  );
}
