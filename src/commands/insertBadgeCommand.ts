import * as vscode from 'vscode';
import { getRepoInfo } from '../utils/repoUtils';

export async function insertBadgeCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('❌ No active editor found.');
        return;
    }

    // 1. Get Real Repo Data (Magic! 🎩)
    const repoInfo = await getRepoInfo(editor.document.uri);
    
    // Default fallback if we can't find repo info
    const user = repoInfo?.user || 'user';
    const repo = repoInfo?.repo || 'repo';

    // 2. Dynamic Options (Pre-filled with real data)
    const badgeOptions = [
        { 
            label: '$(law) License Badge', 
            description: 'MIT License', 
            detail: '![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)' 
        },
        {
            label: '$(beaker) Build Status',
            description: 'GitHub Actions',
            // Note: here we used the user and repo variables
            detail: `![Build Status](https://img.shields.io/github/actions/workflow/status/${user}/${repo}/ci.yml)`
        },
        { 
            label: '$(package) Version Badge', 
            description: 'Marketplace Version', 
            detail: `![Version](https://img.shields.io/visual-studio-marketplace/v/${user}.${repo})` 
        },
        { 
            label: '$(cloud-download) Installs Badge', 
            description: 'Total Downloads', 
            detail: `![Installs](https://img.shields.io/visual-studio-marketplace/i/${user}.${repo})` 
        },
        {
            label: '$(pencil) Custom Badge',
            description: 'Write your own markdown',
            detail: 'CUSTOM' // Flag to recognize it below
        }
    ];

    // 3. Show Menu
    const selected = await vscode.window.showQuickPick(badgeOptions, {
        placeHolder: `Insert a badge for ${user}/${repo} 🛡️`
    });

    if (!selected) {return;}

    let badgeMarkdown = selected.detail;

    // 4. Handle Custom Case
    if (badgeMarkdown === 'CUSTOM') {
        const input = await vscode.window.showInputBox({
            prompt: 'Enter badge Markdown',
            placeHolder: '![alt](https://img.shields.io/...)'
        });
        if (!input) {return;}
        badgeMarkdown = input;
    }

    // 5. Insert
    editor.edit(editBuilder => {
        // If no selection, put it at cursor
        // If there is selection, replace it
        if (editor.selection.isEmpty) {
            editBuilder.insert(editor.selection.active, badgeMarkdown!);
        } else {
            editBuilder.replace(editor.selection, badgeMarkdown!);
        }
    });
}