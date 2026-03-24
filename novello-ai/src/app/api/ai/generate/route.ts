import { NextRequest, NextResponse } from 'next/server';
import { streamGenerate, generateJSON, AIProvider } from '@/lib/ai';
import { REWRITE_PROMPT, EXPAND_PROMPT, OUTLINE_PROMPT, SUMMARIZE_PROMPT } from '@/lib/prompts';
import { verifyIdToken, db } from '@/lib/firebase-admin';
import { LoomEngine } from '@/lib/loom-engine';
import { Project, Chapter, Entity, Series } from '@/lib/types';
import type { Tool } from 'ai';
import { z } from 'zod';

// ── Request body schema ──────────────────────
const GenerateRequestSchema = z.object({
    prompt: z.string().max(50_000).optional(),
    provider: z.enum(['auto', 'ollama']).default('auto'),
    model: z.string().default(''),
    mode: z.enum(['stream', 'json']).default('stream'),
    action: z.string().optional(),
    genre: z.string().optional(),
    context: z.string().optional(),
    projectId: z.string().optional(),
    projectData: z.unknown().optional(),
    chaptersData: z.array(z.unknown()).optional(),
    entitiesData: z.array(z.unknown()).optional(),
    seriesData: z.unknown().nullable().optional(),
    activeChapterText: z.string().optional(),
    recentConversations: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
    endpointMode: z.string().default('generate'),
    title: z.string().optional(),
    synopsis: z.string().optional(),
    styleProfile: z.unknown().optional(),
});

// =============================================
// POST /api/ai/generate
// Unified AI generation endpoint.
// Supports streaming and JSON modes.
// =============================================

