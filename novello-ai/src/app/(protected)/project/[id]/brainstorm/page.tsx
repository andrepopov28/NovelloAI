'use client';

import { useState, use, useCallback, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Lightbulb,
    Sparkles,
    BookOpen,
    Loader2,
    Plus,
    AlertCircle,
    StickyNote,
    Network,
    ListOrdered,
    X,
    GripVertical,
    Palette,
    Trash2,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAI } from '@/lib/hooks/useAI';
import { useChapters } from '@/lib/hooks/useChapters';
import { OutlineResult } from '@/lib/types';
import { toast } from 'sonner';

// ─── Post-It Note ──────────────────────
interface PostIt {
    id: string;
    text: string;
    color: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

// ─── Mind Map Node ──────────────────────
interface MindNode {
    id: string;
    label: string;
    children: MindNode[];
    expanded: boolean;
    color: string;
}

const postItColors = [
    '#FEF3C7', // amber
    '#DBEAFE', // blue
    '#D1FAE5', // green
    '#FCE7F3', // pink
    '#E9D5FF', // purple
    '#FED7AA', // orange
];

const mindMapCategories = [
    { label: 'Characters', color: '#8B5CF6' },
    { label: 'Plot Points', color: '#06B6D4' },
    { label: 'Settings', color: '#10B981' },
    { label: 'Themes', color: '#F59E0B' },
    { label: 'Conflicts', color: '#EF4444' },
];

type Tab = 'outline' | 'whiteboard' | 'mindmap';

export default function BrainstormPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const router = useRouter();
    const { loading: aiLoading, error: aiError, generateOutline, clearError } = useAI('ollama', '', projectId);
    const { createChapter } = useChapters(projectId);

    const [activeTab, setActiveTab] = useState<Tab>('outline');
    const [premise, setPremise] = useState('');
    const [genre, setGenre] = useState('');
    const [outline, setOutline] = useState<OutlineResult | null>(null);
    const [applying, setApplying] = useState(false);

    // ─── Whiteboard State ───
    const [postIts, setPostIts] = useState<PostIt[]>([]);
    const [editingPostIt, setEditingPostIt] = useState<string | null>(null);
    const whiteboardRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

    // ─── Mind Map State ───
    const [mindMap, setMindMap] = useState<MindNode>(() => ({
        id: 'root',
        label: 'Story Premise',
        expanded: true,
        color: '#d4a843',
        children: mindMapCategories.map((cat) => ({
            id: cat.label.toLowerCase().replace(/\s/g, '-'),
            label: cat.label,
            color: cat.color,
            expanded: true,
            children: [],
        })),
    }));

    // ─── Outline Handlers ───
    const handleGenerate = useCallback(async () => {
        if (!premise.trim()) {
            toast.error('Please enter a premise first.');
            return;
        }
        clearError();
        const result = await generateOutline(premise, genre);
        if (result) {
            setOutline(result);
            toast.success(`Generated ${result.chapters.length} chapters!`);
        }
    }, [premise, genre, generateOutline, clearError]);

    const handleApplyToProject = useCallback(async () => {
        if (!outline) return;
        setApplying(true);
        try {
            for (let i = 0; i < outline.chapters.length; i++) {
                const ch = outline.chapters[i];
                await createChapter({ title: ch.title, order: i, synopsis: ch.synopsis });
            }
            toast.success('Chapters created! Redirecting to editor...');
            setTimeout(() => router.push(`/project/${projectId}`), 1000);
        } catch {
            toast.error('Failed to create chapters. Please try again.');
        } finally {
            setApplying(false);
        }
    }, [outline, createChapter, projectId, router]);

    // ─── Whiteboard Handlers ───
    const addPostIt = useCallback(() => {
        const wb = whiteboardRef.current;
        const newPostIt: PostIt = {
            id: `note-${Date.now()}`,
            text: '',
            color: postItColors[Math.floor(Math.random() * postItColors.length)],
            x: wb ? Math.random() * (wb.offsetWidth - 180) : 100,
            y: wb ? Math.random() * (wb.offsetHeight - 160) : 100,
            width: 180,
            height: 150,
        };
        setPostIts((prev) => [...prev, newPostIt]);
        setEditingPostIt(newPostIt.id);
    }, []);

