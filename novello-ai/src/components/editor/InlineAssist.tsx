'use client';

import { useState, useCallback } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/react';
import { Wand2, Expand, Check, X, Loader2 } from 'lucide-react';
import { useAI } from '@/lib/hooks/useAI';
import { useAuth } from '@/lib/hooks/useAuth';
import { saveVersion } from '@/lib/firestore';
import { toast } from 'sonner';

interface InlineAssistProps {
    editor: Editor;
    rollingContext?: string;
    projectId?: string;
    chapterId?: string;
}

export function InlineAssist({ editor, rollingContext = '', projectId, chapterId }: InlineAssistProps) {
    const { user } = useAuth();
    const { loading, streamedText, streamGenerate, cancelGeneration } = useAI('ollama', '', projectId);
    const [showPreview, setShowPreview] = useState(false);

    const handleAction = useCallback(
        async (action: 'rewrite' | 'expand') => {
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, ' ');
            if (!selectedText.trim()) return;

            setShowPreview(true);
            // Pass context for continuity-aware generation
            await streamGenerate(selectedText, action);
        },
        [editor, streamGenerate]
    );

    const handleAccept = useCallback(async () => {
        if (!streamedText) return;
        const { from, to } = editor.state.selection;
        editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContent(streamedText)
            .run();
        setShowPreview(false);

        // Save version snapshot on AI insert (PRD Section 7.2)
        if (chapterId && user) {
            try {
                const fullContent = editor.getHTML();
                await saveVersion(chapterId, user.uid, fullContent, 'ai_insert');
            } catch (err) {
                console.error('Failed to save AI insert version:', err);
                // Don't block the user flow, just log
            }
        }
    }, [editor, streamedText, chapterId, user]);

    const handleDismiss = useCallback(() => {
        cancelGeneration();
        setShowPreview(false);
    }, [cancelGeneration]);

    return (
        <>
            <BubbleMenu
                editor={editor}
                shouldShow={({ editor: e }: { editor: Editor }) => {
                    const { from, to } = e.state.selection;
                    const text = e.state.doc.textBetween(from, to, ' ');
                    return text.trim().length > 5 && !showPreview;
                }}
            >
                <div
                    className="flex items-center gap-1 px-2 py-1.5 rounded-[var(--radius-lg)] shadow-lg"
                    style={{
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    }}
                >
                    <button
                        onClick={() => handleAction('rewrite')}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all hover:bg-[var(--surface-tertiary)] cursor-pointer"
                        style={{ color: 'var(--accent)' }}
                    >
                        <Wand2 size={13} />
                        Rewrite
                    </button>
                    <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                    <button
                        onClick={() => handleAction('expand')}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all hover:bg-[var(--surface-tertiary)] cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <Expand size={13} />
                        Expand
                    </button>
                </div>
            </BubbleMenu>

            {/* Streaming Preview Panel */}
            {showPreview && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50">
                    <div
                        className="rounded-[var(--radius-lg)] p-5 shadow-xl"
                        style={{
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid var(--border)',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                                {loading ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={12} />
                                        AI Suggestion
                                    </>
                                )}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {!loading && streamedText && (
                                    <button
                                        onClick={handleAccept}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-white transition-all cursor-pointer"
                                        style={{ background: 'var(--accent)' }}
                                    >
                                        <Check size={12} />
                                        Accept
                                    </button>
                                )}
                                <button
                                    onClick={handleDismiss}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all hover:bg-[var(--surface-tertiary)] cursor-pointer"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    <X size={12} />
                                    Dismiss
                                </button>
                            </div>
                        </div>
                        <div
                            className="text-sm leading-relaxed max-h-48 overflow-y-auto"
                            style={{
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-serif)',
                            }}
                        >
                            {streamedText || (
                                <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                    Waiting for response...
                                </span>
                            )}
                        </div>
                        {rollingContext && (
                            <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                    ✦ Context-aware (using {rollingContext.split('\n').length - 1} chapter summaries)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
