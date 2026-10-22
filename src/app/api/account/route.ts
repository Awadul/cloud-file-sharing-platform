import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, clearSession } from "@/lib/session";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { platformEnabled } from "@/lib/platform";
import { apiError } from "@/lib/errors";
export async function DELETE(request: NextRequest) {
  const u = await requireSession();
  if (!u) return apiError("UNAUTHENTICATED", "Please sign in");
  if (!platformEnabled())
    return apiError(
      "UNAVAILABLE",
      "Account deletion is awaiting the database migration. Contact support for help.",
    );
  const body = z
    .object({ password: z.string().min(1), confirmation: z.literal("DELETE") })
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return apiError("VALIDATION", "Enter your password and type DELETE.");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: u.email,
    password: body.data.password,
  });
  if (error) return apiError("UNAUTHENTICATED", "The password is incorrect.");
  for (let page = 0; page < 100; page++) {
    const { data: files, error: storageError } = await db.storage
      .from("document-images")
      .list(u.userId, { limit: 1000 });
    if (storageError) {
      if (storageError.message.toLowerCase().includes("not found")) break;
      return apiError(
        "INTERNAL",
        "Image storage is unavailable. Please try deletion later.",
      );
    }
    if (!files?.length) break;
    const removed = await db.storage
      .from("document-images")
      .remove(files.map((f) => `${u.userId}/${f.name}`));
    if (removed.error)
      return apiError("INTERNAL", "Image deletion failed. Please try again.");
    if (page === 99)
      return apiError(
        "INTERNAL",
        "Image cleanup is incomplete. Please retry account deletion.",
      );
  }
  const deleted = await db.auth.admin.deleteUser(u.userId);
  if (deleted.error)
    return apiError(
      "INTERNAL",
      "Account deletion failed. Please contact support.",
    );
  await clearSession().catch(() => undefined);
  return NextResponse.json({ ok: true });
}
