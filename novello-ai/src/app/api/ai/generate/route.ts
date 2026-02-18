import { NextRequest, NextResponse } from 'next/server';
import { streamGenerate, generateJSON } from '@/lib/ai';
import { REWRITE_PROMPT, EXPAND_PROMPT, OUTLINE_PROMPT, SUMMARIZE_PROMPT } from '@/lib/prompts';
import { verifyIdToken, db } from '@/lib/firebase-admin';
import { LoomEngine } from '@/lib/loom-engine';
import { Project, Chapter, Entity, Series } from '@/lib/types';

// =============================================
// POST /api/ai/generate
// Unified AI generation endpoint.
// Supports streaming and JSON modes.
// =============================================

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        const body = await req.json();
        const {
            prompt,
            provider = 'ollama',
            model = '',
            mode = 'stream',
            action,
            genre,
            context: manualContext,
            projectId, // 🆕 Use projectId to build Loom context
        } = body as {
            prompt: string;
            provider: 'ollama' | 'gemini';
            model: string;
            mode: 'stream' | 'json';
            action?: 'rewrite' | 'expand' | 'outline' | 'summarize' | 'write_chapter';
            genre?: string;
            context?: string;
            projectId?: string;
            title?: string;
            synopsis?: string;
            styleProfile?: any;
        };

        let context = manualContext;

        // --- Loom Context Engine Integration ---
        if (projectId && !manualContext) {
            try {
                // Fetch context data in parallel
                const [projectDoc, chaptersSnap, entitiesSnap] = await Promise.all([
                    db.collection('projects').doc(projectId).get(),
                    db.collection('chapters').where('projectId', '==', projectId).get(),
                    db.collection('entities').where('projectId', '==', projectId).get(),
                ]);

                if (projectDoc.exists) {
                    const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
                    const chaptersData = chaptersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));
                    const entitiesData = entitiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Entity));

                    let seriesData: Series | null = null;
                    if (projectData.seriesId) {
                        const seriesDoc = await db.collection('series').doc(projectData.seriesId).get();
                        if (seriesDoc.exists) {
                            seriesData = { id: seriesDoc.id, ...seriesDoc.data() } as Series;
                        }
                    }

                    context = LoomEngine.assembleContext(
                        projectData,
                        chaptersData,
                        entitiesData,
                        seriesData,
                        { currentText: prompt || '' }
                    );
                }
            } catch (err) {
                console.warn('[Loom Error] Failed to assemble context:', err);
                // Fallback to manual context or no context
            }
        }

        if (!prompt && action !== 'write_chapter') {
            return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
        }

        // Build the final prompt based on action
        let finalPrompt = prompt;
        if (action === 'rewrite') {
            finalPrompt = REWRITE_PROMPT(prompt, '', context);
        } else if (action === 'expand') {
            finalPrompt = EXPAND_PROMPT(prompt, context);
        } else if (action === 'outline') {
            finalPrompt = OUTLINE_PROMPT(prompt, genre || '');
        } else if (action === 'summarize') {
            finalPrompt = SUMMARIZE_PROMPT(prompt);
        } else if (action === 'write_chapter') {
            const { WRITE_CHAPTER_PROMPT } = await import('@/lib/prompts');
            finalPrompt = WRITE_CHAPTER_PROMPT(body.title || 'Untitled', body.synopsis || prompt, context, body.styleProfile);
        }

        if (mode === 'json') {
            const text = await generateJSON({ prompt: finalPrompt, provider, model });
            return NextResponse.json({ result: text });
        }

        // Streaming mode
        const result = await streamGenerate({ prompt: finalPrompt, provider, model });
        // Manually implement Data Stream Protocol since toDataStreamResponse is missing in this version
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of result.textStream) {
                        const message = `0:${JSON.stringify(chunk)}\n`;
                        controller.enqueue(encoder.encode(message));
                    }
                } catch (error) {
                    controller.error(error);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    } catch (error) {
        console.error('[AI Generate Error]', error);
        const message = error instanceof Error ? error.message : 'AI generation failed';

        // Detect Gemini quota / rate-limit errors and return 429 so the client
        // can show a proper "quota exhausted" message rather than a generic 500.
        const isQuotaError =
            message.includes('quota') ||
            message.includes('rate limit') ||
            message.includes('RESOURCE_EXHAUSTED') ||
            message.includes('exceeded your current quota');

        if (isQuotaError) {
            return NextResponse.json(
                {
                    error: 'Gemini free-tier quota exhausted. The daily limit resets at midnight Pacific Time. You can switch to Ollama in Settings → AI, or wait for the quota to reset.',
                    code: 'QUOTA_EXHAUSTED',
                },
                { status: 429 }
            );
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
