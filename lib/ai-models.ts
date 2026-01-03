/**
 * AI Model configurations - shared between client and server
 *
 * This file should NOT import any server-only modules (like Prisma)
 * so it can be safely used in client components.
 */

// Fallback model priority order
export const AI_MODELS = [
  "google:gemini-2.5-flash-lite", // Primary - Google Direct
  "openai/gpt-oss-20b:free", // Fallback 1 - OpenRouter
  "google/gemini-2.0-flash-exp:free", // Fallback 2 - OpenRouter
] as const;

export type AIModel = (typeof AI_MODELS)[number];
