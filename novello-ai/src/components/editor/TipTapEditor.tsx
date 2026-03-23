'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import { InlineAssist } from './InlineAssist';
import { MentionExtension } from './MentionExtension';
import { MentionList, MentionListRef } from './MentionList';
import { PassiveVoiceExtension } from './PassiveVoice';
import { EditorToolbar } from './EditorToolbar';
import { Entity } from '@/lib/types';

interface TipTapEditorProps {
  content: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  entities?: Entity[];
  passiveVoiceEnabled?: boolean;
  rollingContext?: string;
  projectId?: string;
  chapterId?: string;
  editable?: boolean;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing your story...',
  className = '',
  entities = [],
  passiveVoiceEnabled = false,
  rollingContext = '',
  projectId,
  chapterId,
  editable = true,
}: TipTapEditorProps) {
  // Keep a ref to entities for the suggestion plugin
  const entitiesRef = useRef<Entity[]>(entities);
  useEffect(() => {
    entitiesRef.current = entities;
  }, [entities]);

  // Build extensions with memoization on passiveVoiceEnabled
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    MentionExtension.configure({
      suggestion: {
        items: ({ query }: { query: string }) => {
          return entitiesRef.current
            .filter((e) =>
              e.name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 8);
        },
        render: () => {
          let component: HTMLDivElement | null = null;
          let reactRoot: ReturnType<typeof createRoot> | null = null;
          let listRef: MentionListRef | null = null;

          return {
            onStart: (props: SuggestionProps) => {
              component = document.createElement('div');
              component.style.position = 'absolute';
              component.style.zIndex = '50';
              document.body.appendChild(component);

              reactRoot = createRoot(component);
              reactRoot.render(
                <MentionList
                  ref={(r) => { listRef = r; }}
                  items={props.items as Entity[]}
                  command={props.command as (item: { id: string; label: string; type: string }) => void}
                />
              );

              updatePosition(component, props.clientRect as (() => DOMRect | null));
            },
            onUpdate: (props: SuggestionProps) => {
              if (reactRoot) {
                reactRoot.render(
                  <MentionList
                    ref={(r) => { listRef = r; }}
                    items={props.items as Entity[]}
                    command={props.command as (item: { id: string; label: string; type: string }) => void}
                  />
                );
              }
              if (component) {
                updatePosition(component, props.clientRect as (() => DOMRect | null));
              }
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') {
                cleanup();
                return true;
              }
              return listRef?.onKeyDown(props) ?? false;
            },
            onExit: () => cleanup(),
          };

          function cleanup() {
            if (reactRoot) {
              reactRoot.unmount();
              reactRoot = null;
            }
            if (component) {
              component.remove();
              component = null;
            }
            listRef = null;
          }

          function updatePosition(el: HTMLElement, clientRect: (() => DOMRect | null)) {
            const rect = clientRect?.();
            if (!rect) return;
            el.style.left = `${rect.left}px`;
            el.style.top = `${rect.bottom + 4}px`;
          }
        },
      },
    }),
    PassiveVoiceExtension.configure({
      enabled: passiveVoiceEnabled,
    }),
  ], [placeholder, passiveVoiceEnabled]);

  const editor = useEditor({
    extensions,
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `manuscript prose-editor focus:outline-none min-h-[60vh] ${!editable ? 'cursor-wait opacity-80' : ''}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className={`tiptap-wrapper ${className}`}>
      {/* Formatting Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor Content */}
      <EditorContent editor={editor} />
      {editor && <InlineAssist editor={editor} rollingContext={rollingContext} projectId={projectId} chapterId={chapterId} />}

      <style>{`
        .tiptap-wrapper .ProseMirror {
          outline: none;
          min-height: 60vh;
          padding: 2rem 0;
        }

        .tiptap-wrapper .ProseMirror p {
          font-family: var(--font-serif);
          font-size: 1.125rem;
          line-height: 1.85;
          color: var(--text-primary);
          margin-bottom: 1.25rem;
        }

        .tiptap-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-tertiary);
          pointer-events: none;
          height: 0;
          font-style: italic;
        }

        .tiptap-wrapper .ProseMirror h1 {
          font-family: var(--font-sans);
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .tiptap-wrapper .ProseMirror h2 {
          font-family: var(--font-sans);
          font-size: 1.375rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .tiptap-wrapper .ProseMirror h3 {
          font-family: var(--font-sans);
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }

        .tiptap-wrapper .ProseMirror blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: var(--text-secondary);
        }

        .tiptap-wrapper .ProseMirror ul,
        .tiptap-wrapper .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }

        .tiptap-wrapper .ProseMirror li {
          margin-bottom: 0.5rem;
          font-family: var(--font-serif);
          font-size: 1.125rem;
          line-height: 1.85;
        }

        .tiptap-wrapper .ProseMirror hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 2rem 0;
        }

        .tiptap-wrapper .ProseMirror pre {
          background: var(--surface-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem 1.25rem;
          margin: 1.5rem 0;
          overflow-x: auto;
        }

        .tiptap-wrapper .ProseMirror pre code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.875rem;
          color: var(--text-primary);
          background: none;
          padding: 0;
          border-radius: 0;
        }

        .tiptap-wrapper .ProseMirror code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.875em;
          background: var(--surface-secondary);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 0.1em 0.35em;
          color: var(--accent);
        }

        .tiptap-wrapper .ProseMirror .mention {
          color: var(--accent);
          font-weight: 600;
          cursor: pointer;
          border-radius: 4px;
          padding: 0 2px;
        }

        .tiptap-wrapper .ProseMirror .mention:hover {
          background: var(--accent-muted);
        }

        /* Image styles */
        .tiptap-wrapper .ProseMirror .editor-image {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5rem 0;
          display: block;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.15s;
        }

        .tiptap-wrapper .ProseMirror .editor-image.ProseMirror-selectednode {
          border-color: var(--accent);
          outline: none;
        }

        /* Link styles */
        .tiptap-wrapper .ProseMirror .editor-link {
          color: var(--accent);
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }

        .tiptap-wrapper .ProseMirror .editor-link:hover {
          color: var(--accent-warm);
        }

        /* Text alignment */
        .tiptap-wrapper .ProseMirror [style*="text-align: center"] { text-align: center; }
        .tiptap-wrapper .ProseMirror [style*="text-align: right"] { text-align: right; }
        .tiptap-wrapper .ProseMirror [style*="text-align: justify"] { text-align: justify; }
      `}</style>
    </div>
  );
}

// Word count helper
export function useWordCount(editor: Editor | null): number {
  if (!editor) return 0;
  const text = editor.getText();
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).length;
}

export default TipTapEditor;
