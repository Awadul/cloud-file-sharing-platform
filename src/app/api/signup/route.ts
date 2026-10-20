// app/api/signup/route.ts
// Handles new user registration via Supabase Auth

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { SignupSchema } from '@/lib/schemas';
import { apiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', parsed.error.issues[0]?.message ?? 'Invalid input');
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  const namePart = name?.trim() || normalizedEmail.split('@')[0];
  const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  const supabase = await createClient();

  // 1. First attempt standard sign up
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: `${req.nextUrl.origin}/auth/callback`,
      data: {
        name: formattedName,
      },
    },
  });

  if (error) {
    return apiError(error.status === 429 ? 'RATE_LIMITED' : 'VALIDATION', error.status === 429 ? 'Too many sign-up attempts. Please wait before trying again.' : error.message);
  }

  const user = data?.user;
  if (!user) {
    return apiError('INTERNAL', 'Failed to register account');
  }

  const hasSession = !!data.session;

  // Sync profile into public.users
  await db
    .from('users')
    .upsert({ id: user.id, email: normalizedEmail, name: formattedName });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: formattedName },
    confirmationRequired: !hasSession,
    message: hasSession
      ? 'Account created successfully'
      : 'Account created. Please check your email for a confirmation link to activate your workspace.',
  });
}
