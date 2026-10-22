import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { platformEnabled, platformError } from "@/lib/platform";
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await requireSession();
  if (!u) return apiError("UNAUTHENTICATED", "Please sign in");
  if (!platformEnabled())
    return apiError("UNAVAILABLE", "Invitations are awaiting setup.");
  const { id } = await params;
  const { error } = await db.rpc("plainpage_revoke_invite", {
    p_invite: id,
    p_actor: u.userId,
  });
  if (error) return platformError(error.message);
  return NextResponse.json({ ok: true });
}
