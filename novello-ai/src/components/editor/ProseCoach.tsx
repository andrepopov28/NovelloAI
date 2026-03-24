'use client';

import { useMemo } from 'react';
import { analyzeReadability, ReadabilityMetrics } from '@/lib/readability';

interface ProseCoachProps {
    content: string; // HTML content from TipTap
}

function GaugeBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                <span style={{ color, fontWeight: 700 }}>{value}</span>
            </div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
            </div>
        </div>
    );
}

function ScorePill({ label, value, ideal, low, high }: { label: string; value: number; ideal: number; low: number; high: number }) {
    const quality = value >= low && value <= high ? 'good' : value < low ? 'low' : 'high';
    const colors = { good: 'var(--success, #16a34a)', low: 'var(--warning, #d97706)', high: 'var(--danger, #dc2626)' };
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{
                fontSize: '0.78rem', fontWeight: 700, color: colors[quality],
                background: `${colors[quality]}18`, borderRadius: 6, padding: '2px 8px'
            }}>
                {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
        </div>
    );
}

export function ProseCoach({ content }: ProseCoachProps) {
    const metrics = useMemo(() => analyzeReadability(content), [content]);
    
    if (!metrics) {
        return (
            <div style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                Start writing to see prose metrics
            </div>
        );
    }

    const { fleschKincaid, avgSentenceLength, passiveVoiceCount, adverbCount, wordCount } = metrics;
    
    // Flesch score quality
    const fleschQuality = fleschKincaid >= 60 ? 'Accessible' : fleschKincaid >= 40 ? 'Moderate' : 'Complex';
    const fleschColor = fleschKincaid >= 60 ? 'var(--success, #16a34a)' : fleschKincaid >= 40 ? 'var(--warning, #d97706)' : 'var(--danger, #dc2626)';

    return (
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                📊 Prose Coach
            </div>

            {/* Flesch-Kincaid Score */}
            <div style={{ background: 'var(--surface-secondary)', borderRadius: 10, padding: '0.75rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Readability</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: fleschColor }}>{Math.round(fleschKincaid)}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: fleschColor, fontWeight: 600, marginBottom: 6 }}>{fleschQuality}</div>
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, fleschKincaid)}%`, background: fleschColor, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    60+ accessible · 40–60 moderate · ≤40 literary
                </div>
            </div>

            {/* Prose Metrics */}
            <div style={{ background: 'var(--surface-secondary)', borderRadius: 10, padding: '0.75rem', border: '1px solid var(--border)' }}>
                <ScorePill label="Avg Sentence Length" value={avgSentenceLength} ideal={15} low={8} high={25} />
                <ScorePill label="Passive Voice %" value={passiveVoiceCount} ideal={5} low={0} high={10} />
                <ScorePill label="Adverb Count" value={adverbCount} ideal={3} low={0} high={10} />
            </div>

            {/* Word stats */}
            <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, background: 'var(--surface-secondary)', borderRadius: 8, padding: '0.6rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>{wordCount.toLocaleString()}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>words</div>
                </div>
                <div style={{ flex: 1, background: 'var(--surface-secondary)', borderRadius: 8, padding: '0.6rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{Math.ceil(wordCount / 200)}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>min read</div>
                </div>
            </div>

            {/* Tips */}
            {passiveVoiceCount > 10 && (
                <div style={{ fontSize: '0.72rem', color: 'var(--warning, #d97706)', background: 'rgba(217,119,6,0.08)', padding: '6px 10px', borderRadius: 8 }}>
                    ⚠ High passive voice — aim for under 10%
                </div>
            )}
            {adverbCount > 15 && (
                <div style={{ fontSize: '0.72rem', color: 'var(--warning, #d97706)', background: 'rgba(217,119,6,0.08)', padding: '6px 10px', borderRadius: 8 }}>
                    ⚠ Many adverbs detected — show, don't modify
                </div>
            )}
            {avgSentenceLength > 30 && (
                <div style={{ fontSize: '0.72rem', color: 'var(--warning, #d97706)', background: 'rgba(217,119,6,0.08)', padding: '6px 10px', borderRadius: 8 }}>
                    ⚠ Long sentences — consider breaking them up
                </div>
            )}
        </div>
    );
}
