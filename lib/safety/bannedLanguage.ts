/**
 * Post-hoc safety net for the non-clinical boundary the prompts already
 * instruct Gemini to follow (see lib/capture/prompt.ts / lib/ask/prompt.ts).
 * A prompt instruction is not a guarantee — this scans what actually comes
 * back and gives every caller a defensive second layer, independent of
 * whether the model behaved.
 */
const BANNED_WORDS = [
  // Exact set the prompts themselves forbid.
  "narcissist",
  "narcissistic",
  "insecure",
  "insecurity",
  "anxious",
  "anxiety",
  "manipulative",
  "manipulate",
  "manipulation",
  "controlling",
  "toxic",
  // Closely related clinical/diagnostic labels in the same spirit.
  "psychopath",
  "sociopath",
  "personality disorder",
  "gaslighting",
  "gaslight",
] as const;

/** Returns the specific banned word found (lowercased), or null if the text is clean. */
export function findBannedLanguage(text: string | null | undefined): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lower.includes(word)) return word;
  }
  return null;
}
