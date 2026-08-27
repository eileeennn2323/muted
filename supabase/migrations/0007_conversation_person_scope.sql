-- Ask Muted conversations were one-per-workspace, shared across every page —
-- opening the panel on Cayden's profile then navigating to Lessons or /me
-- kept showing the same thread. Scope conversations to the person whose
-- profile you're on (null = the general/page-level conversation used on
-- Lessons, /me, Home, and the standalone /ask page).
--
-- Multiple rows can exist per (workspace_id, person_id): the app always
-- reuses the most recent one for continuity, but "New conversation" inserts
-- a fresh row rather than reusing it — same pattern as a normal chat
-- history, not one eternal thread per person.
alter table conversations add column person_id uuid references people (id) on delete cascade;

drop index if exists conversations_workspace_id_idx;
create index conversations_workspace_id_person_id_idx on conversations (workspace_id, person_id, created_at desc);
