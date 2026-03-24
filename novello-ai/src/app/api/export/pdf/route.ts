import { NextRequest, NextResponse } from 'next/server';
import type { Project, Chapter } from '@/lib/types';
import { verifyIdToken } from '@/lib/firebase-admin';

// =============================================
// POST /api/export/pdf
// Returns a print-ready HTML file (browser prints to PDF).
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

        // Generate print-ready HTML
        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(project.title || 'Untitled')}</title>
<style>
  @page {
    margin: 1in;
    size: letter;
    @bottom-center {
      content: counter(page) ' of ' counter(pages);
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 10pt;
      color: #555;
    }
    @top-center {
      content: string(book-title);
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 9pt;
      color: #888;
      letter-spacing: 0.05em;
    }
  }
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
    string-set: book-title content(text);
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
  ${sorted
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

        // Return print-ready HTML (user opens in browser and prints to PDF)
        return new NextResponse(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `attachment; filename="${sanitizeFilename(project.title)}.html"`,
            },
        });
    } catch (error) {
        console.error('[PDF Export Error]', error);
        const message = error instanceof Error ? error.message : 'Export failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeFilename(name: string): string {
    return (name || 'untitled').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'untitled';
}
