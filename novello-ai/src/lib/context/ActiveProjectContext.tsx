'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ActiveProjectContextValue {
    activeProjectId: string | null;
    setActiveProjectId: (id: string | null) => void;
}

const ActiveProjectContext = createContext<ActiveProjectContextValue>({
    activeProjectId: null,
    setActiveProjectId: () => { },
});

const STORAGE_KEY = 'novello-active-project';

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
    const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);

    // Hydrate from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setActiveProjectIdState(stored);
        } catch {
            // SSR safety
        }
    }, []);

    const setActiveProjectId = (id: string | null) => {
        setActiveProjectIdState(id);
        try {
            if (id) {
                localStorage.setItem(STORAGE_KEY, id);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // SSR safety
        }
    };

    return (
        <ActiveProjectContext.Provider value={{ activeProjectId, setActiveProjectId }}>
            {children}
        </ActiveProjectContext.Provider>
    );
}

export function useActiveProject() {
    return useContext(ActiveProjectContext);
}
