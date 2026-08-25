import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AskContext = {
  people: { id: string; name: string; roles: string[] }[];
  personInsights: {
    id: string;
    personName: string;
    type: string;
    content: string;
    confidence: string;
    isInferred: boolean;
    noteIds: string[];
  }[];
  relationshipInsights: {
    id: string;
    personAName: string;
    personBName: string;
    content: string;
    confidence: string;
    isInferred: boolean;
    noteIds: string[];
  }[];
  lessons: {
    id: string;
    title: string;
    explanation: string | null;
    themes: string[];
    isInferred: boolean;
    noteIds: string[];
  }[];
  selfInsights: {
    id: string;
    type: string;
    content: string;
    confidence: string;
    isInferred: boolean;
    noteIds: string[];
  }[];
  /** The only note ids Gemini is allowed to cite in based_on_note_ids — every
   * id it returns is checked against this set before we ever persist or
   * display it, so a hallucinated id can't slip through. */
  availableNoteIds: Set<string>;
};

async function fetchNoteIdsMap(
  supabase: SupabaseClient,
  table: string,
  idColumn: string,
  ids: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (ids.length === 0) return map;
  const { data, error } = await supabase.from(table).select(`${idColumn},note_id`).in(idColumn, ids);
  if (error) throw error;
  for (const row of (data ?? []) as unknown as ({ note_id: string } & Record<string, unknown>)[]) {
    const parentId = row[idColumn] as string;
    const list = map.get(parentId) ?? [];
    list.push(row.note_id);
    map.set(parentId, list);
  }
  return map;
}

export async function buildAskContext(supabase: SupabaseClient, workspaceId: string): Promise<AskContext> {
  const [peopleRes, personInsightRes, relRes, lessonRes, selfRes] = await Promise.all([
    supabase.from("people").select("id,name,roles").eq("workspace_id", workspaceId),
    supabase.from("person_insights").select("id,person_id,type,content,confidence,is_inferred").eq("workspace_id", workspaceId),
    supabase
      .from("relationship_insights")
      .select("id,person_a_id,person_b_id,content,confidence,is_inferred")
      .eq("workspace_id", workspaceId),
    supabase.from("lessons").select("id,title,explanation,themes,is_inferred").eq("workspace_id", workspaceId),
    supabase.from("self_insights").select("id,type,content,confidence,is_inferred").eq("workspace_id", workspaceId),
  ]);
  if (peopleRes.error) throw peopleRes.error;
  if (personInsightRes.error) throw personInsightRes.error;
  if (relRes.error) throw relRes.error;
  if (lessonRes.error) throw lessonRes.error;
  if (selfRes.error) throw selfRes.error;

  const people = peopleRes.data ?? [];
  const personInsightRows = personInsightRes.data ?? [];
  const relRows = relRes.data ?? [];
  const lessonRows = lessonRes.data ?? [];
  const selfRows = selfRes.data ?? [];

  const namesById = new Map(people.map((p) => [p.id, p.name]));

  const [personEvidence, relEvidence, lessonEvidence, selfEvidence] = await Promise.all([
    fetchNoteIdsMap(supabase, "person_insight_evidence", "insight_id", personInsightRows.map((i) => i.id)),
    fetchNoteIdsMap(supabase, "relationship_insight_evidence", "relationship_insight_id", relRows.map((r) => r.id)),
    fetchNoteIdsMap(supabase, "lesson_evidence", "lesson_id", lessonRows.map((l) => l.id)),
    fetchNoteIdsMap(supabase, "self_insight_evidence", "self_insight_id", selfRows.map((s) => s.id)),
  ]);

  const availableNoteIds = new Set<string>();
  for (const map of [personEvidence, relEvidence, lessonEvidence, selfEvidence]) {
    for (const list of map.values()) for (const id of list) availableNoteIds.add(id);
  }

  return {
    people: people.map((p) => ({ id: p.id, name: p.name, roles: p.roles })),
    personInsights: personInsightRows.map((i) => ({
      id: i.id,
      personName: namesById.get(i.person_id) ?? "Unknown",
      type: i.type,
      content: i.content,
      confidence: i.confidence,
      isInferred: i.is_inferred,
      noteIds: personEvidence.get(i.id) ?? [],
    })),
    relationshipInsights: relRows.map((r) => ({
      id: r.id,
      personAName: namesById.get(r.person_a_id) ?? "Unknown",
      personBName: namesById.get(r.person_b_id) ?? "Unknown",
      content: r.content,
      confidence: r.confidence,
      isInferred: r.is_inferred,
      noteIds: relEvidence.get(r.id) ?? [],
    })),
    lessons: lessonRows.map((l) => ({
      id: l.id,
      title: l.title,
      explanation: l.explanation,
      themes: l.themes,
      isInferred: l.is_inferred,
      noteIds: lessonEvidence.get(l.id) ?? [],
    })),
    selfInsights: selfRows.map((s) => ({
      id: s.id,
      type: s.type,
      content: s.content,
      confidence: s.confidence,
      isInferred: s.is_inferred,
      noteIds: selfEvidence.get(s.id) ?? [],
    })),
    availableNoteIds,
  };
}
