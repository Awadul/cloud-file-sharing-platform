import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { documentAccess, platformError } from "@/lib/platform";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: NextRequest, { params }: Context) {
  const { id } = await params;
  const access = await documentAccess(id);
  if (access.response) return access.response;
  const { data, error } = await db
    .from("document_versions")
    .select("revision,title,content,created_at,author_id")
    .eq("document_id", id)
    .order("revision", { ascending: false })
    .limit(100);
  if (error) return apiError("INTERNAL", "History could not be loaded.");
  return NextResponse.json({ versions: data });
}
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const access = await documentAccess(id);
  if (access.response) return access.response;
  if (access.role !== "owner")
    return apiError("FORBIDDEN", "Only the owner can restore a version.");
  const parsed = z
    .object({
      revision: z.number().int().positive(),
      restore: z.number().int().positive(),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return apiError("VALIDATION", "Choose a version to restore.");
  const { data, error } = await db.rpc("plainpage_save", {
    p_id: id,
    p_actor: access.session.userId,
    p_revision: parsed.data.revision,
    p_restore: parsed.data.restore,
  });
  if (error) return platformError(error.message);
  return NextResponse.json(data);
}
