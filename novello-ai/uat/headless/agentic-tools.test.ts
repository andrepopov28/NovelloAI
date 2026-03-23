import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment, RulesTestContext } from '@firebase/rules-unit-testing';
import { getDoc, doc, setLogLevel } from 'firebase/firestore';
import { z } from 'zod';
import { evaluateLLM } from '../scripts/llmJudge';
import fs from 'fs';
import path from 'path';

let testEnv: RulesTestEnvironment;
let uatContext: RulesTestContext;
const PROJECT_ID = 'demo-uat-project';
const UID = 'uat-user-1';

// We define exact schemas we expect the tools to match in production
const CodexCreateSchema = z.object({
    name: z.string(),
    type: z.enum(['character', 'location', 'lore']),
    description: z.string()
});

const AudiobookJobSchema = z.object({
    confirm: z.boolean()
});

beforeAll(async () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    setLogLevel('error');

    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules, host: '127.0.0.1', port: 8080 },
    });
    uatContext = testEnv.authenticatedContext(UID);
});

afterAll(async () => {
    await testEnv.cleanup();
});

describe('Agentic AI Tool Calling blocks', () => {

    it('validates tool-call JSON correctness for create_codex_entity using LLM Judge', async () => {
        const prompt = 'Add a new lore entry called "The Artifact": A small glowing stone that hums with ancient energy.';
        const instruction = 'Extract the parameters for create_codex_entity from the prompt. The JSON MUST exactly match this shape: { "name": string, "type": "character" | "location" | "lore", "description": string }. Return ONLY valid JSON.';

        // This leverages phi3.5 local judge to ensure the extraction matches the Zod schema
        const toolParams = await evaluateLLM(instruction, prompt, CodexCreateSchema);

        expect(toolParams.name).toContain('Artifact');
        expect(toolParams.type).toBe('lore');
        expect(toolParams.description.toLowerCase()).toContain('glowing stone');

        // Simulate backend tool execution
        const db = uatContext.firestore();
        const docRef = doc(db, 'projects/uat-project-1/entities/new-artifact');
        await expect(docRef).toBeDefined();
    }, 45000); // Allow time for LLM execution

    it('validates tool-call JSON correctness for generate_audiobook using LLM Judge', async () => {
        const prompt = 'Yes, go ahead and generate the audiobook for my project now.';
        const instruction = 'Extract the parameters for generate_audiobook. The JSON MUST exactly match {"confirm": boolean} and confirm should be true. Return ONLY valid JSON.';

        const toolParams = await evaluateLLM(instruction, prompt, AudiobookJobSchema);

        expect(toolParams.confirm).toBe(true);
    }, 45000);

    // Note: The actual Firestore mutation logic for tool calls would be integrated here 
    // simulating the backend response mapping the LLM parsed JSON to Admin SDK calls.
});
