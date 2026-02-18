import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import type { Project, Chapter } from '@/lib/types';
import { verifyIdToken } from '@/lib/firebase-admin';

// =============================================
// GET /api/export/pdf?projectId=xxx
// Generates a basic HTML-to-PDF style document.
// Uses a simple HTML approach with print-ready CSS.
// =============================================

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    await verifyIdToken(authHeader);

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

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

    // Fetch chapters (client-side sort to avoid index requirement)
    const chaptersSnap = await getDocs(
      query(
        collection(db, 'chapters'),
        where('projectId', '==', projectId)
      )
    );
    const chapters = chaptersSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Chapter)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (chapters.length === 0) {
      return NextResponse.json({ error: 'No chapters to export' }, { status: 400 });
    }

    // Generate print-ready HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(project.title || 'Untitled')}</title>
<style>
  @page { margin: 1in; size: letter; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 6.5in;
    margin: 0 auto;
    padding: 1in;
  }
  .title-page {
    text-align: center;
    padding-top: 3in;
    page-break-after: always;
  }
  .title-page h1 {
    font-size: 28pt;
    font-weight: bold;
    margin-bottom: 0.5in;
  }
  .title-page .author {
    font-size: 16pt;
    color: #555;
  }
  .chapter {
    page-break-before: always;
  }
  .chapter h2 {
    font-size: 18pt;
    font-weight: bold;
    margin-bottom: 0.3in;
    text-align: center;
  }
  .chapter-content {
    text-indent: 0.5in;
  }
  .chapter-content p {
    margin: 0 0 0.8em;
  }
</style>
</head>
<body>
  <div class="title-page">
    <h1>${escapeHtml(project.title || 'Untitled')}</h1>
    <div class="author">by ${escapeHtml(project.metadata?.authorName || 'Author')}</div>
  </div>
  ${chapters
        .map(
          (ch) => `
  <div class="chapter">
    <h2>${escapeHtml(ch.title)}</h2>
    <div class="chapter-content">${ch.content || '<p>(Empty chapter)</p>'}</div>
  </div>`
        )
        .join('\n')}
</body>
</html>`;

    // Return HTML as downloadable file (browsers can print to PDF)
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(project.title)}.html"`,
      },
    });
  } catch (error) {
    console.error('[PDF Export Error]', error);
    const message = error instanceof Error ? error.message : 'PDF export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeFilename(name: string): string {
  return (name || 'untitled').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'untitled';
}
