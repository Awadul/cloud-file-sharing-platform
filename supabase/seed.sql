-- Seed data for Ajaia Docs
-- Passwords are mocked (checked server-side against DEMO_PASSWORD env var)

-- 1. Users
insert into users (id, email, name) values
  ('00000000-0000-0000-0000-000000000001', 'alice@demo.test', 'Alice'),
  ('00000000-0000-0000-0000-000000000002', 'bob@demo.test', 'Bob'),
  ('00000000-0000-0000-0000-000000000003', 'carol@demo.test', 'Carol')
on conflict (email) do nothing;

-- 2. Documents
-- Clean slate for seed documents to maintain predictable test state
delete from documents where owner_id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);

-- Alice's Documents
insert into documents (id, owner_id, title, excerpt, content, updated_at) values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Product launch brief',
    'Goals, audience, key messages and launch plan for the upcoming Q4 release.',
    '{
      "type": "doc",
      "content": [
        { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Product Launch Brief" }] },
        { "type": "paragraph", "content": [
          { "type": "text", "text": "This document defines the " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "key objectives" },
          { "type": "text", "text": " and audience for our upcoming " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "flagship release" },
          { "type": "text", "text": "." }
        ]},
        { "type": "bulletList", "content": [
          { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Target audience: Product and Engineering teams" }] }] },
          { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Core messaging: Calm, document-first collaboration" }] }] },
          { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Rollout date: October 2026" }] }] }
        ]}
      ]
    }'::jsonb,
    now() - interval '20 minutes'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Engineering handoff',
    'Technical overview, architecture and next steps for platform services.',
    '{
      "type": "doc",
      "content": [
        { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Engineering Handoff & Specs" }] },
        { "type": "paragraph", "content": [
          { "type": "text", "text": "Complete system walkthrough covering the " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "data access gate" },
          { "type": "text", "text": " and state synchronization." }
        ]},
        { "type": "bulletList", "content": [
          { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Postgres schema with indexed foreign keys" }] }] },
          { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Strict Zod request payload validation" }] }] }
        ]}
      ]
    }'::jsonb,
    now() - interval '2 days'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Brand guidelines',
    'Voice, tone, visual identity and examples for our clean design system.',
    '{
      "type": "doc",
      "content": [
        { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Brand Guidelines" }] },
        { "type": "paragraph", "content": [
          { "type": "text", "text": "Design system rules: " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "quiet chrome" },
          { "type": "text", "text": ", generous whitespace, and focused typography." }
        ]},
        { "type": "bulletList", "content": [
          { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Primary accent: Royal Blue (#1D4ED8)" }] }] },
          { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Dark rail navigation: Slate Navy (#1B2740)" }] }] }
        ]}
      ]
    }'::jsonb,
    now() - interval '8 days'
  );

-- Bob's Documents (Shared with Alice)
insert into documents (id, owner_id, title, excerpt, content, updated_at) values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Marketing campaign plan',
    'Channel strategy, timeline and deliverables for multi-market expansion.',
    '{
      "type": "doc",
      "content": [
        { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Marketing Campaign Plan" }] },
        { "type": "paragraph", "content": [
          { "type": "text", "text": "Detailed roadmap for " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Q4 multi-channel growth" },
          { "type": "text", "text": "." }
        ]}
      ]
    }'::jsonb,
    now() - interval '1 day'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Customer research summary',
    'Interview notes, themes and opportunities discovered during user sessions.',
    '{
      "type": "doc",
      "content": [
        { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Customer Research Summary" }] },
        { "type": "paragraph", "content": [
          { "type": "text", "text": "Insights collected from " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "24 customer interviews" },
          { "type": "text", "text": "." }
        ]}
      ]
    }'::jsonb,
    now() - interval '4 days'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'Q3 planning notes',
    'Objectives, risks and open questions for upcoming roadmap alignment.',
    '{
      "type": "doc",
      "content": [
        { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Q3 Planning Notes" }] },
        { "type": "paragraph", "content": [
          { "type": "text", "text": "Retrospective and forward-looking " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "resource planning" },
          { "type": "text", "text": "." }
        ]}
      ]
    }'::jsonb,
    now() - interval '10 days'
  );

-- 3. Shares
-- Alice shares "Product launch brief" with Bob as viewer
insert into shares (document_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'viewer')
on conflict (document_id, user_id) do update set role = excluded.role;

-- Bob shares his documents with Alice
insert into shares (document_id, user_id, role) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'editor'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'viewer'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'viewer')
on conflict (document_id, user_id) do update set role = excluded.role;
