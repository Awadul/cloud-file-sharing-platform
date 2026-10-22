import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  const body = z
    .object({ email: z.string().email() })
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return apiError("VALIDATION", "Enter a valid email address.");
  const client = await createClient();
  const origin = new URL(request.url).origin;
  await client.auth.resetPasswordForEmail(
    body.data.email.trim().toLowerCase(),
    { redirectTo: `${origin}/auth/callback?next=/reset-password` },
  );
  return NextResponse.json({
    message:
      "If an account exists for that email, a password-reset link will arrive shortly.",
  });
}
