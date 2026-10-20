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
  let { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: formattedName,
      },
    },
  });

  // 2. Fallback for email rate limit or unconfirmed project setup: use Admin API to provision with pre-confirmed email
  if (error && (error.message.toLowerCase().includes('rate limit') || error.status === 429)) {
    const { data: adminUser, error: adminError } = await db.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name: formattedName },
    });

    if (adminError) {
      return apiError('VALIDATION', adminError.message);
    }

    if (adminUser?.user) {
      // Sign in through SSR client so cookies are written
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!loginError && loginData?.user) {
        data = {
          user: loginData.user,
          session: loginData.session,
        };
        error = null;
      }
    }
  }

  if (error) {
    return apiError('VALIDATION', error.message);
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
