'use client';

import React from 'react';
import { useTheme } from '@/lib/hooks/useTheme';

export default function NovelloLogo() {
    const { theme } = useTheme();
    const isDark = theme === 'futuro' || theme === 'play';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '2px',
                userSelect: 'none',
                lineHeight: 1,
            }}
        >
            <span
                style={{
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                    fontSize: '1.65rem',
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg, #DFBD69 0%, #B8860B 50%, #DFBD69 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}
            >
                Novello
            </span>
            <span
                style={{
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    fontWeight: 400,
                    fontSize: '1.1rem',
                    letterSpacing: '0.08em',
                    color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
                    paddingLeft: '2px',
                    alignSelf: 'flex-start',
                    paddingTop: '3px',
                }}
            >
                AI
            </span>
        </div>
    );
}
