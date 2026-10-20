// app/api/login/route.ts
// Handles authentication via Supabase Auth with auto-sync to public.users

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { LoginSchema } from '@/lib/schemas';
import { apiError } from '@/lib/errors';
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', parsed.error.issues[0]?.message ?? 'Invalid input');
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const supabase = await createClient();

  // 1. Attempt sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (authError || !authData?.user) {
    return apiError('UNAUTHENTICATED', 'Invalid email or password. Please try again.');
  }

  // 3. Ensure profile row exists in public.users
  const user = authData.user;
  const namePart = (user.user_metadata?.name || normalizedEmail.split('@')[0]) as string;
  const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  await db
    .from('users')
    .upsert({ id: user.id, email: normalizedEmail, name: formattedName });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: formattedName },
  });
}
