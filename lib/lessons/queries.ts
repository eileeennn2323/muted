import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchEvidenceMap, type EvidenceItem } from "@/lib/evidence";

export type LessonItem = {
  id: string;
  title: string;
  explanation: string | null;
  themes: string[];
  isInferred: boolean;
  userEdited: boolean;
  relatedPeople: { id: string; name: string }[];
  evidence: EvidenceItem[];
};

export async function getLessonsByTheme(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Record<string, LessonItem[]>> {
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id,title,explanation,themes,is_inferred,user_edited,updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!lessons?.length) return {};

  const lessonIds = lessons.map((l) => l.id);

  const { data: linkRows, error: linkError } = await supabase
    .from("lesson_people")
    .select("lesson_id,person_id")
    .in("lesson_id", lessonIds);
  if (linkError) throw linkError;

  const personIds = Array.from(new Set((linkRows ?? []).map((l) => l.person_id)));
  const namesById = new Map<string, string>();
  if (personIds.length > 0) {
    const { data: people, error: peopleError } = await supabase.from("people").select("id,name").in("id", personIds);
    if (peopleError) throw peopleError;
    for (const p of people ?? []) namesById.set(p.id, p.name);
  }

  const peopleByLesson = new Map<string, { id: string; name: string }[]>();
  for (const link of linkRows ?? []) {
    const name = namesById.get(link.person_id);
    if (!name) continue;
    const list = peopleByLesson.get(link.lesson_id) ?? [];
    list.push({ id: link.person_id, name });
    peopleByLesson.set(link.lesson_id, list);
  }

  const evidenceByLesson = await fetchEvidenceMap(supabase, "lesson_evidence", "lesson_id", lessonIds);

  const byTheme: Record<string, LessonItem[]> = {};
  for (const lesson of lessons) {
    const item: LessonItem = {
      id: lesson.id,
      title: lesson.title,
      explanation: lesson.explanation,
      themes: lesson.themes,
      isInferred: lesson.is_inferred,
      userEdited: lesson.user_edited,
      relatedPeople: peopleByLesson.get(lesson.id) ?? [],
      evidence: evidenceByLesson.get(lesson.id) ?? [],
    };
    for (const theme of lesson.themes) {
      (byTheme[theme] ??= []).push(item);
    }
  }
  return byTheme;
}
