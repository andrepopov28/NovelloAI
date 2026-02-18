'use client';

import { Editor } from '@tiptap/react';
import { useState, useRef, useCallback } from 'react';
import {
    Bold, Italic, Underline, Strikethrough, Code, Code2,
    Heading1, Heading2, Heading3, Type,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered,
    Quote, Minus,
    Image as ImageIcon, Link as LinkIcon,
    Undo, Redo,
    X, ExternalLink,
} from 'lucide-react';

interface EditorToolbarProps {
    editor: Editor | null;
}

interface ToolbarButtonProps {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault(); // Prevent editor losing focus
                onClick();
            }}
            disabled={disabled}
            title={title}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '5px',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--text-secondary)',
                opacity: disabled ? 0.4 : 1,
                transition: 'all 0.15s ease',
                flexShrink: 0,
            }}
            onMouseEnter={(e) => {
                if (!disabled && !active) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-tertiary)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                }
            }}
        >
            {children}
        </button>
    );
}

function Divider() {
    return (
        <div style={{
            width: '1px',
            height: '20px',
            background: 'var(--border)',
            flexShrink: 0,
            margin: '0 2px',
        }} />
    );
}

// ── Image Modal ──────────────────────────────────────────────────────────────
interface ImageModalProps {
    onInsert: (url: string, alt: string) => void;
    onClose: () => void;
}

