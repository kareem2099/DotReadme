import * as vscode from 'vscode';
import { getRepoInfo } from '../utils/repoUtils';

export class PathFixer {

    // ── Public: Main Trigger (Called from Command) ────────────────────────────

    public static async fix(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('❌ No active Markdown file found!');
            return;
        }

        const document = editor.document;

        // Auto-detect User/Repo from package.json
        const repoInfo = await getRepoInfo(document.uri);

        if (!repoInfo) {
            vscode.window.showErrorMessage(
                "❌ Could not find 'repository' in package.json. Please check your file."
            );
            return;
        }

        const { user, repo, branch } = repoInfo;

        // Apply the fix
        const originalText = document.getText();
        const fixedText    = this.fixRelativePaths(originalText, user, repo, branch);

        if (originalText === fixedText) {
            vscode.window.showInformationMessage('✨ No relative paths found to fix.');
            return;
        }

        // Write changes back to the editor
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(originalText.length)
        );

        await editor.edit(editBuilder => editBuilder.replace(fullRange, fixedText));
        vscode.window.showInformationMessage(`✅ Fixed paths for ${user}/${repo}!`);
    }

    // ── Public: Core Fix Logic ────────────────────────────────────────────────

    /**
     * Converts relative image/link paths to absolute GitHub URLs.
     *
     * ✅ Single-pass regex — images and links are handled in ONE replace call.
     *    This prevents the double-pass bug where an image fixed in pass 1
     *    would be incorrectly re-processed as a link in pass 2.
     *
     * Images  → raw.githubusercontent.com  (for direct rendering)
     * Links   → github.com/.../blob/...    (for browsable file links)
     */
    public static fixRelativePaths(
        markdownContent: string,
        repoUser: string,
        repoName: string,
        branch: string = 'main'
    ): string {
        // Matches both ![alt](path) and [text](path) in a single pass.
        // Capture groups:
        //   bang       — '!' if image, '' if link
        //   altOrText  — the label inside []
        //   rawPath    — the path inside ()
        const MARKDOWN_LINK = /(!?)\[([^\]]*)\]\((?!https?:\/\/)(?!#)([^)]+)\)/g;

        return markdownContent.replace(
            MARKDOWN_LINK,
            (_match, bang: string, altOrText: string, rawPath: string) => {
                // Skip anchors and anything that already became absolute
                if (rawPath.startsWith('#') || rawPath.startsWith('http')) {
                    return _match;
                }

                // Strip leading ./ or / — e.g. ./images/logo.png → images/logo.png
                const cleanPath = rawPath.replace(/^(\.\/|\/)/, '');

                if (bang === '!') {
                    // Image → raw URL so it renders everywhere (Marketplace, GitHub, Open VSX)
                    return `![${altOrText}](https://raw.githubusercontent.com/${repoUser}/${repoName}/${branch}/${cleanPath})`;
                } else {
                    // Link → browsable blob URL
                    return `[${altOrText}](https://github.com/${repoUser}/${repoName}/blob/${branch}/${cleanPath})`;
                }
            }
        );
    }
}