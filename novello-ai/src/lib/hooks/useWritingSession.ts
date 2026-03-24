import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { saveWritingSession, getSessionForDate, getSessionsForProject } from '@/lib/local-db';
import { WritingSession } from '@/lib/types';

// Returns today's date in YYYY-MM-DD format
function today() {
    return new Date().toISOString().slice(0, 10);
}

function makeId(projectId: string, date: string) {
    return `${projectId}-${date}`;
}

/**
 * useWritingSession — tracks daily word counts and streak for a project.
 * Call it once in the writing IDE and pass the current editor word count.
 */
export function useWritingSession(projectId: string, currentWordCount: number) {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<WritingSession[]>([]);
    const [sessionStart, setSessionStart] = useState<number>(Date.now());
    const [baselineWords, setBaselineWords] = useState<number>(0);
    const [initialized, setInitialized] = useState(false);

    // Load all sessions on mount
    useEffect(() => {
        if (!projectId) return;
        getSessionsForProject(projectId).then(s => {
            setSessions(s);
            setInitialized(true);
        });
    }, [projectId]);

    // Set baseline on init to compute session delta correctly
    useEffect(() => {
        if (initialized && currentWordCount > 0 && baselineWords === 0) {
            setBaselineWords(currentWordCount);
            setSessionStart(Date.now());
        }
    }, [initialized, currentWordCount, baselineWords]);

    // Auto-save session every 60 seconds while typing
    useEffect(() => {
        if (!initialized || !projectId || !user?.uid) return;
        const interval = setInterval(async () => {
            const wordsThisSession = Math.max(0, currentWordCount - baselineWords);
            const date = today();
            const id = makeId(projectId, date);
            const existing = await getSessionForDate(projectId, date);
            const session: WritingSession = {
                id,
                projectId,
                userId: user.uid,
                date,
                wordsWritten: (existing?.wordsWritten || 0) + wordsThisSession,
                sessionStartedAt: existing?.sessionStartedAt || sessionStart,
                updatedAt: Date.now(),
            };
            await saveWritingSession(session);
            // Update local cache
            setSessions(prev => {
                const idx = prev.findIndex(s => s.id === id);
                if (idx >= 0) { const n = [...prev]; n[idx] = session; return n; }
                return [...prev, session];
            });
            // Reset baseline
            setBaselineWords(currentWordCount);
        }, 60_000);
        return () => clearInterval(interval);
    }, [initialized, projectId, user, currentWordCount, baselineWords, sessionStart]);

    // Manually record a snapshot (call on chapter save)
    const recordSnapshot = useCallback(async () => {
        if (!projectId || !user?.uid) return;
        const wordsThisSession = Math.max(0, currentWordCount - baselineWords);
        if (wordsThisSession === 0) return;
        const date = today();
        const id = makeId(projectId, date);
        const existing = await getSessionForDate(projectId, date);
        const session: WritingSession = {
            id,
            projectId,
            userId: user.uid,
            date,
            wordsWritten: (existing?.wordsWritten || 0) + wordsThisSession,
            sessionStartedAt: existing?.sessionStartedAt || sessionStart,
            updatedAt: Date.now(),
        };
        await saveWritingSession(session);
        setSessions(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (idx >= 0) { const n = [...prev]; n[idx] = session; return n; }
            return [...prev, session];
        });
        setBaselineWords(currentWordCount);
    }, [projectId, user, currentWordCount, baselineWords, sessionStart]);

    // Compute streak
    const streak = (() => {
        const sessionDates = new Set(sessions.map(s => s.date));
        const t = today();
        let count = 0;
        let cursor = new Date(t);
        while (sessionDates.has(cursor.toISOString().slice(0, 10))) {
            count++;
            cursor.setDate(cursor.getDate() - 1);
        }
        return count;
    })();

    const todayWords = sessions.find(s => s.date === today())?.wordsWritten || 0;

    return { sessions, streak, todayWords, recordSnapshot };
}
