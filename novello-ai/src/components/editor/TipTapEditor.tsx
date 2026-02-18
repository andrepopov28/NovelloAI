'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import { InlineAssist } from './InlineAssist';
import { MentionExtension } from './MentionExtension';
import { MentionList, MentionListRef } from './MentionList';
import { PassiveVoiceExtension } from './PassiveVoice';
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
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'manuscript prose-editor focus:outline-none min-h-[60vh]',
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
