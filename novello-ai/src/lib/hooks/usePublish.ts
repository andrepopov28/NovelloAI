'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getProject, getChapters } from '@/lib/local-db';

export interface PublishMetadata {
    author: string;
    description: string;
    isbn: string;
    categories: string;
    coverUrl: string | null;
}

export function usePublish() {
    const { user } = useAuth();
    const [metadata, setMetadata] = useState<PublishMetadata>({
        author: '',
        description: '',
        isbn: '',
        categories: '',
        coverUrl: null,
    });
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const updateMetadata = useCallback((updates: Partial<PublishMetadata>) => {
        setMetadata((prev) => ({ ...prev, ...updates }));
    }, []);

    const exportEpub = useCallback(
        async (projectId: string, projectTitle?: string) => {
            setExporting(true);
            setExportError(null);
            try {
                // Fetch project + chapters from local IndexedDB on the client
                const [project, chapters] = await Promise.all([
                    getProject(projectId),
                    getChapters(projectId),
                ]);

                if (!project) throw new Error('Project not found in local database');
                if (!chapters || chapters.length === 0) throw new Error('No chapters found to export');

                const token = user?.uid ?? 'local';
                const res = await fetch('/api/export/epub', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    // Send the data the server needs — no Firestore reads required
                    body: JSON.stringify({ project, chapters }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Export failed');
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const safeName = (projectTitle || project.title || 'manuscript').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'manuscript';
                a.download = `${safeName}.epub`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                setExportError(err instanceof Error ? err.message : 'Export failed');
            } finally {
                setExporting(false);
            }
        },
        [user]
    );

    const exportPdf = useCallback(
        async (projectId: string, projectTitle?: string) => {
            setExporting(true);
            setExportError(null);
            try {
                // Fetch project + chapters from local IndexedDB on the client
                const [project, chapters] = await Promise.all([
                    getProject(projectId),
                    getChapters(projectId),
                ]);

                if (!project) throw new Error('Project not found in local database');
                if (!chapters || chapters.length === 0) throw new Error('No chapters found to export');

                const sorted = [...chapters].sort((a, b) => (a.order || 0) - (b.order || 0));

                const html = `
                <div style="font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; max-width: 6.5in; margin: 0 auto; padding: 1in;">
                    <div style="text-align: center; padding-top: 3in; page-break-after: always;" class="page-break">
                        <h1 style="font-size: 28pt; font-weight: bold; margin-bottom: 0.5in;">${project.title || 'Untitled'}</h1>
                        <div style="font-size: 16pt; color: #555;">by ${project.metadata?.authorName || 'Author'}</div>
                    </div>
                    ${sorted.map(ch => `
                        <div style="page-break-before: always;" class="page-break">
                            <h2 style="font-size: 18pt; font-weight: bold; margin-bottom: 0.3in; text-align: center;">${ch.title}</h2>
                            <div style="text-indent: 0.5in;">${ch.content || '<p>(Empty chapter)</p>'}</div>
                        </div>
                    `).join('')}
                </div>`;

                const safeName = (projectTitle || project.title || 'manuscript').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'manuscript';
                
                // Dynamically import html2pdf to prevent SSR issues
                // @ts-ignore
                const html2pdf = (await import('html2pdf.js')).default;
                
                const opt = {
                    margin:       [0.5, 0.5] as [number, number], // margin in inches
                    filename:     `${safeName}.pdf`,
                    image:        { type: 'jpeg' as const, quality: 0.98 },
                    html2canvas:  { scale: 2 },
                    pagebreak:    { mode: 'css', before: '.page-break' },
                    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
                };
                
                const element = document.createElement('div');
                element.innerHTML = html;
                
                await html2pdf().set(opt).from(element).save();
            } catch (err) {
                setExportError(err instanceof Error ? err.message : 'PDF export failed');
            } finally {
                setExporting(false);
            }
        },
        [user]
    );

    return {
        metadata,
        updateMetadata,
        exporting,
        exportError,
        exportEpub,
        exportPdf,
    };
}
