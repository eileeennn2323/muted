import "server-only";
import { getGeminiClient, CAPTURE_MODEL, GEMINI_TIMEOUT_MS } from "@/lib/gemini";
import { AskAnswerSchema, type AskAnswer } from "./schema";
import { GEMINI_ASK_SCHEMA } from "./geminiRequestSchema";
import { buildAskPrompt } from "./prompt";
import type { AskContext } from "./context";
import { findBannedLanguage } from "@/lib/safety/bannedLanguage";

async function callGemini(
  question: string,
  context: AskContext,
  history: { role: string; content: string }[]
): Promise<AskAnswer | null> {
  try {
    const client = getGeminiClient();
    const { system, user } = buildAskPrompt(question, context, history);

    const response = await client.models.generateContent({
      model: CAPTURE_MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: GEMINI_ASK_SCHEMA,
        maxOutputTokens: 4000,
        abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      },
    });

    const text = response.text;
    if (!text) {
      console.error("Ask Muted returned no text output.", response.promptFeedback);
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      console.error("Ask Muted returned non-JSON output:", error);
      return null;
    }

    const result = AskAnswerSchema.safeParse(parsed);
    if (!result.success) {
      console.error("Ask Muted response failed validation:", JSON.stringify(result.error));
      return null;
    }

    // Hardening: never trust a note id Gemini didn't actually see in context.
    const based_on_note_ids = result.data.based_on_note_ids.filter((id) => context.availableNoteIds.has(id));

    // Post-hoc safety net independent of the prompt's own instruction not to
    // use these words. `approach` is required, so a hit there fails the
    // whole generation (triggers the caller's retry) rather than shipping a
    // patched-down answer; the other fields are already nullable/droppable.
    const approachHit = findBannedLanguage(result.data.approach);
    if (approachHit) {
      console.error(`Ask Muted response dropped for banned language ("${approachHit}") in approach:`, result.data.approach);
      return null;
    }

    const avoidHit = findBannedLanguage(result.data.avoid);
    if (avoidHit) console.error(`Ask Muted "avoid" cleared for banned language ("${avoidHit}"):`, result.data.avoid);

    const watchYourselfHit = findBannedLanguage(result.data.watch_yourself);
    if (watchYourselfHit)
      console.error(`Ask Muted "watch_yourself" cleared for banned language ("${watchYourselfHit}"):`, result.data.watch_yourself);

    const expect = result.data.expect.filter((item) => {
      const hit = findBannedLanguage(item);
      if (hit) console.error(`Ask Muted "expect" item dropped for banned language ("${hit}"):`, item);
      return !hit;
    });

    return {
      ...result.data,
      avoid: avoidHit ? null : result.data.avoid,
      watch_yourself: watchYourselfHit ? null : result.data.watch_yourself,
      expect,
      based_on_note_ids,
    };
  } catch (error) {
    console.error("Gemini ask call failed (network, timeout, or API error):", error);
    return null;
  }
}

export async function runAskResponse(
  question: string,
  context: AskContext,
  history: { role: string; content: string }[]
): Promise<AskAnswer | null> {
  const first = await callGemini(question, context, history);
  if (first) return first;
  console.warn("Ask Muted response failed — retrying once.");
  return await callGemini(question, context, history);
}
