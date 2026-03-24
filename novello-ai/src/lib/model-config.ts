// Model configuration per AI action — Multi-Model Routing (V34)
// Allows different Ollama models per task type for performance/quality balance.

export type ModelAction = 
    | 'write'        // Full chapter writing — heavy models
    | 'rewrite'      // Sentence-level rewriting
    | 'outline'      // Outline generation
    | 'critique'     // AI Beta Reader — reasoning models preferred
    | 'continuity'   // Continuity checking — fast models ok
    | 'style'        // Style analysis — needs literary understanding
    | 'brainstorm'   // Ideation — creative models preferred
    | 'chat'         // General chat assistant
    | 'autocomplete' // Inline autocomplete — fastest model required
    | 'ghost_writer' // Full autonomous chapter writing
    | 'plot_holes';  // Plot analysis

export interface ModelConfig {
    defaultModel: string;
    actionOverrides: Partial<Record<ModelAction, string>>;
}

const DEFAULT_CONFIG_KEY = 'novello-model-config';

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
    defaultModel: 'qwen2.5:7b',
    actionOverrides: {
        write: 'qwen2.5:7b',
        rewrite: 'qwen2.5:7b',
        outline: 'qwen2.5:7b',
        critique: 'qwen2.5:7b',
        continuity: 'qwen2.5:7b',
        style: 'qwen2.5:7b',
        brainstorm: 'qwen2.5:7b',
        chat: 'qwen2.5:7b',
        autocomplete: 'qwen2.5:3b', // fastest possible for inline suggestions
        ghost_writer: 'qwen2.5:7b',
        plot_holes: 'qwen2.5:7b',
    },
};

/** Load model config from localStorage (SSR-safe). Returns defaults if not found. */
export function loadModelConfig(): ModelConfig {
    if (typeof window === 'undefined') return DEFAULT_MODEL_CONFIG;
    try {
        const raw = localStorage.getItem(DEFAULT_CONFIG_KEY);
        if (!raw) return DEFAULT_MODEL_CONFIG;
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_MODEL_CONFIG, ...parsed, actionOverrides: { ...DEFAULT_MODEL_CONFIG.actionOverrides, ...(parsed.actionOverrides || {}) } };
    } catch {
        return DEFAULT_MODEL_CONFIG;
    }
}

/** Save model config to localStorage. */
export function saveModelConfig(config: ModelConfig): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEFAULT_CONFIG_KEY, JSON.stringify(config));
}

/** Get the model to use for a specific action, respecting overrides. */
export function getModelForAction(action: ModelAction, config?: ModelConfig): string {
    const cfg = config || loadModelConfig();
    return cfg.actionOverrides[action] || cfg.defaultModel;
}

/** Reset to defaults. */
export function resetModelConfig(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(DEFAULT_CONFIG_KEY);
    }
}
