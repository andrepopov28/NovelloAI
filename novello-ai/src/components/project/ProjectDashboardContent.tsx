'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, BookOpen, Eye, EyeOff, Search, Loader2, Sparkles, History, ShieldAlert, Activity } from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';
import { useEntities } from '@/lib/hooks/useEntities';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { useContextEngine } from '@/lib/hooks/useContextEngine';
import { useAI } from '@/lib/hooks/useAI';
import { useProjects } from '@/lib/hooks/useProjects';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { ChapterSidebar } from '@/components/editor/ChapterSidebar';
import { ProseCoach } from '@/components/editor/ProseCoach';
import { CritiquePanel } from '@/components/editor/CritiquePanel';
import { StreakCalendar } from '@/components/editor/StreakCalendar';
import { useWritingSession } from '@/lib/hooks/useWritingSession';
import { TemplatePickerModal } from '@/components/project/TemplatePickerModal';
import type { ChapterTemplate } from '@/lib/chapter-templates';

import { SyncIndicator } from '@/components/layout/SyncIndicator';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { VersionHistory } from '@/components/editor/VersionHistory';
import { AlertsPanel } from '@/components/editor/AlertsPanel';
import { saveVersion } from '@/lib/firestore';
import { useAuth } from '@/lib/hooks/useAuth';
import { useContinuityChecker } from '@/lib/hooks/useContinuityChecker';
import { analyzeReadability } from '@/lib/readability';
import { toast } from 'sonner';

