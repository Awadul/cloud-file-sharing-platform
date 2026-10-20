// lib/db.ts
// SERVER ONLY — Supabase client using service role key.
// Never import this from client components.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

export const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// ─── Typed row shapes ────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  name: string;
}

export interface DocumentRow {
  id: string;
  owner_id: string;
  title: string;
  excerpt: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ShareRow {
  document_id: string;
  user_id: string;
  role: 'editor' | 'viewer';
}
