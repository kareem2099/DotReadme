import * as vscode from 'vscode';

export interface AuditRule {
    name: string;
    check: (content: string) => boolean;
    points: number;
    suggestion: string;
    category: 'structure' | 'content' | 'best-practices';
}

export interface AuditResult {
    score: number;
    maxScore: number;
    percentage: number;
    passedRules: AuditRule[];
    failedRules: AuditRule[];
    suggestions: string[];
}

export class ReadmeAuditor {

    // 📋 Define All Quality Rules
    private static rules: AuditRule[] = [
        // ========== STRUCTURE RULES (40 points) ==========
        {
            name: 'Has Title (H1)',
            //  Updated: Checks for # Title OR <h1>Title</h1>
            check: (content) => /(^#\s+.+)|(<h1[^>]*>)/im.test(content),
            points: 10,
            suggestion: 'Add a clear title using # or <h1> tag',
            category: 'structure'
        },
        {
            name: 'Has Installation Section',
            //  Updated: Checks for ## Installation OR <h2>Installation</h2>
            check: (content) => /(##?|<h[2-3][^>]*>)\s*(Installation|Install|Setup|Getting Started)/i.test(content),
            points: 10,
            suggestion: 'Add an "Installation" section to help users get started',
            category: 'structure'
        },
        {
            name: 'Has Usage Section',
            check: (content) => /(##?|<h[2-3][^>]*>)\s*(Usage|How to Use|Examples|Quick Start|Quick Actions)/i.test(content),
            points: 10,
            suggestion: 'Add a "Usage" section with examples',
            category: 'structure'
        },
        {
            name: 'Has License Section',
            check: (content) => /(##?|<h[2-3][^>]*>)\s*(License|Licensing)/i.test(content),
            points: 10,
            suggestion: 'Add a "License" section to clarify usage rights',
            category: 'structure'
        },

        // ========== CONTENT RULES (40 points) ==========
        {
            name: 'Has Description',
            check: (content) => {
                // Remove tags to count real text length
                const cleanText = content.replace(/<[^>]*>/g, '').replace(/^#\s+.+/m, '').trim();
                return cleanText.length >= 50;
            },
            points: 10,
            suggestion: 'Add a clear description explaining what your project does',
            category: 'content'
        },
        {
            name: 'Contains Code Examples',
            //  Updated: Checks for ``` OR <code> tag
            check: (content) => /```[\s\S]*?```|<pre>|<code>/.test(content),
            points: 10,
            suggestion: 'Add code examples using ``` blocks',
            category: 'content'
        },
        {
            name: 'Has Images/Screenshots',
            //  Updated: Checks for ![]() OR <img src>
            check: (content) => /(!\[.*?\]\(.+?\))|(<img[^>]+src=)/i.test(content),
            points: 10,
            suggestion: 'Add screenshots using ![alt](url) or <img> tags',
            category: 'content'
        },
        {
            name: 'Has Links',
            //  Updated: Checks for []() OR <a href>
            check: (content) => /(\[.+?\]\(.+?\))|(<a[^>]+href=)/i.test(content),
            points: 10,
            suggestion: 'Add relevant links to documentation',
            category: 'content'
        },

        // ========== BEST PRACTICES (20 points) ==========
        {
            name: 'Has Badges',
            //  Updated: Checks for shields.io links in MD or HTML
            check: (content) => /shields\.io|badge/i.test(content),
            points: 5,
            suggestion: 'Add badges for build status or version',
            category: 'best-practices'
        },
        {
            name: 'Has Table of Contents',
            check: (content) => /(##?|<h[2-3]>)\s*(Table of Contents|TOC|Contents)/i.test(content),
            points: 5,
            suggestion: 'Add a Table of Contents for easy navigation',
            category: 'best-practices'
        },
        {
            name: 'Has Contributing Section',
            check: (content) => /(##?|<h[2-3][^>]*>)\s*(Contributing|Contribution|Contributors)/i.test(content),
            points: 5,
            suggestion: 'Add a "Contributing" section',
            category: 'best-practices'
        },
        {
            name: 'Reasonable Length',
            check: (content) => {
                const wordCount = content.split(/\s+/).length;
                return wordCount >= 100 && wordCount <= 5000;
            },
            points: 5,
            suggestion: 'Aim for 100-5000 words',
            category: 'best-practices'
        }
    ];

    //  Main Audit Function
    public static audit(markdownContent: string): AuditResult {
        let totalScore = 0;
        const maxScore = this.rules.reduce((sum, rule) => sum + rule.points, 0);

        const passedRules: AuditRule[] = [];
        const failedRules: AuditRule[] = [];

        // Run all checks
        this.rules.forEach(rule => {
            if (rule.check(markdownContent)) {
                totalScore += rule.points;
                passedRules.push(rule);
            } else {
                failedRules.push(rule);
            }
        });

        const percentage = Math.round((totalScore / maxScore) * 100);

        return {
            score: totalScore,
            maxScore: maxScore,
            percentage: percentage,
            passedRules: passedRules,
            failedRules: failedRules,
            suggestions: failedRules.map(rule => rule.suggestion)
        };
    }

    //  Get Score Color/Grade
    public static getGrade(percentage: number): { grade: string; color: string; emoji: string } {
        if (percentage >= 90) {return { grade: 'A+', color: '#00d26a', emoji: '🏆' };}
        if (percentage >= 80) {return { grade: 'A', color: '#26a641', emoji: '🌟' };}
        if (percentage >= 70) {return { grade: 'B', color: '#7ee787', emoji: '✅' };}
        if (percentage >= 60) {return { grade: 'C', color: '#ffd33d', emoji: '⚡' };}
        if (percentage >= 50) {return { grade: 'D', color: '#ff8c00', emoji: '⚠️' };}
        return { grade: 'F', color: '#ff4444', emoji: '❌' };
    }

    // 📊 Generate HTML Report (for Webview)
    public static generateHtmlReport(result: AuditResult): string {
        const grade = this.getGrade(result.percentage);

        return `
        <div class="audit-report">
            <div class="audit-header">
                <div class="audit-score" style="border-color: ${grade.color};">
                    <span class="score-emoji">${grade.emoji}</span>
                    <div class="score-value">${result.percentage}%</div>
                    <div class="score-grade" style="color: ${grade.color};">${grade.grade}</div>
                    <div class="score-text">${result.score} / ${result.maxScore} points</div>
                </div>
            </div>

            ${result.failedRules.length > 0 ? `
            <div class="audit-section suggestions">
                <h3>💡 Suggestions for Improvement</h3>
                <ul>
                    ${result.failedRules.map(rule => `
                        <li>
                            <strong>${rule.name}</strong> <span class="points">+${rule.points} pts</span>
                            <p>${rule.suggestion}</p>
                        </li>
                    `).join('')}
                </ul>
            </div>
            ` : '<div class="audit-perfect">🎉 Perfect! Your README is excellent!</div>'}

            <details class="audit-details">
                <summary>✅ Passed Checks (${result.passedRules.length}/${this.rules.length})</summary>
                <ul>
                    ${result.passedRules.map(rule => `
                        <li><span class="check-pass">✓</span> ${rule.name} <span class="points-earned">+${rule.points}</span></li>
                    `).join('')}
                </ul>
            </details>
        </div>
        `;
    }
}