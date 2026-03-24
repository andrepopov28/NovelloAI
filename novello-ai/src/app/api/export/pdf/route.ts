import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        try {
            await verifyIdToken(authHeader);
        } catch (e) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { project, chapters } = body;

        if (!project || !chapters || !Array.isArray(chapters)) {
            return NextResponse.json({ error: 'Missing or invalid project/chapters data in body' }, { status: 400 });
        }

        // Build HTML for print-to-PDF
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${project.title}</title>
    <style>
        body { font-family: Georgia, serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1 { text-align: center; font-size: 2.5em; margin-bottom: 0.5em; }
        .author { text-align: center; font-size: 1.2em; color: #666; margin-bottom: 4rem; }
        h2 { margin-top: 3rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
        .chapter-content { white-space: pre-wrap; margin-top: 1.5rem; }
        @media print {
            body { padding: 0; max-width: none; }
            h2 { page-break-before: always; }
        }
    </style>
</head>
<body>
    <h1>${project.title || 'Untitled'}</h1>
    <div class="author">${project.author || 'Anonymous'}</div>
`;

        for (const chap of chapters) {
            html += `<h2>${chap.title || 'Untitled Chapter'}</h2>`;
            html += `<div class="chapter-content">${chap.content || ''}</div>`;
        }

        html += `</body></html>`;

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `attachment; filename="${project.title?.replace(/\\s+/g, '_') || 'export'}.html"`
            }
        });
    } catch (error) {
        console.error('PDF Export Action Error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
