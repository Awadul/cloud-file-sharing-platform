-- Plainpage product tiers. Apply to a backed-up staging database first.
begin;
-- All application table access is mediated by authenticated server routes.
alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.shares enable row level security;
revoke all on public.users,public.documents,public.shares from anon,authenticated;
grant all on public.users,public.documents,public.shares to service_role;
alter table public.documents add column if not exists revision bigint not null default 1;
alter table public.documents add column if not exists deleted_at timestamptz;
alter table public.documents add column if not exists review_status text not null default 'draft' check (review_status in ('draft','in_review','final'));
create table if not exists public.document_versions (
 document_id uuid not null references public.documents(id) on delete cascade,
 revision bigint not null, title text not null, content jsonb not null,
 author_id uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now(), primary key(document_id,revision)
);
create table if not exists public.document_invitations (
 id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
 email text not null, role text not null check(role in ('editor','viewer')),
 invited_by uuid not null references public.users(id) on delete cascade,
 accepted_by uuid references public.users(id) on delete set null, created_at timestamptz not null default now(),
 unique(document_id,email)
);
create table if not exists public.review_rounds (
 id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
 revision bigint not null, requested_by uuid not null references public.users(id) on delete cascade,
 due_at timestamptz not null, message text not null default '', created_at timestamptz not null default now(), closed_at timestamptz
);
create unique index if not exists one_open_review on public.review_rounds(document_id) where closed_at is null;
create table if not exists public.review_responses (
 round_id uuid not null references public.review_rounds(id) on delete cascade,
 reviewer_id uuid not null references public.users(id) on delete cascade,
 decision text not null default 'pending' check(decision in ('pending','approved','changes_requested')),
 feedback text not null default '', responded_at timestamptz, primary key(round_id,reviewer_id)
);
create table if not exists public.notification_outbox (
 id uuid primary key default gen_random_uuid(), recipient text not null, subject text not null, body text not null,
 document_id uuid references public.documents(id) on delete cascade,
 created_at timestamptz not null default now(), sent_at timestamptz, attempts integer not null default 0,
 locked_until timestamptz, last_error text
);
create table if not exists public.ai_usage (
 user_id uuid not null references public.users(id) on delete cascade, day date not null default current_date,
 calls integer not null default 0, primary key(user_id,day)
);
create table if not exists public.analytics_daily (
 day date not null default current_date, event text not null, count bigint not null default 1, primary key(day,event)
);
create table if not exists public.document_images (
 key text primary key, document_id uuid not null references public.documents(id) on delete cascade,
 uploaded_by uuid not null references public.users(id) on delete cascade, created_at timestamptz not null default now()
);
alter table public.document_images enable row level security;
revoke all on public.document_images from anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('document-images','document-images',false,5242880,array['image/png','image/jpeg','image/webp']) on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
-- Server service-role access only; there are no browser table policies.
alter table public.document_versions enable row level security;
alter table public.document_invitations enable row level security;
alter table public.review_rounds enable row level security;
alter table public.review_responses enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.ai_usage enable row level security;
alter table public.analytics_daily enable row level security;
revoke all on public.document_versions,public.document_invitations,public.review_rounds,public.review_responses,public.notification_outbox,public.ai_usage,public.analytics_daily from anon,authenticated;