export function ProjectDashboardContent({ projectId }: { projectId: string }) {
    const router = useRouter();

    const { chapters, loading, createChapter, deleteChapter } = useChapters(projectId);
    const { entities } = useEntities(projectId);
    const { projects } = useProjects();
    const { rollingContext, summarizing, summarizeAll } = useContextEngine(chapters);
    const { writeChapter, loading: aiLoading } = useAI('ollama', '', projectId);

    const { user } = useAuth();
    const { checkContinuity, alerts, checking, dismissAlert } = useContinuityChecker(projectId);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [passiveVoice, setPassiveVoice] = useState(false);
    const [tracing, setTracing] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);
    const [showReadability, setShowReadability] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    // Get active chapter
    const activeChapter = chapters.find((c) => c.id === activeChapterId) || null;
    const activeProject = projects.find(p => p.id === projectId);
    const readability = useMemo(() => analyzeReadability(editorContent), [editorContent]);
    const targetWords = activeProject?.targetWordCount || 80000;
    const currentWords = activeProject?.wordCount || 0;
    const progressPct = Math.min(1, currentWords / targetWords);

    // Auto-select first chapter when loaded (must be in useEffect, not render body)
    useEffect(() => {
        if (!loading && chapters.length > 0 && !activeChapterId) {
            setActiveChapterId(chapters[0].id);
            setEditorContent(chapters[0].content || '');
        }
    }, [chapters, loading, activeChapterId]);

    // Live word count for the current typing session
    const currentSessionWords = useMemo(() => {
        if (!editorContent) return 0;
        return editorContent.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).length;
    }, [editorContent]);

    const { sessions, streak, todayWords } = useWritingSession(projectId, currentSessionWords);

    // Auto-save — disabled during AI generation to prevent debounce churn while streaming
    const { syncStatus } = useAutoSave(activeChapterId, projectId, editorContent, aiLoading);

    const handleSelectChapter = useCallback(
        (chapterId: string) => {
            const ch = chapters.find((c) => c.id === chapterId);
            if (ch) {
                setActiveChapterId(ch.id);
                setEditorContent(ch.content || '');
            }
        },
        [chapters]
    );

    const handleAddChapterClick = useCallback(() => {
        setShowTemplateModal(true);
    }, []);

    const handleApplyTemplate = useCallback(async (tpl: ChapterTemplate | null) => {
        setShowTemplateModal(false);
        const startIndex = chapters.length;

        if (!tpl) {
            // Blank chapter
            const id = await createChapter({ title: `Chapter ${startIndex + 1}`, order: startIndex });
            setActiveChapterId(id);
            setEditorContent('');
        } else {
            // Bulk create from template
            let firstId: string | null = null;
            for (let i = 0; i < tpl.chapters.length; i++) {
                const chapterDef = tpl.chapters[i];
                const id = await createChapter({
                    title: chapterDef.title,
                    synopsis: chapterDef.synopsis,
                    order: startIndex + i
                });
                if (i === 0) firstId = id;
            }
            if (firstId) {
                setActiveChapterId(firstId);
                // content will update via chapter selection
            }
            toast.success(`Applied ${tpl.name} template (${tpl.chapters.length} chapters)`);
        }
    }, [chapters.length, createChapter]);

    const handleDeleteChapter = useCallback(
        async (chapterId: string) => {
            await deleteChapter(chapterId);
            if (activeChapterId === chapterId) {
                const remaining = chapters.filter((c) => c.id !== chapterId);
                if (remaining.length > 0) {
                    setActiveChapterId(remaining[0].id);
                    setEditorContent(remaining[0].content || '');
                } else {
                    setActiveChapterId(null);
                    setEditorContent('');
                }
            }
        },
        [activeChapterId, chapters, deleteChapter]
    );

    // ── Export Handlers ──────────────────────────────

    const handleExportPdf = useCallback(async () => {
        try {
            toast.info('Generating HTML for PDF print…');
            const token = user?.uid ?? 'local';
            const project = projects.find((p) => p.id === projectId);
            if (!project) throw new Error('Project not found');
            if (chapters.length === 0) throw new Error('No chapters to export');

            const res = await fetch('/api/export/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ project, chapters }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Export failed');
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeName = (project.title || 'manuscript').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'manuscript';
            a.download = `${safeName}.html`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Export generated! Open the file and Print to PDF.');
        } catch (err) {
            console.error('PDF export failed:', err);
            toast.error('PDF export failed. Please try again.');
        }
    }, [projectId, projects, chapters, user]);

    const handleExportEpub = useCallback(async () => {
        try {
            toast.info('Generating EPUB…');
            const token = user?.uid ?? 'local';
            const project = projects.find((p) => p.id === projectId);
            if (!project) throw new Error('Project not found');
            if (chapters.length === 0) throw new Error('No chapters to export');

            const res = await fetch('/api/export/epub', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ project, chapters }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Export failed');
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeName = (project.title || 'manuscript').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'manuscript';
            a.download = `${safeName}.epub`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('EPUB exported successfully!');
        } catch (err) {
            console.error('EPUB export failed:', err);
            toast.error('EPUB export failed. Please try again.');
        }
    }, [projectId, projects, chapters, user]);

    const handleSaveSnapshot = useCallback(async () => {
        if (!activeChapterId || !user) return;
        try {
            await saveVersion(activeChapterId, user.uid, editorContent, 'manual');
            toast.success('Version snapshot saved');
        } catch (err) {
            console.error('Failed to save version:', err);
            toast.error('Failed to save version snapshot');
        }
    }, [activeChapterId, user, editorContent]);

    const handleRestoreVersion = useCallback((content: string) => {
        setEditorContent(content);
        toast.success('Version restored. Auto-save will persist changes shortly.');
    }, []);

    // ── AI Feature Handlers ──────────────────────────

    const handleTraceEntities = useCallback(async () => {
        setTracing(true);
        try {
            const token = user?.uid ?? 'local';
            const res = await fetch('/api/ai/trace', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                // Pass IndexedDB data directly — server has no Firestore access in local mode
                body: JSON.stringify({ chapters, entities }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Entity tracing complete. ${data.traced} entities updated.`);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Trace failed:', err);
            toast.error('Entity tracing failed.');
        } finally {
            setTracing(false);
        }
    }, [chapters, entities, user]);

    const handleSummarize = useCallback(async () => {
        toast.info('Building chapter summaries…');
        await summarizeAll();
        toast.success('Context engine updated!');
    }, [summarizeAll]);

    const handleAutoWriteChapter = useCallback(async () => {
        if (!activeChapter) return;
        const project = projects.find(p => p.id === projectId);
        const context = project ? `Synopsis: ${project.synopsis}\nGenre: ${project.genre}` : rollingContext;

        toast.info(`Writing "${activeChapter.title}" with AI...`);

        try {
            const stream = await writeChapter(
                activeChapter.title,
                activeChapter.synopsis || '',
                context,
                project?.styleProfile,
                editorContent
            );
            if (!stream) return;

            setEditorContent(''); // Clear for streaming
            let fullContent = '';
            const reader = stream.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunkText = decoder.decode(value, { stream: true });
                const lines = chunkText.split('\n');
                for (const line of lines) {
                    if (line.startsWith('0:')) {
                        try {
                            const text = JSON.parse(line.slice(2));
                            fullContent += text;
                            setEditorContent(fullContent);
                        } catch { /* skip */ }
                    }
                }
            }
            toast.success('Chapter written!');
        } catch (err) {
            console.error('Auto-write failed:', err);
            toast.error('Failed to auto-write chapter.');
        }
    }, [activeChapter, projects, projectId, rollingContext, writeChapter]);

    return (
        <div className="flex h-[calc(100vh-var(--nav-height))]">
            {/* Chapter Sidebar */}
            <ChapterSidebar
                chapters={chapters}
                activeChapterId={activeChapterId}
                onSelect={handleSelectChapter}
                onAdd={handleAddChapterClick}
                onDelete={handleDeleteChapter}
            />

            {/* Main Editor */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div
                    className="flex items-center justify-between px-6 py-3 border-b"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface-secondary)' }}
                >
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/app')}
                            className="p-2 rounded-[var(--radius-md)] transition-all hover:bg-[var(--surface-tertiary)] cursor-pointer"
                            style={{ color: 'var(--text-tertiary)' }}
                            aria-label="Back to dashboard"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {activeChapter?.title || 'Select a chapter'}
                        </span>
                        <SyncIndicator status={syncStatus} />

                        {/* Word Count Progress */}
                        {activeProject && (
                            <div className="flex items-center gap-2 ml-4 px-3 py-1.5 rounded-lg bg-[var(--surface-primary)] border border-[var(--border)]">
                                <div className="flex flex-col gap-1 w-24">
                                    <div className="flex justify-between items-center text-[10px] font-medium text-[var(--text-tertiary)]">
                                        <span>{currentWords.toLocaleString()} w</span>
                                        <span>{Math.round(progressPct * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-500" 
                                            style={{ 
                                                width: `${progressPct * 100}%`,
                                                background: progressPct >= 0.8 ? '#10b981' : progressPct >= 0.3 ? '#f59e0b' : '#ef4444'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Passive Voice Toggle */}
                        <button
                            onClick={() => setPassiveVoice((p) => !p)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all cursor-pointer ${passiveVoice ? 'text-white' : ''
                                }`}
                            style={{
                                ...(passiveVoice
                                    ? { background: '#f59e0b', color: 'white' }
                                    : { color: 'var(--text-tertiary)' }),
                            }}
                            title="Toggle passive voice highlighting"
                            aria-label={passiveVoice ? "Disable passive voice highlighting" : "Enable passive voice highlighting"}
                            aria-pressed={passiveVoice}
                        >
                            {passiveVoice ? <EyeOff size={13} /> : <Eye size={13} />}
                            Passive
                        </button>

                        {/* Trace Entities */}
                        <button
                            onClick={handleTraceEntities}
                            disabled={tracing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all hover:bg-[var(--surface-tertiary)] cursor-pointer"
                            style={{ color: 'var(--text-tertiary)' }}
                            title="Scan chapters for entity mentions"
                            aria-label="Scan chapters for entity mentions"
                        >
                            {tracing ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                            Trace
                        </button>

                        {/* Continuity Check */}
                        <button
                            onClick={() => setShowAlerts(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all hover:bg-[var(--surface-tertiary)] cursor-pointer ${alerts.length > 0 ? 'text-orange-500' : 'text-[var(--text-tertiary)]'
                                }`}
                            title="Check for continuity errors"
                            aria-label="Check for continuity errors"
                        >
                            {checking ? <Loader2 size={13} className="animate-spin" /> : <ShieldAlert size={13} />}
                            Check
                            {alerts.length > 0 && (
                                <span className="bg-orange-500 text-white text-[10px] px-1 rounded-full">{alerts.length}</span>
                            )}
                        </button>

                        {/* Readability Score */}
                        <div className="relative">
                            <button
                                onClick={() => setShowReadability(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all hover:bg-[var(--surface-tertiary)] cursor-pointer ${showReadability ? 'text-[#8b5cf6]' : 'text-[var(--text-tertiary)]'}`}
                                title="Chapter Readability & Pacing Analysis"
                            >
                                <Activity size={13} />
                                Metrics
                            </button>

                            {/* Popup Readability */}
                            {showReadability && (
                                <div className="absolute top-10 right-0 w-64 p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] shadow-lg z-50">
                                    <h4 className="text-sm font-bold mb-3 text-[var(--text-primary)]">Readability Analysis</h4>
                                    
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-[var(--text-tertiary)]">Grade Level</span>
                                        <span className="text-xs font-semibold" style={{ color: readability.fleschKincaid > 70 ? '#10b981' : '#f59e0b' }}>
                                            {readability.gradeLevel}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-[var(--text-tertiary)]">Flesch Reading Ease</span>
                                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                                            {readability.fleschKincaid} / 100
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-[var(--text-tertiary)]">Est. Reading Time</span>
                                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                                            {readability.readingTimeMinutes} min
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-[var(--text-tertiary)]">Words / Sentences</span>
                                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                                            {readability.wordCount} / {readability.sentenceCount}
                                        </span>
                                    </div>
                                    
                                    <div className="mt-4 text-[10px] text-[var(--text-tertiary)] leading-normal">
                                        Higher score (70+) means easier to read. Bestselling fiction targets 6th-8th grade readability.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Summarize / Context */}
                        <button
                            onClick={handleSummarize}
                            disabled={summarizing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all hover:bg-[var(--surface-tertiary)] cursor-pointer"
                            style={{ color: rollingContext ? 'var(--accent)' : 'var(--text-tertiary)' }}
                            title="Build rolling context from chapter summaries"
                            aria-label="Build rolling context from chapter summaries"
                        >
                            {summarizing ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />}
                            Context
                        </button>

                        {/* Write with AI */}
                        {activeChapter && (editorContent.length < 50) && (
                            <Button
                                onClick={handleAutoWriteChapter}
                                disabled={aiLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all cursor-pointer bg-accent-warm hover:bg-accent-warm-strong text-white border-none"
                            >
                                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                                Write with AI
                            </Button>
                        )}

                        {/* Version History Toggle */}
                        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
                        <Button
                            variant="ghost"
                            onClick={() => setShowHistory(true)}
                            title="Version History"
                            aria-label="Open version history"
                            className="px-2"
                        >
                            <History size={16} />
                        </Button>

                        {/* Export Buttons */}
                        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

                        <Button variant="secondary" size="sm" onClick={handleExportPdf} disabled={chapters.length === 0}>
                            <Download size={13} />
                            Export PDF
                        </Button>
                        <Button variant="secondary" onClick={handleExportEpub} disabled={chapters.length === 0}>
                            <Download size={14} />
                            EPUB
                        </Button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-primary)' }}>
                    {loading ? (
                        <div className="max-w-4xl px-10 py-8 space-y-3">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                    ) : activeChapter ? (
                        <div className="max-w-4xl px-10 py-8">
                            {/* Chapter Title */}
                            <h1
                                style={{
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '1.6rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.25rem',
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1.2,
                                }}
                            >
                                {activeChapter.title}
                            </h1>
                            <div
                                style={{
                                    height: '1px',
                                    background: 'var(--border)',
                                    marginBottom: '0.5rem',
                                }}
                            />
                            <TipTapEditor
                                content={editorContent}
                                onChange={setEditorContent}
                                placeholder="Begin writing your chapter..."
                                entities={entities}
                                passiveVoiceEnabled={passiveVoice}
                                rollingContext={rollingContext}
                                projectId={projectId}
                                chapterId={activeChapterId || undefined}
                                editable={!aiLoading}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                {chapters.length === 0
                                    ? 'Add a chapter to start writing.'
                                    : 'Select a chapter from the sidebar.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar (AI Tools & Stats) */}
            <aside 
                className="flex flex-col h-full border-l overflow-y-auto w-[var(--sidebar-width)] xl:w-80 shrink-0"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-primary)' }}
            >
                <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <StreakCalendar 
                        sessions={sessions} 
                        streak={streak} 
                        todayWords={todayWords} 
                        dailyGoal={activeProject?.targetWordCount ? Math.floor(activeProject.targetWordCount / 90) : 500} 
                    />
                </div>
                
                {activeChapter && (
                    <>
                        <ProseCoach content={editorContent} />
                        <CritiquePanel 
                            chapterId={activeChapter.id}
                            chapterTitle={activeChapter.title}
                            chapterContent={editorContent}
                            projectId={projectId}
                            context={rollingContext}
                        />
                    </>
                )}
            </aside>

            {/* Version History Panel */}
            <VersionHistory
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                chapterId={activeChapterId || ''}
                currentContent={editorContent}
                onRestore={handleRestoreVersion}
                onSaveSnapshot={handleSaveSnapshot}
            />

            {/* Alerts Panel */}
            <AlertsPanel
                isOpen={showAlerts}
                onClose={() => setShowAlerts(false)}
                alerts={alerts}
                checking={checking}
                onDismiss={dismissAlert}
                onCheckNow={() => activeChapterId && checkContinuity(editorContent, activeChapterId)}
            />

            {/* Template Picker Modal */}
            {showTemplateModal && (
                <TemplatePickerModal
                    onSelect={handleApplyTemplate}
                    onClose={() => setShowTemplateModal(false)}
                />
            )}
        </div>
    );
}
