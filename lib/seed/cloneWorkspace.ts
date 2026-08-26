import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_WORKSPACE_ID } from "@/lib/workspace";

/**
 * Clones every row belonging to the shared demo workspace into a fresh judge
 * workspace, generating new ids and remapping foreign keys along the way.
 *
 * This is a full copy rather than an overlay: at hackathon scale (a handful
 * of people, a few dozen insights) copying is far simpler and safer than
 * building read-time overlay logic, and it guarantees one judge can never
 * see or affect another judge's edits or the master demo dataset.
 */
export async function cloneDemoDataInto(
  supabase: SupabaseClient,
  targetWorkspaceId: string
): Promise<void> {
  const personIds = new Map<string, string>();
  const noteIds = new Map<string, string>();
  const personInsightIds = new Map<string, string>();
  const relationshipInsightIds = new Map<string, string>();
  const lessonIds = new Map<string, string>();
  const selfInsightIds = new Map<string, string>();

  await cloneRows(supabase, "people", targetWorkspaceId, personIds, (row, id) => ({
    id,
    workspace_id: targetWorkspaceId,
    name: row.name,
    roles: row.roles,
    aliases: row.aliases,
  }));

  await cloneRows(supabase, "notes", targetWorkspaceId, noteIds, (row, id) => ({
    id,
    workspace_id: targetWorkspaceId,
    raw_content: row.raw_content,
    context_summary: row.context_summary,
    created_at: row.created_at,
  }));

  await cloneRows(
    supabase,
    "person_insights",
    targetWorkspaceId,
    personInsightIds,
    (row, id) => ({
      id,
      workspace_id: targetWorkspaceId,
      person_id: personIds.get(row.person_id as string),
      type: row.type,
      content: row.content,
      confidence: row.confidence,
      is_inferred: row.is_inferred,
      user_edited: row.user_edited,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
  );

  await cloneRows(
    supabase,
    "relationship_insights",
    targetWorkspaceId,
    relationshipInsightIds,
    (row, id) => ({
      id,
      workspace_id: targetWorkspaceId,
      person_a_id: personIds.get(row.person_a_id as string),
      person_b_id: personIds.get(row.person_b_id as string),
      content: row.content,
      confidence: row.confidence,
      is_inferred: row.is_inferred,
      user_edited: row.user_edited,
      relationship_type: row.relationship_type,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
  );

  await cloneRows(supabase, "lessons", targetWorkspaceId, lessonIds, (row, id) => ({
    id,
    workspace_id: targetWorkspaceId,
    title: row.title,
    explanation: row.explanation,
    themes: row.themes,
    is_inferred: row.is_inferred,
    user_edited: row.user_edited,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  await cloneRows(
    supabase,
    "self_insights",
    targetWorkspaceId,
    selfInsightIds,
    (row, id) => ({
      id,
      workspace_id: targetWorkspaceId,
      type: row.type,
      content: row.content,
      confidence: row.confidence,
      is_inferred: row.is_inferred,
      user_edited: row.user_edited,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
  );

  // Join / evidence tables have no id or workspace_id of their own — remap via
  // the id maps built above, keyed off the original (demo) row ids.
  await cloneJoinRows(supabase, "note_people", ["note_id", "person_id"], "note_id", [
    ...noteIds.keys(),
  ], { note_id: noteIds, person_id: personIds });

  await cloneJoinRows(
    supabase,
    "person_insight_evidence",
    ["insight_id", "note_id"],
    "insight_id",
    [...personInsightIds.keys()],
    { insight_id: personInsightIds, note_id: noteIds }
  );

  await cloneJoinRows(
    supabase,
    "relationship_insight_evidence",
    ["relationship_insight_id", "note_id"],
    "relationship_insight_id",
    [...relationshipInsightIds.keys()],
    { relationship_insight_id: relationshipInsightIds, note_id: noteIds }
  );

  await cloneJoinRows(
    supabase,
    "lesson_evidence",
    ["lesson_id", "note_id"],
    "lesson_id",
    [...lessonIds.keys()],
    { lesson_id: lessonIds, note_id: noteIds }
  );

  await cloneJoinRows(
    supabase,
    "lesson_people",
    ["lesson_id", "person_id"],
    "lesson_id",
    [...lessonIds.keys()],
    { lesson_id: lessonIds, person_id: personIds }
  );

  await cloneJoinRows(
    supabase,
    "self_insight_evidence",
    ["self_insight_id", "note_id"],
    "self_insight_id",
    [...selfInsightIds.keys()],
    { self_insight_id: selfInsightIds, note_id: noteIds }
  );
}

async function cloneRows(
  supabase: SupabaseClient,
  table: string,
  targetWorkspaceId: string,
  idMap: Map<string, string>,
  buildRow: (row: Record<string, unknown>, newId: string) => Record<string, unknown>
): Promise<void> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("workspace_id", DEMO_WORKSPACE_ID);
  if (error) throw error;
  if (!data?.length) return;

  const rows = data.map((row) => {
    const newId = crypto.randomUUID();
    idMap.set(row.id as string, newId);
    return buildRow(row, newId);
  });

  const { error: insertError } = await supabase.from(table).insert(rows);
  if (insertError) throw insertError;
}

async function cloneJoinRows(
  supabase: SupabaseClient,
  table: string,
  columns: string[],
  filterColumn: string,
  sourceFilterIds: string[],
  idMaps: Record<string, Map<string, string>>
): Promise<void> {
  if (!sourceFilterIds.length) return;

  // select("*") rather than a dynamically-built column list: passing a
  // runtime string to .select() defeats supabase-js's column typing and
  // produces an unusable row type.
  const { data, error } = await supabase.from(table).select("*").in(filterColumn, sourceFilterIds);
  if (error) throw error;
  if (!data?.length) return;

  const rows = data
    .map((row: Record<string, unknown>) => {
      // Start from every column on the source row (e.g. quote on the
      // evidence tables) so nothing beyond the remapped ids gets silently
      // dropped, then overwrite just the foreign-key columns with their
      // remapped ids.
      const mapped: Record<string, unknown> = { ...row };
      for (const col of columns) {
        const mappedId = idMaps[col]?.get(row[col] as string);
        if (!mappedId) return null; // skip rows we don't have a remapped id for
        mapped[col] = mappedId;
      }
      return mapped;
    })
    .filter((row): row is Record<string, unknown> => row !== null);

  if (!rows.length) return;

  const { error: insertError } = await supabase.from(table).insert(rows);
  if (insertError) throw insertError;
}
