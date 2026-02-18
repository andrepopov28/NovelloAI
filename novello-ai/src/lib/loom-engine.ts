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
            maxTokens = 2000,
            includeEntities = true,
            includeSeriesContext = true,
            currentText = '',
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
            if (currentSize + seriesBlock.length < maxChars * 0.2) {
                contextParts.push(seriesBlock);
                currentSize += seriesBlock.length;
            }
        }

        // 3. Entity Injection (Smart Priority)
        if (includeEntities && entities.length > 0) {
            // Find entities mentioned in currentText or prompt
            const mentionedEntities = entities.filter(e =>
                currentText.toLowerCase().includes(e.name.toLowerCase()) ||
                e.isShared // Always prioritize shared/series entities
            );

            // If none mentioned, pick top 3 by updatedAt? No, let's just take the mentioned ones
            // and maybe a couple of extra important ones.
            const importantEntities = mentionedEntities.length > 0
                ? mentionedEntities
                : entities.slice(0, 3);

            let entityBlock = '\nKey Entities:';
            importantEntities.forEach(e => {
                const entry = `\n- ${e.name} (${e.type}): ${e.description}`;
                if (currentSize + entityBlock.length + entry.length < maxChars * 0.5) {
                    entityBlock += entry;
                    currentSize += entry.length;
                }
            });
            contextParts.push(entityBlock);
        }

        // 4. Narrative Rollup (Chapters/Summaries)
        // We prioritize the most recent chapter summaries to stay within the narrative window.
        if (chapters.length > 0) {
            let narrativeBlock = '\nNarrative Progression:';
            const sortedChapters = [...chapters].sort((a, b) => (b.order || 0) - (a.order || 0));

            for (const ch of sortedChapters) {
                const summary = ch.lastSummary || ch.synopsis || '';
                if (!summary) continue;

                const entry = `\n[Chapter ${ch.order + 1}: ${ch.title}] ${summary}`;
                if (currentSize + narrativeBlock.length + entry.length < maxChars) {
                    // Prepend to maintain chronological feel in the block, 
                    // though we processed from most recent.
                    narrativeBlock = narrativeBlock.replace('\nNarrative Progression:', `\nNarrative Progression:\n${entry}`);
                    currentSize += entry.length;
                } else {
                    break;
                }
            }
            contextParts.push(narrativeBlock);
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
