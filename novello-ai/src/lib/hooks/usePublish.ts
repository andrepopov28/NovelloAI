'use client';

import { useState, useCallback } from 'react';

export interface PublishMetadata {
    author: string;
    description: string;
    isbn: string;
    categories: string;
    coverUrl: string | null;
}

export function usePublish() {
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
                const res = await fetch('/api/export/epub', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Export failed');
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const safeName = (projectTitle || 'manuscript').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'manuscript';
                a.download = `${safeName}.epub`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                setExportError(err instanceof Error ? err.message : 'Export failed');
            } finally {
                setExporting(false);
            }
        },
        []
    );

    const exportPdf = useCallback(
        async (projectId: string, projectTitle?: string) => {
            setExporting(true);
            setExportError(null);
            try {
                const res = await fetch(`/api/export/pdf?projectId=${projectId}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'PDF export failed');
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const safeName = (projectTitle || 'manuscript').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'manuscript';
                a.download = `${safeName}.html`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                setExportError(err instanceof Error ? err.message : 'PDF export failed');
            } finally {
                setExporting(false);
            }
        },
        []
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
