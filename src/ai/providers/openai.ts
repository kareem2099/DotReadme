// ─────────────────────────────────────────────────────────────────────────────
//  DotReadme — OpenAI Provider (GPT)
// ─────────────────────────────────────────────────────────────────────────────

import { IAiProvider, AiResponse } from "../types";
import { httpsPost } from "./baseProvider";

// ── Response shape from OpenAI API ───────────────────────────────────────────

interface OpenAiResponse {
  choices?: Array<{ message: { content: string } }>;
  error?:   { message: string };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export class OpenAiProvider implements IAiProvider {
  readonly id             = "openai" as const;
  readonly displayName    = "OpenAI (GPT)";
  readonly apiKeySettingId = "dotreadme.ai.openaiApiKey";
  readonly defaultModel   = "gpt-4o";

  async complete(apiKey: string, prompt: string, model: string): Promise<AiResponse> {
    const data = (await httpsPost(
      "https://api.openai.com/v1/chat/completions",
      {
        Authorization: `Bearer ${apiKey}`,
      },
      {
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }
    )) as OpenAiResponse;

    if (data.error) {
      return { success: false, error: `OpenAI error: ${data.error.message}` };
    }

    const text = data.choices?.[0]?.message?.content ?? "";
    return { success: true, result: text.trim() };
  }
}