export async function POST(req: NextRequest) {
    try {
        const startTime = Date.now();
        const requestId = crypto.randomUUID();

        const authHeader = req.headers.get('Authorization');

        // ── Auth: return 401, not 500, on bad/missing token ──
        let userId: string;
        try {
            const decodedToken = await verifyIdToken(authHeader);
            userId = decodedToken.uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── Parse & validate request body ────────────────────
        const rawBody = await req.json();
        const parseResult = GenerateRequestSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parseResult.error.flatten() },
                { status: 400 }
            );
        }
        const {
            prompt,
            provider,
            model,
            mode,
            action,
            genre,
            context: manualContext,
            projectId,
            activeChapterText,
            recentConversations,
            endpointMode,
        } = parseResult.data;
        const body = parseResult.data;

        if (!prompt && action !== 'write_chapter') {
            return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
        }

        // 1. Determine base context cap logic
        let baseMaxTokens = 25000; // ~100k chars for 'generate' or 'codex'
        if (endpointMode === 'inline') baseMaxTokens = 2500; // ~10k chars
        else if (endpointMode === 'brainstorm') baseMaxTokens = 6250; // ~25k chars
        else if (endpointMode === 'audiobook' || endpointMode === 'cover') baseMaxTokens = 2000;

        // 2. Since the app is local-first, the client sends context via the body payload
        const projectData = body.projectData as Project | undefined;
        const chaptersData = (body.chaptersData || []) as Chapter[];
        const entitiesData = (body.entitiesData || []) as Entity[];
        const seriesData = (body.seriesData || null) as Series | null;

        // 3. Generation retry loop (to handle context limits)
        let attempts = 0;
        let finalResponse: Response | null = null;
        let isTruncated = false;

        while (attempts < 2 && !finalResponse) {
            attempts++;
            const maxTokens = attempts === 1 ? baseMaxTokens : Math.floor(baseMaxTokens / 2);
            if (attempts > 1) isTruncated = true;

            let context = manualContext;
            if (projectId && !manualContext && projectData) {
                context = LoomEngine.assembleContext(
                    projectData, chaptersData, entitiesData, seriesData,
                    { currentText: prompt || '', activeChapterText, recentConversations, maxTokens }
                );
            }

            let finalPrompt = prompt;
            if (action === 'rewrite') {
                finalPrompt = REWRITE_PROMPT(prompt!, '', context);
            } else if (action === 'expand') {
                finalPrompt = EXPAND_PROMPT(prompt!, context);
            } else if (action === 'outline') {
                finalPrompt = OUTLINE_PROMPT(prompt!, genre || '');
            } else if (action === 'summary') {
                finalPrompt = SUMMARIZE_PROMPT(prompt!);
            } else if (action === 'cover') {
                const { COVER_PROMPT } = await import('@/lib/prompts');
                finalPrompt = COVER_PROMPT(body.title || 'Untitled', body.synopsis || '', body.genre || '');
            } else if (action === 'write_chapter') {
                const { WRITE_CHAPTER_PROMPT } = await import('@/lib/prompts');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                finalPrompt = WRITE_CHAPTER_PROMPT(body.title || 'Untitled', body.synopsis || prompt!, context, body.styleProfile as any);
            }

            try {
                if (mode === 'json') {
                    const text = await generateJSON({ prompt: finalPrompt!, provider: provider as AIProvider, model: model || undefined });

                    const latency = Date.now() - startTime;
                    console.log(`[AI] ${requestId} | Mode: ${endpointMode} | Length: ${finalPrompt!.length}c | Model: ${provider}/${model} | Latency: ${latency}ms | Truncated: ${isTruncated}`);

                    finalResponse = NextResponse.json({ result: text });
                } else {
                    let toolsObj = undefined;

                    // Only enable tools if we have project context, it's a general request, and the model isn't struggling
                    if (projectId && userId && attempts === 1 && !action) {
                                            const entitySchema = z.object({
                            name: z.string().describe('The name of the entity'),
                            type: z.enum(['character', 'location', 'lore']).describe('The classification of the entity'),
                            description: z.string().describe('A detailed background description of the entity'),
                        });
                        const audiobookSchema = z.object({
                            confirm: z.boolean().describe('Set to true to confirm queueing the audiobook generation.'),
                        });
                        const publishSchema = z.object({
                            format: z.enum(['epub', 'pdf']).describe('The desired export format'),
                        });

                        toolsObj = {
                            create_codex_entity: {
                                description: 'Create a new world-building entity (character, location, lore item) in the codex database. Call this if the user asks to "save this character", "add this place to the codex", etc.',
                                inputSchema: entitySchema,
                                execute: async (args: z.infer<typeof entitySchema>) => {
                                    const docRef = await db.collection('entities').add({
                                        projectId,
                                        name: args.name,
                                        type: args.type,
                                        description: args.description,
                                        createdAt: Date.now(),
                                        updatedAt: Date.now()
                                    });
                                    return `Successfully created entity ${args.name} with ID ${docRef.id}`;
                                }
                            } as Tool<z.infer<typeof entitySchema>, string>,
                            generate_audiobook: {
                                description: 'Schedule the entire book to be generated into an audiobook mp3. Call this if the user asks to "generate my audiobook", "make an audiobook", etc.',
                                inputSchema: audiobookSchema,
                                execute: async (args: z.infer<typeof audiobookSchema>) => {
                                    if (!args.confirm) return 'User did not confirm. Audio book generation cancelled.';

                                    const exportRef = db.collection('exports').doc();
                                    await exportRef.set({
                                        id: exportRef.id,
                                        projectId,
                                        userId,
                                        type: 'audiobook',
                                        status: 'queued',
                                        progress: { currentChapter: 0, totalChapters: 0, percentComplete: 0, stage: 'cleaning' },
                                        formats: {},
                                        settings: { voiceId: 'default', language: 'en-US', speed: 1.0, pauseDurationMs: 1000 },
                                        createdAt: Date.now(),
                                        updatedAt: Date.now()
                                    });
                                    return `Successfully queued the audiobook generation (Job ID: ${exportRef.id}). Tell the user they can track progress globally in the Audiobook node.`;
                                }
                            } as Tool<z.infer<typeof audiobookSchema>, string>,
                            publish_export: {
                                description: 'Export the final manuscript into EPUB or PDF format.',
                                inputSchema: publishSchema,
                                execute: async (args: z.infer<typeof publishSchema>) => {
                                    return `Mock: Successfully scheduled ${args.format} export for this project.`;
                                }
                            } as Tool<z.infer<typeof publishSchema>, string>,
                        };
                    }

                    const result = await streamGenerate({
                        prompt: finalPrompt!,
                        provider: provider as AIProvider,
                        model: model || undefined,
                        tools: toolsObj
                    });

                    const latency = Date.now() - startTime;
                    console.log(`[AI] ${requestId} | Mode: ${endpointMode} | Length: ${finalPrompt!.length}c | Model: ${provider}/${model} | Latency: ${latency}ms | Truncated: ${isTruncated}`);

                    // Use the SDK's built-in stream response which handles both text and tool-call events
                    finalResponse = result.toTextStreamResponse();
                }
            } catch (error: any) {
                const msg = error.message || '';
                const isQuotaError = msg.includes('quota') || msg.includes('rate limit') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('exceeded your current quota');
                const isLengthError = msg.toLowerCase().includes('context') || msg.toLowerCase().includes('length') || msg.toLowerCase().includes('token');

                if ((isLengthError || isQuotaError) && attempts === 1) {
                    console.warn(`[AI] ${requestId} | Recoverable error caught (${msg.substring(0, 50)}), retrying with half context...`);
                    continue; // Loop again, cuts maxTokens in half
                }

                // If attempt 2 or unrecoverable, throw up to external catch
                throw error;
            }
        }

        return finalResponse as Response;
    } catch (error) {
        console.error('[AI Generate Error]', error);
        const message = error instanceof Error ? error.message : 'AI generation failed';

        // Return standard 500 for generation failures.

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
