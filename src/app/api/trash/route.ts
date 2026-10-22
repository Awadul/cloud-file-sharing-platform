import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { apiError } from "@/lib/errors";
import { platformEnabled } from "@/lib/platform";
export async function GET() {
  const user = await requireSession();
  if (!user) return apiError("UNAUTHENTICATED", "Please sign in");
  if (!platformEnabled())
    return apiError("UNAVAILABLE", "Trash is awaiting platform setup.");
  const { data, error } = await db
    .from("documents")
    .select("id,title,deleted_at")
    .eq("owner_id", user.userId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) return apiError("INTERNAL", "Trash could not be loaded.");
  return NextResponse.json({ documents: data });
}
export async function POST(request: NextRequest) {
  const user = await requireSession();
  if (!user) return apiError("UNAUTHENTICATED", "Please sign in");
  if (!platformEnabled())
    return apiError("UNAVAILABLE", "Trash is awaiting platform setup.");
  const body = z
    .object({ id: z.string().uuid() })
    .safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError("VALIDATION", "Choose a document.");
  const { data, error } = await db
    .from("documents")
    .update({ deleted_at: null })
    .eq("id", body.data.id)
    .eq("owner_id", user.userId)
    .not("deleted_at", "is", null)
    .select("id")
    .maybeSingle();
  if (error) return apiError("INTERNAL", "Restore failed.");
  if (!data) return apiError("NOT_FOUND", "Document not found.");
  return NextResponse.json(data);
}
