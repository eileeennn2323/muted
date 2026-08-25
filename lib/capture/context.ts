import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PersonRow = { id: string; name: string; roles: string[]; aliases: string[] };
export type PersonInsightRow = {
  id: string;
  person_id: string;
  type: string;
  content: string;
  confidence: string;
  is_inferred: boolean;
  user_edited: boolean;
};
export type RelationshipInsightRow = {
  id: string;
  person_a_id: string;
  person_b_id: string;
  content: string;
  confidence: string;
  is_inferred: boolean;
  user_edited: boolean;
};

export type MemoryContext = {
  people: PersonRow[];
  personInsights: PersonInsightRow[];
  relationshipInsights: RelationshipInsightRow[];
  lessons: { title: string; themes: string[] }[];
  selfInsights: { type: string; content: string; confidence: string }[];
  /** Set when the note was captured from a specific person's page (Add note). */
  anchorPerson: PersonRow | null;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Simple word-boundary heuristic — good enough to scope which people's existing
 * insights are worth sending, without needing an extra AI call just to find names. */
function mentionsName(noteText: string, name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const pattern = new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, "i");
  return pattern.test(noteText);
}

export async function buildMemoryContext(
  supabase: SupabaseClient,
  workspaceId: string,
  noteText: string,
  anchorPersonId?: string | null
): Promise<MemoryContext> {
  const { data: peopleData, error: peopleError } = await supabase
    .from("people")
    .select("id,name,roles,aliases")
    .eq("workspace_id", workspaceId);
  if (peopleError) throw peopleError;
  const people = (peopleData ?? []) as PersonRow[];

  const anchorPerson = anchorPersonId ? (people.find((p) => p.id === anchorPersonId) ?? null) : null;

  const plausibleIds = new Set(
    people
      .filter((p) => mentionsName(noteText, p.name) || p.aliases.some((a) => mentionsName(noteText, a)))
      .map((p) => p.id)
  );
  // Always include the person this note was captured from (Add note on their
  // page), even if the note never spells out their name — e.g. "asks a lot
  // of questions before committing" written from John's page is about John.
  if (anchorPerson) plausibleIds.add(anchorPerson.id);
  const plausibleIdList = [...plausibleIds];

  let personInsights: PersonInsightRow[] = [];
  let relationshipInsights: RelationshipInsightRow[] = [];

  if (plausibleIdList.length > 0) {
    const { data: piData, error: piError } = await supabase
      .from("person_insights")
      .select("id,person_id,type,content,confidence,is_inferred,user_edited")
      .eq("workspace_id", workspaceId)
      .in("person_id", plausibleIdList);
    if (piError) throw piError;
    personInsights = (piData ?? []) as PersonInsightRow[];

    const idList = plausibleIdList.join(",");
    const { data: riData, error: riError } = await supabase
      .from("relationship_insights")
      .select("id,person_a_id,person_b_id,content,confidence,is_inferred,user_edited")
      .eq("workspace_id", workspaceId)
      .or(`person_a_id.in.(${idList}),person_b_id.in.(${idList})`);
    if (riError) throw riError;
    relationshipInsights = (riData ?? []) as RelationshipInsightRow[];
  }

  const { data: lessonsData, error: lessonsError } = await supabase
    .from("lessons")
    .select("title,themes")
    .eq("workspace_id", workspaceId);
  if (lessonsError) throw lessonsError;

  const { data: selfData, error: selfError } = await supabase
    .from("self_insights")
    .select("type,content,confidence")
    .eq("workspace_id", workspaceId);
  if (selfError) throw selfError;

  return {
    people,
    personInsights,
    relationshipInsights,
    lessons: lessonsData ?? [],
    selfInsights: selfData ?? [],
    anchorPerson,
  };
}
