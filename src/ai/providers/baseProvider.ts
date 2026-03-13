// ─────────────────────────────────────────────────────────────────────────────
//  DotReadme — Base Provider
//  all shared logic for AI providers: prompt building, HTTPS requests, and the provider interface contract.
// ─────────────────────────────────────────────────────────────────────────────

import * as https from "https";
import { AiRequestOptions, INTENT_PROMPTS } from "../types";

// ── HTTPS Helper ─────────────────────────────────────────────────────────────

/**
 * Minimal HTTPS POST — no external dependencies (uses Node built-in).
 * Returns parsed JSON or throws on network/parse errors.
 */
export function httpsPost(
  url: string,
  headers: Record<string, string>,
  body: unknown
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsed  = new URL(url);

    const req = https.request(
      {
        hostname: parsed.hostname,
        path:     parsed.pathname + parsed.search,
        method:   "POST",
        headers:  {
          "Content-Type":   "application/json",
          "Content-Length": Buffer.byteLength(payload),
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Failed to parse API response: ${data}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// ── Prompt Builder ────────────────────────────────────────────────────────────

/**
 * Builds the final prompt string from an AiRequestOptions object.
 * Shared by all providers — keeps prompts consistent.
 */
export function buildPrompt(options: AiRequestOptions): string {
  const instruction = INTENT_PROMPTS[options.intent];
  const contextLine = options.context
    ? `This text belongs to the section: "${options.context}".\n\n`
    : "";

  return (
    `${instruction}\n\n` +
    `${contextLine}` +
    `--- Original Markdown ---\n` +
    `${options.text}\n` +
    `--- End ---`
  );
}

/**
 * Builds the prompt for generating a missing section.
 * Shared by all providers.
 */
export function buildSectionPrompt(
  sectionName: string,
  projectContext: string
): string {
  return (
    `You are a technical writing assistant. ` +
    `Generate a complete and well-written "## ${sectionName}" section for a README file.\n\n` +
    `Project context:\n${projectContext}\n\n` +
    `Return only the Markdown for this section — no extra commentary.`
  );
}