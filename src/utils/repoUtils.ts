import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface RepoInfo {
    user: string;
    repo: string;
    branch: string;
}

export async function getRepoInfo(uri: vscode.Uri): Promise<RepoInfo | null> {
    // 1. Get Workspace Folder
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    if (!folder) {return null;}

    // 2. Check package.json
    const packageJsonPath = path.join(folder.uri.fsPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {return null;}

    try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const repoUrl = pkg.repository?.url || pkg.repository; 

        if (!repoUrl) {return null;}

        // 🔥 FIX: Regex updated to handle repo names with dots (e.g. "node.js")
        // Matches: github.com/user/repo OR github.com:user/repo.git
        const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+)/);

        if (!match) {return null;}

        return {
            user: match[1],
            // Remove .git from the end if present (cleaner than regex)
            repo: match[2].replace(/\.git$/, ''), 
            branch: 'main' // MVP: Default to main (later we can detect via .git/HEAD)
        };
    } catch (error) {
        console.error('Error reading package.json:', error);
        return null;
    }
}