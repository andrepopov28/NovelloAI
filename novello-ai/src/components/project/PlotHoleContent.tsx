'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, AlertTriangle, CheckCircle, Loader2, BookMarked } from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';
import { useEntities } from '@/lib/hooks/useEntities';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProjects } from '@/lib/hooks/useProjects';
import { PlotThread } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

const STATUS_CONFIG = {
    open: { label: 'Open', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    resolved: { label: 'Resolved', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
    dangling: { label: '⚠ Dangling', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
};

export function PlotHoleContent({ projectId }: { projectId: string }) {
    const router = useRouter();
    const { user } = useAuth();
    const { chapters, loading: chaptersLoading } = useChapters(projectId);
    const { entities } = useEntities(projectId);
    const { projects } = useProjects();
    const project = projects.find(p => p.id === projectId);

    const [threads, setThreads] = useState<PlotThread[]>([]);
    const [summary, setSummary] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleScan = async () => {
        if (!user?.uid) { toast.error('Not authenticated'); return; }
        if (chapters.length < 2) { toast.error('Need at least 2 chapters with summaries for plot hole detection'); return; }
        setScanning(true);
        try {
            const token = '';
            const res = await fetch('/api/ai/plot-holes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ chapters, entities }),
            });
            if (!res.ok) throw new Error('Plot hole scan failed');
            const data = await res.json();
            setThreads(data.openThreads || []);
            setSummary(data.summary || '');
            setScanned(true);
        } catch {
            toast.error('Plot hole scan failed — is Ollama running?');
        } finally {
            setScanning(false);
        }
    };

    const dangling = threads.filter(t => t.status === 'dangling');
    const open = threads.filter(t => t.status === 'open');
    const resolved = threads.filter(t => t.status === 'resolved');

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '2rem' }}>
                <button
                    onClick={() => router.push(`/project/${projectId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <BookMarked size={20} color="var(--accent)" />
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Plot Hole Detector</h1>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                        AI-powered analysis of open threads, dangling plot lines, and unresolved setups
                    </p>
                </div>
                <Button
                    onClick={handleScan}
                    disabled={scanning || chaptersLoading}
                >
                    {scanning ? (
                        <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Scanning...</>
                    ) : (
                        <><Search size={14} /> {scanned ? 'Rescan' : 'Scan Manuscript'}</>
                    )}
                </Button>
            </div>

            {/* Stats */}
            {scanned && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>{dangling.length}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Dangling threads</div>
                        </div>
                        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>{open.length}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Open threads</div>
                        </div>
                        <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{resolved.length}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Resolved</div>
                        </div>
                    </div>

                    {summary && (
                        <div style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {summary}
                        </div>
                    )}

                    {threads.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <CheckCircle size={32} color="var(--success, #16a34a)" style={{ marginBottom: 8 }} />
                            <div style={{ fontWeight: 700 }}>No plot holes detected</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Your narrative is cohesive</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[...dangling, ...open, ...resolved].map(thread => {
                                const cfg = STATUS_CONFIG[thread.status];
                                const isExpanded = expandedId === thread.id;
                                return (
                                    <div
                                        key={thread.id}
                                        style={{ background: 'var(--surface-secondary)', border: `1px solid ${thread.status === 'dangling' ? 'rgba(220,38,38,0.25)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden' }}
                                    >
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : thread.id)}
                                            style={{ width: '100%', textAlign: 'left', padding: '0.875rem 1rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                                        >
                                            <AlertTriangle size={14} color={cfg.color} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{thread.title}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                    Introduced: {thread.introducedInChapter} · Last: {thread.lastMentionedInChapter || 'Never revisited'}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 6, padding: '3px 8px' }}>
                                                {cfg.label}
                                            </span>
                                        </button>

                                        {isExpanded && (
                                            <div style={{ padding: '0 1rem 0.875rem', borderTop: '1px solid var(--border)' }}>
                                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0.75rem 0 0' }}>{thread.description}</p>
                                                {thread.characters && thread.characters.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                                        {thread.characters.map(c => (
                                                            <span key={c} style={{ fontSize: '0.72rem', background: 'rgba(var(--accent-rgb,99,102,241), 0.1)', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
                                                                {c}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {!scanned && !scanning && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    <BookMarked size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Ready to scan</div>
                    <div style={{ fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                        Requires at least 2 chapters with AI-generated summaries.<br />
                        Run "Summarize All" from the editor sidebar first.
                    </div>
                    <Button onClick={handleScan}>
                        <Search size={14} /> Scan Manuscript
                    </Button>
                </div>
            )}
        </div>
    );
}
