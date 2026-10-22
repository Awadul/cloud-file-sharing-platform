import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const received = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    Buffer.byteLength(received) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  )
    return apiError("UNAUTHENTICATED", "Unauthorized");
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM)
    return apiError("UNAVAILABLE", "Transactional email is not configured.");
  const { data, error } = await db.rpc("plainpage_claim_mail");
  if (error) return apiError("INTERNAL", "Queue unavailable.");
  let sent = 0;
  for (const mail of data ?? []) {
    try {
      const result = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": mail.id,
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM,
          to: [mail.recipient],
          subject: mail.subject,
          text: mail.body,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!result.ok)
        throw new Error(`Email provider returned ${result.status}`);
      const marked = await db
        .from("notification_outbox")
        .update({
          sent_at: new Date().toISOString(),
          locked_until: null,
          last_error: null,
        })
        .eq("id", mail.id);
      if (!marked.error) sent++;
    } catch {
      await db
        .from("notification_outbox")
        .update({
          last_error: "Delivery failed; retry scheduled",
          locked_until: new Date(Date.now() + 300000).toISOString(),
        })
        .eq("id", mail.id);
    }
  }
  return NextResponse.json({ sent, processed: data?.length ?? 0 });
}
