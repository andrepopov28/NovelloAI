import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText as aiStreamText, generateText as aiGenerateText, LanguageModel } from 'ai';
import { SYSTEM_PROMPT } from './prompts';

// =============================================
// Novello AI v19 — AI Service (Dual Provider)
// Supports Ollama (local) and Gemini (cloud).
// =============================================

type AIProvider = 'ollama' | 'gemini';

// --- Provider Factories ---

function getGeminiModel(modelName: string): LanguageModel {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
    const google = createGoogleGenerativeAI({ apiKey });
    return google(modelName || 'gemini-2.0-flash');
}

function getOllamaModel(modelName: string): LanguageModel {
    const baseURL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    const ollama = createOpenAICompatible({
        name: 'ollama',
        baseURL: `${baseURL}/v1`,
    });
    return ollama(modelName || 'qwen2.5-coder:7b');
}

function getModel(provider: AIProvider, modelName: string): LanguageModel {
    return provider === 'gemini'
        ? getGeminiModel(modelName)
        : getOllamaModel(modelName);
}

// --- Health Checks ---

export async function checkOllamaHealth(): Promise<boolean> {
    const baseURL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    try {
        const res = await fetch(baseURL, { signal: AbortSignal.timeout(3000) });
        return res.ok;
    } catch {
        return false;
    }
}

export async function checkGeminiHealth(): Promise<boolean> {
    return Boolean(process.env.GEMINI_API_KEY);
}

// --- Generation ---

export async function streamGenerate(options: {
    prompt: string;
    provider: AIProvider;
    model: string;
    system?: string;
}) {
    const model = getModel(options.provider, options.model);
    return aiStreamText({
        model,
        system: options.system || SYSTEM_PROMPT,
        prompt: options.prompt,
    });
}

export async function generateJSON(options: {
    prompt: string;
    provider: AIProvider;
    model: string;
    system?: string;
}): Promise<string> {
    const model = getModel(options.provider, options.model);
    const result = await aiGenerateText({
        model,
        system: options.system || SYSTEM_PROMPT,
        prompt: options.prompt,
    });
    return result.text;
}
