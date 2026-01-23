import * as vscode from 'vscode';
import MarkdownIt from 'markdown-it';
import { ReadmeAuditor } from './ReadmeAuditor';

export class HtmlGenerator {
    
    private static md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true
    });

    public static generateHtml(webview: vscode.Webview, extensionUri: vscode.Uri, markdownContent: string): string {
        // 1. Convert Markdown to HTML
        const renderedHtml = this.md.render(markdownContent);

        // 🔥 NEW: Run Audit
        const auditResult = ReadmeAuditor.audit(markdownContent);
        const auditHtml = ReadmeAuditor.generateHtmlReport(auditResult);

        // 2. Get Safe URIs for Assets
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'simulator.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'simulator.js'));

        // 3. Content Security Policy
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

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
                    <button id="btn-ovsx" class="mode-btn">Open VSX</button>
                </div>
            </div>

            <!-- 🔥 NEW: Quality Score Panel -->
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

    private static getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}