// app/api/login/route.ts
// Handles authentication via Supabase Auth with auto-sync to public.users

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { LoginSchema } from '@/lib/schemas';
import { apiError } from '@/lib/errors';
import { timingSafeEqual } from 'crypto';

function constantTimeCompare(a: string, b: string): boolean {
  const aBytes = Buffer.from(a);
  const bBytes = Buffer.from(b);
  if (aBytes.length !== bBytes.length) {
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
  const normalizedEmail = email.toLowerCase().trim();

  const demoPassword = process.env.DEMO_PASSWORD ?? 'demo123';
  const isDemoPassword = demoPassword ? constantTimeCompare(password, demoPassword) : false;

  const supabase = await createClient();

  // 1. Attempt sign in with Supabase Auth
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  // 2. If user doesn't exist in auth.users yet (e.g. seed user or first-time demo login)
  if (authError) {
    if (isDemoPassword || password.length >= 4) {
      // Check if user already has a row in public.users to keep matching UUID
      const { data: existingUser } = await db
        .from('users')
        .select('id, email, name')
        .eq('email', normalizedEmail)
        .single();

      const namePart = (existingUser?.name || normalizedEmail.split('@')[0]) as string;
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      // Create in auth.users via Supabase Admin API with pre-confirmed email
      const { data: createdAuth, error: createAuthError } = await db.auth.admin.createUser({
        ...(existingUser ? { id: existingUser.id } : {}),
        email: normalizedEmail,
        password: isDemoPassword ? demoPassword : password,
        email_confirm: true,
        user_metadata: { name: formattedName },
      });

      if (!createAuthError && createdAuth?.user) {
        // Sign in via SSR client to set session cookies
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: isDemoPassword ? demoPassword : password,
        });

        if (!retryError && retryData?.user) {
          authData = retryData;
          authError = null;

          // Ensure public.users row exists
          await db
            .from('users')
            .upsert({ id: retryData.user.id, email: normalizedEmail, name: formattedName });
        }
      }
    }
  }

  if (authError || !authData?.user) {
    return apiError('UNAUTHENTICATED', authError?.message || 'Invalid email or password');
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
