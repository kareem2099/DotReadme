import * as vscode from 'vscode';
import { HtmlGenerator } from './HtmlGenerator';

/**
 * Manages the webview panel for the README Simulator.
 * Handles state updates, debouncing, and resource disposal.
 */
export class SimulatorPanel {
    public static currentPanel: SimulatorPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];
    
    // State Management
    private lastContent: string = ""; // Stores the last valid markdown content to prevent flickering
    private debounceTimer: NodeJS.Timeout | undefined; // Timer for delaying updates during typing

    /**
     * Public method to create or reveal the simulator panel.
     * Implements the Singleton pattern (only one panel at a time).
     */
    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.Beside; // Open beside the code editor

        // If panel already exists, reveal it
        if (SimulatorPanel.currentPanel) {
            SimulatorPanel.currentPanel.panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'dotreadmeSimulator',
            'DotReadme Simulator',
            column,
            {
                enableScripts: true, // Required for theme switching and interactivity
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')], // Restrict access to media folder
                retainContextWhenHidden: true // Keep state when switching tabs
            }
        );

        SimulatorPanel.currentPanel = new SimulatorPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;

        // 1. Register Lifecycle Listener
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // 2. Register Document Change Listener (Typing)
        // We use triggerUpdate() here to apply debouncing
        vscode.workspace.onDidChangeTextDocument(
            e => {
                if (e.document === vscode.window.activeTextEditor?.document) {
                    this.triggerUpdate();
                }
            },
            null,
            this.disposables
        );

        // 3. Register Editor Switch Listener
        vscode.window.onDidChangeActiveTextEditor(
            () => this.triggerUpdate(),
            null,
            this.disposables
        );

        // 4. Initial Update (Immediate render on open)
        this.update();
    }

    /**
     * Cleans up resources when the panel is closed.
     */
    public dispose() {
        SimulatorPanel.currentPanel = undefined;
        this.panel.dispose();
        
        // Clear any pending debounce timers
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    /**
     * Handles the update logic with a delay (Debounce).
     * This prevents the extension from lagging while the user is typing fast.
     */
    private triggerUpdate() {
        // Cancel the previous pending update
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Schedule a new update in 500ms (0.5 seconds)
        this.debounceTimer = setTimeout(() => {
            this.update();
        }, 500);
    }

    /**
     * The core rendering logic.
     * Generates the HTML and sends it to the webview.
     */
    private update() {
        const editor = vscode.window.activeTextEditor;

        // 1. Handle Focus Loss:
        // If the user clicks inside the simulator, 'activeTextEditor' becomes undefined.
        // We return early but DO NOT clear the view. We keep the 'lastContent'.
        if (!editor) {
            return;
        }

        // 2. Handle Non-Markdown Files:
        // If the user switches to a JS or JSON file, ignore it.
        if (editor.document.languageId !== 'markdown') {
            return;
        }

        // 3. Get Content:
        // Fetch new text from editor.
        const markdownContent = editor.document.getText();
        
        // Update our memory cache
        this.lastContent = markdownContent;

        // 4. Handle Empty State:
        // If the file is completely empty, show a friendly placeholder.
        if (!markdownContent) {
            this.panel.webview.html = HtmlGenerator.generateHtml(
                this.panel.webview,
                this.extensionUri,
                "# No Content Detected ⚠️\n\nStart typing in your Markdown file to see the magic happen!"
            );
            return;
        }

        // 5. Generate and Set HTML
        this.panel.webview.html = HtmlGenerator.generateHtml(
            this.panel.webview,
            this.extensionUri,
            markdownContent
        );
    }
}