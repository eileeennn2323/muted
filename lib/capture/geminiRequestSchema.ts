/**
 * The JSON schema sent to Gemini for the capture extraction request.
 *
 * This is deliberately looser than `CaptureExtractionSchema` in lib/capture/schema.ts
 * (no enums, no length limits, no additionalProperties) — confirmed via live
 * testing that Gemini's structured-output validator rejects our real schema
 * with a bare "Request contains an invalid argument" 400 once enough
 * enum/length constraints accumulate across the whole schema, with no field
 * telling us which part it disliked. The allowed values are still spelled out
 * in the prompt text, and every response is re-validated against the strict
 * `CaptureExtractionSchema` (with its enums and length limits) before we ever
 * write anything to the database — this file only loosens what we *ask*
 * Gemini to conform to, never what we trust.
 */
const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };

export const GEMINI_CAPTURE_SCHEMA = {
  type: "object",
  properties: {
    people: {
      type: "array",
      items: {
        type: "object",
        properties: {
          existing_person_id: nullableString,
          new_person_name: nullableString,
          matched_alias: nullableString,
        },
        required: ["existing_person_id", "new_person_name", "matched_alias"],
      },
    },
    person_insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          person_ref: { type: "string" },
          type: { type: "string" },
          content: { type: "string" },
          confidence: { type: "string" },
          is_inferred: { type: "boolean" },
          existing_insight_id: nullableString,
          quote: nullableString,
        },
        required: ["person_ref", "type", "content", "confidence", "is_inferred", "existing_insight_id", "quote"],
      },
    },
    relationship_insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          person_a_ref: { type: "string" },
          person_b_ref: { type: "string" },
          content: { type: "string" },
          confidence: { type: "string" },
          is_inferred: { type: "boolean" },
          existing_relationship_insight_id: nullableString,
          quote: nullableString,
          relationship_type: nullableString,
        },
        required: [
          "person_a_ref",
          "person_b_ref",
          "content",
          "confidence",
          "is_inferred",
          "existing_relationship_insight_id",
          "quote",
          "relationship_type",
        ],
      },
    },
    context_summary: nullableString,
    lessons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          explanation: nullableString,
          themes: { type: "array", items: { type: "string" } },
          is_inferred: { type: "boolean" },
          existing_lesson_id: nullableString,
          related_person_refs: { type: "array", items: { type: "string" } },
          quote: nullableString,
        },
        required: [
          "title",
          "explanation",
          "themes",
          "is_inferred",
          "existing_lesson_id",
          "related_person_refs",
          "quote",
        ],
      },
    },
    self_insight: {
      anyOf: [
        {
          type: "object",
          properties: {
            type: { type: "string" },
            content: { type: "string" },
            confidence: { type: "string" },
            is_inferred: { type: "boolean" },
            quote: nullableString,
          },
          required: ["type", "content", "confidence", "is_inferred", "quote"],
        },
        { type: "null" },
      ],
    },
  },
  required: ["people", "person_insights", "relationship_insights", "context_summary", "lessons", "self_insight"],
} as const;
