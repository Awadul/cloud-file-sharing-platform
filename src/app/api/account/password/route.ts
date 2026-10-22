import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  const body = z
    .object({ password: z.string().min(8).max(128) })
    .safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError("VALIDATION", "Use 8 to 128 characters.");
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    return apiError(
      "UNAUTHENTICATED",
      "Your reset link has expired. Request a new one.",
    );
  const result = await client.auth.updateUser({ password: body.data.password });
  if (result.error) return apiError("VALIDATION", result.error.message);
  await client.auth.signOut();
  return NextResponse.json({ ok: true });
}
