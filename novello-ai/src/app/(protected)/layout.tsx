'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ThemeProvider } from '@/lib/hooks/useTheme';
import { GlobalNav } from '@/components/layout/GlobalNav';
import { AIChatbox } from '@/components/layout/AIChatbox';
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
            <ErrorBoundary>
                <GlobalNav />
                <main style={{
                    paddingTop: '80px', // Matches global-nav height (updated from 64px)
                    paddingRight: 'var(--chatbox-width)', // Prevent content overlapping the fixed chatbox
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}>
                    {children}
                </main>
                <AIChatbox />
            </ErrorBoundary>
        </ThemeProvider>
    );
}
