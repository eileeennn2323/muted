-- Muted — initial schema
-- All access goes through server-side code using the service role key.
-- Row Level Security is enabled on every table with no policies attached,
-- so the anon/authenticated keys get zero access by default even if one is
-- ever accidentally exposed; only the service role (which bypasses RLS) can
-- read or write.

create extension if not exists pgcrypto;

-- Workspaces -----------------------------------------------------------

create table workspaces (
  id uuid primary key,
  kind text not null check (kind in ('demo', 'judge')),
  created_at timestamptz not null default now(),
  seeded_at timestamptz
);

alter table workspaces enable row level security;

-- People -----------------------------------------------------------------

create table people (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name text not null,
  roles text[] not null default '{}',
  aliases text[] not null default '{}', -- hidden from the profile UI; used only for name resolution
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index people_workspace_id_idx on people (workspace_id);

alter table people enable row level security;

-- Notes --------------------------------------------------------------------

create table notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  raw_content text not null,
  context_summary text, -- situational/atmosphere observations not tied to one person
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index notes_workspace_id_idx on notes (workspace_id);

alter table notes enable row level security;

create table note_people (
  note_id uuid not null references notes (id) on delete cascade,
  person_id uuid not null references people (id) on delete cascade,
  primary key (note_id, person_id)
);

alter table note_people enable row level security;

-- Person insights ------------------------------------------------------

create table person_insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  person_id uuid not null references people (id) on delete cascade,
  type text not null check (
    type in ('cares_about', 'communication', 'likely_questions', 'avoid', 'approach')
  ),
  content text not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  is_inferred boolean not null default true,
  user_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index person_insights_workspace_id_idx on person_insights (workspace_id);
create index person_insights_person_id_idx on person_insights (person_id);

alter table person_insights enable row level security;

create table person_insight_evidence (
  insight_id uuid not null references person_insights (id) on delete cascade,
  note_id uuid not null references notes (id) on delete cascade,
  primary key (insight_id, note_id)
);

alter table person_insight_evidence enable row level security;

-- Relationship insights ------------------------------------------------

create table relationship_insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  person_a_id uuid not null references people (id) on delete cascade,
  person_b_id uuid not null references people (id) on delete cascade,
  content text not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  is_inferred boolean not null default true,
  user_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (person_a_id <> person_b_id)
);

create index relationship_insights_workspace_id_idx on relationship_insights (workspace_id);

alter table relationship_insights enable row level security;

create table relationship_insight_evidence (
  relationship_insight_id uuid not null references relationship_insights (id) on delete cascade,
  note_id uuid not null references notes (id) on delete cascade,
  primary key (relationship_insight_id, note_id)
);

alter table relationship_insight_evidence enable row level security;

-- Lessons ------------------------------------------------------------------

create table lessons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  title text not null,
  explanation text,
  themes text[] not null,
  is_inferred boolean not null default true,
  user_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (array_length(themes, 1) between 1 and 2)
);

create index lessons_workspace_id_idx on lessons (workspace_id);

alter table lessons enable row level security;

create table lesson_evidence (
  lesson_id uuid not null references lessons (id) on delete cascade,
  note_id uuid not null references notes (id) on delete cascade,
  primary key (lesson_id, note_id)
);

alter table lesson_evidence enable row level security;

create table lesson_people (
  lesson_id uuid not null references lessons (id) on delete cascade,
  person_id uuid not null references people (id) on delete cascade,
  primary key (lesson_id, person_id)
);

alter table lesson_people enable row level security;

-- Self insights (About Me) ----------------------------------------------

create table self_insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  type text not null check (type in ('pattern', 'strength', 'watch_out', 'working_on')),
  content text not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  is_inferred boolean not null default true,
  user_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index self_insights_workspace_id_idx on self_insights (workspace_id);

alter table self_insights enable row level security;

create table self_insight_evidence (
  self_insight_id uuid not null references self_insights (id) on delete cascade,
  note_id uuid not null references notes (id) on delete cascade,
  primary key (self_insight_id, note_id)
);

alter table self_insight_evidence enable row level security;

-- Ask Muted conversations ------------------------------------------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index conversations_workspace_id_idx on conversations (workspace_id);

alter table conversations enable row level security;

create table conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  based_on_note_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index conversation_messages_conversation_id_idx on conversation_messages (conversation_id);

alter table conversation_messages enable row level security;

-- Usage / rate limiting --------------------------------------------------

create table session_usage (
  workspace_id uuid not null references workspaces (id) on delete cascade,
  day date not null default current_date,
  capture_count integer not null default 0,
  ask_count integer not null default 0,
  primary key (workspace_id, day)
);

alter table session_usage enable row level security;
