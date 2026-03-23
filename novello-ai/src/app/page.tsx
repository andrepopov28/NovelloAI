import { Suspense } from 'react';
import RootRedirect from '@/components/RootRedirect';

// RootPage is a Server Component that renders RootRedirect inside Suspense.
// Next.js handles its dynamic nature automatically.

export default function RootPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--surface-primary)]"><div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" /></div>}>
      <RootRedirect />
    </Suspense>
  );
}
