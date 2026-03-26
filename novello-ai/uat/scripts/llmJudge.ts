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

    const extractJson = (text: string) => {
        // Try to extract JSON from common markdown block patterns or find first '{' and last '}'
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
        return jsonMatch ? jsonMatch[1].trim() : text.trim();
    };

    const attemptParse = (text: string) => {
        const cleaned = extractJson(text);
        try {
            const parsed = JSON.parse(cleaned);
            return schema.parse(parsed);
        } catch (e: any) {
            throw new Error(`JSON Validation Error: ${e.message}. Cleaned input was: ${cleaned}`);
        }
    };

    try {
        return attemptParse(rawResponse);
    } catch (e: any) {
        console.warn(`[LLM Judge] First validation failed. Retrying... Error: ${e.message}`);

        // Retry attempt / Repair JSON
        const repairPrompt = `
You previously returned this response:
${rawResponse}

It failed validation with this error:
${e.message}

Please repair the JSON so that it perfectly matches the required schema. 
Return ONLY the raw valid JSON object. Do not wrap it in markdown blockquotes or add any explanation.
`;

        const retryResponse = await callOllama("You are a strict JSON repair bot. You output ONLY valid JSON.", repairPrompt);
        console.log(`[LLM Judge] Raw response (retry): ${retryResponse.substring(0, 100)}...`);
        return attemptParse(retryResponse);
    }
}

async function callOllama(system: string, prompt: string): Promise<string> {
    if (process.env.CI) {
        console.log('[LLM Judge] CI detected. Returning mock response.');
        if (prompt.includes('Artifact')) {
            return JSON.stringify({ name: 'The Artifact', type: 'lore', description: 'A small glowing stone that hums with ancient energy.' });
        }
        if (prompt.includes('generate the audiobook')) {
            return JSON.stringify({ confirm: true });
        }
        return '{}';
    }

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
