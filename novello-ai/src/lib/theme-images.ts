/**
 * Theme-aware module image registry.
 * Maps each theme to its set of 6 module images.
 * Falls back to 'dark' images if a theme's images haven't been generated yet.
 */

import type { Theme } from '@/lib/hooks/useTheme';

export type ModuleKey = 'write' | 'brainstorm' | 'data' | 'audiobook' | 'publish' | 'settings';

export type ThemeImageSet = Record<ModuleKey, string>;

const BASE = '/images/themes';

/** Full image registry — one entry per theme */
const THEME_IMAGES: Record<Theme, ThemeImageSet> = {
    dark: {
        write: `${BASE}/dark/write.webp`,
        brainstorm: `${BASE}/dark/brainstorm.webp`,
        data: `${BASE}/dark/data.webp`,
        audiobook: `${BASE}/dark/audiobook.webp`,
        publish: `${BASE}/dark/publish.webp`,
        settings: `${BASE}/dark/settings.webp`,
    },
    light: {
        write: `${BASE}/light/write.webp`,
        brainstorm: `${BASE}/light/brainstorm.webp`,
        data: `${BASE}/light/data.webp`,
        audiobook: `${BASE}/light/audiobook.webp`,
        publish: `${BASE}/light/publish.webp`,
        settings: `${BASE}/light/settings.webp`,
    },
    swiss: {
        write: `${BASE}/swiss/write.webp`,
        brainstorm: `${BASE}/swiss/brainstorm.webp`,
        data: `${BASE}/swiss/data.webp`,
        audiobook: `${BASE}/swiss/audiobook.webp`,
        publish: `${BASE}/swiss/publish.webp`,
        settings: `${BASE}/swiss/settings.webp`,
    },
    eink: {
        write: `${BASE}/eink/write.webp`,
        brainstorm: `${BASE}/eink/brainstorm.webp`,
        data: `${BASE}/eink/data.webp`,
        audiobook: `${BASE}/eink/audiobook.webp`,
        publish: `${BASE}/eink/publish.webp`,
        settings: `${BASE}/eink/settings.webp`,
    },
    cupertino: {
        write: `${BASE}/cupertino/write.webp`,
        brainstorm: `${BASE}/cupertino/brainstorm.webp`,
        data: `${BASE}/cupertino/data.webp`,
        audiobook: `${BASE}/cupertino/audiobook.webp`,
        publish: `${BASE}/cupertino/publish.webp`,
        settings: `${BASE}/cupertino/settings.webp`,
    },
    academia: {
        write: `${BASE}/academia/write.webp`,
        brainstorm: `${BASE}/academia/brainstorm.webp`,
        data: `${BASE}/academia/data.webp`,
        audiobook: `${BASE}/academia/audiobook.webp`,
        publish: `${BASE}/academia/publish.webp`,
        settings: `${BASE}/academia/settings.webp`,
    },
    brutalist: {
        write: `${BASE}/brutalist/write.webp`,
        brainstorm: `${BASE}/brutalist/brainstorm.webp`,
        data: `${BASE}/brutalist/data.webp`,
        audiobook: `${BASE}/brutalist/audiobook.webp`,
        publish: `${BASE}/brutalist/publish.webp`,
        settings: `${BASE}/brutalist/settings.webp`,
    },
    terminal: {
        write: `${BASE}/terminal/write.webp`,
        brainstorm: `${BASE}/terminal/brainstorm.webp`,
        data: `${BASE}/terminal/data.webp`,
        audiobook: `${BASE}/terminal/audiobook.webp`,
        publish: `${BASE}/terminal/publish.webp`,
        settings: `${BASE}/terminal/settings.webp`,
    },
    editorial: {
        write: `${BASE}/editorial/write.webp`,
        brainstorm: `${BASE}/editorial/brainstorm.webp`,
        data: `${BASE}/editorial/data.webp`,
        audiobook: `${BASE}/editorial/audiobook.webp`,
        publish: `${BASE}/editorial/publish.webp`,
        settings: `${BASE}/editorial/settings.webp`,
    },
};

/** Fallback set used when a theme's images aren't ready yet */
const FALLBACK = THEME_IMAGES.dark;

/**
 * Get the image path for a specific theme + module combination.
 * Returns the dark fallback if the theme-specific image isn't available.
 */
export function getThemeImage(theme: Theme, module: ModuleKey): string {
    return THEME_IMAGES[theme]?.[module] ?? FALLBACK[module];
}

/**
 * Get all 6 module images for a given theme.
 */
export function getThemeImageSet(theme: Theme): ThemeImageSet {
    return THEME_IMAGES[theme] ?? FALLBACK;
}

/**
 * Themes that use light-colored images (need dark text overlay on cards).
 * Dark themes use white text; light themes use dark text.
 */
export const LIGHT_THEMES = new Set<Theme>(['light', 'swiss', 'eink', 'cupertino', 'editorial', 'brutalist']);

export function isLightTheme(theme: Theme): boolean {
    return LIGHT_THEMES.has(theme);
}
