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
    .select("person_id,type,content,updated_at")
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
    // The one-liner preview mirrors the person page's "At a glance" section
    // specifically (type: general) — not just whatever insight of any type
    // was touched most recently. Rows arrive ordered by updated_at desc, so
    // the first "general" row seen per person is their most current one.
    if (row.type === "general" && !headlineByPerson.has(row.person_id)) {
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

export type PersonLesson = {
  id: string;
  title: string;
  explanation: string | null;
  isInferred: boolean;
};

export type PersonPlaybook = {
  person: { id: string; name: string; roles: string[] };
  insightsByType: Record<string, PlaybookInsight[]>;
  lessons: PersonLesson[];
};

export async function getPersonPlaybook(
  supabase: SupabaseClient,
  workspaceId: string,
  personId: string
): Promise<PersonPlaybook | null> {
  // None of these three depend on each other's results — only on the
  // personId/workspaceId we already have — so fetch them together instead
  // of paying for three sequential round-trips.
  const [personResult, insightsResult, lessonLinksResult] = await Promise.all([
    supabase.from("people").select("id,name,roles").eq("workspace_id", workspaceId).eq("id", personId).maybeSingle(),
    supabase
      .from("person_insights")
      .select("id,type,content,confidence,is_inferred,user_edited")
      .eq("workspace_id", workspaceId)
      .eq("person_id", personId)
      .order("updated_at", { ascending: false }),
    supabase.from("lesson_people").select("lesson_id").eq("person_id", personId),
  ]);
  if (personResult.error) throw personResult.error;
  const person = personResult.data;
  if (!person) return null;
  if (insightsResult.error) throw insightsResult.error;
  if (lessonLinksResult.error) throw lessonLinksResult.error;

  const insights = insightsResult.data;
  const insightIds = (insights ?? []).map((i) => i.id);
  const lessonIds = Array.from(new Set((lessonLinksResult.data ?? []).map((l) => l.lesson_id)));

  // Evidence lookup and the lessons fetch depend on different upstream
  // results (insightIds vs. lessonIds), not on each other.
  const [evidenceByInsight, lessonRowsResult] = await Promise.all([
    fetchEvidenceMap(supabase, "person_insight_evidence", "insight_id", insightIds),
    lessonIds.length > 0
      ? supabase
          .from("lessons")
          .select("id,title,explanation,is_inferred,updated_at")
          .eq("workspace_id", workspaceId)
          .in("id", lessonIds)
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: [], error: null } as const),
  ]);
  if (lessonRowsResult.error) throw lessonRowsResult.error;

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

  const lessons: PersonLesson[] = (lessonRowsResult.data ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    explanation: l.explanation,
    isInferred: l.is_inferred,
  }));

  return { person, insightsByType, lessons };
}
