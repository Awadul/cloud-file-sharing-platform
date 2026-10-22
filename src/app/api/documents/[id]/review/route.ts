import { NextRequest, NextResponse } from "next/server";
import { trackAction } from "@/lib/analytics";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { documentAccess, platformError } from "@/lib/platform";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: NextRequest, { params }: Context) {
  const { id } = await params;
  const a = await documentAccess(id);
  if (a.response) return a.response;
  const { data, error } = await db
    .from("review_rounds")
    .select("*,review_responses(*,users!reviewer_id(name,email))")
    .eq("document_id", id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) return apiError("INTERNAL", "Review could not be loaded.");
  const { data: people } = await db
    .from("shares")
    .select("user_id,users(id,name,email)")
    .eq("document_id", id);
  return NextResponse.json({
    round: data?.[0] ?? null,
    people: people ?? [],
    userId: a.session.userId,
    status: a.doc.review_status,
    revision: a.doc.revision,
  });
}
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const a = await documentAccess(id);
  if (a.response) return a.response;
  const parsed = z
    .object({
      action: z.enum([
        "request",
        "approved",
        "changes_requested",
        "final",
        "remind",
      ]),
      revision: z.number().int().positive(),
      reviewers: z.array(z.string().uuid()).max(20).default([]),
      due: z.string().datetime().optional(),
      message: z.string().max(2000).default(""),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return apiError("VALIDATION", "Check the review details.");
  const p = parsed.data;
  const { data, error } = await db.rpc("plainpage_review", {
    p_id: id,
    p_actor: a.session.userId,
    p_action: p.action,
    p_revision: p.revision,
    p_reviewers: p.reviewers,
    p_due: p.due ?? null,
    p_message: p.message,
  });
  if (error) return platformError(error.message);
  if (p.action === "request") await trackAction("review_requested");
  return NextResponse.json(data);
}
