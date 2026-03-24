import { NextRequest, NextResponse } from 'next/server';
import type { Project, Chapter } from '@/lib/types';
import epub from 'epub-gen-memory';
import { verifyIdToken } from '@/lib/firebase-admin';

// =============================================
// POST /api/export/epub
// Generates a downloadable EPUB from project chapters.
// Local-first: project + chapters are passed in the request body
// (read from IndexedDB on the client, not from Firestore).
// =============================================

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        const body = await req.json();
        const { project, chapters } = body as { project: Project; chapters: Chapter[] };

        if (!project || !project.title) {
            return NextResponse.json({ error: 'project is required' }, { status: 400 });
        }

        if (!Array.isArray(chapters) || chapters.length === 0) {
            return NextResponse.json({ error: 'No chapters to export' }, { status: 400 });
        }

        // Sort chapters by order
        const sorted = [...chapters].sort((a, b) => (a.order || 0) - (b.order || 0));

        // Generate EPUB buffer
        const content = sorted.map((ch) => ({
            title: escapeHtml(ch.title),
            content: ch.content || '<p>(Empty chapter)</p>',
        }));

        const buffer = await epub(
            {
                title: escapeHtml(project.title || 'Untitled'),
                author: escapeHtml(project.metadata?.authorName || 'Novello AI Author'),
                description: escapeHtml(project.synopsis || ''),
            },
            content
        );

        const uint8 = new Uint8Array(buffer);

        return new NextResponse(uint8, {
            status: 200,
            headers: {
                'Content-Type': 'application/epub+zip',
                'Content-Disposition': `attachment; filename="${sanitizeFilename(project.title)}.epub"`,
            },
        });
    } catch (error) {
        console.error('[EPUB Export Error]', error);
        const message = error instanceof Error ? error.message : 'EPUB export failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeFilename(name: string): string {
    return (name || 'untitled').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'untitled';
}
