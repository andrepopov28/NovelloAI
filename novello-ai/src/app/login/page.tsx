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

        {/* Enter App */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-[var(--radius-md)] font-medium text-sm transition-all hover:shadow-md cursor-pointer"
          style={{
            background: 'var(--accent)',
            color: '#fff',
          }}
        >
          <BookOpen size={18} />
          Enter Novello
        </button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <Sparkles size={12} style={{ color: 'var(--accent)' }} />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            V34 — Local-First · No Cloud Required
          </span>
          <Sparkles size={12} style={{ color: 'var(--accent)' }} />
        </div>
      </div>
    </div>
  );
}
