'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ThemeProvider } from '@/lib/hooks/useTheme';
import { GlobalNav } from '@/components/layout/GlobalNav';
import { AIChatbox } from '@/components/layout/AIChatbox';
import { ProjectLedger } from '@/components/layout/ProjectLedger';
import { ActiveProjectProvider } from '@/lib/context/ActiveProjectContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
                <div className="loading-spinner">
                    <div className="spinner-ring" />
                    <span className="spinner-label">Loading Novello...</span>
                </div>
                <style jsx>{`
                    .loading-spinner {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 16px;
                    }
                    .spinner-ring {
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        border: 2px solid var(--border);
                        border-top-color: var(--accent);
                        animation: spin 0.8s linear infinite;
                    }
                    .spinner-label {
                        font-size: 0.8rem;
                        color: var(--text-tertiary);
                        font-weight: 500;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!user) return null;

    return (
        <ThemeProvider>
            <ActiveProjectProvider>
                <ErrorBoundary>
                    <GlobalNav />
                    <main
                        className="flex-1 overflow-y-auto relative"
                        style={{
                            paddingTop: 'var(--nav-height, 80px)',
                            paddingRight: 'var(--chatbox-width, 320px)',
                            paddingLeft: '0px',
                            paddingBottom: '0px',
                            minHeight: '100vh',
                        }}
                    >
                        <div style={{ padding: '1.5rem' }}>
                        <Suspense fallback={<div className="p-8 text-center text-secondary">Loading...</div>}>
                            {children}
                        </Suspense>
                        </div>
                    </main>
                    <AIChatbox />
                    <ProjectLedger />
                </ErrorBoundary>
            </ActiveProjectProvider>
        </ThemeProvider>
    );
}
