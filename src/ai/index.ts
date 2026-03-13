// ─────────────────────────────────────────────────────────────────────────────
//  DotReadme — AI Service (Orchestrator)
//
//  This is the "conductor" of the orchestra. It doesn't handle any HTTP code.
//  Its job is only:
//    1. Read user settings
//    2. Choose the appropriate Provider
//    3. Build the Prompt
//    4. Send to the Provider and return the Response
//
//  To add a new Provider:
//    1. Create a new file in providers/
//    2. Add it to PROVIDERS_REGISTRY here
//    3. That's it — nothing else needs to change
// ─────────────────────────────────────────────────────────────────────────────

import * as vscode from "vscode";
import { AiProvider, AiRequestOptions, AiResponse, IAiProvider } from "./types";
import { buildPrompt, buildSectionPrompt } from "./providers/baseProvider";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAiProvider }    from "./providers/openai";
import { GeminiProvider }    from "./providers/gemini";

// ── Provider Registry ─────────────────────────────────────────────────────────
// To add a new Provider: create an instance here and that's it

const PROVIDERS_REGISTRY: Record<AiProvider, IAiProvider> = {
  anthropic: new AnthropicProvider(),
  openai:    new OpenAiProvider(),
  gemini:    new GeminiProvider(),
};

// ── AiService ─────────────────────────────────────────────────────────────────

export class AiService {
  private readonly config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration("dotreadme.ai");
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /** Rewrite a selected block of Markdown with the given intent. */
  async rewrite(options: AiRequestOptions): Promise<AiResponse> {
    const { provider, key } = this.resolveProvider();
    if (!key) {return this.missingKeyError(provider);}

    const prompt = buildPrompt(options);
    return this.dispatch(provider, key, prompt);
  }

  /** Generate content for a missing README section. */
  async generateSection(
    sectionName: string,
    projectContext: string
  ): Promise<AiResponse> {
    const { provider, key } = this.resolveProvider();
    if (!key) {return this.missingKeyError(provider);}

    const prompt = buildSectionPrompt(sectionName, projectContext);
    return this.dispatch(provider, key, prompt);
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  /** Read provider from settings and resolve its API key. */
  private resolveProvider(): { provider: IAiProvider; key: string } {
    const providerId = this.config.get<AiProvider>("provider") ?? "anthropic";
    const provider   = PROVIDERS_REGISTRY[providerId];
    const key        = (this.config.get<string>(
      // strip "dotreadme.ai." prefix since we're already scoped to that namespace
      provider.apiKeySettingId.replace("dotreadme.ai.", "")
    ) ?? "").trim();

    return { provider, key };
  }

  /** Get the model to use: user override → provider default. */
  private resolveModel(provider: IAiProvider): string {
    const override = (this.config.get<string>("model") ?? "").trim();
    return override || provider.defaultModel;
  }

  /** Dispatch the request to the correct provider and handle errors uniformly. */
  private async dispatch(
    provider: IAiProvider,
    key: string,
    prompt: string
  ): Promise<AiResponse> {
    try {
      const model = this.resolveModel(provider);
      return await provider.complete(key, prompt, model);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `[${provider.displayName}] Request failed: ${message}` };
    }
  }

  /** Uniform "missing key" error that points the user to the right setting. */
  private missingKeyError(provider: IAiProvider): AiResponse {
    return {
      success: false,
      error:
        `No API key found for ${provider.displayName}. ` +
        `Please add your key in Settings → "${provider.apiKeySettingId}".`,
    };
  }
}

// ── Re-export types for consumers ────────────────────────────────────────────
export * from "./types";