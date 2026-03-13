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
    if (!folder) { return null; }

    const root = folder.uri.fsPath;

    // 2. Check package.json
    const packageJsonPath = path.join(root, 'package.json');
    if (!fs.existsSync(packageJsonPath)) { return null; }

    try {
        const pkg      = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const repoUrl  = pkg.repository?.url || pkg.repository;

        if (!repoUrl) { return null; }

        // Matches: github.com/user/repo OR github.com:user/repo.git
        const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+)/);
        if (!match) { return null; }

        return {
            user:   match[1],
            repo:   match[2].replace(/\.git$/, ''),
            branch: detectBranch(root),
        };
    } catch (error) {
        console.error('DotReadme: Error reading package.json:', error);
        return null;
    }
}

// ── Branch Detection ──────────────────────────────────────────────────────────

/**
 * Reads the current branch from .git/HEAD.
 * Format: "ref: refs/heads/main" → "main"
 * Falls back to 'main' if the file is missing or in detached HEAD state.
 */
function detectBranch(repoRoot: string): string {
    try {
        const headPath = path.join(repoRoot, '.git', 'HEAD');
        if (!fs.existsSync(headPath)) { return 'main'; }

        const headContent = fs.readFileSync(headPath, 'utf8').trim();

        // Normal branch: "ref: refs/heads/my-branch"
        const match = headContent.match(/^ref: refs\/heads\/(.+)$/);
        if (match) { return match[1]; }

        // Detached HEAD (commit hash) — fall back to master
        return 'master';
    } catch {
        return 'master';
    }
}