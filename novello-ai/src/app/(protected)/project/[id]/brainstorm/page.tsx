'use client';

import React, {
    useState, use, useCallback, useRef, useEffect,
    MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent,
} from 'react';
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
    ZoomIn,
    ZoomOut,
    Maximize2,
    Trash2,
    Palette,
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

// ─── Canvas Mind Map ──────────────────────
interface MMNode {
    id: string;
    label: string;
    x: number;
    y: number;
    color: string;
    parentId: string | null;
}

const NODE_W = 180;
const NODE_H = 44;

const postItColors = [
    '#FEF3C7', '#DBEAFE', '#D1FAE5', '#FCE7F3', '#E9D5FF', '#FED7AA',
];

const NODE_COLORS = [
    '#d4a843', '#8B5CF6', '#06B6D4', '#10B981',
    '#EF4444', '#F59E0B', '#EC4899', '#6366F1',
];

const defaultNodes = (): MMNode[] => [
    { id: 'root', label: 'Story Premise', x: 0, y: 0, color: '#d4a843', parentId: null },
    { id: 'characters', label: 'Characters', x: 300, y: -180, color: '#8B5CF6', parentId: 'root' },
    { id: 'plot', label: 'Plot Points', x: 300, y: -60, color: '#06B6D4', parentId: 'root' },
    { id: 'settings', label: 'Settings', x: 300, y: 60, color: '#10B981', parentId: 'root' },
    { id: 'themes', label: 'Themes', x: 300, y: 180, color: '#F59E0B', parentId: 'root' },
    { id: 'conflicts', label: 'Conflicts', x: 300, y: 300, color: '#EF4444', parentId: 'root' },
];

type Tab = 'outline' | 'whiteboard' | 'mindmap';

