import { z } from "zod";

export const CONFIDENCE_VALUES = ["low", "medium", "high"] as const;
export const PERSON_INSIGHT_TYPES = [
  "cares_about",
  "communication",
  "likely_questions",
  "avoid",
  "approach",
  "general",
] as const;
export const SELF_INSIGHT_TYPES = ["pattern", "strength", "watch_out", "working_on"] as const;
export const RELATIONSHIP_TYPES = ["reports_to", "influences", "works_closely_with"] as const;
export const LESSON_THEMES = [
  "Communication",
  "Leadership",
  "Stakeholder Management",
  "Personal Growth",
] as const;

const confidenceEnum = z.enum(CONFIDENCE_VALUES);
const personInsightTypeEnum = z.enum(PERSON_INSIGHT_TYPES);
const selfInsightTypeEnum = z.enum(SELF_INSIGHT_TYPES);
const themeEnum = z.enum(LESSON_THEMES);
const relationshipTypeEnum = z.enum(RELATIONSHIP_TYPES);

const quoteField = z
  .string()
  .max(280)
  .nullable()
  .describe(
    "The exact sentence or fragment copied verbatim from the note that most directly supports this — not a paraphrase or summary of the whole note. Null only if no single fragment captures it well."
  );

export const PersonMentionSchema = z.object({
  existing_person_id: z
    .string()
    .nullable()
    .describe("Set to the exact id of an existing person from the context, or null."),
  new_person_name: z
    .string()
    .max(100)
    .nullable()
    .describe(
      "Set when this mention is a person not in the existing list. Reuse this exact string everywhere else you reference them."
    ),
  matched_alias: z
    .string()
    .max(40)
    .nullable()
    .describe(
      "Set only when existing_person_id is set and the note used a shorthand/initial for them not already in their known aliases."
    ),
});

export const PersonInsightSchema = z.object({
  person_ref: z
    .string()
    .describe("Either an existing_person_id or the exact new_person_name used above."),
  type: personInsightTypeEnum,
  content: z.string().min(1).max(300),
  confidence: confidenceEnum,
  is_inferred: z.boolean(),
  existing_insight_id: z
    .string()
    .nullable()
    .describe(
      "Set to an existing insight id from context to reinforce/refine it in place (content should be the new current-best-understanding wording). Null to create a new insight."
    ),
  quote: quoteField,
});

export const RelationshipInsightSchema = z.object({
  person_a_ref: z.string(),
  person_b_ref: z.string(),
  content: z.string().min(1).max(300),
  confidence: confidenceEnum,
  is_inferred: z.boolean(),
  existing_relationship_insight_id: z
    .string()
    .nullable()
    .describe(
      "Set to an existing relationship insight id from context to reinforce/refine it in place. Null to create a new one."
    ),
  quote: quoteField,
  relationship_type: relationshipTypeEnum
    .nullable()
    .describe(
      "Classify the dynamic when it clearly fits one of: reports_to (person_a_ref reports to / is managed by person_b_ref), influences (person_a_ref influences person_b_ref's decisions or behaviour), works_closely_with (frequent close collaboration, no clear hierarchy). Null if the note doesn't clearly support one of these three."
    ),
});

export const LessonSchema = z.object({
  title: z.string().min(1).max(140),
  explanation: z.string().max(300).nullable(),
  themes: z.array(themeEnum).min(1).max(2),
  is_inferred: z.boolean(),
  existing_lesson_id: z
    .string()
    .nullable()
    .describe(
      "Set to an existing lesson id from context to reinforce it in place — same underlying lesson, now with more evidence or clearer wording. Null to create a new lesson."
    ),
  related_person_refs: z.array(z.string()).max(6),
  quote: quoteField,
});

export const SelfInsightSchema = z.object({
  type: selfInsightTypeEnum,
  content: z.string().min(1).max(300),
  confidence: confidenceEnum,
  is_inferred: z.boolean(),
  quote: quoteField,
});

export const CaptureExtractionSchema = z.object({
  people: z.array(PersonMentionSchema).max(10),
  person_insights: z.array(PersonInsightSchema).max(20),
  relationship_insights: z.array(RelationshipInsightSchema).max(10),
  context_summary: z
    .string()
    .max(300)
    .nullable()
    .describe(
      "Situational/atmosphere observation not fairly attributed to one person. Null for most notes."
    ),
  lessons: z
    .array(LessonSchema)
    .max(3)
    .describe(
      "Zero or more genuinely reusable, people-related lessons — including behaviours worth learning from someone in the note. Empty array for most notes."
    ),
  self_insight: SelfInsightSchema.nullable().describe(
    "Only when the note reveals something about the workspace owner's own behaviour. Null otherwise."
  ),
});

export type CaptureExtraction = z.infer<typeof CaptureExtractionSchema>;
export type PersonInsightExtraction = z.infer<typeof PersonInsightSchema>;
export type RelationshipInsightExtraction = z.infer<typeof RelationshipInsightSchema>;
