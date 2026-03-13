import * as vscode from 'vscode';
import { ReadmeAuditor } from '../services/ReadmeAuditor';

export async function auditReadmeCommand(context: vscode.ExtensionContext): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
        vscode.window.showErrorMessage('❌ No active editor found.');
        return;
    }

    if (editor.document.languageId !== 'markdown') {
        vscode.window.showWarningMessage('⚠️ Please open a Markdown file first!');
        return;
    }

    // Get the markdown content
    const content = editor.document.getText();
    
    // Run the audit
    const result = ReadmeAuditor.audit(content);
    const grade = ReadmeAuditor.getGrade(result.percentage);

    // Show quick result in notification
    const message = `${grade.emoji} README Score: ${result.percentage}% (${grade.grade}) - ${result.score}/${result.maxScore} points`;
    
    const action = await vscode.window.showInformationMessage(message, 'View Details', 'Dismiss');
    
    if (action === 'View Details') {
        showDetailedAudit(result, context);
    }
}

function showDetailedAudit(result: ReturnType<typeof ReadmeAuditor.audit>, context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'readmeAudit',
        '📊 README Audit Report',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
        }
    );

    const htmlReport = ReadmeAuditor.generateHtmlReport(result);
    const grade = ReadmeAuditor.getGrade(result.percentage);
    
    // Get proper CSS URI
    const cssUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'media', 'simulator.css')
    );

    panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>README Audit Report</title>
        <link href="${cssUri}" rel="stylesheet">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: #f6f8fa;
                padding: 20px;
                color: #24292f;
            }
            h1 {
                text-align: center;
                color: #24292f;
                margin-bottom: 30px;
                font-size: 2em;
            }
            .audit-report { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .audit-header { 
                text-align: center; 
                margin-bottom: 30px; 
            }
            .audit-score {
                display: inline-block;
                padding: 24px;
                border: 3px solid ${grade.color};
                border-radius: 12px;
                text-align: center;
                background: white;
            }
            .score-emoji { 
                font-size: 3em; 
                display: block; 
                margin-bottom: 10px;
            }
            .score-value { 
                font-size: 3em; 
                font-weight: bold; 
                margin: 10px 0; 
                color: #24292f;
            }
            .score-grade { 
                font-size: 1.8em; 
                font-weight: bold; 
                color: ${grade.color};
                margin-bottom: 5px;
            }
            .score-text { 
                font-size: 0.95em; 
                color: #656d76; 
            }
            .audit-section { 
                margin: 25px 0; 
            }
            .audit-section h3 { 
                color: #24292f; 
                margin-bottom: 15px;
                font-size: 1.3em;
            }
            .audit-section ul { 
                list-style: none;
                padding: 0;
            }
            .audit-section li { 
                background: #f6f8fa;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 8px;
                border-left: 3px solid #0969da;
            }
            .audit-section li strong {
                display: block;
                margin-bottom: 5px;
                color: #24292f;
            }
            .audit-section li p {
                margin: 5px 0 0 0;
                color: #656d76;
                font-size: 0.95em;
            }
            .points { 
                float: right;
                background: #0969da;
                color: white;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.85em;
                font-weight: bold;
            }
            .audit-perfect {
                text-align: center;
                padding: 40px;
                background: #dff6dd;
                border-radius: 10px;
                font-size: 1.3em;
                color: #1a7f37;
                font-weight: 600;
            }
            .audit-details { 
                margin-top: 25px;
                background: #f6f8fa;
                padding: 20px;
                border-radius: 8px;
            }
            .audit-details summary {
                cursor: pointer;
                font-weight: 600;
                color: #24292f;
                font-size: 1.1em;
                user-select: none;
            }
            .audit-details ul {
                list-style: none;
                padding: 0;
                margin-top: 15px;
            }
            .audit-details li {
                padding: 10px 0;
                border-bottom: 1px solid #d0d7de;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .audit-details li:last-child {
                border-bottom: none;
            }
            .check-pass { 
                color: #1a7f37; 
                font-weight: bold; 
                margin-right: 8px;
            }
            .points-earned { 
                background: rgba(26, 127, 55, 0.1);
                color: #1a7f37;
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 0.85em;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <h1>📊 README Quality Audit</h1>
        ${htmlReport}
    </body>
    </html>`;
}