create or replace function public.plainpage_save(p_id uuid,p_actor uuid,p_revision bigint,p_title text default null,p_content jsonb default null,p_restore bigint default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare d documents; v document_versions;
begin
 select * into d from documents where id=p_id for update;
 if d.id is null or d.deleted_at is not null then raise exception 'NOT_FOUND'; end if;
 if d.owner_id<>p_actor and not exists(select 1 from shares where document_id=p_id and user_id=p_actor and role='editor') then raise exception 'FORBIDDEN'; end if;
 if d.revision<>p_revision then raise exception 'CONFLICT'; end if;
 if p_restore is not null then
  if d.owner_id<>p_actor then raise exception 'FORBIDDEN'; end if;
  select * into v from document_versions where document_id=p_id and revision=p_restore;
  if v.document_id is null then raise exception 'NOT_FOUND'; end if;
  p_title:=v.title; p_content:=v.content;
 end if;
 insert into document_versions(document_id,revision,title,content,author_id) values(d.id,d.revision,d.title,d.content,p_actor) on conflict do nothing;
 update documents set title=coalesce(p_title,title),content=coalesce(p_content,content),revision=revision+1,updated_at=now(),review_status='draft' where id=p_id returning * into d;
 -- Editing closes the previous round: old approvals cannot finalize new content.
 update review_rounds set closed_at=now() where document_id=p_id and closed_at is null;
 insert into document_versions(document_id,revision,title,content,author_id) values(d.id,d.revision,d.title,d.content,p_actor);
 return to_jsonb(d);
end $$;

create or replace function public.plainpage_invite(p_id uuid,p_actor uuid,p_email text,p_role text,p_body text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare d documents; i document_invitations;
begin
 select * into d from documents where id=p_id and deleted_at is null for update;
 if d.id is null then raise exception 'NOT_FOUND'; end if;
 if d.owner_id<>p_actor then raise exception 'FORBIDDEN'; end if;
 if p_role not in ('editor','viewer') then raise exception 'VALIDATION'; end if;
 if exists(select 1 from users where id=p_actor and lower(email)=lower(p_email)) then raise exception 'VALIDATION'; end if;
 insert into document_invitations(document_id,email,role,invited_by) values(p_id,lower(trim(p_email)),p_role,p_actor)
 on conflict(document_id,email) do update set role=excluded.role,accepted_by=null,created_at=now() returning * into i;
 insert into notification_outbox(recipient,subject,body,document_id) values(i.email,'A document was shared with you on Plainpage',p_body,p_id);
 return to_jsonb(i);
end $$;

create or replace function public.plainpage_accept_invites(p_actor uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare verified_email text; n integer:=0; i document_invitations;
begin
 select lower(email) into verified_email from auth.users where id=p_actor and email_confirmed_at is not null;
 if verified_email is null then return 0; end if;
 for i in select * from document_invitations where email=verified_email and accepted_by is null for update loop
  if exists(select 1 from documents where id=i.document_id and deleted_at is null and owner_id<>p_actor) then
   insert into shares(document_id,user_id,role) values(i.document_id,p_actor,i.role)
    on conflict(document_id,user_id) do update set role=excluded.role;
   update document_invitations set accepted_by=p_actor where id=i.id;
   n:=n+1;
  end if;
 end loop;
 return n;
end $$;

create or replace function public.plainpage_review(p_id uuid,p_actor uuid,p_action text,p_revision bigint,p_reviewers uuid[] default '{}',p_due timestamptz default null,p_message text default '')
returns jsonb language plpgsql security definer set search_path=public as $$
declare d documents; r review_rounds; reviewer uuid; target_email text;
begin
 select * into d from documents where id=p_id and deleted_at is null for update;
 if d.id is null then raise exception 'NOT_FOUND'; end if;
 if d.revision<>p_revision then raise exception 'CONFLICT'; end if;
 if p_action='request' then
  if d.owner_id<>p_actor then raise exception 'FORBIDDEN'; end if;
  if cardinality(p_reviewers)<1 or cardinality(p_reviewers)>20 or p_due is null or p_due<=now() then raise exception 'VALIDATION'; end if;
  foreach reviewer in array p_reviewers loop
   if not exists(select 1 from shares where document_id=p_id and user_id=reviewer) then raise exception 'VALIDATION'; end if;
  end loop;
  update review_rounds set closed_at=now() where document_id=p_id and closed_at is null;
  insert into review_rounds(document_id,revision,requested_by,due_at,message) values(p_id,d.revision,p_actor,p_due,left(p_message,2000)) returning * into r;
  foreach reviewer in array p_reviewers loop
   insert into review_responses(round_id,reviewer_id) values(r.id,reviewer) on conflict do nothing;
   select email into target_email from users where id=reviewer;
   insert into notification_outbox(recipient,subject,body,document_id) values(target_email,'Review requested on Plainpage','Please review a document in your Plainpage Reviews inbox. Due: '||p_due::text,p_id);
  end loop;
  update documents set review_status='in_review' where id=p_id;
 else
  select * into r from review_rounds where document_id=p_id and closed_at is null for update;
  if r.id is null or r.revision<>d.revision then raise exception 'CONFLICT'; end if;
  if p_action in ('approved','changes_requested') then
   if not exists(select 1 from shares where document_id=p_id and user_id=p_actor) then raise exception 'FORBIDDEN'; end if;
   if p_action='changes_requested' and length(trim(p_message))=0 then raise exception 'VALIDATION'; end if;
   update review_responses set decision=p_action,feedback=left(p_message,2000),responded_at=now() where round_id=r.id and reviewer_id=p_actor;
   if not found then raise exception 'FORBIDDEN'; end if;
  elsif p_action='final' then
   if d.owner_id<>p_actor then raise exception 'FORBIDDEN'; end if;
   if exists(select 1 from review_responses where round_id=r.id and decision<>'approved') or not exists(select 1 from review_responses where round_id=r.id) then raise exception 'CONFLICT'; end if;
   update documents set review_status='final' where id=p_id;
   update review_rounds set closed_at=now() where id=r.id;
  elsif p_action='remind' then
   if d.owner_id<>p_actor then raise exception 'FORBIDDEN'; end if;
   if exists(select 1 from notification_outbox where document_id=p_id and subject='Review reminder on Plainpage' and created_at>now()-interval '1 day') then raise exception 'RATE_LIMITED'; end if;
   insert into notification_outbox(recipient,subject,body,document_id)
    select u.email,'Review reminder on Plainpage','A document is waiting for your review in Plainpage.',p_id from review_responses rr join users u on u.id=rr.reviewer_id where rr.round_id=r.id and rr.decision='pending';
  else raise exception 'VALIDATION'; end if;
 end if;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.plainpage_ai_reserve(p_actor uuid,p_limit integer)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 insert into ai_usage(user_id,day,calls) values(p_actor,current_date,1)
 on conflict(user_id,day) do update set calls=ai_usage.calls+1 where ai_usage.calls<p_limit returning calls into n;
 if n is null then raise exception 'RATE_LIMITED'; end if; return n;
end $$;
create or replace function public.plainpage_analytics(p_event text)
returns void language sql security definer set search_path=public as $$
 insert into analytics_daily(day,event,count) values(current_date,p_event,1) on conflict(day,event) do update set count=analytics_daily.count+1;
$$;
create or replace function public.plainpage_claim_mail()
returns setof notification_outbox language sql security definer set search_path=public as $$
 update notification_outbox set locked_until=now()+interval '2 minutes',attempts=attempts+1 where id in
 (select id from notification_outbox where sent_at is null and attempts<5 and (locked_until is null or locked_until<now()) order by created_at for update skip locked limit 3) returning *;
$$;
create or replace function public.plainpage_revoke_invite(p_invite uuid,p_actor uuid)
returns void language plpgsql security definer set search_path=public as $$
declare i document_invitations; d documents;
begin
 select * into i from document_invitations where id=p_invite for update;
 if i.id is null then raise exception 'NOT_FOUND'; end if;
 select * into d from documents where id=i.document_id;
 if d.owner_id<>p_actor then raise exception 'FORBIDDEN'; end if;
 if i.accepted_by is not null then delete from shares where document_id=i.document_id and user_id=i.accepted_by; end if;
 delete from document_invitations where id=i.id;
 delete from notification_outbox where document_id=i.document_id and recipient=i.email and sent_at is null;
end $$;
revoke execute on function public.plainpage_revoke_invite(uuid,uuid) from public,anon,authenticated;
grant execute on function public.plainpage_revoke_invite(uuid,uuid) to service_role;
grant all on public.document_versions,public.document_invitations,public.review_rounds,public.review_responses,public.notification_outbox,public.ai_usage,public.analytics_daily,public.document_images to service_role;
-- Auth deletion and public profile cascades share the Auth database transaction.
create or replace function public.plainpage_auth_deleted()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 delete from public.users where id=old.id;
 return old;
end $$;
drop trigger if exists plainpage_auth_deleted on auth.users;
create trigger plainpage_auth_deleted after delete on auth.users for each row execute function public.plainpage_auth_deleted();
revoke execute on function public.plainpage_auth_deleted() from public,anon,authenticated;
-- These functions take actor IDs from authenticated server routes, never browsers.
revoke execute on function public.plainpage_save(uuid,uuid,bigint,text,jsonb,bigint),public.plainpage_invite(uuid,uuid,text,text,text),public.plainpage_accept_invites(uuid),public.plainpage_review(uuid,uuid,text,bigint,uuid[],timestamptz,text),public.plainpage_ai_reserve(uuid,integer),public.plainpage_analytics(text),public.plainpage_claim_mail() from public,anon,authenticated;
grant execute on function public.plainpage_save(uuid,uuid,bigint,text,jsonb,bigint),public.plainpage_invite(uuid,uuid,text,text,text),public.plainpage_accept_invites(uuid),public.plainpage_review(uuid,uuid,text,bigint,uuid[],timestamptz,text),public.plainpage_ai_reserve(uuid,integer),public.plainpage_analytics(text),public.plainpage_claim_mail() to service_role;
commit;
