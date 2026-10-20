// app/api/documents/[id]/shares/route.ts
// GET  → list shares (owner only)
// POST → add or update share

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/errors';
import { ShareSchema } from '@/lib/schemas';
import { getAccess, can } from '@/lib/access';

type Params = { params: Promise<{ id: string }> };

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

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!session) return apiError('UNAUTHENTICATED', 'Please log in');

  const { id } = await params;
  const { doc, shares } = await loadDocAndShares(id);

  if (!doc) return apiError('NOT_FOUND', 'Document not found');

  const role = getAccess(session.userId, doc, shares);
  if (!can.read(role)) return apiError('NOT_FOUND', 'Document not found');
  if (!can.share(role)) return apiError('FORBIDDEN', 'Only the owner can view shares');

  const shareList = await getSharesWithUsers(id);
  return NextResponse.json({ shares: shareList });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!session) return apiError('UNAUTHENTICATED', 'Please log in');

  const { id } = await params;
  const { doc, shares } = await loadDocAndShares(id);

  if (!doc) return apiError('NOT_FOUND', 'Document not found');

  const role = getAccess(session.userId, doc, shares);
  if (!can.read(role)) return apiError('NOT_FOUND', 'Document not found');
  if (!can.share(role)) return apiError('FORBIDDEN', 'Only the owner can share a document');

  const body = await req.json().catch(() => null);
  const parsed = ShareSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION', parsed.error.issues[0]?.message ?? 'Invalid input');
  const { email, role: shareRole } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Find target user or provision user so sharing scales to any teammate
  let { data: targetUser } = await db
    .from('users')
    .select('id, email')
    .eq('email', normalizedEmail)
    .single();

  if (!targetUser) {
    const namePart = normalizedEmail.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const { data: newUser } = await db
      .from('users')
      .insert({ email: normalizedEmail, name: formattedName })
      .select('id, email')
      .single();

    if (newUser) {
      targetUser = newUser;
    } else {
      return apiError('USER_NOT_FOUND', `No user with email "${email}"`);
    }
  }

  // Cannot share with yourself
  if (targetUser.id === session.userId) {
    return apiError('VALIDATION', 'You already own this document');
  }

  // Upsert share
  const { error: upsertError } = await db
    .from('shares')
    .upsert({ document_id: id, user_id: targetUser.id, role: shareRole });

  if (upsertError) return apiError('INTERNAL', 'Failed to update share');

  const shareList = await getSharesWithUsers(id);
  return NextResponse.json({ shares: shareList });
}