function ImageModal({ onInsert, onClose }: ImageModalProps) {
    const [tab, setTab] = useState<'url' | 'upload'>('url');
    const [url, setUrl] = useState('');
    const [alt, setAlt] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleUrl = () => {
        if (url.trim()) onInsert(url.trim(), alt.trim() || 'image');
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            onInsert(dataUrl, alt.trim() || file.name);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                width: '420px',
                boxShadow: 'var(--shadow-xl)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Insert Image</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--surface-secondary)', borderRadius: '8px', padding: '4px' }}>
                    {(['url', 'upload'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            flex: 1, padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: tab === t ? 'var(--surface-elevated)' : 'transparent',
                            color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize',
                            boxShadow: tab === t ? 'var(--shadow-xs)' : 'none',
                            transition: 'all 0.15s',
                        }}>
                            {t === 'url' ? 'From URL' : 'Upload File'}
                        </button>
                    ))}
                </div>

                {tab === 'url' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUrl()}
                            autoFocus
                            style={{
                                padding: '8px 12px', borderRadius: '8px',
                                border: '1px solid var(--border)', background: 'var(--surface-secondary)',
                                color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Alt text (optional)"
                            value={alt}
                            onChange={e => setAlt(e.target.value)}
                            style={{
                                padding: '8px 12px', borderRadius: '8px',
                                border: '1px solid var(--border)', background: 'var(--surface-secondary)',
                                color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleUrl}
                            disabled={!url.trim()}
                            style={{
                                padding: '9px', borderRadius: '8px', border: 'none', cursor: url.trim() ? 'pointer' : 'not-allowed',
                                background: url.trim() ? 'var(--accent)' : 'var(--surface-tertiary)',
                                color: url.trim() ? '#fff' : 'var(--text-tertiary)',
                                fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s',
                            }}
                        >
                            Insert Image
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Alt text (optional)"
                            value={alt}
                            onChange={e => setAlt(e.target.value)}
                            style={{
                                padding: '8px 12px', borderRadius: '8px',
                                border: '1px solid var(--border)', background: 'var(--surface-secondary)',
                                color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
                            }}
                        />
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                        <button
                            onClick={() => fileRef.current?.click()}
                            style={{
                                padding: '32px', borderRadius: '8px', border: '2px dashed var(--border)',
                                background: 'var(--surface-secondary)', color: 'var(--text-tertiary)',
                                fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            }}
                        >
                            <ImageIcon size={24} />
                            Click to choose an image file
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Link Modal ───────────────────────────────────────────────────────────────
interface LinkModalProps {
    currentUrl: string;
    onInsert: (url: string) => void;
    onRemove: () => void;
    onClose: () => void;
}

function LinkModal({ currentUrl, onInsert, onRemove, onClose }: LinkModalProps) {
    const [url, setUrl] = useState(currentUrl);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                width: '380px',
                boxShadow: 'var(--shadow-xl)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Insert Link</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                        <X size={16} />
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && url.trim() && onInsert(url.trim())}
                        autoFocus
                        style={{
                            padding: '8px 12px', borderRadius: '8px',
                            border: '1px solid var(--border)', background: 'var(--surface-secondary)',
                            color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
                        }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => url.trim() && onInsert(url.trim())}
                            disabled={!url.trim()}
                            style={{
                                flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
                                cursor: url.trim() ? 'pointer' : 'not-allowed',
                                background: url.trim() ? 'var(--accent)' : 'var(--surface-tertiary)',
                                color: url.trim() ? '#fff' : 'var(--text-tertiary)',
                                fontSize: '0.82rem', fontWeight: 600,
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <ExternalLink size={13} /> Set Link
                            </span>
                        </button>
                        {currentUrl && (
                            <button
                                onClick={onRemove}
                                style={{
                                    padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--border)',
                                    cursor: 'pointer', background: 'transparent',
                                    color: 'var(--text-secondary)', fontSize: '0.82rem',
                                }}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Toolbar ─────────────────────────────────────────────────────────────
export function EditorToolbar({ editor }: EditorToolbarProps) {
    const [showImageModal, setShowImageModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);

    const insertImage = useCallback((url: string, alt: string) => {
        editor?.chain().focus().setImage({ src: url, alt }).run();
        setShowImageModal(false);
    }, [editor]);

    const insertLink = useCallback((url: string) => {
        if (!url) return;
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
        setShowLinkModal(false);
    }, [editor]);

    const removeLink = useCallback(() => {
        editor?.chain().focus().unsetLink().run();
        setShowLinkModal(false);
    }, [editor]);

    const currentLinkUrl = editor?.getAttributes('link').href ?? '';

    if (!editor) return null;

    return (
        <>
            {showImageModal && (
                <ImageModal onInsert={insertImage} onClose={() => setShowImageModal(false)} />
            )}
            {showLinkModal && (
                <LinkModal
                    currentUrl={currentLinkUrl}
                    onInsert={insertLink}
                    onRemove={removeLink}
                    onClose={() => setShowLinkModal(false)}
                />
            )}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '2px',
                padding: '6px 10px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-secondary)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}>
                {/* History */}
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (⌘Z)">
                    <Undo size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (⌘⇧Z)">
                    <Redo size={14} />
                </ToolbarButton>

                <Divider />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    active={editor.isActive('paragraph')}
                    title="Normal text"
                >
                    <Type size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 size={14} />
                </ToolbarButton>

                <Divider />

                {/* Text formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="Bold (⌘B)"
                >
                    <Bold size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="Italic (⌘I)"
                >
                    <Italic size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    title="Underline (⌘U)"
                >
                    <Underline size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <Strikethrough size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    active={editor.isActive('code')}
                    title="Inline code"
                >
                    <Code size={14} />
                </ToolbarButton>

                <Divider />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    active={editor.isActive({ textAlign: 'left' })}
                    title="Align left"
                >
                    <AlignLeft size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    active={editor.isActive({ textAlign: 'center' })}
                    title="Align center"
                >
                    <AlignCenter size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    active={editor.isActive({ textAlign: 'right' })}
                    title="Align right"
                >
                    <AlignRight size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    active={editor.isActive({ textAlign: 'justify' })}
                    title="Justify"
                >
                    <AlignJustify size={14} />
                </ToolbarButton>

                <Divider />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="Bullet list"
                >
                    <List size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="Ordered list"
                >
                    <ListOrdered size={14} />
                </ToolbarButton>

                <Divider />

                {/* Blocks */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    title="Blockquote"
                >
                    <Quote size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    active={editor.isActive('codeBlock')}
                    title="Code block"
                >
                    <Code2 size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Horizontal rule"
                >
                    <Minus size={14} />
                </ToolbarButton>

                <Divider />

                {/* Insert */}
                <ToolbarButton
                    onClick={() => setShowImageModal(true)}
                    active={editor.isActive('image')}
                    title="Insert image"
                >
                    <ImageIcon size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => setShowLinkModal(true)}
                    active={editor.isActive('link')}
                    title="Insert / edit link"
                >
                    <LinkIcon size={14} />
                </ToolbarButton>
            </div>
        </>
    );
}
