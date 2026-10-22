import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { platformEnabled } from "@/lib/platform";
export async function POST() {
  const u = await requireSession();
  if (!u) return apiError("UNAUTHENTICATED", "Please sign in");
  if (!platformEnabled()) return NextResponse.json({ accepted: 0 });
  const { data, error } = await db.rpc("plainpage_accept_invites", {
    p_actor: u.userId,
  });
  if (error) return apiError("INTERNAL", "Invitations could not be accepted.");
  return NextResponse.json({ accepted: data });
}
