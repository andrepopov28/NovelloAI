'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

export type Theme = 'play' | 'global' | 'futuro';

export interface ThemeMeta {
    id: Theme;
    name: string;
    label: string;
    description: string;
    icon: string;
    colorScheme: 'dark' | 'light' | 'dim';
    swatches: [string, string, string];
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
        muted: string;
        border: string;
    };
    avatars: Record<'architect' | 'stylist' | 'editor' | 'narrator' | 'strategist', string>;
}

// Helper to determine colorScheme from background color
function getColorScheme(backgroundColor: string): 'dark' | 'light' | 'dim' {
    const hex = backgroundColor.startsWith('#') ? backgroundColor.slice(1) : backgroundColor;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    if (luminance < 0.2) return 'dark';
    if (luminance < 0.5) return 'dim';
    return 'light';
}

export const THEME_META: Record<Theme, ThemeMeta> = {
  play: {
    id: 'play',
    name: 'Play',
    label: 'Play',
    description: 'Dynamic and artistic style for creative storytelling.',
    icon: '🎭',
    colorScheme: 'dim',
    swatches: ['#1C1C2E', '#5856D6', '#FF3B30'],
    colors: {
      primary: '#FF3B30',
      secondary: '#FF9500',
      accent: '#5856D6',
      background: '#FFFFFF',
      text: '#1C1C1E',
      muted: '#8E8E93',
      border: '#C7C7CC',
    },
    avatars: {
      architect: '/images/avatars/play/kermit.png',
      stylist: '/images/avatars/play/bugs.png',
      editor: '/images/avatars/play/tomjerry.png',
      narrator: '/images/avatars/play/panther.png',
      strategist: '/images/avatars/play/bart.png',
    },
  },
  global: {
    id: 'global',
    name: 'Global',
    label: 'Global',
    description: 'Clean, minimalist, and professional aesthetic.',
    icon: '🌐',
    colorScheme: 'light',
    swatches: ['#F2F2F7', '#007AFF', '#4CD964'],
    colors: {
      primary: '#007AFF',
      secondary: '#5AC8FA',
      accent: '#4CD964',
      background: '#F2F2F7',
      text: '#1C1C1E',
      muted: '#8E8E93',
      border: '#D1D1D6',
    },
    avatars: {
      architect: '/images/avatars/global/architect.png',
      stylist: '/images/avatars/global/stylist.png',
      editor: '/images/avatars/global/editor.png',
      narrator: '/images/avatars/global/narrator.png',
      strategist: '/images/avatars/global/strategist.png',
    },
  },
  futuro: {
    id: 'futuro',
    name: 'Futuro',
    label: 'Futuro',
    description: 'Dark, tech-focused style with glowing accents.',
    icon: '🟩',
    colorScheme: 'dark',
    swatches: ['#000000', '#32D74B', '#BF5AF2'],
    colors: {
      primary: '#32D74B',
      secondary: '#64D2FF',
      accent: '#BF5AF2',
      background: '#000000',
      text: '#FFFFFF',
      muted: '#48484A',
      border: '#38383A',
    },
    avatars: {
      architect: '/images/avatars/futuro/architect.png',
      stylist: '/images/avatars/futuro/stylist.png',
      editor: '/images/avatars/futuro/editor.png',
      narrator: '/images/avatars/futuro/narrator.png',
      strategist: '/images/avatars/futuro/strategist.png',
    },
  },
};

const VALID_THEMES = new Set<string>(Object.keys(THEME_META));
const THEME_IDS = Object.keys(THEME_META) as Theme[];

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
    themeMeta: ThemeMeta;
}

function getThemeMeta(t: Theme): ThemeMeta {
    return THEME_META[t] || THEME_META['play'];
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'play',
    toggleTheme: () => { },
    setTheme: () => { },
    themeMeta: THEME_META['play'],
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('play');

    useEffect(() => {
        const stored = localStorage.getItem('novello-theme');
        const initial: Theme = (stored && VALID_THEMES.has(stored)) ? (stored as Theme) : 'play';
        setThemeState(initial);
        const meta = getThemeMeta(initial);
        document.documentElement.setAttribute('data-theme', initial);
        document.documentElement.style.colorScheme = meta.colorScheme;
    }, []);

    const applyTheme = useCallback((t: Theme) => {
        setThemeState(t);
        const meta = getThemeMeta(t);
        document.documentElement.setAttribute('data-theme', t);
        document.documentElement.style.colorScheme = meta.colorScheme;
        localStorage.setItem('novello-theme', t);
    }, []);

    const toggleTheme = useCallback(() => {
        const idx = THEME_IDS.indexOf(theme);
        const next = THEME_IDS[(idx + 1) % THEME_IDS.length];
        applyTheme(next);
    }, [theme, applyTheme]);

    const setTheme = useCallback((t: Theme) => {
        applyTheme(t);
    }, [applyTheme]);

    const themeMeta = getThemeMeta(theme);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, themeMeta }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
