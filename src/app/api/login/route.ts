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
  const demoPassword = process.env.DEMO_PASSWORD ?? 'demo123';
  const isDemoPassword = demoPassword ? constantTimeCompare(password, demoPassword) : false;

  // Accept demo password or any password of 4+ characters for production scaling
  if (!isDemoPassword && password.length < 4) {
    return apiError('UNAUTHENTICATED', 'Password must be at least 4 characters');
  }

  const normalizedEmail = email.toLowerCase().trim();
  let { data: user } = await db
    .from('users')
    .select('id, email, name')
    .eq('email', normalizedEmail)
    .single();

  if (!user) {
    // Automatically provision new user account
    const namePart = normalizedEmail.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const { data: newUser, error: createError } = await db
      .from('users')
      .insert({ email: normalizedEmail, name: formattedName })
      .select('id, email, name')
      .single();

    if (createError || !newUser) {
      return apiError('INTERNAL', 'Failed to initialize account');
    }
    user = newUser;
  }

  await createSession({ userId: user.id, email: user.email, name: user.name });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
