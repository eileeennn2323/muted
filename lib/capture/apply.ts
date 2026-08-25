import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemoryContext, PersonRow } from "./context";
import type { CaptureExtraction } from "./schema";

export type PickedUpPersonLine = { personId: string; personName: string; content: string; isInferred: boolean };
export type PickedUpRelationshipLine = {
  personAName: string;
  personBName: string;
  content: string;
  isInferred: boolean;
  confidence: string;
};
export type PickedUp = {
  newPeople: { id: string; name: string }[];
  personLines: PickedUpPersonLine[];
  relationshipLines: PickedUpRelationshipLine[];
  lessonLines: { content: string; isInferred: boolean }[];
  selfLine: { content: string; isInferred: boolean } | null;
};

// New insights outrank updates to an existing one when picking the single
// headline line to show per person in "Picked up". Gemini's structured
// output only tolerates 6 fields on this object (see runCaptureExtraction),
// so "new vs. update" is derived from existing_insight_id being null rather
// than from a separate action field — reinforce vs. refine has no separate
// signal, which only affects this cosmetic ranking, not what gets written.
const NEW_PRIORITY = 2;
const UPDATE_PRIORITY = 1;

async function linkEvidence(
  supabase: SupabaseClient,
  table: string,
  idColumn: string,
  id: string,
  noteId: string,
  quote?: string | null
): Promise<void> {
  const row: Record<string, unknown> = { [idColumn]: id, note_id: noteId };
  if (quote !== undefined) row.quote = quote;
  const { error } = await supabase
    .from(table)
    .upsert(row, { onConflict: `${idColumn},note_id`, ignoreDuplicates: true });
  if (error) console.error(`Failed to link evidence into ${table}:`, error);
}

