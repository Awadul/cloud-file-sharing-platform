-- Ajaia Docs Schema
-- Run this in your Supabase SQL editor

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  title text not null default 'Untitled document',
  excerpt text not null default '',
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shares (
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('editor','viewer')),
  primary key (document_id, user_id)
);

create index if not exists idx_documents_owner_id on documents(owner_id);
create index if not exists idx_shares_user_id on shares(user_id);
