-- map_edges_one_per_insight was created as a PARTIAL unique index
-- (`where source_relationship_insight_id is not null`), which Postgres
-- cannot use as an ON CONFLICT inference target unless the conflicting
-- query repeats the same WHERE predicate — something the Supabase client's
-- upsert(onConflict: "...") can't express, so every "accept suggestion"
-- request failed with 42P10 ("no unique or exclusion constraint matching
-- the ON CONFLICT specification").
--
-- A plain (non-partial) unique index has identical real-world behavior
-- here: Postgres already treats NULLs as distinct in a unique index, so
-- custom user-drawn edges (source_relationship_insight_id = null) were
-- never actually at risk of colliding — the partial WHERE clause was
-- redundant, not load-bearing. Dropping it fixes ON CONFLICT inference
-- with no change in what's allowed.
drop index if exists map_edges_one_per_insight;
create unique index map_edges_one_per_insight on map_edges (source_relationship_insight_id);