export default function BrainstormPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const router = useRouter();
    const { loading: aiLoading, generateOutline, clearError, error: aiError } = useAI('ollama', '', projectId);
    const { createChapter } = useChapters(projectId);

    const [activeTab, setActiveTab] = useState<Tab>('mindmap');
    const [premise, setPremise] = useState('');
    const [genre, setGenre] = useState('');
    const [outline, setOutline] = useState<OutlineResult | null>(null);
    const [applying, setApplying] = useState(false);

    // ─── Whiteboard State ───
    const [postIts, setPostIts] = useState<PostIt[]>([]);
    const [editingPostIt, setEditingPostIt] = useState<string | null>(null);
    const whiteboardRef = useRef<HTMLDivElement>(null);
    const wbDragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

    // ─── Canvas Mind Map State ───
    const [nodes, setNodes] = useState<MMNode[]>(defaultNodes);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [colorPickerId, setColorPickerId] = useState<string | null>(null);
    const [pan, setPan] = useState({ x: 480, y: 320 }); // initial offset so root is visible
    const [zoom, setZoom] = useState(1);
    const [expandingId, setExpandingId] = useState<string | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const nodeDragRef = useRef<{ id: string; startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
    const panDragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
    const spaceHeld = useRef(false);

    // ─── Outline Handlers ───
    const handleGenerate = useCallback(async () => {
        if (!premise.trim()) { toast.error('Please enter a premise first.'); return; }
        clearError();
        const result = await generateOutline(premise, genre);
        if (result) { setOutline(result); toast.success(`Generated ${result.chapters.length} chapters!`); }
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
        } catch { toast.error('Failed to create chapters.'); }
        finally { setApplying(false); }
    }, [outline, createChapter, projectId, router]);

    // ─── Whiteboard Handlers ───
    const addPostIt = useCallback(() => {
        const wb = whiteboardRef.current;
        const newPostIt: PostIt = {
            id: `note-${Date.now()}`, text: '',
            color: postItColors[Math.floor(Math.random() * postItColors.length)],
            x: wb ? Math.random() * (wb.offsetWidth - 180) : 100,
            y: wb ? Math.random() * (wb.offsetHeight - 160) : 100,
            width: 180, height: 150,
        };
        setPostIts(prev => [...prev, newPostIt]);
        setEditingPostIt(newPostIt.id);
    }, []);

    const updatePostIt = useCallback((id: string, updates: Partial<PostIt>) => {
        setPostIts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }, []);

    const deletePostIt = useCallback((id: string) => {
        setPostIts(prev => prev.filter(p => p.id !== id));
    }, []);

    const handleWbMouseDown = useCallback((e: ReactMouseEvent, id: string) => {
        const postIt = postIts.find(p => p.id === id);
        if (!postIt) return;
        wbDragRef.current = { id, offsetX: e.clientX - postIt.x, offsetY: e.clientY - postIt.y };
    }, [postIts]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!wbDragRef.current || !whiteboardRef.current) return;
            const rect = whiteboardRef.current.getBoundingClientRect();
            const newX = Math.max(0, Math.min(e.clientX - wbDragRef.current.offsetX, rect.width - 180));
            const newY = Math.max(0, Math.min(e.clientY - wbDragRef.current.offsetY, rect.height - 150));
            updatePostIt(wbDragRef.current.id, { x: newX, y: newY });
        };
        const handleMouseUp = () => { wbDragRef.current = null; };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    }, [updatePostIt]);

    // ─── Canvas Mind Map Handlers ───

    // Space key for pan mode
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') { spaceHeld.current = true; e.preventDefault(); } };
        const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') spaceHeld.current = false; };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
    }, []);

    // Canvas mouse events
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (nodeDragRef.current) {
                const dx = (e.clientX - nodeDragRef.current.startX) / zoom;
                const dy = (e.clientY - nodeDragRef.current.startY) / zoom;
                setNodes(prev => prev.map(n =>
                    n.id === nodeDragRef.current!.id
                        ? { ...n, x: nodeDragRef.current!.nodeX + dx, y: nodeDragRef.current!.nodeY + dy }
                        : n
                ));
            } else if (panDragRef.current) {
                const dx = e.clientX - panDragRef.current.startX;
                const dy = e.clientY - panDragRef.current.startY;
                setPan({ x: panDragRef.current.panX + dx, y: panDragRef.current.panY + dy });
            }
        };
        const handleMouseUp = () => {
            nodeDragRef.current = null;
            panDragRef.current = null;
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [zoom]);

    const handleCanvasMouseDown = useCallback((e: ReactMouseEvent) => {
        if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('mm-canvas-inner')) {
            setSelectedId(null);
            setColorPickerId(null);
            panDragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
        }
    }, [pan]);

    const handleNodeMouseDown = useCallback((e: ReactMouseEvent, node: MMNode) => {
        e.stopPropagation();
        setSelectedId(node.id);
        setColorPickerId(null);
        nodeDragRef.current = { id: node.id, startX: e.clientX, startY: e.clientY, nodeX: node.x, nodeY: node.y };
    }, []);

    const handleWheel = useCallback((e: ReactWheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.max(0.2, Math.min(3, z * delta)));
    }, []);

    const addChildNode = useCallback((parentId: string, e: ReactMouseEvent) => {
        e.stopPropagation();
        const parent = nodes.find(n => n.id === parentId);
        if (!parent) return;
        const siblings = nodes.filter(n => n.parentId === parentId);
        const newNode: MMNode = {
            id: `node-${Date.now()}`,
            label: 'New idea',
            x: parent.x + 220,
            y: parent.y + siblings.length * 60 - (siblings.length * 30),
            color: parent.color,
            parentId,
        };
        setNodes(prev => [...prev, newNode]);
        setEditingId(newNode.id);
        setSelectedId(newNode.id);
    }, [nodes]);

    const deleteNode = useCallback((id: string, e: ReactMouseEvent) => {
        e.stopPropagation();
        if (id === 'root') return;
        // Also delete all descendants
        const getAllDescendants = (nodeId: string, allNodes: MMNode[]): string[] => {
            const children = allNodes.filter(n => n.parentId === nodeId).map(n => n.id);
            return [...children, ...children.flatMap(cid => getAllDescendants(cid, allNodes))];
        };
        const toDelete = new Set([id, ...getAllDescendants(id, nodes)]);
        setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
        if (selectedId && toDelete.has(selectedId)) setSelectedId(null);
    }, [nodes, selectedId]);

    const fitToScreen = useCallback(() => {
        if (nodes.length === 0) return;
        const xs = nodes.map(n => n.x);
        const ys = nodes.map(n => n.y);
        const minX = Math.min(...xs); const maxX = Math.max(...xs) + NODE_W;
        const minY = Math.min(...ys); const maxY = Math.max(...ys) + NODE_H;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const cw = canvas.offsetWidth; const ch = canvas.offsetHeight;
        const scaleX = cw / (maxX - minX + 80);
        const scaleY = ch / (maxY - minY + 80);
        const newZoom = Math.min(scaleX, scaleY, 1.5);
        setZoom(newZoom);
        setPan({
            x: (cw - (maxX - minX) * newZoom) / 2 - minX * newZoom,
            y: (ch - (maxY - minY) * newZoom) / 2 - minY * newZoom,
        });
    }, [nodes]);

    // AI Expand
    const expandWithAI = useCallback(async (nodeId: string, e: ReactMouseEvent) => {
        e.stopPropagation();
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        setExpandingId(nodeId);
        try {
            // Use the AI hook's raw generate — we'll call generateOutline with a special prompt
            // and parse the response as ideas
            const prompt = `Give me exactly 4 creative brainstorming ideas that branch from the concept: "${node.label}". Return ONLY a JSON array of 4 short strings, nothing else. Example: ["Idea one","Idea two","Idea three","Idea four"]`;
            const res = await generateOutline(prompt, '');
            // Try to parse from the outline result title or synopsis fields
            let ideas: string[] = [];
            if (res && res.chapters && res.chapters.length > 0) {
                ideas = res.chapters.slice(0, 4).map(ch => ch.title);
            }
            if (ideas.length === 0) {
                toast.error('No ideas returned. Try again.');
                return;
            }
            const siblings = nodes.filter(n => n.parentId === nodeId);
            const newNodes: MMNode[] = ideas.map((idea, i) => ({
                id: `ai-${Date.now()}-${i}`,
                label: idea,
                x: node.x + 240,
                y: node.y + (siblings.length + i) * 64 - (ideas.length * 32) + 16,
                color: node.color,
                parentId: nodeId,
            }));
            setNodes(prev => [...prev, ...newNodes]);
            toast.success(`Added ${newNodes.length} AI ideas!`);
        } catch {
            toast.error('AI expansion failed.');
        } finally {
            setExpandingId(null);
        }
    }, [nodes, generateOutline]);

    // ─── SVG Bezier connections ───
    const renderEdges = () => {
        const edges: React.ReactElement[] = [];
        nodes.forEach(node => {
            if (!node.parentId) return;
            const parent = nodes.find(n => n.id === node.parentId);
            if (!parent) return;
            const x1 = parent.x + NODE_W;
            const y1 = parent.y + NODE_H / 2;
            const x2 = node.x;
            const y2 = node.y + NODE_H / 2;
            const cx = (x1 + x2) / 2;
            const d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
            edges.push(
                <path
                    key={`${parent.id}-${node.id}`}
                    d={d}
                    fill="none"
                    stroke={node.color}
                    strokeWidth={selectedId === node.id || selectedId === parent.id ? 2.5 : 1.5}
                    strokeOpacity={0.6}
                    strokeLinecap="round"
                />
            );
        });
        return edges;
    };

    // ─── Tab UI ───
    const tabs: { key: Tab; label: string; icon: typeof ListOrdered }[] = [
        { key: 'outline', label: 'Outline', icon: ListOrdered },
        { key: 'whiteboard', label: 'Whiteboard', icon: StickyNote },
        { key: 'mindmap', label: 'Mind Map', icon: Network },
    ];

    // Compute SVG bounding box (world coords)
    const allX = nodes.map(n => n.x);
    const allY = nodes.map(n => n.y);
    const svgMinX = Math.min(...allX, 0) - 200;
    const svgMinY = Math.min(...allY, 0) - 200;
    const svgW = Math.max(...allX, 0) + NODE_W + 400 - svgMinX;
    const svgH = Math.max(...allY, 0) + NODE_H + 400 - svgMinY;

    return (
        <div className="brainstorm-root">
            <div className={`brainstorm-container ${activeTab === 'mindmap' ? 'brainstorm-fullwidth' : ''}`}>
                {/* Header */}
                <div className="brainstorm-header">
                    <button onClick={() => router.push(`/project/${projectId}`)} className="back-btn">
                        <ArrowLeft size={16} />
                    </button>
                    <Lightbulb size={20} className="header-icon" />
                    <h1 className="header-title">Brainstorm</h1>
                </div>

                {/* Tabs */}
                <div className="tab-bar">
                    {tabs.map(t => {
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
                                onChange={e => setPremise(e.target.value)}
                                placeholder="Describe your story idea..."
                                rows={5}
                                className="premise-textarea"
                            />
                            <div className="premise-actions">
                                <div className="genre-wrap">
                                    <label className="genre-label">Genre (optional)</label>
                                    <input
                                        value={genre}
                                        onChange={e => setGenre(e.target.value)}
                                        placeholder="e.g., Mystery, Sci-Fi"
                                        className="genre-input"
                                    />
                                </div>
                                <Button onClick={handleGenerate} disabled={aiLoading || !premise.trim()}>
                                    {aiLoading ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate Outline</>}
                                </Button>
                            </div>
                        </Card>

                        {aiError && (
                            <div className="error-banner">
                                <AlertCircle size={16} /><span>{aiError}</span>
                            </div>
                        )}

                        {outline && (
                            <div>
                                <div className="outline-header">
                                    <div className="outline-header-left">
                                        <BookOpen size={16} />
                                        <h2 className="outline-count">Generated Outline — {outline.chapters.length} Chapters</h2>
                                    </div>
                                    <Button onClick={handleApplyToProject} disabled={applying}>
                                        {applying ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Plus size={14} /> Apply to Project</>}
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
                            <Button onClick={addPostIt}><Plus size={14} /> Add Note</Button>
                            <span className="whiteboard-count">{postIts.length} notes</span>
                        </div>
                        <div className="whiteboard" ref={whiteboardRef}>
                            <div className="whiteboard-grid" />
                            {postIts.length === 0 && (
                                <div className="whiteboard-empty">
                                    <StickyNote size={40} />
                                    <p>Click <strong>Add Note</strong> to start brainstorming</p>
                                </div>
                            )}
                            {postIts.map(note => (
                                <div
                                    key={note.id}
                                    className="postit"
                                    style={{ left: note.x, top: note.y, width: note.width, background: note.color }}
                                >
                                    <div className="postit-header" onMouseDown={e => handleWbMouseDown(e, note.id)}>
                                        <GripVertical size={12} className="postit-grip" />
                                        <div className="postit-colors">
                                            {postItColors.map(c => (
                                                <button key={c} className="postit-color-dot" style={{ background: c }} onClick={() => updatePostIt(note.id, { color: c })} />
                                            ))}
                                        </div>
                                        <button className="postit-delete" onClick={() => deletePostIt(note.id)}><X size={12} /></button>
                                    </div>
                                    <textarea
                                        className="postit-text"
                                        value={note.text}
                                        onChange={e => updatePostIt(note.id, { text: e.target.value })}
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
                    <div className="mm-root">
                        {/* Toolbar */}
                        <div className="mm-toolbar">
                            <div className="mm-toolbar-left">
                                <span className="mm-toolbar-title">
                                    <Network size={14} />
                                    Mind Map
                                </span>
                                <span className="mm-node-count">{nodes.length} nodes</span>
                            </div>
                            <div className="mm-toolbar-right">
                                <span className="mm-hint">Space+drag to pan · Scroll to zoom · Drag nodes</span>
                                <div className="mm-zoom-group">
                                    <button className="mm-zoom-btn" onClick={() => setZoom(z => Math.min(3, z * 1.2))}><ZoomIn size={14} /></button>
                                    <span className="mm-zoom-label">{Math.round(zoom * 100)}%</span>
                                    <button className="mm-zoom-btn" onClick={() => setZoom(z => Math.max(0.2, z * 0.8))}><ZoomOut size={14} /></button>
                                </div>
                                <button className="mm-fit-btn" onClick={fitToScreen} title="Fit to screen">
                                    <Maximize2 size={14} />
                                </button>
                                <button className="mm-reset-btn" onClick={() => { setNodes(defaultNodes()); setPan({ x: 480, y: 320 }); setZoom(1); }} title="Reset">
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div
                            className="mm-canvas"
                            ref={canvasRef}
                            onMouseDown={handleCanvasMouseDown}
                            onWheel={handleWheel}
                            style={{ cursor: spaceHeld.current ? 'grab' : 'default' }}
                        >
                            <div
                                className="mm-canvas-inner"
                                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
                            >
                                {/* SVG edges */}
                                <svg
                                    className="mm-svg"
                                    style={{
                                        position: 'absolute',
                                        left: svgMinX,
                                        top: svgMinY,
                                        width: svgW,
                                        height: svgH,
                                        overflow: 'visible',
                                        pointerEvents: 'none',
                                    }}
                                    viewBox={`${svgMinX} ${svgMinY} ${svgW} ${svgH}`}
                                >
                                    {renderEdges()}
                                </svg>

                                {/* Nodes */}
                                {nodes.map(node => {
                                    const isSelected = selectedId === node.id;
                                    const isEditing = editingId === node.id;
                                    const isRoot = node.id === 'root';
                                    const isExpanding = expandingId === node.id;
                                    return (
                                        <div
                                            key={node.id}
                                            className={`mm-node ${isSelected ? 'mm-node-selected' : ''} ${isRoot ? 'mm-node-root' : ''}`}
                                            style={{
                                                left: node.x,
                                                top: node.y,
                                                width: NODE_W,
                                                height: NODE_H,
                                                borderColor: node.color,
                                                boxShadow: isSelected ? `0 0 0 2px ${node.color}55, 0 4px 20px ${node.color}33` : undefined,
                                            }}
                                            onMouseDown={e => handleNodeMouseDown(e, node)}
                                            onDoubleClick={e => { e.stopPropagation(); setEditingId(node.id); }}
                                        >
                                            {/* Color dot */}
                                            <div
                                                className="mm-node-dot"
                                                style={{ background: node.color }}
                                                onClick={e => { e.stopPropagation(); setColorPickerId(colorPickerId === node.id ? null : node.id); }}
                                            />

                                            {/* Label */}
                                            {isEditing ? (
                                                <input
                                                    className="mm-node-input"
                                                    autoFocus
                                                    value={node.label}
                                                    onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, label: e.target.value } : n))}
                                                    onBlur={() => setEditingId(null)}
                                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingId(null); }}
                                                    onClick={e => e.stopPropagation()}
                                                    onMouseDown={e => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className="mm-node-label" style={{ color: isRoot ? node.color : 'var(--text-primary)' }}>
                                                    {node.label}
                                                </span>
                                            )}

                                            {/* Action buttons (visible on hover/select) */}
                                            <div className="mm-node-actions">
                                                <button
                                                    className="mm-action-btn mm-action-add"
                                                    title="Add child"
                                                    onClick={e => addChildNode(node.id, e)}
                                                    onMouseDown={e => e.stopPropagation()}
                                                >
                                                    <Plus size={10} />
                                                </button>
                                                <button
                                                    className={`mm-action-btn mm-action-ai ${isExpanding ? 'mm-action-ai-loading' : ''}`}
                                                    title="Expand with AI"
                                                    onClick={e => expandWithAI(node.id, e)}
                                                    onMouseDown={e => e.stopPropagation()}
                                                    disabled={isExpanding || aiLoading}
                                                >
                                                    {isExpanding ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                                </button>
                                                {!isRoot && (
                                                    <button
                                                        className="mm-action-btn mm-action-del"
                                                        title="Delete"
                                                        onClick={e => deleteNode(node.id, e)}
                                                        onMouseDown={e => e.stopPropagation()}
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Color picker popover */}
                                            {colorPickerId === node.id && (
                                                <div
                                                    className="mm-color-picker"
                                                    onClick={e => e.stopPropagation()}
                                                    onMouseDown={e => e.stopPropagation()}
                                                >
                                                    {NODE_COLORS.map(c => (
                                                        <button
                                                            key={c}
                                                            className={`mm-color-swatch ${node.color === c ? 'mm-color-active' : ''}`}
                                                            style={{ background: c }}
                                                            onClick={() => {
                                                                setNodes(prev => prev.map(n => n.id === node.id ? { ...n, color: c } : n));
                                                                setColorPickerId(null);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Empty state */}
                            {nodes.length === 0 && (
                                <div className="mm-empty">
                                    <Network size={40} />
                                    <p>Click Reset to start a new mind map</p>
                                </div>
                            )}
                        </div>
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
                .brainstorm-fullwidth {
                    max-width: 100%;
                }

                /* Header */
                .brainstorm-header {
                    display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
                }
                .back-btn {
                    width: 34px; height: 34px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-secondary);
                    color: var(--text-secondary); display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: all var(--transition-fast);
                }
                .back-btn:hover { background: var(--surface-tertiary); color: var(--text-primary); }
                .header-icon { color: var(--accent-warm); }
                .header-title { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); }

                /* Tabs */
                .tab-bar {
                    display: flex; gap: 4px; padding: 4px;
                    background: var(--surface-secondary); border-radius: var(--radius-md);
                    border: 1px solid var(--border); margin-bottom: 20px;
                }
                .tab-btn {
                    flex: 1; display: flex; align-items: center; justify-content: center;
                    gap: 6px; padding: 10px; border-radius: var(--radius-sm); border: none;
                    background: transparent; color: var(--text-tertiary);
                    font-size: 0.82rem; font-weight: 600; cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .tab-btn:hover { color: var(--text-primary); background: var(--surface-tertiary); }
                .tab-active {
                    background: var(--accent-warm-muted) !important;
                    color: var(--accent-warm) !important;
                    box-shadow: var(--shadow-sm);
                }
                .tab-content { animation: fadeIn 0.2s ease; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                /* ── Outline Tab ── */
                .input-label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
                .premise-textarea {
                    width: 100%; padding: 12px 16px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-tertiary);
                    color: var(--text-primary); font-size: 0.88rem; line-height: 1.7;
                    resize: none; outline: none; font-family: var(--font-serif);
                }
                .premise-textarea:focus { border-color: var(--accent-warm); }
                .premise-actions { display: flex; align-items: flex-end; gap: 12px; margin-top: 12px; }
                .genre-wrap { flex: 1; }
                .genre-label { display: block; font-size: 0.72rem; font-weight: 600; color: var(--text-tertiary); margin-bottom: 6px; }
                .genre-input {
                    width: 100%; padding: 8px 12px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-tertiary);
                    color: var(--text-primary); font-size: 0.82rem; outline: none;
                }
                .genre-input:focus { border-color: var(--accent-warm); }
                .error-banner {
                    display: flex; align-items: center; gap: 8px; padding: 12px;
                    border-radius: var(--radius-md); background: rgba(239,68,68,0.1);
                    color: #ef4444; font-size: 0.82rem; margin-bottom: 16px;
                }
                .outline-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
                .outline-header-left { display: flex; align-items: center; gap: 8px; color: var(--accent-warm); }
                .outline-count { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
                .outline-list { display: flex; flex-direction: column; gap: 8px; }
                .outline-item { display: flex; align-items: flex-start; gap: 12px; }
                .outline-num {
                    flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.72rem; font-weight: 700; color: #fff; background: var(--accent-warm);
                }
                .outline-ch-title { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
                .outline-ch-synopsis { font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5; }
                .empty-state { text-align: center; padding: 48px 0; color: var(--text-tertiary); font-size: 0.82rem; }
                .empty-state :global(.empty-icon) { margin: 0 auto 12px; opacity: 0.3; }

                /* ── Whiteboard Tab ── */
                .whiteboard-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
                .whiteboard-count { font-size: 0.72rem; color: var(--text-tertiary); }
                .whiteboard {
                    position: relative; width: 100%; height: 560px;
                    border-radius: var(--radius-lg); border: 1px solid var(--border);
                    background: var(--surface-secondary); overflow: hidden;
                }
                .whiteboard-grid {
                    position: absolute; inset: 0;
                    background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
                    background-size: 20px 20px; opacity: 0.5;
                }
                .whiteboard-empty {
                    position: absolute; inset: 0; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 12px;
                    color: var(--text-tertiary); font-size: 0.82rem; pointer-events: none;
                }
                .postit {
                    position: absolute; border-radius: 4px;
                    box-shadow: 2px 3px 8px rgba(0,0,0,0.15);
                    display: flex; flex-direction: column; z-index: 2; transition: box-shadow 0.15s;
                }
                .postit:hover { box-shadow: 4px 6px 16px rgba(0,0,0,0.2); z-index: 3; }
                .postit-header {
                    display: flex; align-items: center; padding: 4px 6px;
                    cursor: grab; gap: 4px; border-bottom: 1px solid rgba(0,0,0,0.08);
                }
                .postit-header:active { cursor: grabbing; }
                .postit-grip { color: rgba(0,0,0,0.25); flex-shrink: 0; }
                .postit-colors { display: flex; gap: 3px; flex: 1; }
                .postit-color-dot {
                    width: 12px; height: 12px; border-radius: 50%;
                    border: 1px solid rgba(0,0,0,0.12); cursor: pointer; transition: transform 0.1s;
                }
                .postit-color-dot:hover { transform: scale(1.3); }
                .postit-delete {
                    width: 18px; height: 18px; display: flex; align-items: center;
                    justify-content: center; border-radius: 50%; border: none;
                    background: transparent; color: rgba(0,0,0,0.3); cursor: pointer; flex-shrink: 0;
                }
                .postit-delete:hover { color: rgba(0,0,0,0.7); background: rgba(0,0,0,0.08); }
                .postit-text {
                    flex: 1; padding: 8px 10px; border: none; background: transparent;
                    color: #1a1a1a; font-size: 0.8rem; line-height: 1.4; resize: none; outline: none;
                    font-family: 'Caveat', 'Comic Sans MS', cursive, sans-serif;
                }

                /* ══════════════════════════════════════════
                   MIND MAP CANVAS
                ══════════════════════════════════════════ */
                .mm-root {
                    display: flex; flex-direction: column;
                    height: calc(100vh - var(--nav-height) - 140px);
                    min-height: 560px;
                    animation: fadeIn 0.2s ease;
                }

                /* Toolbar */
                .mm-toolbar {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 10px 16px; border-radius: var(--radius-md) var(--radius-md) 0 0;
                    background: var(--surface-secondary); border: 1px solid var(--border);
                    border-bottom: none; flex-shrink: 0;
                }
                .mm-toolbar-left { display: flex; align-items: center; gap: 12px; }
                .mm-toolbar-title {
                    display: flex; align-items: center; gap: 7px;
                    font-size: 0.82rem; font-weight: 700; color: var(--accent-warm);
                }
                .mm-node-count { font-size: 0.72rem; color: var(--text-tertiary); }
                .mm-toolbar-right { display: flex; align-items: center; gap: 10px; }
                .mm-hint { font-size: 0.68rem; color: var(--text-tertiary); }
                .mm-zoom-group {
                    display: flex; align-items: center; gap: 4px;
                    background: var(--surface-tertiary); border: 1px solid var(--border);
                    border-radius: var(--radius-md); padding: 2px 6px;
                }
                .mm-zoom-btn {
                    width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
                    border: none; background: transparent; color: var(--text-secondary);
                    cursor: pointer; border-radius: var(--radius-sm); transition: all 0.15s;
                }
                .mm-zoom-btn:hover { background: var(--surface-secondary); color: var(--text-primary); }
                .mm-zoom-label { font-size: 0.72rem; font-weight: 600; color: var(--text-secondary); min-width: 36px; text-align: center; }
                .mm-fit-btn, .mm-reset-btn {
                    display: flex; align-items: center; gap: 5px;
                    padding: 5px 10px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-tertiary);
                    color: var(--text-secondary); font-size: 0.72rem; font-weight: 600;
                    cursor: pointer; transition: all 0.15s;
                }
                .mm-fit-btn:hover, .mm-reset-btn:hover { border-color: var(--border-strong); color: var(--text-primary); }

                /* Canvas */
                .mm-canvas {
                    flex: 1; position: relative; overflow: hidden;
                    border-radius: 0 0 var(--radius-md) var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary);
                    background-image:
                        radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
                    background-size: 24px 24px;
                    cursor: default;
                    user-select: none;
                }
                .mm-canvas-inner {
                    position: absolute; top: 0; left: 0;
                    will-change: transform;
                }
                .mm-svg { pointer-events: none; }

                /* Node */
                .mm-node {
                    position: absolute;
                    display: flex; align-items: center; gap: 8px;
                    padding: 0 10px;
                    border-radius: 10px;
                    border: 2px solid var(--border);
                    background: var(--surface-tertiary);
                    backdrop-filter: blur(8px);
                    cursor: grab;
                    transition: box-shadow 0.15s, border-color 0.15s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                .mm-node:active { cursor: grabbing; }
                .mm-node:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
                .mm-node-root {
                    border-radius: 14px;
                    background: var(--surface-secondary);
                    font-weight: 700;
                }
                .mm-node-selected {
                    background: var(--surface-secondary);
                }
                .mm-node-dot {
                    width: 10px; height: 10px; border-radius: 50%;
                    flex-shrink: 0; cursor: pointer;
                    transition: transform 0.15s;
                }
                .mm-node-dot:hover { transform: scale(1.4); }
                .mm-node-label {
                    flex: 1; font-size: 0.8rem; font-weight: 500;
                    color: var(--text-primary);
                    pointer-events: none;
                    word-break: break-word;
                    line-height: 1.3;
                }
                .mm-node-input {
                    flex: 1; border: none; background: transparent;
                    color: var(--text-primary); font-size: 0.8rem; font-weight: 500;
                    outline: none; min-width: 0;
                }

                /* Node action buttons */
                .mm-node-actions {
                    display: flex; gap: 3px;
                    opacity: 0; transition: opacity 0.15s;
                }
                .mm-node:hover .mm-node-actions,
                .mm-node-selected .mm-node-actions {
                    opacity: 1;
                }
                .mm-action-btn {
                    width: 20px; height: 20px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    border: 1px solid var(--border); background: var(--surface-secondary);
                    cursor: pointer; transition: all 0.15s; color: var(--text-tertiary);
                    flex-shrink: 0;
                }
                .mm-action-add:hover { background: var(--accent-warm-muted); color: var(--accent-warm); border-color: var(--accent-warm); }
                .mm-action-ai:hover { background: rgba(139,92,246,0.15); color: #8b5cf6; border-color: #8b5cf6; }
                .mm-action-ai-loading { background: rgba(139,92,246,0.15); color: #8b5cf6; border-color: #8b5cf6; }
                .mm-action-del:hover { background: rgba(239,68,68,0.1); color: #ef4444; border-color: #ef4444; }

                /* Color picker */
                .mm-color-picker {
                    position: absolute; top: calc(100% + 8px); left: 0; z-index: 100;
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;
                    padding: 8px; border-radius: var(--radius-md);
                    background: var(--surface-elevated); border: 1px solid var(--border);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                }
                .mm-color-swatch {
                    width: 20px; height: 20px; border-radius: 50%;
                    border: 2px solid transparent; cursor: pointer; transition: transform 0.1s;
                }
                .mm-color-swatch:hover { transform: scale(1.25); }
                .mm-color-active { border-color: white; }

                /* Empty */
                .mm-empty {
                    position: absolute; inset: 0; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 12px;
                    color: var(--text-tertiary); font-size: 0.82rem; pointer-events: none;
                }
            `}</style>
        </div>
    );
}
