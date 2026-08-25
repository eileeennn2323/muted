import "server-only";
import { GoogleGenAI } from "@google/genai";

let cached: GoogleGenAI | null = null;

/**
 * Server-only Gemini client. Never import this from a Client Component —
 * the API key must never reach the browser bundle.
 */
export function getGeminiClient(): GoogleGenAI {
  if (cached) return cached;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  cached = new GoogleGenAI({ apiKey });
  return cached;
}

// gemini-2.5-flash and gemini-2.5-flash-lite both 404 for new API keys
// ("no longer available to new users"). gemini-3.6-flash (the suggested
// replacement) works but is capped at a 20-requests/day free-tier quota —
// unworkable for hackathon dev + a live demo. gemini-3.5-flash-lite is the
// current free-tier workhorse tier with a much more generous daily quota,
// which matters more for reliability than the modest reasoning gap vs
// full Flash.
export const CAPTURE_MODEL = "gemini-3.5-flash-lite";

// A live demo can't afford an AI call that just hangs — bound every Gemini
// request so a slow response fails fast into the existing retry/fallback
// path instead of leaving the UI stuck on "Muted is thinking…" indefinitely.
export const GEMINI_TIMEOUT_MS = 15_000;
