// app/api/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/session';
import { LoginSchema } from '@/lib/schemas';
import { apiError } from '@/lib/errors';
import { timingSafeEqual } from 'crypto';

function constantTimeCompare(a: string, b: string): boolean {
  const aBytes = Buffer.from(a);
  const bBytes = Buffer.from(b);
  if (aBytes.length !== bBytes.length) {
    // Still run a comparison to avoid timing side-channels
    timingSafeEqual(aBytes, Buffer.alloc(aBytes.length));
    return false;
  }
  return timingSafeEqual(aBytes, bBytes);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', parsed.error.issues[0]?.message ?? 'Invalid input');
  }

  const { email, password } = parsed.data;
  const demoPassword = process.env.DEMO_PASSWORD ?? '';

  if (!constantTimeCompare(password, demoPassword)) {
    return apiError('UNAUTHENTICATED', 'Incorrect password');
  }

  const { data: user, error } = await db
    .from('users')
    .select('id, email, name')
    .eq('email', email)
    .single();

  if (error || !user) {
    return apiError('UNAUTHENTICATED', 'No account with that email');
  }

  await createSession({ userId: user.id, email: user.email, name: user.name });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