export async function applyCaptureExtraction(params: {
  supabase: SupabaseClient;
  workspaceId: string;
  noteId: string;
  extraction: CaptureExtraction;
  context: MemoryContext;
}): Promise<PickedUp> {
  const { supabase, workspaceId, noteId, extraction, context } = params;

  const existingPersonIds = new Set(context.people.map((p) => p.id));
  const existingInsightIds = new Set(context.personInsights.map((i) => i.id));
  const existingRelationshipInsightIds = new Set(context.relationshipInsights.map((r) => r.id));

  // ref -> resolved person id. Existing people resolve to themselves (identity).
  const refMap = new Map<string, string>();
  for (const id of existingPersonIds) refMap.set(id, id);

  const namesById = new Map<string, string>(context.people.map((p) => [p.id, p.name]));
  const newPeople: { id: string; name: string }[] = [];

  for (const mention of extraction.people) {
    if (mention.existing_person_id && existingPersonIds.has(mention.existing_person_id)) {
      const personId = mention.existing_person_id;
      if (mention.matched_alias) {
        await maybeAppendAlias(supabase, workspaceId, context.people, personId, mention.matched_alias);
      }
      continue;
    }

    if (mention.new_person_name) {
      const name = mention.new_person_name.trim();
      if (!name) continue;
      if (refMap.has(mention.new_person_name)) continue; // already resolved earlier in this same batch

      const collision = context.people.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (collision) {
        refMap.set(mention.new_person_name, collision.id);
        continue;
      }

      const newId = crypto.randomUUID();
      const { error } = await supabase
        .from("people")
        .insert({ id: newId, workspace_id: workspaceId, name, roles: [], aliases: [] });
      if (!error) {
        refMap.set(mention.new_person_name, newId);
        namesById.set(newId, name);
        newPeople.push({ id: newId, name });
      }
    }
  }

  const resolveRef = (ref: string): string | null => refMap.get(ref) ?? null;

  const personLineCandidates = new Map<
    string,
    { personId: string; personName: string; content: string; isInferred: boolean; priority: number }
  >();

  for (const pi of extraction.person_insights) {
    const personId = resolveRef(pi.person_ref);
    if (!personId) continue;
    const content = pi.content.trim();
    if (!content) continue;

    let wrote = false;
    const isNew = !pi.existing_insight_id;

    if (isNew) {
      const newInsightId = crypto.randomUUID();
      const { error } = await supabase.from("person_insights").insert({
        id: newInsightId,
        workspace_id: workspaceId,
        person_id: personId,
        type: pi.type,
        content,
        confidence: pi.confidence,
        is_inferred: pi.is_inferred,
        user_edited: false,
      });
      if (!error) {
        await linkEvidence(supabase, "person_insight_evidence", "insight_id", newInsightId, noteId, pi.quote);
        wrote = true;
      }
    } else {
      // Hardening: only allow ids we actually offered Gemini in context, and
      // confirm the target genuinely belongs to the resolved person before writing.
      if (!pi.existing_insight_id || !existingInsightIds.has(pi.existing_insight_id)) continue;
      const target = context.personInsights.find((i) => i.id === pi.existing_insight_id);
      if (!target || target.person_id !== personId) continue;

      const { error } = await supabase
        .from("person_insights")
        .update({
          content,
          confidence: pi.confidence,
          is_inferred: pi.is_inferred,
          user_edited: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pi.existing_insight_id)
        .eq("workspace_id", workspaceId);
      if (!error) {
        await linkEvidence(supabase, "person_insight_evidence", "insight_id", pi.existing_insight_id, noteId, pi.quote);
        wrote = true;
      }
    }

    if (wrote) {
      const priority = isNew ? NEW_PRIORITY : UPDATE_PRIORITY;
      const existingCandidate = personLineCandidates.get(personId);
      if (!existingCandidate || priority > existingCandidate.priority) {
        personLineCandidates.set(personId, {
          personId,
          personName: namesById.get(personId) ?? "Unknown",
          content,
          isInferred: pi.is_inferred,
          priority,
        });
      }
    }
  }

  const relationshipLines: PickedUpRelationshipLine[] = [];

  for (const ri of extraction.relationship_insights) {
    const personAId = resolveRef(ri.person_a_ref);
    const personBId = resolveRef(ri.person_b_ref);
    if (!personAId || !personBId || personAId === personBId) continue;
    const content = ri.content.trim();
    if (!content) continue;

    let wrote = false;

    if (!ri.existing_relationship_insight_id) {
      const newId = crypto.randomUUID();
      const { error } = await supabase.from("relationship_insights").insert({
        id: newId,
        workspace_id: workspaceId,
        person_a_id: personAId,
        person_b_id: personBId,
        content,
        confidence: ri.confidence,
        is_inferred: ri.is_inferred,
        user_edited: false,
        // Set once at creation, like person_insights.type — a relationship's
        // category doesn't change on reinforcement, only its wording does.
        relationship_type: ri.relationship_type,
      });
      if (!error) {
        await linkEvidence(supabase, "relationship_insight_evidence", "relationship_insight_id", newId, noteId, ri.quote);
        wrote = true;
      }
    } else {
      if (
        !ri.existing_relationship_insight_id ||
        !existingRelationshipInsightIds.has(ri.existing_relationship_insight_id)
      )
        continue;
      const target = context.relationshipInsights.find((r) => r.id === ri.existing_relationship_insight_id);
      if (!target) continue;
      const samePair =
        (target.person_a_id === personAId && target.person_b_id === personBId) ||
        (target.person_a_id === personBId && target.person_b_id === personAId);
      if (!samePair) continue;

      const { error } = await supabase
        .from("relationship_insights")
        .update({
          content,
          confidence: ri.confidence,
          is_inferred: ri.is_inferred,
          user_edited: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ri.existing_relationship_insight_id)
        .eq("workspace_id", workspaceId);
      if (!error) {
        await linkEvidence(
          supabase,
          "relationship_insight_evidence",
          "relationship_insight_id",
          ri.existing_relationship_insight_id,
          noteId,
          ri.quote
        );
        wrote = true;
      }
    }

    if (wrote) {
      relationshipLines.push({
        personAName: namesById.get(personAId) ?? "Unknown",
        personBName: namesById.get(personBId) ?? "Unknown",
        content,
        isInferred: ri.is_inferred,
        confidence: ri.confidence,
      });
    }
  }

  const lessonLines: PickedUp["lessonLines"] = [];
  for (const lesson of extraction.lessons) {
    const title = lesson.title.trim();
    if (!title) continue;

    const lessonId = crypto.randomUUID();
    const { error } = await supabase.from("lessons").insert({
      id: lessonId,
      workspace_id: workspaceId,
      title,
      explanation: lesson.explanation?.trim() || null,
      themes: lesson.themes,
      is_inferred: lesson.is_inferred,
      user_edited: false,
    });
    if (error) continue;

    await linkEvidence(supabase, "lesson_evidence", "lesson_id", lessonId, noteId, lesson.quote);
    const relatedIds = lesson.related_person_refs.map((ref) => resolveRef(ref)).filter((id): id is string => Boolean(id));
    if (relatedIds.length > 0) {
      await supabase
        .from("lesson_people")
        .upsert(
          relatedIds.map((personId) => ({ lesson_id: lessonId, person_id: personId })),
          { onConflict: "lesson_id,person_id", ignoreDuplicates: true }
        );
    }
    lessonLines.push({ content: title, isInferred: lesson.is_inferred });
  }

  let selfLine: PickedUp["selfLine"] = null;
  if (extraction.self_insight) {
    const self = extraction.self_insight;
    const content = self.content.trim();
    if (content) {
      const selfId = crypto.randomUUID();
      const { error } = await supabase.from("self_insights").insert({
        id: selfId,
        workspace_id: workspaceId,
        type: self.type,
        content,
        confidence: self.confidence,
        is_inferred: self.is_inferred,
        user_edited: false,
      });
      if (!error) {
        await linkEvidence(supabase, "self_insight_evidence", "self_insight_id", selfId, noteId, self.quote);
        selfLine = { content, isInferred: self.is_inferred };
      }
    }
  }

  return {
    newPeople,
    personLines: Array.from(personLineCandidates.values()).map(({ personId, personName, content, isInferred }) => ({
      personId,
      personName,
      content,
      isInferred,
    })),
    relationshipLines,
    lessonLines,
    selfLine,
  };
}

async function maybeAppendAlias(
  supabase: SupabaseClient,
  workspaceId: string,
  people: PersonRow[],
  personId: string,
  rawAlias: string
): Promise<void> {
  const alias = rawAlias.trim();
  if (!alias || alias.length > 40) return;

  const person = people.find((p) => p.id === personId);
  if (!person) return;
  if (alias.toLowerCase() === person.name.toLowerCase()) return;
  if (person.aliases.some((a) => a.toLowerCase() === alias.toLowerCase())) return;

  const merged = [...person.aliases, alias];
  await supabase.from("people").update({ aliases: merged }).eq("id", personId).eq("workspace_id", workspaceId);
  person.aliases = merged;
}
