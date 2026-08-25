import "server-only";
import { getGeminiClient, CAPTURE_MODEL, GEMINI_TIMEOUT_MS } from "@/lib/gemini";
import { AskAnswerSchema, type AskAnswer } from "./schema";
import { GEMINI_ASK_SCHEMA } from "./geminiRequestSchema";
import { buildAskPrompt } from "./prompt";
import type { AskContext } from "./context";

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

    return { ...result.data, based_on_note_ids };
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
