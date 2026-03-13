// ─────────────────────────────────────────────────────────────────────────────
//  DotReadme — Anthropic Provider (Claude)
// ─────────────────────────────────────────────────────────────────────────────

import { IAiProvider, AiResponse } from "../types";
import { httpsPost } from "./baseProvider";

// ── Response shape from Anthropic API ────────────────────────────────────────

interface AnthropicResponse {
  content?: Array<{ type: string; text: string }>;
  error?:   { message: string };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export class AnthropicProvider implements IAiProvider {
  readonly id             = "anthropic" as const;
  readonly displayName    = "Anthropic (Claude)";
  readonly apiKeySettingId = "dotreadme.ai.anthropicApiKey";
  readonly defaultModel   = "claude-sonnet-4-20250514";

  async complete(apiKey: string, prompt: string, model: string): Promise<AiResponse> {
    const data = (await httpsPost(
      "https://api.anthropic.com/v1/messages",
      {
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
      },
      {
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }
    )) as AnthropicResponse;

    if (data.error) {
      return { success: false, error: `Anthropic error: ${data.error.message}` };
    }

    const text = data.content?.find((b) => b.type === "text")?.text ?? "";
    return { success: true, result: text.trim() };
  }
}