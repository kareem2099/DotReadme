import * as vscode from 'vscode';
import { TocGenerator } from '../services/TocGenerator';

export async function tocCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('❌ No active editor found.');
        return;
    }

    if (editor.document.languageId !== 'markdown') {
        vscode.window.showWarningMessage('⚠️ Please open a Markdown file first!');
        return;
    }

    const originalContent = editor.document.getText();
    const result          = TocGenerator.generate(originalContent);

    if (result.entriesCount === 0) {
        vscode.window.showWarningMessage(
            '⚠️ No headings found (##, ###) to build a Table of Contents.'
        );
        return;
    }

    // Replace the entire document content with the updated version
    const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(originalContent.length)
    );

    await editor.edit(editBuilder => editBuilder.replace(fullRange, result.toc));

    const action = result.inserted ? 'updated' : 'inserted';
    vscode.window.showInformationMessage(
        `✅ DotReadme: TOC ${action} with ${result.entriesCount} entries!`
    );
}