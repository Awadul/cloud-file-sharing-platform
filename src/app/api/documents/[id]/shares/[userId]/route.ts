// app/api/documents/[id]/shares/[userId]/route.ts
// DELETE → remove a share (owner only)
// PATCH  → update share role (owner only)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/errors';
import { getAccess, can } from '@/lib/access';
import { z } from 'zod';

type Params = { params: Promise<{ id: string; userId: string }> };

async function loadDocAndShares(docId: string) {
  const [docResult, sharesResult] = await Promise.all([
    db.from('documents').select('owner_id').eq('id', docId).single(),
    db.from('shares').select('user_id, role').eq('document_id', docId),
  ]);
  return { doc: docResult.data, shares: sharesResult.data ?? [] };
}

async function getSharesWithUsers(docId: string) {
  const { data } = await db
    .from('shares')
    .select('user_id, role, users(id, name, email)')
    .eq('document_id', docId);
  return data ?? [];
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!session) return apiError('UNAUTHENTICATED', 'Please log in');

  const { id, userId } = await params;
  const { doc, shares } = await loadDocAndShares(id);

  if (!doc) return apiError('NOT_FOUND', 'Document not found');

  const role = getAccess(session.userId, doc, shares);
  if (!can.read(role)) return apiError('NOT_FOUND', 'Document not found');
  if (!can.share(role)) return apiError('FORBIDDEN', 'Only the owner can remove access');

  const { error } = await db
    .from('shares')
    .delete()
    .eq('document_id', id)
    .eq('user_id', userId);

  if (error) return apiError('INTERNAL', 'Failed to remove share');

  const shareList = await getSharesWithUsers(id);
  return NextResponse.json({ shares: shareList });
}

const PatchShareSchema = z.object({ role: z.enum(['editor', 'viewer']) });

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!session) return apiError('UNAUTHENTICATED', 'Please log in');

  const { id, userId } = await params;
  const { doc, shares } = await loadDocAndShares(id);

  if (!doc) return apiError('NOT_FOUND', 'Document not found');

  const role = getAccess(session.userId, doc, shares);
  if (!can.read(role)) return apiError('NOT_FOUND', 'Document not found');
  if (!can.share(role)) return apiError('FORBIDDEN', 'Only the owner can change roles');

  const body = await req.json().catch(() => null);
  const parsed = PatchShareSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION', 'Invalid role');

  const { error } = await db
    .from('shares')
    .update({ role: parsed.data.role })
    .eq('document_id', id)
    .eq('user_id', userId);

  if (error) return apiError('INTERNAL', 'Failed to update role');

  const shareList = await getSharesWithUsers(id);
  return NextResponse.json({ shares: shareList });
}
