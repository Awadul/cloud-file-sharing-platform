// app/api/documents/[id]/route.ts
// GET    /api/documents/[id]  → doc + role
// PATCH  /api/documents/[id]  → autosave or rename
// DELETE /api/documents/[id]  → owner only

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/errors';
import { PatchDocSchema } from '@/lib/schemas';
import { getAccess, can } from '@/lib/access';

type Params = { params: Promise<{ id: string }> };

async function loadDocAndShares(id: string) {
  const [docResult, sharesResult] = await Promise.all([
    db.from('documents').select('*').eq('id', id).single(),
    db.from('shares').select('user_id, role').eq('document_id', id),
  ]);
  return { doc: docResult.data, docError: docResult.error, shares: sharesResult.data ?? [] };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!session) return apiError('UNAUTHENTICATED', 'Please log in');

  const { id } = await params;
  const { doc, shares } = await loadDocAndShares(id);

  if (!doc) return apiError('NOT_FOUND', 'Document not found');

  const role = getAccess(session.userId, doc, shares);
  if (!can.read(role)) return apiError('NOT_FOUND', 'Document not found');

  return NextResponse.json({ ...doc, role });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!session) return apiError('UNAUTHENTICATED', 'Please log in');

  const { id } = await params;
  const { doc, shares } = await loadDocAndShares(id);

  if (!doc) return apiError('NOT_FOUND', 'Document not found');

  const role = getAccess(session.userId, doc, shares);
  if (!can.read(role)) return apiError('NOT_FOUND', 'Document not found');
  if (!can.write(role)) return apiError('FORBIDDEN', 'You do not have edit access');

  const body = await req.json().catch(() => null);
  const parsed = PatchDocSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION', parsed.error.issues[0]?.message ?? 'Invalid input');

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.title !== undefined)   update.title   = parsed.data.title;
  if (parsed.data.content !== undefined) update.content = parsed.data.content;

  const { data: updated, error } = await db
    .from('documents')
    .update(update)
    .eq('id', id)
    .select('id, title, updated_at')
    .single();

  if (error || !updated) return apiError('INTERNAL', 'Failed to update document');

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!session) return apiError('UNAUTHENTICATED', 'Please log in');

  const { id } = await params;
  const { doc, shares } = await loadDocAndShares(id);

  if (!doc) return apiError('NOT_FOUND', 'Document not found');

  const role = getAccess(session.userId, doc, shares);
  if (!can.read(role)) return apiError('NOT_FOUND', 'Document not found');
  if (!can.delete(role)) return apiError('FORBIDDEN', 'Only the owner can delete a document');

  const { error } = await db.from('documents').delete().eq('id', id);
  if (error) return apiError('INTERNAL', 'Failed to delete document');

  return new NextResponse(null, { status: 204 });
}
