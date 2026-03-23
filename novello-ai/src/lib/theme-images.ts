/**
 * Theme-aware module image registry.
 * Maps each of the 3 themes to its 6 module images.
 * Generated via Google Stitch (project 9659578790309981132).
 */

import type { Theme } from '@/lib/hooks/useTheme';

export type ModuleKey = 'write' | 'brainstorm' | 'data' | 'audiobook' | 'publish' | 'settings';

export type ThemeImageSet = Record<ModuleKey, string>;

const BASE = '/images/themes';

/** Full image registry */
const THEME_IMAGES: Record<Theme, ThemeImageSet> = {
    play: {
        write:      `${BASE}/play/write.webp`,
        brainstorm: `${BASE}/play/brainstorm.webp`,
        data:       `${BASE}/play/data.webp`,
        audiobook:  `${BASE}/play/audiobook.webp`,
        publish:    `${BASE}/play/publish.webp`,
        settings:   `${BASE}/play/settings.webp`,
    },
    global: {
        write:      `${BASE}/global/write.webp`,
        brainstorm: `${BASE}/global/brainstorm.webp`,
        data:       `${BASE}/global/data.webp`,
        audiobook:  `${BASE}/global/audiobook.webp`,
        publish:    `${BASE}/global/publish.webp`,
        settings:   `${BASE}/global/settings.webp`,
    },
    futuro: {
        write:      `${BASE}/futuro/write.webp`,
        brainstorm: `${BASE}/futuro/brainstorm.webp`,
        data:       `${BASE}/futuro/data.webp`,
        audiobook:  `${BASE}/futuro/audiobook.webp`,
        publish:    `${BASE}/futuro/publish.webp`,
        settings:   `${BASE}/futuro/settings.webp`,
    },
};

/** Fallback set used when a theme's images aren't ready yet */
const FALLBACK = THEME_IMAGES.futuro;

export function getThemeImage(theme: Theme, module: ModuleKey): string {
    return THEME_IMAGES[theme]?.[module] ?? FALLBACK[module];
}

export function getThemeImageSet(theme: Theme): ThemeImageSet {
    return THEME_IMAGES[theme] ?? FALLBACK;
}

/**
 * Only "global" uses light colors — the other two are dark/dim.
 */
export const LIGHT_THEMES = new Set<Theme>(['global']);

export function isLightTheme(theme: Theme): boolean {
    return LIGHT_THEMES.has(theme);
}
