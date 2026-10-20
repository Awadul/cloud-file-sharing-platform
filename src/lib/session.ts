// lib/session.ts
// Supabase Auth session layer.
// SERVER ONLY.

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

const COOKIE_NAME = 'plainpage_session';
export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

/** Trust only sessions verified by Supabase Auth. */
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
    return null;
  }
  return null;
}

/** Require a session or return null (caller returns 401). */
export async function requireSession(): Promise<SessionPayload | null> {
  return getSession();
}

/** Clear all sessions (both Supabase Auth and legacy cookie). */
export async function clearSession(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  if (error) throw error;
}
