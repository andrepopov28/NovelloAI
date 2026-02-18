'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { BookOpen, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/app');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
                <div
                    className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'var(--surface-primary)' }}
        >
            <div
                className="rounded-[var(--radius-xl)] border p-10 max-w-md w-full text-center animate-slide-up"
                style={{
                    background: 'var(--surface-secondary)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                }}
            >
                {/* Logo */}
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: 'var(--accent)' }}
                >
                    <BookOpen size={32} className="text-white" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Welcome to Novello AI
                </h1>
                <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                    The Autonomous Publisher — Your AI-Powered Writing Studio
                </p>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Write', icon: '✍️' },
                        { label: 'Brainstorm', icon: '💡' },
                        { label: 'Publish', icon: '📚' },
                    ].map((f) => (
                        <div key={f.label} className="text-center">
                            <div className="text-2xl mb-1">{f.icon}</div>
                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{f.label}</div>
                        </div>
                    ))}
                </div>

                {/* Google Sign-In */}
                <button
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-[var(--radius-md)] font-medium text-sm transition-all hover:shadow-md cursor-pointer"
                    style={{
                        background: 'var(--surface-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-strong)',
                    }}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 mt-8">
                    <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        v23 — The Autonomous Publisher
                    </span>
                    <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                </div>
            </div>
        </div>
    );
}
