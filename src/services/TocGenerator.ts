// ─────────────────────────────────────────────────────────────────────────────
//  DotReadme — TOC Generator Service
//  Reads headings from Markdown and generates Table of Contents
// ─────────────────────────────────────────────────────────────────────────────

export interface TocEntry {
    level: number;   // 2 = ##, 3 = ###, 4 = ####
    text:  string;   // "Getting Started"
    slug:  string;   // "getting-started"
}

export interface TocResult {
    toc:         string;   // The Markdown ready for insertion
    entriesCount: number;
    inserted:    boolean;  // true if a TOC already existed and was updated
}

// ── Markers ───────────────────────────────────────────────────────────────────
// We place the TOC between markers so we can update it later without breaking the rest of the file
const TOC_START = '<!-- TOC-START -->';
const TOC_END   = '<!-- TOC-END -->';

export class TocGenerator {

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Generates the TOC and places it in the Markdown.
     * - If no TOC exists: places it after the H1 heading
     * - If a TOC exists (between markers): updates it in the same location
     */
    public static generate(markdownContent: string): TocResult {
        const entries = this.extractHeadings(markdownContent);

        if (entries.length === 0) {
            return { toc: '', entriesCount: 0, inserted: false };
        }

        const tocBlock = this.buildTocBlock(entries);

        // If a TOC exists → update it in place
        if (this.hasToc(markdownContent)) {
            return {
                toc:          this.replaceToc(markdownContent, tocBlock),
                entriesCount: entries.length,
                inserted:     true,
            };
        }

        // No TOC → place it after H1 (or at the beginning if no H1)
        return {
            toc:          this.insertToc(markdownContent, tocBlock),
            entriesCount: entries.length,
            inserted:     false,
        };
    }

    // ── Private: Extraction ───────────────────────────────────────────────────

    /**
     * Extracts all headings from level ## and below.
     * Ignores H1 headings (project title) as they're not needed in the TOC.
     * Ignores any heading inside code blocks.
     */
    private static extractHeadings(content: string): TocEntry[] {
        const entries: TocEntry[] = [];
        const lines               = content.split('\n');
        let inCodeBlock           = false;

        for (const line of lines) {
            // track code blocks so we don't include headings inside them
            if (line.trimStart().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }
            if (inCodeBlock) { continue; }

            const match = line.match(/^(#{2,4})\s+(.+)/);
            if (!match) { continue; }

            const level = match[1].length;
            const text  = match[2].trim();

            entries.push({ level, text, slug: this.toSlug(text) });
        }

        return entries;
    }

    // ── Private: Slug Builder ─────────────────────────────────────────────────

    /**
     * Converts heading text to GitHub-compatible anchor slug.
     * "Getting Started 🚀" → "getting-started-"  (GitHub ignores emojis)
     * "API Reference"      → "api-reference"
     */
    private static toSlug(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')   // remove anything that's not letters/numbers/spaces
            .trim()
            .replace(/\s+/g, '-')       // spaces → hyphens
            .replace(/-+/g, '-');       // multiple hyphens → one
    }

    // ── Private: TOC Block Builder ────────────────────────────────────────────

    private static buildTocBlock(entries: TocEntry[]): string {
        const lines: string[] = [];

        lines.push('## 📋 Table of Contents');
        lines.push('');

        for (const entry of entries) {
            // ## → no indent, ### → 2 spaces, #### → 4 spaces
            const indent = '  '.repeat(entry.level - 2);
            lines.push(`${indent}- [${entry.text}](#${entry.slug})`);
        }

        lines.push('');

        return [TOC_START, '', ...lines, TOC_END].join('\n');
    }

    // ── Private: Insert / Replace Helpers ────────────────────────────────────

    private static hasToc(content: string): boolean {
        return content.includes(TOC_START);
    }

    private static replaceToc(content: string, tocBlock: string): string {
        const startIdx = content.indexOf(TOC_START);
        const endIdx   = content.indexOf(TOC_END);

        if (startIdx === -1 || endIdx === -1) { return content; }

        return (
            content.slice(0, startIdx).trimEnd() +
            '\n\n' + tocBlock + '\n\n' +
            content.slice(endIdx + TOC_END.length).trimStart()
        );
    }

    /** Places the TOC after the first H1 heading, or at the beginning if no H1 exists */
    private static insertToc(content: string, tocBlock: string): string {
        const lines    = content.split('\n');
        const h1Index  = lines.findIndex(l => /^#\s+/.test(l));

        if (h1Index === -1) {
            // No H1 → place TOC at the beginning
            return tocBlock + '\n\n' + content;
        }

        // Place TOC after H1 + any empty line immediately following it
        let insertAfter = h1Index;
        while (insertAfter + 1 < lines.length && lines[insertAfter + 1].trim() === '') {
            insertAfter++;
        }

        lines.splice(insertAfter + 1, 0, '', tocBlock, '');
        return lines.join('\n');
    }
}