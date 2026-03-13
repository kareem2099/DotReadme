// ─────────────────────────────────────────────────────────────────────────────
//  DotReadme — AI Types & Interfaces
//  all types related to AI providers, intents, request/response formats, and the provider interface contract.
// ─────────────────────────────────────────────────────────────────────────────

// ── Providers ────────────────────────────────────────────────────────────────

export type AiProvider = "anthropic" | "openai" | "gemini";

// ── Intents ──────────────────────────────────────────────────────────────────

export type RewriteIntent = "clarity" | "tone" | "concise" | "professional";

export const INTENT_PROMPTS: Record<RewriteIntent, string> = {
  clarity:
    "Rewrite the following README section to be clearer and easier to understand. " +
    "Keep the same meaning. Use simple, direct language. Return only the rewritten Markdown.",

  tone:
    "Rewrite the following README section with a more professional and engaging tone. " +
    "Keep the same meaning and structure. Return only the rewritten Markdown.",

  concise:
    "Make the following README section more concise. " +
    "Remove redundancy and unnecessary words. Return only the rewritten Markdown.",

  professional:
    "Rewrite the following README section so it sounds polished and professional, " +
    "as if written by a senior open-source maintainer. Return only the rewritten Markdown.",
};

// ── Request / Response ────────────────────────────────────────────────────────

export interface AiRequestOptions {
  text: string;
  intent: RewriteIntent;
  context?: string; // e.g. the nearest "## Heading" above the selection
}

export interface AiResponse {
  success: boolean;
  result?: string;
  error?: string;
}

// ── Provider Interface (Strategy Pattern) ────────────────────────────────────

/**
 * Every AI provider MUST implement this interface.
 * Adding a new provider = creating a new class that satisfies this contract.
 */
export interface IAiProvider {
  /** The unique identifier for this provider (matches AiProvider type). */
  readonly id: AiProvider;

  /** Human-readable name shown in error messages and notifications. */
  readonly displayName: string;

  /** The VS Code setting key where the user stores their API key. */
  readonly apiKeySettingId: string;

  /** Default model to use when the user hasn't specified an override. */
  readonly defaultModel: string;

  /**
   * Send a prompt to the provider's API and return the raw text result.
   * @param apiKey  - The user's API key (already validated before this call).
   * @param prompt  - The fully-built prompt string.
   * @param model   - The model to use (default or user override).
   */
  complete(apiKey: string, prompt: string, model: string): Promise<AiResponse>;
}