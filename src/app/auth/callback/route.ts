import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next') ?? '/';
  let next = '/';
  try {
    const destination = new URL(requestedNext, origin);
    if (destination.origin === origin) next = destination.pathname + destination.search + destination.hash;
  } catch {
    // Invalid return destinations fall back to the workspace.
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } catch {
      // Show a recoverable error without exposing provider details.
    }
  }
  return NextResponse.redirect(new URL('/login?error=auth_callback', origin));
}