    const updatePostIt = useCallback((id: string, updates: Partial<PostIt>) => {
        setPostIts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    }, []);

    const deletePostIt = useCallback((id: string) => {
        setPostIts((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const handleMouseDown = useCallback((e: ReactMouseEvent, id: string) => {
        const postIt = postIts.find((p) => p.id === id);
        if (!postIt) return;
        dragRef.current = {
            id,
            offsetX: e.clientX - postIt.x,
            offsetY: e.clientY - postIt.y,
        };
    }, [postIts]);

    useEffect(() => {
        const handleMouseMove = (e: globalThis.MouseEvent) => {
            if (!dragRef.current || !whiteboardRef.current) return;
            const rect = whiteboardRef.current.getBoundingClientRect();
            const newX = Math.max(0, Math.min(e.clientX - dragRef.current.offsetX, rect.width - 180));
            const newY = Math.max(0, Math.min(e.clientY - dragRef.current.offsetY, rect.height - 150));
            updatePostIt(dragRef.current.id, { x: newX, y: newY });
        };
        const handleMouseUp = () => { dragRef.current = null; };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [updatePostIt]);

    // ─── Mind Map Handlers ───
    const toggleExpand = useCallback((nodeId: string) => {
        const toggle = (node: MindNode): MindNode => {
            if (node.id === nodeId) return { ...node, expanded: !node.expanded };
            return { ...node, children: node.children.map(toggle) };
        };
        setMindMap((prev) => toggle(prev));
    }, []);

    const addChild = useCallback((parentId: string) => {
        const insert = (node: MindNode): MindNode => {
            if (node.id === parentId) {
                return {
                    ...node,
                    expanded: true,
                    children: [
                        ...node.children,
                        {
                            id: `node-${Date.now()}`,
                            label: 'New idea...',
                            color: node.color,
                            expanded: true,
                            children: [],
                        },
                    ],
                };
            }
            return { ...node, children: node.children.map(insert) };
        };
        setMindMap((prev) => insert(prev));
    }, []);

    const updateNodeLabel = useCallback((nodeId: string, label: string) => {
        const update = (node: MindNode): MindNode => {
            if (node.id === nodeId) return { ...node, label };
            return { ...node, children: node.children.map(update) };
        };
        setMindMap((prev) => update(prev));
    }, []);

    const deleteNode = useCallback((nodeId: string) => {
        const remove = (node: MindNode): MindNode => ({
            ...node,
            children: node.children.filter((c) => c.id !== nodeId).map(remove),
        });
        setMindMap((prev) => remove(prev));
    }, []);

    // ─── Render Mind Map Node ───
    const renderMindNode = (node: MindNode, depth: number = 0, isRoot: boolean = false) => (
        <div key={node.id} className="mind-node-wrap" style={{ marginLeft: depth * 24 }}>
            <div
                className={`mind-node ${isRoot ? 'mind-node-root' : ''}`}
                style={{ borderLeftColor: node.color }}
            >
                <button
                    className="mind-toggle"
                    onClick={() => toggleExpand(node.id)}
                    style={{ visibility: node.children.length > 0 ? 'visible' : 'hidden' }}
                >
                    {node.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <input
                    className="mind-label"
                    value={node.label}
                    onChange={(e) => updateNodeLabel(node.id, e.target.value)}
                    style={{ color: isRoot ? 'var(--accent-warm)' : 'var(--text-primary)' }}
                />
                <button className="mind-add" onClick={() => addChild(node.id)} title="Add child">
                    <Plus size={12} />
                </button>
                {!isRoot && (
                    <button className="mind-delete" onClick={() => deleteNode(node.id)} title="Delete">
                        <X size={12} />
                    </button>
                )}
            </div>
            {node.expanded && node.children.map((child) => renderMindNode(child, depth + 1))}
        </div>
    );

    // ─── Tab UI ───
    const tabs: { key: Tab; label: string; icon: typeof ListOrdered }[] = [
        { key: 'outline', label: 'Outline', icon: ListOrdered },
        { key: 'whiteboard', label: 'Whiteboard', icon: StickyNote },
        { key: 'mindmap', label: 'Mind Map', icon: Network },
    ];

    return (
        <div className="brainstorm-root">
            <div className="brainstorm-container">
                {/* Header */}
                <div className="brainstorm-header">
                    <button
                        onClick={() => router.push(`/project/${projectId}`)}
                        className="back-btn"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <Lightbulb size={20} className="header-icon" />
                    <h1 className="header-title">Brainstorm</h1>
                </div>

                {/* Tabs */}
                <div className="tab-bar">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.key}
                                className={`tab-btn ${activeTab === t.key ? 'tab-active' : ''}`}
                                onClick={() => setActiveTab(t.key)}
                            >
                                <Icon size={14} />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* ═══ OUTLINE TAB ═══ */}
                {activeTab === 'outline' && (
                    <div className="tab-content">
                        <Card className="p-6 mb-6">
                            <label className="input-label">Your Premise</label>
                            <textarea
                                value={premise}
                                onChange={(e) => setPremise(e.target.value)}
                                placeholder="Describe your story idea..."
                                rows={5}
                                className="premise-textarea"
                            />
                            <div className="premise-actions">
                                <div className="genre-wrap">
                                    <label className="genre-label">Genre (optional)</label>
                                    <input
                                        value={genre}
                                        onChange={(e) => setGenre(e.target.value)}
                                        placeholder="e.g., Mystery, Sci-Fi"
                                        className="genre-input"
                                    />
                                </div>
                                <Button onClick={handleGenerate} disabled={aiLoading || !premise.trim()}>
                                    {aiLoading ? (
                                        <><Loader2 size={14} className="animate-spin" /> Generating...</>
                                    ) : (
                                        <><Sparkles size={14} /> Generate Outline</>
                                    )}
                                </Button>
                            </div>
                        </Card>

                        {aiError && (
                            <div className="error-banner">
                                <AlertCircle size={16} />
                                <span>{aiError}</span>
                            </div>
                        )}

                        {outline && (
                            <div>
                                <div className="outline-header">
                                    <div className="outline-header-left">
                                        <BookOpen size={16} />
                                        <h2 className="outline-count">
                                            Generated Outline — {outline.chapters.length} Chapters
                                        </h2>
                                    </div>
                                    <Button onClick={handleApplyToProject} disabled={applying}>
                                        {applying ? (
                                            <><Loader2 size={14} className="animate-spin" /> Creating...</>
                                        ) : (
                                            <><Plus size={14} /> Apply to Project</>
                                        )}
                                    </Button>
                                </div>
                                <div className="outline-list">
                                    {outline.chapters.map((ch, idx) => (
                                        <Card key={idx} className="p-4">
                                            <div className="outline-item">
                                                <span className="outline-num">{idx + 1}</span>
                                                <div>
                                                    <h3 className="outline-ch-title">{ch.title}</h3>
                                                    <p className="outline-ch-synopsis">{ch.synopsis}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!outline && !aiLoading && (
                            <div className="empty-state">
                                <Sparkles size={40} className="empty-icon" />
                                <p>Enter your story premise above and click <strong>Generate Outline</strong> to create a chapter structure.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ WHITEBOARD TAB ═══ */}
                {activeTab === 'whiteboard' && (
                    <div className="tab-content">
                        <div className="whiteboard-toolbar">
                            <Button onClick={addPostIt}>
                                <Plus size={14} /> Add Note
                            </Button>
                            <span className="whiteboard-count">{postIts.length} notes</span>
                        </div>

                        <div className="whiteboard" ref={whiteboardRef}>
                            {/* Grid pattern */}
                            <div className="whiteboard-grid" />

                            {postIts.length === 0 && (
                                <div className="whiteboard-empty">
                                    <StickyNote size={40} />
                                    <p>Click <strong>Add Note</strong> to start brainstorming</p>
                                </div>
                            )}

                            {postIts.map((note) => (
                                <div
                                    key={note.id}
                                    className="postit"
                                    style={{
                                        left: note.x,
                                        top: note.y,
                                        width: note.width,
                                        background: note.color,
                                    }}
                                >
                                    <div
                                        className="postit-header"
                                        onMouseDown={(e) => handleMouseDown(e, note.id)}
                                    >
                                        <GripVertical size={12} className="postit-grip" />
                                        <div className="postit-colors">
                                            {postItColors.map((c) => (
                                                <button
                                                    key={c}
                                                    className="postit-color-dot"
                                                    style={{ background: c }}
                                                    onClick={() => updatePostIt(note.id, { color: c })}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            className="postit-delete"
                                            onClick={() => deletePostIt(note.id)}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                    <textarea
                                        className="postit-text"
                                        value={note.text}
                                        onChange={(e) => updatePostIt(note.id, { text: e.target.value })}
                                        placeholder="Type your idea..."
                                        autoFocus={editingPostIt === note.id}
                                        onClick={() => setEditingPostIt(note.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ MIND MAP TAB ═══ */}
                {activeTab === 'mindmap' && (
                    <div className="tab-content">
                        <Card className="mindmap-card">
                            <div className="mindmap-header">
                                <Network size={16} />
                                <span>Mind Map</span>
                            </div>
                            <div className="mindmap-tree">
                                {renderMindNode(mindMap, 0, true)}
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            <style jsx>{`
                .brainstorm-root {
                    min-height: calc(100vh - var(--nav-height));
                    background: var(--surface-primary);
                    padding: 24px;
                }
                .brainstorm-container {
                    max-width: 960px;
                    margin: 0 auto;
                }

                /* Header */
                .brainstorm-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .back-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .back-btn:hover {
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                }
                .header-icon { color: var(--accent-warm); }
                .header-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                /* Tabs */
                .tab-bar {
                    display: flex;
                    gap: 4px;
                    padding: 4px;
                    background: var(--surface-secondary);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    margin-bottom: 20px;
                }
                .tab-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 10px;
                    border-radius: var(--radius-sm);
                    border: none;
                    background: transparent;
                    color: var(--text-tertiary);
                    font-size: 0.82rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .tab-btn:hover {
                    color: var(--text-primary);
                    background: var(--surface-tertiary);
                }
                .tab-active {
                    background: var(--accent-warm-muted) !important;
                    color: var(--accent-warm) !important;
                    box-shadow: var(--shadow-sm);
                }

                .tab-content { animation: fadeIn 0.2s ease; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                /* ── Outline Tab ── */
                .input-label {
                    display: block;
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }
                .premise-textarea {
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                    font-size: 0.88rem;
                    line-height: 1.7;
                    resize: none;
                    outline: none;
                    font-family: var(--font-serif);
                }
                .premise-textarea:focus { border-color: var(--accent-warm); }
                .premise-actions {
                    display: flex;
                    align-items: flex-end;
                    gap: 12px;
                    margin-top: 12px;
                }
                .genre-wrap { flex: 1; }
                .genre-label {
                    display: block;
                    font-size: 0.72rem;
                    font-weight: 600;
                    color: var(--text-tertiary);
                    margin-bottom: 6px;
                }
                .genre-input {
                    width: 100%;
                    padding: 8px 12px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                    font-size: 0.82rem;
                    outline: none;
                }
                .genre-input:focus { border-color: var(--accent-warm); }

                .error-banner {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px;
                    border-radius: var(--radius-md);
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    font-size: 0.82rem;
                    margin-bottom: 16px;
                }
                .outline-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }
                .outline-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--accent-warm);
                }
                .outline-count {
                    font-size: 0.88rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .outline-list { display: flex; flex-direction: column; gap: 8px; }
                .outline-item { display: flex; align-items: flex-start; gap: 12px; }
                .outline-num {
                    flex-shrink: 0;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.72rem;
                    font-weight: 700;
                    color: #fff;
                    background: var(--accent-warm);
                }
                .outline-ch-title {
                    font-size: 0.88rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }
                .outline-ch-synopsis {
                    font-size: 0.78rem;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }
                .empty-state {
                    text-align: center;
                    padding: 48px 0;
                    color: var(--text-tertiary);
                    font-size: 0.82rem;
                }
                .empty-state :global(.empty-icon) {
                    margin: 0 auto 12px;
                    opacity: 0.3;
                }

                /* ── Whiteboard Tab ── */
                .whiteboard-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .whiteboard-count {
                    font-size: 0.72rem;
                    color: var(--text-tertiary);
                }
                .whiteboard {
                    position: relative;
                    width: 100%;
                    height: 560px;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary);
                    overflow: hidden;
                }
                .whiteboard-grid {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
                    background-size: 20px 20px;
                    opacity: 0.5;
                }
                .whiteboard-empty {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: var(--text-tertiary);
                    font-size: 0.82rem;
                    pointer-events: none;
                }

                /* Post-it */
                .postit {
                    position: absolute;
                    border-radius: 4px;
                    box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.15);
                    display: flex;
                    flex-direction: column;
                    z-index: 2;
                    transition: box-shadow 0.15s;
                }
                .postit:hover {
                    box-shadow: 4px 6px 16px rgba(0, 0, 0, 0.2);
                    z-index: 3;
                }
                .postit-header {
                    display: flex;
                    align-items: center;
                    padding: 4px 6px;
                    cursor: grab;
                    gap: 4px;
                    border-bottom: 1px solid rgba(0,0,0,0.08);
                }
                .postit-header:active { cursor: grabbing; }
                .postit-grip { color: rgba(0,0,0,0.25); flex-shrink: 0; }
                .postit-colors {
                    display: flex;
                    gap: 3px;
                    flex: 1;
                }
                .postit-color-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 1px solid rgba(0,0,0,0.12);
                    cursor: pointer;
                    transition: transform 0.1s;
                }
                .postit-color-dot:hover { transform: scale(1.3); }
                .postit-delete {
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    border: none;
                    background: transparent;
                    color: rgba(0,0,0,0.3);
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .postit-delete:hover { color: rgba(0,0,0,0.7); background: rgba(0,0,0,0.08); }
                .postit-text {
                    flex: 1;
                    padding: 8px 10px;
                    border: none;
                    background: transparent;
                    color: #1a1a1a;
                    font-size: 0.8rem;
                    line-height: 1.4;
                    resize: none;
                    outline: none;
                    font-family: 'Caveat', 'Comic Sans MS', cursive, sans-serif;
                }

                /* ── Mind Map Tab ── */
                .mindmap-card { padding: 20px !important; }
                .mindmap-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--accent-warm);
                    font-size: 0.88rem;
                    font-weight: 700;
                    margin-bottom: 16px;
                }
                .mindmap-tree {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .mind-node-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .mind-node {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 8px;
                    border-radius: var(--radius-sm);
                    border-left: 3px solid var(--accent);
                    transition: background var(--transition-fast);
                }
                .mind-node:hover {
                    background: var(--surface-tertiary);
                }
                .mind-node-root {
                    border-left-width: 4px;
                    padding: 10px 12px;
                    background: var(--surface-secondary);
                    border-radius: var(--radius-md);
                    margin-bottom: 8px;
                }
                .mind-toggle {
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--radius-sm);
                    border: none;
                    background: transparent;
                    color: var(--text-tertiary);
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .mind-toggle:hover { background: var(--surface-elevated); }
                .mind-label {
                    flex: 1;
                    border: none;
                    background: transparent;
                    color: var(--text-primary);
                    font-size: 0.82rem;
                    font-weight: 500;
                    outline: none;
                    padding: 2px 4px;
                }
                .mind-label:focus {
                    background: var(--surface-tertiary);
                    border-radius: var(--radius-sm);
                }
                .mind-add, .mind-delete {
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--radius-sm);
                    border: none;
                    background: transparent;
                    color: var(--text-tertiary);
                    cursor: pointer;
                    opacity: 0;
                    transition: all var(--transition-fast);
                }
                .mind-node:hover .mind-add,
                .mind-node:hover .mind-delete {
                    opacity: 1;
                }
                .mind-add:hover {
                    background: var(--accent-warm-muted);
                    color: var(--accent-warm);
                }
                .mind-delete:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }
            `}</style>
        </div>
    );
}
