import * as vscode from 'vscode';
import { getRepoInfo } from '../utils/repoUtils';

export class PathFixer {

    // 1. The Main Trigger (Called from Command)
    public static async fix() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { 
            vscode.window.showErrorMessage("❌ No active Markdown file found!");
            return; 
        }

        const document = editor.document;
        
        // 2. Auto-detect User/Repo from package.json
        const repoInfo = await getRepoInfo(document.uri);
        
        if (!repoInfo) {
            // If detection fails, ask user manually? Or show error.
            vscode.window.showErrorMessage("❌ Could not find 'repository' in package.json. Please check your file.");
            return;
        }

        const { user, repo, branch } = repoInfo;

        // 3. Apply the Fix Logic
        const originalText = document.getText();
        const fixedText = this.fixRelativePaths(originalText, user, repo, branch);

        if (originalText === fixedText) {
            vscode.window.showInformationMessage("✨ No relative paths found to fix.");
            return;
        }

        // 4. Write changes to editor
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(originalText.length)
        );

        editor.edit(editBuilder => {
            editBuilder.replace(fullRange, fixedText);
        });

        vscode.window.showInformationMessage(`✅ Fixed paths for ${user}/${repo}!`);
    }

    // 🔥 Your Logic (Enhanced with Path Cleanup)
    public static fixRelativePaths(markdownContent: string, repoUser: string, repoName: string, branch: string = 'main'): string {
        const patterns = [
            // Images: ![alt](path) -> raw.githubusercontent.com
            /\!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
            // Links: [text](path) -> github.com/.../blob
            /\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g
        ];

        let fixedContent = markdownContent;

        patterns.forEach(pattern => {
            fixedContent = fixedContent.replace(pattern, (match, altOrText, rawPath) => {
                // Ignore #anchors or absolute links
                if (rawPath.startsWith('#') || rawPath.startsWith('http')) {
                    return match;
                }

                // 🧹 CLEANUP: Remove './' or '/' from start of path
                // Example: ./images/logo.png -> images/logo.png
                const cleanPath = rawPath.replace(/^(\.\/|\/)/, '');

                const isImage = match.startsWith('!');

                if (isImage) {
                    return `![${altOrText}](https://raw.githubusercontent.com/${repoUser}/${repoName}/${branch}/${cleanPath})`;
                } else {
                    return `[${altOrText}](https://github.com/${repoUser}/${repoName}/blob/${branch}/${cleanPath})`;
                }
            });
        });

        return fixedContent;
    }
}