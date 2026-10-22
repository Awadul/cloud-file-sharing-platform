import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { apiError } from "@/lib/errors";
import { platformEnabled } from "@/lib/platform";
export async function GET() {
  const u = await requireSession();
  if (!u) return apiError("UNAUTHENTICATED", "Please sign in");
  if (!platformEnabled())
    return apiError("UNAVAILABLE", "Reviews are awaiting platform setup.");
  const [{ data: requested, error: e1 }, { data: assigned, error: e2 }] =
    await Promise.all([
      db
        .from("review_rounds")
        .select("*,documents(id,title,deleted_at,review_status)")
        .eq("requested_by", u.userId)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("review_responses")
        .select(
          "decision,review_rounds(*,documents(id,title,deleted_at,review_status))",
        )
        .eq("reviewer_id", u.userId)
        .limit(100),
    ]);
  if (e1 || e2) return apiError("INTERNAL", "Reviews could not be loaded.");
  const { data: access, error: accessError } = await db
    .from("shares")
    .select("document_id")
    .eq("user_id", u.userId);
  if (accessError)
    return apiError("INTERNAL", "Review access could not be checked.");
  const permitted = new Set((access ?? []).map((row) => row.document_id));
  const safeAssigned = (assigned ?? []).filter((row) => {
    const round = row.review_rounds as unknown as {
      document_id: string;
    } | null;
    return round && permitted.has(round.document_id);
  });
  return NextResponse.json({ requested, assigned: safeAssigned });
}
