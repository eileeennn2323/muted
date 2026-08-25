import { z } from "zod";

export const AskAnswerSchema = z.object({
  approach: z
    .string()
    .min(1)
    .max(600)
    .describe("1-3 short sentences — the core recommended way to approach this. Lead with the single most important thing to do."),
  expect: z
    .array(z.string().max(200))
    .max(5)
    .describe("Specific questions, reactions, or behaviours to expect, grounded in memory. Empty if there's nothing to predict."),
  avoid: z.string().max(300).nullable(),
  watch_yourself: z.string().max(300).nullable(),
  based_on_note_ids: z
    .array(z.string())
    .max(10)
    .describe("Only ids that appeared in the supplied context. Empty if the answer has no specific grounding."),
});

export type AskAnswer = z.infer<typeof AskAnswerSchema>;
