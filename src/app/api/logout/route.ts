// app/api/logout/route.ts

import { NextResponse } from 'next/server';
import { apiError } from '@/lib/errors';
import { clearSession } from '@/lib/session';

export async function POST() {
  try {
    await clearSession();
  } catch {
    return apiError('INTERNAL', 'Unable to sign out. Please try again.');
  }
  return NextResponse.json({ ok: true });
}
