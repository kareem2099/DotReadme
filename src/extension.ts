import * as vscode from 'vscode';
import { openSimulatorCommand } from './commands/openSimulatorCommand';
import { fixPathsCommand } from './commands/fixPathsCommand';
import { insertBadgeCommand } from './commands/insertBadgeCommand';
import { auditReadmeCommand } from './commands/auditReadmeCommand';

export function activate(context: vscode.ExtensionContext) {
	console.log('🚀 DotReadme is now active!');

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
}

export function deactivate() {}