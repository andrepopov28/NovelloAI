'use client';

import { useState } from 'react';
import { exportDatabase, importDatabase } from '@/lib/local-db';
import { toast } from 'sonner';

export default function DataSettingsContent() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const data = await exportDatabase();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `novello-backup-${new Date().toISOString().split('T')[0]}.novello`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Database exported successfully!');
        } catch (error: any) {
            toast.error('Failed to export: ' + (error.message || 'Unknown error'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsImporting(true);
            const text = await file.text();
            await importDatabase(text);
            toast.success('Database restored successfully! Reloading...');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            toast.error('Failed to import: ' + (error.message || 'Unknown error'));
        } finally {
            setIsImporting(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
                    Data & Backups
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Manage your local database. Export a .novello JSON file to backup your projects, chapters, and custom voices, or restore from a previous backup.
                </p>
            </header>

            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Export Database</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Download a full snapshot of your local database. Keep this file safe.
                    </p>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-4 py-2 bg-[var(--accent-warm)] text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                    >
                        {isExporting ? 'Exporting...' : 'Export to .novello'}
                    </button>
                </div>

                <div className="h-px bg-[var(--border)] w-full" />

                <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Restore Database</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Upload a .novello file to restore your database. This will overwrite existing data with the same IDs.
                    </p>
                    
                    <label className="inline-block px-4 py-2 bg-[var(--surface-primary)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg hover:border-[var(--accent-warm)] transition cursor-pointer disabled:opacity-50">
                        {isImporting ? 'Restoring...' : 'Restore from Backup'}
                        <input
                            type="file"
                            accept=".novello,.json,application/json"
                            onChange={handleImport}
                            disabled={isImporting}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
