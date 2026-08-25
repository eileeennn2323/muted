import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type EvidenceItem = { noteId: string; createdAt: string; quote: string };

/** Shape shared by every correctable, evidence-backed item (person insights,
 * relationship insights, lessons, self-insights) — lets one InsightCard-style
 * UI and one edit/delete API pattern work across all of them. */
export type EditableInsight = {
  id: string;
  content: string;
  confidence: string;
  isInferred: boolean;
  userEdited: boolean;
  evidence: EvidenceItem[];
};

export function truncate(text: string, max = 220): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

type EvidenceRow = { note_id: string; quote: string | null } & Record<string, unknown>;

/** Fetches evidence rows for a set of parent ids from an evidence-link table
 * (person_insight_evidence, relationship_insight_evidence, lesson_evidence,
 * self_insight_evidence) and resolves each to a displayable quote — the
 * specific fragment Gemini cited, falling back to a truncated view of the
 * whole note for older evidence rows written before quotes existed. */
export async function fetchEvidenceMap(
  supabase: SupabaseClient,
  table: string,
  idColumn: string,
  ids: string[]
): Promise<Map<string, EvidenceItem[]>> {
  const byId = new Map<string, EvidenceItem[]>();
  if (ids.length === 0) return byId;

  const { data: evidenceRows, error: evidenceError } = await supabase
    .from(table)
    .select(`${idColumn},note_id,quote`)
    .in(idColumn, ids);
  if (evidenceError) throw evidenceError;

  const rows = (evidenceRows ?? []) as unknown as EvidenceRow[];
  const noteIds = Array.from(new Set(rows.map((e) => e.note_id)));
  const notesById = new Map<string, { created_at: string; raw_content: string }>();
  if (noteIds.length > 0) {
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id,created_at,raw_content")
      .in("id", noteIds);
    if (notesError) throw notesError;
    for (const n of notes ?? []) notesById.set(n.id, { created_at: n.created_at, raw_content: n.raw_content });
  }

  for (const row of rows) {
    const note = notesById.get(row.note_id);
    if (!note) continue;
    const parentId = row[idColumn] as string;
    const list = byId.get(parentId) ?? [];
    const quote = row.quote && row.quote.trim() ? row.quote.trim() : truncate(note.raw_content);
    list.push({ noteId: row.note_id, createdAt: note.created_at, quote });
    byId.set(parentId, list);
  }
  for (const list of byId.values()) {
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return byId;
}
