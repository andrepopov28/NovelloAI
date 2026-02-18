import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import type { Project, Chapter } from '@/lib/types';
import epub from 'epub-gen-memory';
import { verifyIdToken } from '@/lib/firebase-admin';

// =============================================
// POST /api/export/epub
// Generates a downloadable EPUB from project chapters.
// =============================================

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        const { projectId } = await req.json();
        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }

        const db = getFirebaseDb();

        // Fetch project
        const projectSnap = await getDoc(doc(db, 'projects', projectId));
        if (!projectSnap.exists()) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const project = { id: projectSnap.id, ...projectSnap.data() } as Project;

        // Fetch chapters in order
        const chaptersSnap = await getDocs(
            query(
                collection(db, 'chapters'),
                where('projectId', '==', projectId),
                orderBy('order', 'asc')
            )
        );
        const chapters = chaptersSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Chapter
        );

        if (chapters.length === 0) {
            return NextResponse.json({ error: 'No chapters to export' }, { status: 400 });
        }

        // Generate EPUB buffer (epub-gen-memory takes options + content separately)
        const content = chapters.map((ch) => ({
            title: ch.title,
            content: ch.content || '<p>(Empty chapter)</p>',
        }));

        const buffer = await epub(
            {
                title: project.title || 'Untitled',
                author: 'Novello AI Author',
                description: project.synopsis || '',
            },
            content
        );

        // Convert Buffer to Uint8Array for NextResponse compatibility
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

function sanitizeFilename(name: string): string {
    return (name || 'untitled').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'untitled';
}
