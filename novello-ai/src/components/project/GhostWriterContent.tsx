'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Play, StopCircle, Save, BookOpen, RefreshCw } from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';
import { useProjects } from '@/lib/hooks/useProjects';
import { useEntities } from '@/lib/hooks/useEntities';
import { useContextEngine } from '@/lib/hooks/useContextEngine';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

type GhostStatus = 'idle' | 'writing' | 'awaiting_approval' | 'saved';

export function GhostWriterContent({ projectId }: { projectId: string }) {
    const router = useRouter();
    const { user } = useAuth();
    const { chapters, loading, createChapter, updateChapter } = useChapters(projectId);
    const { entities } = useEntities(projectId);
    const { projects } = useProjects();
    const { rollingContext } = useContextEngine(chapters);
    const project = projects.find(p => p.id === projectId);

    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const [ghostContent, setGhostContent] = useState('');
    const [status, setStatus] = useState<GhostStatus>('idle');
    const [wordTarget, setWordTarget] = useState(1500);
    const abortRef = useRef<AbortController | null>(null);

    const selectedChapter = chapters.find(c => c.id === selectedChapterId);

    const handleGenerate = useCallback(async () => {
        if (!selectedChapter || !user?.uid) {
            toast.error('Select a chapter first');
            return;
        }
        if (!selectedChapter.synopsis) {
            toast.error('Chapter needs a synopsis for Ghost Writer mode');
            return;
        }
        setStatus('writing');
        setGhostContent('');
        abortRef.current = new AbortController();

        try {
            const token = '';
            const res = await fetch('/api/ai/ghost-writer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    chapterTitle: selectedChapter.title,
                    chapterSynopsis: selectedChapter.synopsis,
                    context: rollingContext,
                    styleProfile: project?.styleProfile,
                    wordTarget,
                }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) throw new Error('Ghost Writer API error');

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No response stream');

            const decoder = new TextDecoder();
            let accumulated = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;
                setGhostContent(accumulated);
            }
            setStatus('awaiting_approval');
            toast.success(`Ghost Writer finished — ${accumulated.split(/\s+/).length.toLocaleString()} words`);
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                toast('Ghost Writer stopped');
                setStatus('idle');
            } else {
                toast.error('Ghost Writer failed — is Ollama running?');
                setStatus('idle');
            }
        }
    }, [selectedChapter, user, rollingContext, project, wordTarget]);

    const handleStop = () => {
        abortRef.current?.abort();
    };

    const handleAccept = useCallback(async () => {
        if (!selectedChapterId || !ghostContent) return;
        try {
            await updateChapter(selectedChapterId, { content: ghostContent });
            toast.success('Chapter updated with Ghost Writer draft');
            setStatus('saved');
        } catch {
            toast.error('Failed to save chapter');
        }
    }, [selectedChapterId, ghostContent, updateChapter]);

    const handleReject = () => {
        setGhostContent('');
        setStatus('idle');
    };

    const previewWords = ghostContent.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
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
                        <Bot size={20} color="var(--accent)" />
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Ghost Writer</h1>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(var(--accent-rgb,99,102,241),0.12)', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>BETA</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                        Autonomous chapter writer in your voice. Review before saving.
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Chapter selector */}
                    <div style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                            Select Chapter
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                            {loading ? <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Loading...</div> : chapters
                                .sort((a, b) => a.order - b.order)
                                .map(ch => (
                                    <button
                                        key={ch.id}
                                        onClick={() => setSelectedChapterId(ch.id)}
                                        style={{
                                            textAlign: 'left', padding: '0.6rem 0.75rem', borderRadius: 8, border: `1px solid ${selectedChapterId === ch.id ? 'var(--accent)' : 'transparent'}`,
                                            background: selectedChapterId === ch.id ? 'rgba(var(--accent-rgb,99,102,241),0.08)' : 'var(--surface-primary)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            Ch. {ch.order + 1}: {ch.title}
                                        </div>
                                        {ch.synopsis ? (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {ch.synopsis.slice(0, 50)}...
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--danger, #dc2626)', marginTop: 2 }}>⚠ No synopsis — add one first</div>
                                        )}
                                    </button>
                                ))}
                        </div>
                    </div>

                    {/* Settings */}
                    <div style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                            Settings
                        </div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                            Target word count: <strong>{wordTarget.toLocaleString()}</strong>
                        </label>
                        <input
                            type="range" min={500} max={4000} step={250} value={wordTarget}
                            onChange={e => setWordTarget(Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                            Style profile: {project?.styleProfile ? '✓ Applied' : '⚠ Not computed yet'}
                        </div>
                    </div>

                    {/* Action */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {status === 'idle' || status === 'saved' ? (
                            <Button onClick={handleGenerate} disabled={!selectedChapterId || !selectedChapter?.synopsis}>
                                <Play size={14} /> Generate Chapter
                            </Button>
                        ) : status === 'writing' ? (
                            <Button onClick={handleStop} variant="destructive">
                                <StopCircle size={14} /> Stop Writing
                            </Button>
                        ) : null}
                        {status === 'awaiting_approval' && (
                            <>
                                <Button onClick={handleAccept}>
                                    <Save size={14} /> Accept & Save
                                </Button>
                                <Button onClick={handleGenerate} variant="secondary">
                                    <RefreshCw size={14} /> Regenerate
                                </Button>
                                <button onClick={handleReject} style={{ fontSize: '0.78rem', color: 'var(--danger, #dc2626)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    Discard
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Output */}
                <div style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BookOpen size={14} color="var(--text-tertiary)" />
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {selectedChapter ? `${selectedChapter.title}` : 'No chapter selected'}
                            </span>
                        </div>
                        {ghostContent && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                ~{previewWords.toLocaleString()} words
                            </span>
                        )}
                    </div>
                    <div
                        style={{
                            minHeight: 500, padding: '1.5rem', fontSize: '0.92rem', lineHeight: 1.8,
                            color: 'var(--text-primary)', fontFamily: 'Georgia, serif',
                            animation: status === 'writing' ? 'none' : undefined,
                        }}
                        dangerouslySetInnerHTML={{ __html: ghostContent || `<p style="color: var(--text-tertiary); font-style: italic; font-family: sans-serif; font-size: 0.85rem;">
                            ${status === 'idle' ? 'Select a chapter with a synopsis, then click Generate Chapter.' : 'Writing...'}
                        </p>` }}
                    />
                    {status === 'awaiting_approval' && (
                        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', background: 'rgba(var(--accent-rgb,99,102,241),0.06)', fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, textAlign: 'center' }}>
                            ✓ Generation complete — review and accept or regenerate
                        </div>
                    )}
                    {status === 'saved' && (
                        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', background: 'rgba(22,163,74,0.06)', fontSize: '0.78rem', color: 'var(--success, #16a34a)', fontWeight: 600, textAlign: 'center' }}>
                            ✓ Saved to chapter
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
