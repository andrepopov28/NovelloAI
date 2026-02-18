import { Node, mergeAttributes } from '@tiptap/core';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';

// =============================================
// MentionExtension — @CharacterName detection
// =============================================

export interface MentionOptions {
    suggestion: Partial<SuggestionOptions>;
    HTMLAttributes: Record<string, unknown>;
}

export const MentionExtension = Node.create<MentionOptions>({
    name: 'mention',
    group: 'inline',
    inline: true,
    selectable: false,
    atom: true,

    addOptions() {
        return {
            suggestion: {
                char: '@',
                allowSpaces: false,
                startOfLine: false,
            },
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: (element) => element.getAttribute('data-id'),
                renderHTML: (attributes) => {
                    if (!attributes.id) return {};
                    return { 'data-id': attributes.id };
                },
            },
            label: {
                default: null,
                parseHTML: (element) => element.getAttribute('data-label'),
                renderHTML: (attributes) => {
                    if (!attributes.label) return {};
                    return { 'data-label': attributes.label };
                },
            },
            type: {
                default: 'Character',
                parseHTML: (element) => element.getAttribute('data-type'),
                renderHTML: (attributes) => {
                    if (!attributes.type) return {};
                    return { 'data-type': attributes.type };
                },
            },
        };
    },

    parseHTML() {
        return [{ tag: `span[data-mention]` }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(
                {
                    'data-mention': '',
                    class: 'mention',
                    style: 'color: var(--accent); font-weight: 600; cursor: pointer;',
                },
                this.options.HTMLAttributes,
                HTMLAttributes
            ),
            `@${node.attrs.label ?? node.attrs.id}`,
        ];
    },

    renderText({ node }) {
        return `@${node.attrs.label ?? node.attrs.id}`;
    },

    addKeyboardShortcuts() {
        return {
            Backspace: () =>
                this.editor.commands.command(({ tr, state }) => {
                    let isMention = false;
                    const { selection } = state;
                    const { empty, anchor } = selection;

                    if (!empty) return false;

                    state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
                        if (node.type.name === this.name) {
                            isMention = true;
                            tr.insertText('', pos, pos + node.nodeSize);
                            return false;
                        }
                    });

                    return isMention;
                }),
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});
