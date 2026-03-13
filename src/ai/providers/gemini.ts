// ─────────────────────────────────────────────────────────────────────────────
//  DotReadme — Google Gemini Provider
// ─────────────────────────────────────────────────────────────────────────────

import { IAiProvider, AiResponse } from "../types";
import { httpsPost } from "./baseProvider";

// ── Response shape from Gemini API ───────────────────────────────────────────

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> };
  }>;
  error?: { message: string };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export class GeminiProvider implements IAiProvider {
  readonly id             = "gemini" as const;
  readonly displayName    = "Google Gemini";
  readonly apiKeySettingId = "dotreadme.ai.geminiApiKey";
  readonly defaultModel   = "gemini-2.0-flash";

  async complete(apiKey: string, prompt: string, model: string): Promise<AiResponse> {
    // Gemini authenticates via query param, not Authorization header
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const data = (await httpsPost(
      url,
      {}, // no extra headers needed
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024 },
      }
    )) as GeminiResponse;

    if (data.error) {
      return { success: false, error: `Gemini error: ${data.error.message}` };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { success: true, result: text.trim() };
  }
}