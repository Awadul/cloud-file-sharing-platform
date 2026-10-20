// app/api/me/route.ts
// GET /api/me → current session user info

import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/errors';

export async function GET() {
  const session = await requireSession();
  if (!session) return apiError('UNAUTHENTICATED', 'Please log in');

  return NextResponse.json({
    userId: session.userId,
    name:   session.name,
    email:  session.email,
  });
}
