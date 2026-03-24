'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { saveChapterCritique, getCritiqueForChapter } from '@/lib/local-db';
import { ChapterCritique } from '@/lib/types';
import { Sparkles, ChevronDown, ChevronUp, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function ScoreBar({ label, score, feedback, expanded }: { label: string; score: number; feedback: string; expanded: boolean }) {
    const color = score >= 8 ? 'var(--success, #16a34a)' : score >= 6 ? 'var(--accent)' : score >= 4 ? 'var(--warning, #d97706)' : 'var(--danger, #dc2626)';
    return (
        <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{score}/10</span>
            </div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${score * 10}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
            </div>
            {expanded && feedback && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.5 }}>{feedback}</p>
            )}
        </div>
    );
}

interface CritiquePanelProps {
    chapterId: string;
    chapterTitle: string;
    chapterContent: string;
    projectId: string;
    context?: string;
}

export function CritiquePanel({ chapterId, chapterTitle, chapterContent, projectId, context }: CritiquePanelProps) {
    const { user } = useAuth();
    const [critique, setCritique] = useState<ChapterCritique | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const runCritique = async () => {
        if (!user?.uid) { toast.error('Not authenticated'); return; }
        setLoading(true);
        try {
            // Check cache first
            const cached = await getCritiqueForChapter(chapterId);
            if (cached && Date.now() - cached.createdAt < 3600_000) {
                setCritique(cached);
                setExpanded(true);
                setLoading(false);
                return;
            }

            const token = '';
            const res = await fetch('/api/ai/critique', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ chapterId, chapterTitle, chapterContent, context }),
            });
            if (!res.ok) throw new Error('Critique request failed');
            const data = await res.json();
            const c: ChapterCritique = {
                id: `${chapterId}-${Date.now()}`,
                chapterId,
                projectId,
                userId: user.uid,
                overallScore: data.overallScore || 5,
                pacing: data.pacing || { score: 5, feedback: '' },
                tension: data.tension || { score: 5, feedback: '' },
                characterVoice: data.characterVoice || { score: 5, feedback: '' },
                hookStrength: data.hookStrength || { score: 5, feedback: '' },
                highlights: data.highlights || [],
                suggestions: data.suggestions || [],
                createdAt: Date.now(),
            };
            await saveChapterCritique(c);
            setCritique(c);
            setExpanded(true);
        } catch (e) {
            toast.error('Critique failed — is Ollama running?');
        } finally {
            setLoading(false);
        }
    };

    const overallColor = critique ? (critique.overallScore >= 8 ? '#16a34a' : critique.overallScore >= 6 ? 'var(--accent)' : critique.overallScore >= 4 ? '#d97706' : '#dc2626') : 'var(--text-tertiary)';

    return (
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expanded ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} color="var(--accent)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Beta Reader</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {critique && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: overallColor }}>
                            ⭐ {critique.overallScore}/10
                        </span>
                    )}
                    <button
                        onClick={expanded ? () => setExpanded(false) : runCritique}
                        disabled={loading}
                        style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', background: 'rgba(var(--accent-rgb, 99,102,241), 0.1)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        {loading ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : expanded ? 'Hide' : critique ? 'Show' : 'Critique'}
                    </button>
                </div>
            </div>

            {expanded && critique && (
                <div>
                    <ScoreBar label="Pacing" score={critique.pacing.score} feedback={critique.pacing.feedback} expanded={detailsOpen} />
                    <ScoreBar label="Tension" score={critique.tension.score} feedback={critique.tension.feedback} expanded={detailsOpen} />
                    <ScoreBar label="Character Voice" score={critique.characterVoice.score} feedback={critique.characterVoice.feedback} expanded={detailsOpen} />
                    <ScoreBar label="Hook Strength" score={critique.hookStrength.score} feedback={critique.hookStrength.feedback} expanded={detailsOpen} />

                    <button
                        onClick={() => setDetailsOpen(!detailsOpen)}
                        style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: '8px 0' }}
                    >
                        {detailsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {detailsOpen ? 'Hide' : 'Show'} detailed feedback
                    </button>

                    {detailsOpen && (
                        <>
                            {critique.highlights.length > 0 && (
                                <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--success, #16a34a)', marginBottom: 4 }}>✓ What worked</div>
                                    {critique.highlights.map((h, i) => (
                                        <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid var(--success, #16a34a)' }}>{h}</div>
                                    ))}
                                </div>
                            )}
                            {critique.suggestions.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--warning, #d97706)', marginBottom: 4 }}>↑ Top improvements</div>
                                    {critique.suggestions.map((s, i) => (
                                        <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid var(--warning, #d97706)' }}>
                                            {i + 1}. {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
                        Cached · <button onClick={runCritique} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.68rem' }}>Refresh</button>
                    </div>
                </div>
            )}
        </div>
    );
}
