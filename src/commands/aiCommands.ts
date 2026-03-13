// ─────────────────────────────────────────────────────────────────────────────
//  DotReadme — AI Commands
//  The handlers for AI commands — imported in extension.ts
// ─────────────────────────────────────────────────────────────────────────────

import * as vscode from 'vscode';
import { AiService, RewriteIntent } from '../ai';

// ── Shared Helpers ────────────────────────────────────────────────────────────

/** Walk up from the cursor line to find the nearest ## heading */
function detectSectionHeading(
  document: vscode.TextDocument,
  fromLine: number
): string | undefined {
  for (let i = fromLine; i >= 0; i--) {
    const line = document.lineAt(i).text.trim();
    if (line.startsWith('#')) {return line.replace(/^#+\s*/, '');}
  }
  return undefined;
}

/** Run an AI call with a progress notification and apply the result to the editor */
async function applyRewrite(
  editor: vscode.TextEditor,
  intent: RewriteIntent,
  progressLabel: string,
  ai: AiService
): Promise<void> {
  if (editor.selection.isEmpty) {
    vscode.window.showWarningMessage('DotReadme: Please select the text you want to rewrite first.');
    return;
  }

  const selectedText = editor.document.getText(editor.selection);
  const context      = detectSectionHeading(editor.document, editor.selection.start.line);

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `✨ DotReadme: ${progressLabel}...`, cancellable: false },
    async () => {
      const response = await ai.rewrite({ text: selectedText, intent, context });

      if (!response.success || !response.result) {
        vscode.window.showErrorMessage(`DotReadme AI Error: ${response.error}`);
        return;
      }

      await editor.edit((eb) => eb.replace(editor.selection, response.result!));
      vscode.window.showInformationMessage('✅ DotReadme: Section rewritten successfully!');
    }
  );
}

// ── Exported Command Handlers ─────────────────────────────────────────────────

export async function rewriteForClarityCommand(editor: vscode.TextEditor, ai: AiService): Promise<void> {
  await applyRewrite(editor, 'clarity', 'Rewriting for clarity', ai);
}

export async function rewriteForToneCommand(editor: vscode.TextEditor, ai: AiService): Promise<void> {
  const options = [
    { label: '🎯 Professional', value: 'professional' as RewriteIntent },
    { label: '✂️  Concise',      value: 'concise'      as RewriteIntent },
    { label: '📖 Clear & Simple', value: 'clarity'     as RewriteIntent },
  ];

  const picked = await vscode.window.showQuickPick(options, {
    placeHolder: 'Choose the tone you want',
    title: '🎯 DotReadme: Rewrite for Tone',
  });

  if (!picked) {return;}
  await applyRewrite(editor, picked.value, `Rewriting as ${picked.label.trim()}`, ai);
}

export async function generateMissingSectionCommand(editor: vscode.TextEditor, ai: AiService): Promise<void> {
  const SECTIONS = [
    'Installation', 'Usage', 'Configuration', 'Contributing',
    'License', 'FAQ', 'Roadmap', 'Changelog', 'API Reference', 'Screenshots',
  ];

  const picked = await vscode.window.showQuickPick(SECTIONS, {
    placeHolder: 'Which section do you want to generate?',
    title: '🤖 DotReadme: Generate Missing Section',
  });

  if (!picked) {return;}

  const projectContext = editor.document.getText().slice(0, 500);

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `🤖 DotReadme: Generating "${picked}" section...`, cancellable: false },
    async () => {
      const response = await ai.generateSection(picked, projectContext);

      if (!response.success || !response.result) {
        vscode.window.showErrorMessage(`DotReadme AI Error: ${response.error}`);
        return;
      }

      // Insert at cursor, or append to end of file if cursor is at origin
      const insertAt = editor.selection.active.isEqual(new vscode.Position(0, 0))
        ? new vscode.Position(editor.document.lineCount, 0)
        : editor.selection.active;

      await editor.edit((eb) => eb.insert(insertAt, `\n\n${response.result}\n`));
      vscode.window.showInformationMessage(`✅ DotReadme: "${picked}" section generated!`);
    }
  );
}