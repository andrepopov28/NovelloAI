import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText as aiStreamText, generateText as aiGenerateText, stepCountIs, LanguageModel } from 'ai';
import { SYSTEM_PROMPT } from './prompts';

// =============================================
// Novello AI — AI Service (Multi-Provider)
// Priority cascade:
//   1. Ollama          (local fallback, always offline-safe)
// =============================================

// ── Best free models per provider ─────────────────────────────────────────
export const FREE_MODELS = {
    ollama:     process.env.OLLAMA_MODEL || 'qwen3.5:9b',
} as const;

export type AIProvider = 'ollama' | 'auto';

// ── Provider factories ─────────────────────────────────────────────────────

function getOllamaModel(modelName?: string): LanguageModel {
    const baseURL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    const ollama = createOpenAICompatible({
        name: 'ollama',
        baseURL: `${baseURL}/v1`,
    });
    return ollama(modelName || FREE_MODELS.ollama);
}

/**
 * Resolve the best available model in priority order.
 * If provider is 'auto', tries each in cascade order.
 */
export function getModel(provider: AIProvider, modelName?: string): LanguageModel {
    return getOllamaModel(modelName);
}

// ── Health checks ──────────────────────────────────────────────────────────

export async function checkOllamaHealth(): Promise<boolean> {
    const baseURL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    try {
        const res = await fetch(baseURL, { signal: AbortSignal.timeout(3000) });
        return res.ok;
    } catch {
        return false;
    }
}

export async function checkProviderHealth(): Promise<{
    openrouter?: boolean;
    groq?: boolean;
    gemini?: boolean;
    ollama: boolean;
    active: AIProvider;
}> {
    const ollama = await checkOllamaHealth();

    return { ollama, active: 'ollama' };
}


// ── Generation ─────────────────────────────────────────────────────────────

export async function streamGenerate(options: {
    prompt: string;
    provider?: AIProvider;
    model?: string;
    system?: string;
    tools?: any;
}) {
    const model = getModel(options.provider || 'auto', options.model);
    return aiStreamText({
        model,
        system: options.system || SYSTEM_PROMPT,
        prompt: options.prompt,
        tools: options.tools,
        stopWhen: options.tools ? stepCountIs(3) : undefined,
    });
}

export async function generateJSON(options: {
    prompt: string;
    provider?: AIProvider;
    model?: string;
    system?: string;
}): Promise<string> {
    const model = getModel(options.provider || 'auto', options.model);
    const result = await aiGenerateText({
        model,
        system: options.system || SYSTEM_PROMPT,
        prompt: options.prompt,
    });
    return result.text;
}
