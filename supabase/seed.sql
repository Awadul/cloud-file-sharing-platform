-- Seed data for Ajaia Docs
-- Passwords are mocked (checked server-side against DEMO_PASSWORD env var)

insert into users (id, email, name) values
  ('00000000-0000-0000-0000-000000000001', 'alice@demo.test', 'Alice'),
  ('00000000-0000-0000-0000-000000000002', 'bob@demo.test', 'Bob'),
  ('00000000-0000-0000-0000-000000000003', 'carol@demo.test', 'Carol')
on conflict (email) do nothing;
