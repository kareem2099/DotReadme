# Change Log

All notable changes to the "dotreadme" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.1.0] - 2026-03-12

### Added

#### AI-Powered Features (BYOK)
- **Rewrite for Clarity** — Select any README section and let AI rewrite it for simplicity and readability
- **Rewrite for Tone** — Choose between Professional, Concise, or Clear & Simple rewrites
- **Generate Missing Section** — AI generates complete sections (Installation, Usage, FAQ, Roadmap, and more) from your project context
- **Multi-Provider Support** — Works with Anthropic Claude, OpenAI GPT, and Google Gemini
- **BYOK Security** — API keys stored in VS Code's secret storage (`secret: true`), never hard-coded
- **Section Context Detection** — AI automatically detects the nearest `##` heading to provide smarter rewrites
- **Right-click submenu** — `DotReadme AI` context menu available directly in the editor

#### TOC Generator
- **Generate Table of Contents** — Scans all `##`, `###`, `####` headings and builds a linked TOC
- **Auto-update** — Re-running the command updates the existing TOC in place using `<!-- TOC-START -->` / `<!-- TOC-END -->` markers
- **Smart insertion** — Places TOC after the first H1 heading automatically
- **Code block awareness** — Skips headings inside fenced code blocks
- **GitHub-compatible slugs** — Generates correct anchor links matching GitHub's slug format

### Improved
- **PathFixer** — Fixed double-pass bug where images were incorrectly re-processed as links; now uses a single-pass regex for reliability
- **HtmlGenerator** — Fixed CSP policy to allow dynamic inline styles from the audit score panel
- **insertBadgeCommand** — Added safety guard to prevent inserting `undefined` if badge detail is missing
- **repoUtils** — Branch auto-detection from `.git/HEAD` instead of hardcoded `'main'`
- **AI Architecture** — Refactored to Strategy Pattern: each provider (`anthropic.ts`, `openai.ts`, `gemini.ts`) is isolated. Adding a new provider requires only one new file
- **AiService** — Single shared instance created in `activate()` and passed to all commands, avoiding repeated instantiation

### Technical
- New folder `src/ai/` with `types.ts`, `index.ts`, and `providers/` directory
- All AI HTTP calls use Node.js built-in `https` module — no new dependencies added
- `AiService` reads configuration lazily from `vscode.workspace.getConfiguration`

---

## [1.0.0] - 2026-01-23

### Added
- **Real-time README Simulator** - Preview documentation across GitHub, VS Code Marketplace, and Open VSX platforms
- **Instant Quality Audit** - Comprehensive scoring system (A+ to F) with 12 quality criteria
- **Smart Path Fixer** - Auto-detect GitHub repositories and convert relative paths to absolute URLs
- **Badge Inserter** - Dynamic badge insertion with repository detection
- **Activity Bar Integration** - Quick access panel in VS Code sidebar
- **Multi-Platform Theme Support** - Marketplace, GitHub, and Open VSX themes
- **Keyboard Shortcuts** - Ctrl+1,2,3 for theme switching
- **Live Updates** - Real-time preview as you type
- **Secure Webview** - CSP protection and memory leak prevention
- **Responsive Design** - Works with different screen sizes
- **HTML + Markdown Support** - Recognizes both syntaxes in audits
- **Context Menus** - Right-click actions in editor
- **Intelligent Suggestions** - Specific improvement recommendations

### Technical Features
- **Clean Architecture** - Modular, maintainable codebase
- **TypeScript** - Full type safety and IntelliSense support
- **VS Code Webview API** - Native integration with VS Code
- **Regex-based Processing** - Fast and efficient content analysis
- **State Persistence** - Remembers user preferences
- **Cross-platform Compatibility** - Works on Windows, macOS, Linux

### Quality Assurance
- **ESLint Integration** - Code quality enforcement
- **TypeScript Strict Mode** - Enhanced type checking
- **Memory Leak Prevention** - Proper resource management
- **Security Audits** - CSP and input validation

### Documentation
- **Professional README** - Complete with screenshots, badges, and examples
- **Usage Guide** - Step-by-step instructions for all features
- **Contributing Guidelines** - How to contribute to the project