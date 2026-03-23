'use client';

import React, { Suspense } from "react";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { ThemeProvider } from "@/lib/hooks/useTheme";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background text-foreground">Initializing Novello...</div>}>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </Suspense>
  );
}
