import { z } from 'zod';
import * as dotenv from 'dotenv';

const OLLAMA_URL = process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434';
const JUDGE_MODEL = 'qwen3.5:9b';

export async function evaluateLLM<T>(
    systemInstruction: string,
    prompt: string,
    schema: z.ZodSchema<T>
): Promise<T> {

    // First attempt
    const rawResponse = await callOllama(systemInstruction, prompt);
    console.log(`[LLM Judge] Raw response (1st): ${rawResponse.substring(0, 100)}...`);

    try {
        // Parse and validate
        const parsed = JSON.parse(rawResponse);
        return schema.parse(parsed);
    } catch (e: any) {
        console.warn(`[LLM Judge] First validation failed. Retrying... Error: ${e.message}`);

        // Retry attempt / Repair JSON
        const repairPrompt = `
You previously returned this JSON:
${rawResponse}

It failed validation with this error:
${e.message}

Please repair the JSON so that it perfectly matches the required schema. Return ONLY the raw valid JSON object. Do not wrap it in markdown blockquotes.
`;

        const retryResponse = await callOllama("You are a strict JSON repair bot.", repairPrompt);
        console.log(`[LLM Judge] Raw response (retry): ${retryResponse.substring(0, 100)}...`);
        const retryParsed = JSON.parse(retryResponse);
        return schema.parse(retryParsed);
    }
}

async function callOllama(system: string, prompt: string): Promise<string> {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: JUDGE_MODEL,
            system: system,
            prompt: prompt,
            format: 'json',
            stream: false,
            options: {
                temperature: 0.1
            }
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Ollama API returned ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.response;
}
