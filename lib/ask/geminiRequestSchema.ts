/** Same "ask loosely, validate strictly" pattern as lib/capture/geminiRequestSchema.ts. */
const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };

export const GEMINI_ASK_SCHEMA = {
  type: "object",
  properties: {
    approach: { type: "string" },
    expect: { type: "array", items: { type: "string" } },
    avoid: nullableString,
    watch_yourself: nullableString,
    based_on_note_ids: { type: "array", items: { type: "string" } },
  },
  required: ["approach", "expect", "avoid", "watch_yourself", "based_on_note_ids"],
} as const;
