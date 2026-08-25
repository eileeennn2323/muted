import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { resolveMapId } from "@/lib/people/mapAuth";

const MIN_COOCCURRENCE_NOTES = 2;

type ExistingInsightSuggestion = {
  kind: "existing_insight";
  relationshipInsightId: string;
  otherPersonId: string;
  otherPersonName: string;
  content: string;
  evidenceCount: number;
};

type CoOccurrenceSuggestion = {
  kind: "co_occurrence";
  otherPersonId: string;
  otherPersonName: string;
  noteCount: number;
};

async function findUnmappedInsights(
  supabase: SupabaseClient,
  workspaceId: string,
  mapId: string,
  focusPersonId: string
): Promise<ExistingInsightSuggestion[]> {
  const { data: relRows, error: relError } = await supabase
    .from("relationship_insights")
    .select("id,person_a_id,person_b_id,content")
    .eq("workspace_id", workspaceId)
    .or(`person_a_id.eq.${focusPersonId},person_b_id.eq.${focusPersonId}`);
  if (relError) throw relError;
  if (!relRows?.length) return [];

  const { data: mappedEdges, error: edgesError } = await supabase
    .from("map_edges")
    .select("source_relationship_insight_id")
    .eq("map_id", mapId)
    .not("source_relationship_insight_id", "is", null);
  if (edgesError) throw edgesError;
  const mappedIds = new Set((mappedEdges ?? []).map((e) => e.source_relationship_insight_id as string));

  const unmapped = relRows.filter((r) => !mappedIds.has(r.id));
  if (!unmapped.length) return [];

  const otherIds = Array.from(
    new Set(unmapped.map((r) => (r.person_a_id === focusPersonId ? r.person_b_id : r.person_a_id) as string))
  );
  const { data: people, error: peopleError } = await supabase.from("people").select("id,name").in("id", otherIds);
  if (peopleError) throw peopleError;
  const namesById = new Map((people ?? []).map((p) => [p.id, p.name]));

  const { data: evidenceRows, error: evidenceError } = await supabase
    .from("relationship_insight_evidence")
    .select("relationship_insight_id")
    .in(
      "relationship_insight_id",
      unmapped.map((r) => r.id)
    );
  if (evidenceError) throw evidenceError;
  const evidenceCounts = new Map<string, number>();
  for (const row of evidenceRows ?? []) {
    const key = row.relationship_insight_id as string;
    evidenceCounts.set(key, (evidenceCounts.get(key) ?? 0) + 1);
  }

  return unmapped.map((r) => {
    const otherPersonId = (r.person_a_id === focusPersonId ? r.person_b_id : r.person_a_id) as string;
    return {
      kind: "existing_insight" as const,
      relationshipInsightId: r.id as string,
      otherPersonId,
      otherPersonName: namesById.get(otherPersonId) ?? "Unknown",
      content: r.content as string,
      evidenceCount: evidenceCounts.get(r.id as string) ?? 0,
    };
  });
}

async function findCoOccurrences(
  supabase: SupabaseClient,
  workspaceId: string,
  focusPersonId: string,
  excludePersonIds: Set<string>
): Promise<CoOccurrenceSuggestion[]> {
  const { data: focusNoteLinks, error: notesError } = await supabase
    .from("note_people")
    .select("note_id")
    .eq("person_id", focusPersonId);
  if (notesError) throw notesError;
  const focusNoteIds = (focusNoteLinks ?? []).map((r) => r.note_id as string);
  if (!focusNoteIds.length) return [];

  const { data: coRows, error: coError } = await supabase
    .from("note_people")
    .select("note_id,person_id")
    .in("note_id", focusNoteIds)
    .neq("person_id", focusPersonId);
  if (coError) throw coError;

  const noteCountByPerson = new Map<string, Set<string>>();
  for (const row of coRows ?? []) {
    const personId = row.person_id as string;
    const set = noteCountByPerson.get(personId) ?? new Set<string>();
    set.add(row.note_id as string);
    noteCountByPerson.set(personId, set);
  }

  // Already-related people (existing relationship_insight with the focus
  // person, whether or not it's on the map yet) aren't a "no formal
  // relationship yet" suggestion — that's findUnmappedInsights' territory.
  const { data: relRows, error: relError } = await supabase
    .from("relationship_insights")
    .select("person_a_id,person_b_id")
    .eq("workspace_id", workspaceId)
    .or(`person_a_id.eq.${focusPersonId},person_b_id.eq.${focusPersonId}`);
  if (relError) throw relError;
  const alreadyRelated = new Set(
    (relRows ?? []).map((r) => (r.person_a_id === focusPersonId ? r.person_b_id : r.person_a_id) as string)
  );

  const candidateIds = Array.from(noteCountByPerson.entries())
    .filter(([id, notes]) => notes.size >= MIN_COOCCURRENCE_NOTES && !alreadyRelated.has(id) && !excludePersonIds.has(id))
    .map(([id]) => id);
  if (!candidateIds.length) return [];

  const { data: people, error: peopleError } = await supabase.from("people").select("id,name").in("id", candidateIds);
  if (peopleError) throw peopleError;
  const namesById = new Map((people ?? []).map((p) => [p.id, p.name]));

  return candidateIds.map((id) => ({
    kind: "co_occurrence" as const,
    otherPersonId: id,
    otherPersonName: namesById.get(id) ?? "Unknown",
    noteCount: noteCountByPerson.get(id)?.size ?? 0,
  }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const mapId = await resolveMapId(supabase, workspaceId, id);
  if (!mapId) {
    return NextResponse.json({ existingInsights: [], coOccurrences: [] });
  }

  try {
    const existingInsights = await findUnmappedInsights(supabase, workspaceId, mapId, id);
    const coOccurrences = await findCoOccurrences(
      supabase,
      workspaceId,
      id,
      new Set(existingInsights.map((s) => s.otherPersonId))
    );
    return NextResponse.json({ existingInsights, coOccurrences });
  } catch (error) {
    console.error("Failed to compute map suggestions:", error);
    return NextResponse.json({ error: "Could not load suggestions." }, { status: 500 });
  }
}
