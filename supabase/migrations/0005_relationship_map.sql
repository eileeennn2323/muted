-- Classify relationship_insights into a fixed set of edge categories.
-- Nullable, no default — existing rows (and the demo seed) predate this field.
alter table relationship_insights add column relationship_type text
  check (relationship_type in ('reports_to', 'influences', 'works_closely_with'));

create table relationship_maps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  focus_person_id uuid not null references people(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, focus_person_id)
);
create index relationship_maps_workspace_id_idx on relationship_maps (workspace_id);

create table map_nodes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade, -- denormalized: the real tenant boundary, matches person_insights' pattern
  map_id uuid not null references relationship_maps(id) on delete cascade,
  node_kind text not null check (node_kind in ('me', 'person')),
  person_id uuid references people(id) on delete cascade, -- null iff node_kind = 'me'
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((node_kind = 'me' and person_id is null) or (node_kind = 'person' and person_id is not null))
);
create index map_nodes_workspace_id_idx on map_nodes (workspace_id);
create index map_nodes_map_id_idx on map_nodes (map_id);
create unique index map_nodes_one_person_per_map on map_nodes (map_id, person_id) where person_id is not null;
create unique index map_nodes_one_me_per_map on map_nodes (map_id) where node_kind = 'me';

create table map_edges (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  map_id uuid not null references relationship_maps(id) on delete cascade,
  source_node_id uuid not null references map_nodes(id) on delete cascade,
  target_node_id uuid not null references map_nodes(id) on delete cascade,
  label text not null,
  edge_kind text not null check (edge_kind in ('reports_to', 'influences', 'works_closely_with', 'custom')),
  -- cascade (not set null): if the underlying insight is deleted via the existing
  -- RelationshipList delete button, the derived edge must disappear too, not linger
  -- looking like a live Muted-derived edge with no evidence behind it.
  source_relationship_insight_id uuid references relationship_insights(id) on delete cascade,
  created_by text not null default 'user' check (created_by in ('muted', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_node_id <> target_node_id)
);
create index map_edges_workspace_id_idx on map_edges (workspace_id);
create index map_edges_map_id_idx on map_edges (map_id);
create index map_edges_source_node_id_idx on map_edges (source_node_id);
create index map_edges_target_node_id_idx on map_edges (target_node_id);
-- makes "accept this suggestion" idempotent — double-click / two tabs can't duplicate an edge
create unique index map_edges_one_per_insight on map_edges (source_relationship_insight_id) where source_relationship_insight_id is not null;

create table map_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  map_id uuid not null references relationship_maps(id) on delete cascade,
  content text not null,
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index map_notes_workspace_id_idx on map_notes (workspace_id);
create index map_notes_map_id_idx on map_notes (map_id);

alter table relationship_maps enable row level security;
alter table map_nodes enable row level security;
alter table map_edges enable row level security;
alter table map_notes enable row level security;
