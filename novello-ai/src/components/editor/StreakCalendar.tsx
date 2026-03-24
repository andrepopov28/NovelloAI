'use client';

import { WritingSession } from '@/lib/types';
import { useMemo } from 'react';
import { Flame, Calendar, Trophy } from 'lucide-react';

interface StreakCalendarProps {
    sessions: WritingSession[];
    streak: number;
    todayWords: number;
    dailyGoal?: number;
}

function today() { return new Date().toISOString().slice(0, 10); }

function getLast12Weeks(): string[] {
    const dates: string[] = [];
    const d = new Date();
    for (let i = 83; i >= 0; i--) {
        const cursor = new Date(d);
        cursor.setDate(d.getDate() - i);
        dates.push(cursor.toISOString().slice(0, 10));
    }
    return dates; // 84 = 12 weeks
}

function getIntensity(words: number, goal: number): 0 | 1 | 2 | 3 | 4 {
    if (words === 0) return 0;
    if (words < goal * 0.25) return 1;
    if (words < goal * 0.5) return 2;
    if (words < goal) return 3;
    return 4;
}

const INTENSITY_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: 'var(--border)',
    1: 'rgba(var(--accent-rgb, 99,102,241), 0.2)',
    2: 'rgba(var(--accent-rgb, 99,102,241), 0.4)',
    3: 'rgba(var(--accent-rgb, 99,102,241), 0.7)',
    4: 'var(--accent)',
};

export function StreakCalendar({ sessions, streak, todayWords, dailyGoal = 500 }: StreakCalendarProps) {
    const sessionMap = useMemo(() => {
        const m: Record<string, number> = {};
        sessions.forEach(s => { m[s.date] = (m[s.date] || 0) + s.wordsWritten; });
        return m;
    }, [sessions]);

    const dates = getLast12Weeks();
    const todayDate = today();

    return (
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
            {/* Header stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, background: 'var(--surface-secondary)', borderRadius: 8, padding: '0.5rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                        <Flame size={12} color="#f97316" />
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: streak > 0 ? '#f97316' : 'var(--text-secondary)' }}>{streak}</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>day streak</div>
                </div>
                <div style={{ flex: 1, background: 'var(--surface-secondary)', borderRadius: 8, padding: '0.5rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 2 }}>{todayWords.toLocaleString()}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>today</div>
                </div>
                <div style={{ flex: 1, background: 'var(--surface-secondary)', borderRadius: 8, padding: '0.5rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                        <Trophy size={12} color="var(--accent)" />
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{sessions.length}</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>active days</div>
                </div>
            </div>

            {/* Today's progress bar */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                    <span>Today's Goal</span>
                    <span style={{ fontWeight: 600, color: todayWords >= dailyGoal ? 'var(--success, #16a34a)' : 'var(--text-secondary)' }}>
                        {todayWords} / {dailyGoal} words
                    </span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${Math.min(100, (todayWords / dailyGoal) * 100)}%`,
                        background: todayWords >= dailyGoal ? 'var(--success, #16a34a)' : 'var(--accent)',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                    }} />
                </div>
            </div>

            {/* Contribution-style heatmap grid */}
            <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={10} /> 12-week writing activity
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                    {Array.from({ length: 12 }, (_, week) => (
                        <div key={week} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {dates.slice(week * 7, week * 7 + 7).map(date => {
                                const words = sessionMap[date] || 0;
                                const intensity = getIntensity(words, dailyGoal);
                                const isToday = date === todayDate;
                                return (
                                    <div
                                        key={date}
                                        title={`${date}: ${words.toLocaleString()} words`}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            borderRadius: 2,
                                            background: INTENSITY_COLORS[intensity],
                                            outline: isToday ? '1px solid var(--accent)' : 'none',
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>Less</span>
                    {([0, 1, 2, 3, 4] as const).map(i => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: INTENSITY_COLORS[i] }} />
                    ))}
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>More</span>
                </div>
            </div>
        </div>
    );
}
