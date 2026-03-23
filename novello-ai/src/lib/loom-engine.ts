import { Project, Chapter, Entity, Series } from './types';

/**
 * The Loom — Narrative Context Engine
 * Refinement for v25: Token-aware, entity-injecting context assembler.
 */

export interface LoomContextOptions {
    maxTokens?: number; // Target token limit (approx 4 chars per token)
    includeEntities?: boolean;
    includeSeriesContext?: boolean;
    currentText?: string; // Used to detect which entities to prioritize
    activeChapterText?: string; // 🆕 Up to 20,000 words of current chapter
    recentConversations?: Array<{ role: string; content: string }>; // 🆕 Last 5 exchanges
}

export class LoomEngine {
    private static TOKEN_RATIO = 4; // Average chars per token

    /**
     * Assembles a comprehensive context string for AI generation.
     */
    static assembleContext(
        project: Project,
        chapters: Chapter[],
        entities: Entity[],
        series: Series | null = null,
        options: LoomContextOptions = {}
    ): string {
        const {
            maxTokens = 25000, // 🆕 Increased to handle ~100k chars (20k words)
            includeEntities = true,
            includeSeriesContext = true,
            currentText = '',
            activeChapterText = '',
            recentConversations = [],
        } = options;

        const maxChars = maxTokens * this.TOKEN_RATIO;
        const contextParts: string[] = [];
        let currentSize = 0;

        // 1. Project Foundation (High Priority)
        const foundation = `Premise: ${project.synopsis}\nGenre: ${project.genre}`;
        contextParts.push(foundation);
        currentSize += foundation.length;

        // 2. Series Context (Optional)
        if (includeSeriesContext && series) {
            const seriesBlock = `Series: ${series.title}\nSeries Arc: ${series.description}`;
            if (currentSize + seriesBlock.length < maxChars * 0.1) {
                contextParts.push(seriesBlock);
                currentSize += seriesBlock.length;
            }
        }

        // 3. Entity Injection (Smart Priority)
        if (includeEntities && entities.length > 0) {
            // Find entities mentioned in currentText or prompt
            const mentionedEntities = entities.filter(e =>
                currentText.toLowerCase().includes(e.name.toLowerCase()) ||
                (activeChapterText && activeChapterText.toLowerCase().includes(e.name.toLowerCase())) ||
                e.isShared // Always prioritize shared/series entities
            );

            const importantEntities = mentionedEntities.length > 0
                ? mentionedEntities
                : entities.slice(0, 3);

            let entityBlock = '\nKey Entities:';
            importantEntities.forEach(e => {
                const entry = `\n- ${e.name} (${e.type}): ${e.description}`;
                if (currentSize + entityBlock.length + entry.length < maxChars * 0.2) {
                    entityBlock += entry;
                    currentSize += entry.length;
                }
            });
            contextParts.push(entityBlock);
        }

        // 4. Narrative Rollup (Chapters/Summaries)
        if (chapters.length > 0) {
            let narrativeBlock = '\nNarrative Progression:';
            const sortedChapters = [...chapters].sort((a, b) => (b.order || 0) - (a.order || 0));

            for (const ch of sortedChapters) {
                const summary = ch.lastSummary || ch.synopsis || '';
                if (!summary) continue;

                const entry = `\n[Chapter ${ch.order + 1}: ${ch.title}] ${summary}`;
                if (currentSize + narrativeBlock.length + entry.length < maxChars * 0.4) {
                    narrativeBlock = narrativeBlock.replace('\nNarrative Progression:', `\nNarrative Progression:\n${entry}`);
                    currentSize += entry.length;
                } else {
                    break;
                }
            }
            contextParts.push(narrativeBlock);
        }

        // 5. Active Chapter Loopback (Full chapter up to ~20k words)
        if (activeChapterText) {
            const lookbackText = activeChapterText.slice(-200000); // roughly 20k words max
            const chapterBlock = `\nCurrent Chapter Text:\n${lookbackText}`;
            if (currentSize + chapterBlock.length < maxChars) {
                contextParts.push(chapterBlock);
                currentSize += chapterBlock.length;
            } else {
                // Truncate if we hit the limit
                const allowedLength = maxChars - currentSize - 30;
                if (allowedLength > 100) {
                    contextParts.push(`\nCurrent Chapter Text:\n...${lookbackText.slice(-allowedLength)}`);
                    currentSize += allowedLength + 30;
                }
            }
        }

        // 6. Recent Conversation History
        if (recentConversations.length > 0) {
            const chatLog = recentConversations.map(msg => `${msg.role === 'user' ? 'Author' : 'AI'}: ${msg.content}`).join('\n');
            const chatBlock = `\nRecent Context Window:\n${chatLog}`;
            contextParts.push(chatBlock);
        }

        return contextParts.join('\n\n');
    }

    /**
     * Estimates token count for a string.
     */
    static estimateTokens(text: string): number {
        return Math.ceil(text.length / this.TOKEN_RATIO);
    }
}
