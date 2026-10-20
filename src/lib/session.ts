// lib/session.ts
// Supabase Auth session layer with cookie fallback.
// SERVER ONLY.

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

const COOKIE_NAME = 'plainpage_session';
const ALG = 'HS256';

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || 'fallback-plainpage-secret-key-32chars!';
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

/** Sign a session and set the cookie (legacy fallback). */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/** Read and verify session from Supabase Auth (or fallback cookie). */
export async function getSession(): Promise<SessionPayload | null> {
  // 1. Check Supabase Auth via @supabase/ssr
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!error && user && user.email) {
      // Ensure user profile exists in public.users
      let { data: profile } = await db
        .from('users')
        .select('id, email, name')
        .eq('id', user.id)
        .single();

      if (!profile) {
        const namePart = (user.user_metadata?.name || user.email.split('@')[0]) as string;
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const { data: newProfile } = await db
          .from('users')
          .upsert({ id: user.id, email: user.email.toLowerCase().trim(), name: formattedName })
          .select('id, email, name')
          .single();

        profile = newProfile;
      }

      return {
        userId: user.id,
        email: user.email,
        name: profile?.name || user.email.split('@')[0],
      };
    }
  } catch {
    // If Supabase SSR client isn't configured, fall through to cookie check
  }

  // 2. Fallback: check custom plainpage_session cookie
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

/** Require a session or return null (caller returns 401). */
export async function requireSession(): Promise<SessionPayload | null> {
  return getSession();
}

/** Clear all sessions (both Supabase Auth and legacy cookie). */
export async function clearSession(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
