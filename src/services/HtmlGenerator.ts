import * as vscode from 'vscode';
import MarkdownIt from 'markdown-it';
import { ReadmeAuditor } from './ReadmeAuditor';

export class HtmlGenerator {

    private static md = new MarkdownIt({
        html:        true,
        linkify:     true,
        typographer: true,
    });

    public static generateHtml(
        webview: vscode.Webview,
        extensionUri: vscode.Uri,
        markdownContent: string
    ): string {
        // 1. Convert Markdown → HTML
        const renderedHtml = this.md.render(markdownContent);

        // 2. Run audit and generate the score panel HTML
        const auditResult = ReadmeAuditor.audit(markdownContent);
        const auditHtml   = ReadmeAuditor.generateHtmlReport(auditResult);

        // 3. Safe URIs for local assets
        const styleUri  = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'simulator.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'simulator.js'));

        // 4. Nonce for inline scripts
        const nonce = this.getNonce();

        // ── CSP note ──────────────────────────────────────────────────────────
        // 'unsafe-inline' is required for style-src because ReadmeAuditor
        // injects dynamic inline styles (e.g. border-color, color) that carry
        // the live grade color (#00d26a, #ff4444, …).
        // Removing it would break the colored score card in the audit panel.
        // Scripts are still nonce-locked — no 'unsafe-inline' there.
        // ─────────────────────────────────────────────────────────────────────
        const csp = [
            `default-src 'none'`,
            `style-src ${webview.cspSource} 'unsafe-inline'`,
            `img-src ${webview.cspSource} https:`,
            `script-src 'nonce-${nonce}'`,
        ].join('; ');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <link href="${styleUri}" rel="stylesheet">
    <title>DotReadme Simulator</title>
</head>
<body class="mode-market">

    <div class="toolbar">
        <div class="brand">
            <span class="icon">🚀</span> <strong>DotReadme</strong>
        </div>
        <div class="actions">
            <button id="btn-market" class="mode-btn active">Marketplace</button>
            <button id="btn-github" class="mode-btn">GitHub</button>
            <button id="btn-ovsx"   class="mode-btn">Open VSX</button>
        </div>
    </div>

    <!-- Live Quality Score Panel -->
    <div id="audit-panel">
        ${auditHtml}
    </div>

    <div id="simulator-container">
        <div class="markdown-body">
            ${renderedHtml}
        </div>
    </div>

    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private static getNonce(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let nonce   = '';
        for (let i = 0; i < 32; i++) {
            nonce += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return nonce;
    }
}