'use client';

import { useRef, useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { useTheme, THEME_META, type Theme } from '@/lib/hooks/useTheme';

export function ThemePicker() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        function handleClick(e: MouseEvent) {
            if (
                panelRef.current && !panelRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isOpen]);

    const handleSelect = (t: Theme) => {
        setTheme(t);
        setIsOpen(false);
    };

    return (
        <div className="theme-picker-wrap">
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="control-btn"
                title="Change appearance"
                aria-label="Change appearance"
                aria-expanded={isOpen}
            >
                <Palette size={16} />
            </button>

            {isOpen && (
                <div ref={panelRef} className="theme-panel" role="listbox" aria-label="Appearance">
                    <div className="theme-panel-header">Appearance</div>

                    <div className="theme-cards">
                        {Object.values(THEME_META).map((t) => (
                            <button
                                key={t.id}
                                className={`theme-card-full ${theme === t.id ? 'theme-card-active' : ''}`}
                                onClick={() => handleSelect(t.id)}
                                role="option"
                                aria-selected={theme === t.id}
                            >
                                {/* Visual swatch strip */}
                                <div className="theme-swatch-strip">
                                    <div className="swatch-bg" style={{ background: t.swatches[0] }} />
                                    <div className="swatch-text-bar" style={{ background: t.swatches[1], opacity: 0.7 }} />
                                    <div className="swatch-accent-dot" style={{ background: t.swatches[2] }} />
                                </div>

                                {/* Info */}
                                <div className="theme-info">
                                    <div className="theme-row">
                                        <span className="theme-icon">{t.icon}</span>
                                        <span className="theme-name">{t.label}</span>
                                        {theme === t.id && <span className="theme-check">✓</span>}
                                    </div>
                                    <div className="theme-desc">{t.description}</div>
                                    <div className="theme-mode-badge" data-mode={t.colorScheme}>
                                        {t.colorScheme}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .theme-picker-wrap {
                    position: relative;
                }
                .theme-panel {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 320px;
                    background: var(--glass-bg-strong);
                    backdrop-filter: var(--glass-blur-heavy);
                    -webkit-backdrop-filter: var(--glass-blur-heavy);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-xl);
                    padding: 16px;
                    z-index: 200;
                    animation: scaleIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.92) translateY(-4px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .theme-panel-header {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--border);
                }
                .theme-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .theme-card-full {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: var(--radius-md);
                    border: 1.5px solid transparent;
                    background: var(--surface-secondary);
                    cursor: pointer;
                    transition: all 160ms ease;
                    text-align: left;
                    width: 100%;
                }
                .theme-card-full:hover {
                    border-color: var(--text-tertiary);
                    transform: translateX(2px);
                }
                .theme-card-active {
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 0 1px var(--accent), 0 0 14px var(--accent-glow);
                }
                .theme-swatch-strip {
                    position: relative;
                    width: 52px;
                    height: 44px;
                    border-radius: 8px;
                    overflow: hidden;
                    flex-shrink: 0;
                    border: 1px solid rgba(128,128,128,0.2);
                }
                .swatch-bg {
                    position: absolute;
                    inset: 0;
                }
                .swatch-text-bar {
                    position: absolute;
                    bottom: 8px;
                    left: 6px;
                    right: 6px;
                    height: 4px;
                    border-radius: 2px;
                }
                .swatch-accent-dot {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .theme-info {
                    flex: 1;
                    min-width: 0;
                }
                .theme-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 3px;
                }
                .theme-icon { font-size: 14px; }
                .theme-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .theme-check {
                    margin-left: auto;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--accent);
                    color: var(--text-inverse);
                    font-size: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .theme-desc {
                    font-size: 11px;
                    color: var(--text-tertiary);
                    margin-bottom: 5px;
                }
                .theme-mode-badge {
                    display: inline-block;
                    font-size: 9px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    padding: 2px 6px;
                    border-radius: 4px;
                    color: #fff;
                }
                .theme-mode-badge[data-mode="dim"]   { background: #7c5a2a; }
                .theme-mode-badge[data-mode="light"] { background: #0071e3; }
                .theme-mode-badge[data-mode="dark"]  { background: #00664e; }
            `}</style>
        </div>
    );
}
