// 1. Initialize VS Code API
const vscode = acquireVsCodeApi();

// 🔥 FIX: Make setMode global so HTML onclick can access it
function setMode(mode) {
    // Apply theme to body
    document.body.className = `mode-${mode}`;

    // Apply theme to container (if exists)
    const container = document.getElementById('simulator-container');
    if (container) {
        container.className = `mode-${mode}`;
    }

    // Update button states
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === `btn-${mode}`) {
            btn.classList.add('active');
        }
    });

    // Save state
    vscode.setState({ mode: mode });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Restore previous state if exists
    const previousState = vscode.getState();
    if (previousState && previousState.mode) {
        setMode(previousState.mode);
    } else {
        setMode('market'); // Default
    }

    // 🔥 Attach click handlers to buttons (safer than inline onclick)
    document.getElementById('btn-market')?.addEventListener('click', () => setMode('market'));
    document.getElementById('btn-github')?.addEventListener('click', () => setMode('github'));
    document.getElementById('btn-ovsx')?.addEventListener('click', () => setMode('ovsx'));
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case '1':
                event.preventDefault();
                setMode('market');
                break;
            case '2':
                event.preventDefault();
                setMode('github');
                break;
            case '3':
                event.preventDefault();
                setMode('ovsx');
                break;
        }
    }
});