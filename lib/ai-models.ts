/**
 * AI Model configurations - shared between client and server
 *
 * This file should NOT import any server-only modules (like Prisma)
 * so it can be safely used in client components.
 */

// Fallback model priority order
export const AI_MODELS = [
  "openai/gpt-oss-20b:free", // Primary - current model
  "google/gemini-2.0-flash-exp:free", // Fallback 1 - reliable
  "meta-llama/llama-3.2-3b-instruct:free", // Fallback 2
  "mistralai/mistral-7b-instruct:free", // Fallback 3
] as const;

export type AIModel = (typeof AI_MODELS)[number];
