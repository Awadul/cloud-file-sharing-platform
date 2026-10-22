// app/api/documents/route.ts
// GET  /api/documents  → { owned: [], shared: [] }
// POST /api/documents  → create empty doc

import { NextRequest, NextResponse } from "next/server";
import { trackAction } from "@/lib/analytics";
import { platformEnabled } from "@/lib/platform";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { apiError } from "@/lib/errors";
import { CreateDocSchema } from "@/lib/schemas";

export async function GET() {
  const session = await requireSession();
  if (!session) return apiError("UNAUTHENTICATED", "Please log in");

  // Owned documents (exclude content for list performance)
  const { data: owned, error: ownedError } = await db
    .from("documents")
    .select(
      platformEnabled()
        ? "id, title, excerpt, updated_at, owner_id, revision, review_status, deleted_at"
        : "id, title, excerpt, updated_at, owner_id",
    )
    .eq("owner_id", session.userId)
    .order("updated_at", { ascending: false });

  if (ownedError) return apiError("INTERNAL", "Failed to fetch documents");

  // Shared documents
  const { data: shareRows, error: shareError } = await db
    .from("shares")
    .select(
      platformEnabled()
        ? "document_id, role, documents(id, title, excerpt, updated_at, owner_id, deleted_at, users!owner_id(name, email))"
        : "document_id, role, documents(id, title, excerpt, updated_at, owner_id, users!owner_id(name, email))",
    )
    .eq("user_id", session.userId);

  if (shareError)
    return apiError("INTERNAL", "Failed to fetch shared documents");

  type SharedItem = {
    document_id: string;
    role: string;
    documents: {
      id: string;
      deleted_at?: string | null;
      title: string;
      excerpt: string;
      updated_at: string;
      owner_id: string;
      users: { name: string; email: string } | null;
    } | null;
  };

  const shared = (shareRows as unknown as SharedItem[])
    .filter((s) => s.documents !== null && !s.documents.deleted_at)
    .map((s) => ({
      id: s.documents!.id,
      title: s.documents!.title,
      excerpt: s.documents!.excerpt,
      updated_at: s.documents!.updated_at,
      owner_id: s.documents!.owner_id,
      owner_name: s.documents!.users?.name ?? "Unknown",
      role: s.role,
    }));

  return NextResponse.json({
    owned: (
      (owned ?? []) as unknown as { deleted_at?: string | null }[]
    ).filter((doc) => !doc.deleted_at),
    shared,
  });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return apiError("UNAUTHENTICATED", "Please log in");

  const body = await req.json().catch(() => ({}));
  const parsed = CreateDocSchema.safeParse(body);
  if (!parsed.success)
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Invalid input",
    );

  const { data: doc, error } = await db
    .from("documents")
    .insert({
      owner_id: session.userId,
      title: parsed.data.title ?? "Untitled document",
    })
    .select(
      platformEnabled()
        ? "id, title, updated_at, revision"
        : "id, title, updated_at",
    )
    .single();

  if (error || !doc) return apiError("INTERNAL", "Failed to create document");

  await trackAction("document_created");
  return NextResponse.json(doc, { status: 201 });
}
