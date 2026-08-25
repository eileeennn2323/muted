import "server-only";
import { getGeminiClient, CAPTURE_MODEL, GEMINI_TIMEOUT_MS } from "@/lib/gemini";
import {
  PersonMentionSchema,
  PersonInsightSchema,
  RelationshipInsightSchema,
  LessonSchema,
  SelfInsightSchema,
  type CaptureExtraction,
} from "./schema";
import { GEMINI_CAPTURE_SCHEMA } from "./geminiRequestSchema";
import { buildCapturePrompt } from "./prompt";
import type { MemoryContext } from "./context";

/** Parses each item and logs (not just silently drops) whatever fails
 * validation — otherwise a Gemini quirk on one item can zero out an entire
 * array with no visibility into why. */
function parseItems<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } }, items: unknown[], label: string): T[] {
  const out: T[] = [];
  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success && result.data !== undefined) {
      out.push(result.data);
    } else {
      console.error(`Dropped invalid ${label} item:`, JSON.stringify(item), JSON.stringify(result.error));
    }
  }
  return out;
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** A quote is only trustworthy if it's an actual fragment of the note —
 * otherwise a hallucinated or reworded "quote" could mislead the user into
 * thinking something was said that wasn't. Dropping it (not the whole
 * insight) falls back to the old truncated-note evidence display. */
function sanitizeQuote(quote: string | null, noteText: string): string | null {
  if (!quote) return null;
  const trimmed = quote.trim();
  if (!trimmed) return null;
  if (!normalizeForMatch(noteText).includes(normalizeForMatch(trimmed))) return null;
  return trimmed;
}

/**
 * Validates each array item / nullable object independently and drops
 * whatever doesn't conform, instead of failing the whole capture for one bad
 * field. This matters because the request schema (GEMINI_CAPTURE_SCHEMA) is
 * deliberately loose — Gemini isn't structurally constrained to the real
 * enums, so an occasional invalid value (e.g. a made-up insight `type`) is
 * expected and should just be discarded, not treated as a full failure.
 */
function coerceToCaptureExtraction(raw: unknown, noteText: string): CaptureExtraction {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const people = Array.isArray(obj.people) ? parseItems(PersonMentionSchema, obj.people, "people") : [];

  const person_insights = Array.isArray(obj.person_insights)
    ? parseItems(PersonInsightSchema, obj.person_insights, "person_insights").map((pi) => ({
        ...pi,
        quote: sanitizeQuote(pi.quote, noteText),
      }))
    : [];

  const relationship_insights = Array.isArray(obj.relationship_insights)
    ? parseItems(RelationshipInsightSchema, obj.relationship_insights, "relationship_insights").map((ri) => ({
        ...ri,
        quote: sanitizeQuote(ri.quote, noteText),
      }))
    : [];

  const contextSummaryResult =
    typeof obj.context_summary === "string" ? obj.context_summary.slice(0, 300) : null;

  const lessons = Array.isArray(obj.lessons)
    ? parseItems(LessonSchema, obj.lessons, "lessons").map((l) => ({ ...l, quote: sanitizeQuote(l.quote, noteText) }))
    : [];
  const selfInsightParsed = obj.self_insight ? SelfInsightSchema.safeParse(obj.self_insight) : null;
  const selfInsightResult =
    selfInsightParsed?.success
      ? { ...selfInsightParsed.data, quote: sanitizeQuote(selfInsightParsed.data.quote, noteText) }
      : null;

  return {
    people,
    person_insights,
    relationship_insights,
    context_summary: contextSummaryResult,
    lessons,
    self_insight: selfInsightResult,
  };
}

function isMeaningfullyEmpty(extraction: CaptureExtraction): boolean {
  return (
    extraction.people.length === 0 &&
    extraction.person_insights.length === 0 &&
    extraction.relationship_insights.length === 0 &&
    !extraction.context_summary &&
    extraction.lessons.length === 0 &&
    !extraction.self_insight
  );
}

async function callGemini(note: string, context: MemoryContext): Promise<CaptureExtraction | null> {
  try {
    const client = getGeminiClient();
    const { system, user } = buildCapturePrompt(note, context);

    const response = await client.models.generateContent({
      model: CAPTURE_MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: GEMINI_CAPTURE_SCHEMA,
        maxOutputTokens: 8000,
        abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      },
    });

    const text = response.text;
    if (!text) {
      console.error("Gemini returned no text output.", response.promptFeedback);
      return null;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch (error) {
      console.error("Gemini returned non-JSON output:", error);
      return null;
    }

    return coerceToCaptureExtraction(parsedJson, note);
  } catch (error) {
    console.error("Gemini capture call failed (network, timeout, or API error):", error);
    return null;
  }
}

const MIN_NOTE_LENGTH_WORTH_RETRYING = 40;

export async function runCaptureExtraction(
  note: string,
  context: MemoryContext
): Promise<CaptureExtraction | null> {
  const first = await callGemini(note, context);

  // Retry once whenever the first attempt didn't land: a smaller model
  // occasionally returns a totally empty extraction for a note that clearly
  // has something in it (observed live), and a slow/failed call now also
  // resolves to null (via the timeout + catch in callGemini) rather than
  // throwing — both deserve the same one-time retry instead of an immediate
  // failure. A genuinely trivial note (too short to bother retrying) is left alone.
  const shouldRetry = note.trim().length >= MIN_NOTE_LENGTH_WORTH_RETRYING && (!first || isMeaningfullyEmpty(first));
  if (shouldRetry) {
    console.warn("Capture extraction failed or came back empty for a non-trivial note — retrying once.");
    const second = await callGemini(note, context);
    if (second && !isMeaningfullyEmpty(second)) return second;
    return second ?? first;
  }

  return first;
}
