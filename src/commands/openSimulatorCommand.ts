import * as vscode from 'vscode';
import { SimulatorPanel } from '../services/SimulatorPanel';

export function openSimulatorCommand(context: vscode.ExtensionContext): void {
    const editor = vscode.window.activeTextEditor;

    // Better Check: languageId covers .md, .markdown, and Untitled files
    if (!editor || editor.document.languageId !== 'markdown') {
        vscode.window.showWarningMessage('⚠️ Please focus a Markdown file first!');
        return;
    }

    // Open the panel
    SimulatorPanel.createOrShow(context.extensionUri);
}