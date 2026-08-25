import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchEvidenceMap, type EditableInsight } from "@/lib/evidence";

export type PersonListItem = {
  id: string;
  name: string;
  roles: string[];
  insightCount: number;
  lastUpdated: string | null;
  headline: string | null;
};

export async function getPeopleList(supabase: SupabaseClient, workspaceId: string): Promise<PersonListItem[]> {
  const { data: people, error: peopleError } = await supabase
    .from("people")
    .select("id,name,roles")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });
  if (peopleError) throw peopleError;
  if (!people?.length) return [];

  const { data: insights, error: insightsError } = await supabase
    .from("person_insights")
    .select("person_id,content,updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  if (insightsError) throw insightsError;

  const countByPerson = new Map<string, number>();
  const lastUpdatedByPerson = new Map<string, string>();
  const headlineByPerson = new Map<string, string>();
  for (const row of insights ?? []) {
    countByPerson.set(row.person_id, (countByPerson.get(row.person_id) ?? 0) + 1);
    const current = lastUpdatedByPerson.get(row.person_id);
    if (!current || row.updated_at > current) {
      lastUpdatedByPerson.set(row.person_id, row.updated_at);
    }
    // Rows arrive ordered by updated_at desc, so the first one seen per
    // person is their most recently touched insight — a light "what's most
    // current" preview line for the list row.
    if (!headlineByPerson.has(row.person_id)) {
      headlineByPerson.set(row.person_id, row.content);
    }
  }

  return people.map((p) => ({
    id: p.id,
    name: p.name,
    roles: p.roles,
    headline: headlineByPerson.get(p.id) ?? null,
    insightCount: countByPerson.get(p.id) ?? 0,
    lastUpdated: lastUpdatedByPerson.get(p.id) ?? null,
  }));
}

export type PlaybookInsight = EditableInsight & { type: string };

export type PlaybookRelationship = EditableInsight & {
  otherPersonId: string;
  otherPersonName: string;
  otherPersonRole: string | null;
};

export type PersonLesson = {
  id: string;
  title: string;
  explanation: string | null;
  isInferred: boolean;
};

export type PersonPlaybook = {
  person: { id: string; name: string; roles: string[] };
  insightsByType: Record<string, PlaybookInsight[]>;
  relationships: PlaybookRelationship[];
  lessons: PersonLesson[];
};

export async function getPersonPlaybook(
  supabase: SupabaseClient,
  workspaceId: string,
  personId: string
): Promise<PersonPlaybook | null> {
  const { data: person, error: personError } = await supabase
    .from("people")
    .select("id,name,roles")
    .eq("workspace_id", workspaceId)
    .eq("id", personId)
    .maybeSingle();
  if (personError) throw personError;
  if (!person) return null;

  const { data: insights, error: insightsError } = await supabase
    .from("person_insights")
    .select("id,type,content,confidence,is_inferred,user_edited")
    .eq("workspace_id", workspaceId)
    .eq("person_id", personId)
    .order("updated_at", { ascending: false });
  if (insightsError) throw insightsError;

  const insightIds = (insights ?? []).map((i) => i.id);
  const evidenceByInsight = await fetchEvidenceMap(
    supabase,
    "person_insight_evidence",
    "insight_id",
    insightIds
  );

  const insightsByType: Record<string, PlaybookInsight[]> = {};
  for (const insight of insights ?? []) {
    const entry: PlaybookInsight = {
      id: insight.id,
      type: insight.type,
      content: insight.content,
      confidence: insight.confidence,
      isInferred: insight.is_inferred,
      userEdited: insight.user_edited,
      evidence: evidenceByInsight.get(insight.id) ?? [],
    };
    (insightsByType[insight.type] ??= []).push(entry);
  }

  const { data: relRows, error: relError } = await supabase
    .from("relationship_insights")
    .select("id,person_a_id,person_b_id,content,confidence,is_inferred,user_edited")
    .eq("workspace_id", workspaceId)
    .or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`);
  if (relError) throw relError;

  const otherIds = Array.from(
    new Set((relRows ?? []).map((r) => (r.person_a_id === personId ? r.person_b_id : r.person_a_id)))
  );
  const otherNames = new Map<string, string>();
  const otherRoles = new Map<string, string | null>();
  if (otherIds.length > 0) {
    const { data: otherPeople, error: otherError } = await supabase
      .from("people")
      .select("id,name,roles")
      .in("id", otherIds);
    if (otherError) throw otherError;
    for (const p of otherPeople ?? []) {
      otherNames.set(p.id, p.name);
      otherRoles.set(p.id, p.roles[0] ?? null);
    }
  }

  const relEvidenceById = await fetchEvidenceMap(
    supabase,
    "relationship_insight_evidence",
    "relationship_insight_id",
    (relRows ?? []).map((r) => r.id)
  );

  const relationships: PlaybookRelationship[] = (relRows ?? []).map((r) => {
    const otherPersonId = r.person_a_id === personId ? r.person_b_id : r.person_a_id;
    return {
      id: r.id,
      otherPersonId,
      otherPersonName: otherNames.get(otherPersonId) ?? "Unknown",
      otherPersonRole: otherRoles.get(otherPersonId) ?? null,
      content: r.content,
      confidence: r.confidence,
      isInferred: r.is_inferred,
      userEdited: r.user_edited,
      evidence: relEvidenceById.get(r.id) ?? [],
    };
  });

  const { data: lessonLinks, error: lessonLinksError } = await supabase
    .from("lesson_people")
    .select("lesson_id")
    .eq("person_id", personId);
  if (lessonLinksError) throw lessonLinksError;

  const lessonIds = Array.from(new Set((lessonLinks ?? []).map((l) => l.lesson_id)));
  let lessons: PersonLesson[] = [];
  if (lessonIds.length > 0) {
    const { data: lessonRows, error: lessonsError } = await supabase
      .from("lessons")
      .select("id,title,explanation,is_inferred,updated_at")
      .eq("workspace_id", workspaceId)
      .in("id", lessonIds)
      .order("updated_at", { ascending: false });
    if (lessonsError) throw lessonsError;
    lessons = (lessonRows ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      explanation: l.explanation,
      isInferred: l.is_inferred,
    }));
  }

  return { person, insightsByType, relationships, lessons };
}
