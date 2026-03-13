import * as vscode from 'vscode';
import { openSimulatorCommand }  from './commands/openSimulatorCommand';
import { fixPathsCommand }        from './commands/fixPathsCommand';
import { insertBadgeCommand }     from './commands/insertBadgeCommand';
import { auditReadmeCommand }     from './commands/auditReadmeCommand';
import { rewriteForClarityCommand, rewriteForToneCommand, generateMissingSectionCommand } from './commands/aiCommands';
import { tocCommand }             from './commands/tocCommand';
import { AiService }              from './ai';

export function activate(context: vscode.ExtensionContext) {
	console.log('🚀 DotReadme is now active!');

	// Single shared instance — created once, reused across all AI commands
	const aiService = new AiService();

	// 1. Register Simulator Command
	context.subscriptions.push(
		vscode.commands.registerCommand('dotreadme.openSimulator', () => openSimulatorCommand(context))
	);

	// 2. Register Fix Paths Command
	context.subscriptions.push(
		vscode.commands.registerCommand('dotreadme.fixRelativePaths', () => fixPathsCommand())
	);

	// 3. Register Badge Inserter Command
	context.subscriptions.push(
		vscode.commands.registerCommand('dotreadme.insertBadge', () => insertBadgeCommand())
	);

	// 4. Register Audit Command
	context.subscriptions.push(
		vscode.commands.registerCommand('dotreadme.auditReadme', () => auditReadmeCommand(context))
	);

	// 5. Register TOC Command
	context.subscriptions.push(
		vscode.commands.registerCommand('dotreadme.generateToc', () => tocCommand())
	);

	// 6. Register AI Commands
	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand('dotreadme.rewriteForClarity', (editor) => rewriteForClarityCommand(editor, aiService))
	);

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand('dotreadme.rewriteForTone', (editor) => rewriteForToneCommand(editor, aiService))
	);

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand('dotreadme.generateMissingSection', (editor) => generateMissingSectionCommand(editor, aiService))
	);
}

export function deactivate() {}