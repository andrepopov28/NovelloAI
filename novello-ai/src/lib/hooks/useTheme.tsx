'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

export type Theme =
    | 'dark'
    | 'light'
    | 'swiss'
    | 'eink'
    | 'cupertino'
    | 'academia'
    | 'brutalist'
    | 'terminal'
    | 'editorial';

export interface ThemeMeta {
    id: Theme;
    label: string;
    icon: string;
    category: 'Core' | 'Immersive' | 'Editorial';
    swatches: [string, string, string]; // [bg, text, accent]
    colorScheme: 'dark' | 'light';
}

export const THEME_META: ThemeMeta[] = [
    { id: 'dark', label: 'Dark Mode', icon: '🌙', category: 'Core', swatches: ['#09090b', '#f4f4f5', '#06b6d4'], colorScheme: 'dark' },
    { id: 'light', label: 'Light Mode', icon: '☀️', category: 'Core', swatches: ['#f5f5f7', '#1d1d1f', '#06b6d4'], colorScheme: 'light' },
    { id: 'swiss', label: 'Swiss International', icon: '🇨🇭', category: 'Core', swatches: ['#fafafa', '#111111', '#0038a8'], colorScheme: 'light' },
    { id: 'eink', label: 'Warm E-Ink', icon: '📜', category: 'Core', swatches: ['#f5f0e8', '#2d2d2d', '#c0540c'], colorScheme: 'light' },
    { id: 'cupertino', label: 'Cupertino Glass', icon: '🍎', category: 'Core', swatches: ['#f0f0f5', '#1c1c1e', '#007aff'], colorScheme: 'light' },
    { id: 'academia', label: 'Dark Academia', icon: '📚', category: 'Immersive', swatches: ['#1a2e1a', '#e8dcc8', '#c5a44e'], colorScheme: 'dark' },
    { id: 'brutalist', label: 'Neo-Brutalist', icon: '🔨', category: 'Immersive', swatches: ['#ffffff', '#000000', '#ff6b6b'], colorScheme: 'light' },
    { id: 'terminal', label: 'Cyber-Terminal', icon: '💻', category: 'Immersive', swatches: ['#050505', '#39ff14', '#00e5ff'], colorScheme: 'dark' },
    { id: 'editorial', label: 'High-Fashion', icon: '✨', category: 'Editorial', swatches: ['#ffffff', '#000000', '#000000'], colorScheme: 'light' },
];

const VALID_THEMES = new Set<string>(THEME_META.map(t => t.id));

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
    themeMeta: ThemeMeta;
}

function getThemeMeta(t: Theme): ThemeMeta {
    return THEME_META.find(m => m.id === t) ?? THEME_META[0];
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'dark',
    toggleTheme: () => { },
    setTheme: () => { },
    themeMeta: THEME_META[0],
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');

    // Initialise from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('novello-theme');
        const initial: Theme = (stored && VALID_THEMES.has(stored)) ? (stored as Theme) : 'dark';
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
        const idx = THEME_META.findIndex(m => m.id === theme);
        const next = THEME_META[(idx + 1) % THEME_META.length];
        applyTheme(next.id);
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
