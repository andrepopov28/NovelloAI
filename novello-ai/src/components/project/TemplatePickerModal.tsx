'use client';

import { useState } from 'react';
import { CHAPTER_TEMPLATES, getTemplatesByCategory, ChapterTemplate } from '@/lib/chapter-templates';
import { X, BookOpen, ChevronRight, Check } from 'lucide-react';

interface TemplatePickerModalProps {
    onSelect: (template: ChapterTemplate | null) => void;
    onClose: () => void;
}

export function TemplatePickerModal({ onSelect, onClose }: TemplatePickerModalProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [preview, setPreview] = useState<ChapterTemplate | null>(null);
    const byCategory = getTemplatesByCategory();

    const handleSelect = () => {
        if (!selected) return;
        const tpl = CHAPTER_TEMPLATES.find(t => t.id === selected);
        if (tpl) { onSelect(tpl); onClose(); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border)', borderRadius: 16, width: '90vw', maxWidth: 860, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
                
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <BookOpen size={20} color="var(--accent)" />
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Chapter Structure Templates</h2>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Choose a story framework to pre-populate your chapter structure</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>
                    
                    {/* Template List */}
                    <div style={{ overflow: 'auto', borderRight: '1px solid var(--border)', padding: '1rem' }}>
                        {Object.entries(byCategory).map(([category, templates]) => (
                            <div key={category} style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                    {category}
                                </div>
                                {templates.map(tpl => (
                                    <button
                                        key={tpl.id}
                                        onClick={() => { setSelected(tpl.id); setPreview(tpl); }}
                                        style={{
                                            width: '100%', textAlign: 'left', padding: '0.7rem 0.875rem', borderRadius: 10,
                                            border: `1px solid ${selected === tpl.id ? 'var(--accent)' : 'transparent'}`,
                                            background: selected === tpl.id ? 'rgba(var(--accent-rgb, 99,102,241), 0.08)' : 'var(--surface-secondary)',
                                            cursor: 'pointer', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8,
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tpl.name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{tpl.chapters.length} chapters</div>
                                        </div>
                                        <ChevronRight size={14} color="var(--text-tertiary)" />
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Preview Panel */}
                    <div style={{ overflow: 'auto', padding: '1rem' }}>
                        {preview ? (
                            <>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{preview.name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{preview.description}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {preview.chapters.map((ch, i) => (
                                        <div key={i} style={{ padding: '0.6rem', background: 'var(--surface-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                                                {i + 1}. {ch.title}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                                                {ch.synopsis.slice(0, 120)}...
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                Select a template to preview
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-secondary)', flexShrink: 0 }}>
                    <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Cancel
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => onSelect(null)} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                            + Blank Chapter
                        </button>

                    <button
                        onClick={handleSelect}
                        disabled={!selected}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: selected ? 'var(--accent)' : 'var(--border)', color: selected ? 'white' : 'var(--text-tertiary)', cursor: selected ? 'pointer' : 'not-allowed', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <Check size={14} /> Use Template
                    </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
