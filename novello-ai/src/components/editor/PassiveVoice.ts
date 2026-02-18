import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// =============================================
// PassiveVoice — Decoration plugin that highlights passive voice constructions
// Pattern: forms of "be" + past participle (ed/en/wn/ght/ung etc.)
// =============================================

const PASSIVE_VOICE_KEY = new PluginKey('passiveVoice');

// Common "be" forms
const BE_FORMS = [
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'get', 'gets', 'got', 'gotten', 'getting',
];

// Past participle endings (heuristic)
const PP_ENDINGS = /(?:ed|en|wn|ght|ung|nt|ck|pt|ft|lt|mn|rn|st)$/i;

// Common irregular past participles
const IRREGULAR_PP = new Set([
    'been', 'born', 'broken', 'chosen', 'done', 'drawn', 'driven',
    'eaten', 'fallen', 'flown', 'forgotten', 'frozen', 'given', 'gone',
    'grown', 'hidden', 'known', 'lain', 'left', 'made', 'paid',
    'ridden', 'risen', 'run', 'seen', 'shaken', 'shown', 'spoken',
    'stolen', 'sworn', 'taken', 'thrown', 'told', 'torn', 'understood',
    'woken', 'worn', 'written', 'built', 'bought', 'brought', 'caught',
    'cut', 'dealt', 'dug', 'fed', 'felt', 'found', 'fought', 'heard',
    'held', 'hit', 'hung', 'hurt', 'kept', 'knelt', 'laid', 'led',
    'lost', 'meant', 'met', 'put', 'read', 'said', 'sat', 'sent',
    'set', 'shot', 'shut', 'slept', 'slid', 'sold', 'sought', 'spent',
    'spun', 'split', 'spread', 'stood', 'struck', 'stuck', 'stung',
    'sung', 'sunk', 'swept', 'swum', 'swung', 'taught', 'thought',
    'wound', 'woven', 'won', 'wept',
]);

function isPastParticiple(word: string): boolean {
    const lower = word.toLowerCase();
    return IRREGULAR_PP.has(lower) || PP_ENDINGS.test(lower);
}

function findPassiveVoice(text: string): Array<{ from: number; to: number }> {
    const matches: Array<{ from: number; to: number }> = [];
    const words = text.split(/(\s+)/);
    let pos = 0;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const lower = word.toLowerCase();

        if (BE_FORMS.includes(lower)) {
            // Look for the next non-whitespace word
            let j = i + 1;
            let nextPos = pos + word.length;
            while (j < words.length && /^\s+$/.test(words[j])) {
                nextPos += words[j].length;
                j++;
            }

            if (j < words.length && isPastParticiple(words[j])) {
                // Mark the entire "be + pp" span
                const matchEnd = nextPos + words[j].length;
                matches.push({ from: pos, to: matchEnd });
            }
        }

        pos += word.length;
    }

    return matches;
}

export interface PassiveVoiceOptions {
    enabled: boolean;
}

export const PassiveVoiceExtension = Extension.create<PassiveVoiceOptions>({
    name: 'passiveVoice',

    addOptions() {
        return { enabled: false };
    },

    addProseMirrorPlugins() {
        const extensionThis = this;
        return [
            new Plugin({
                key: PASSIVE_VOICE_KEY,
                state: {
                    init(_, state) {
                        if (!extensionThis.options.enabled) return DecorationSet.empty;
                        return buildDecorations(state.doc);
                    },
                    apply(tr, oldSet) {
                        if (!extensionThis.options.enabled) return DecorationSet.empty;
                        if (tr.docChanged) {
                            return buildDecorations(tr.doc);
                        }
                        return oldSet;
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state) ?? DecorationSet.empty;
                    },
                },
            }),
        ];
    },
});

function buildDecorations(doc: import('@tiptap/pm/model').Node): DecorationSet {
    const decorations: Decoration[] = [];

    doc.descendants((node, pos) => {
        if (!node.isText || !node.text) return;
        const matches = findPassiveVoice(node.text);
        for (const match of matches) {
            decorations.push(
                Decoration.inline(pos + match.from, pos + match.to, {
                    class: 'passive-voice-highlight',
                    style:
                        'background: rgba(245, 158, 11, 0.15); border-bottom: 2px wavy #f59e0b; border-radius: 2px;',
                })
            );
        }
    });

    return DecorationSet.create(doc, decorations);
}
