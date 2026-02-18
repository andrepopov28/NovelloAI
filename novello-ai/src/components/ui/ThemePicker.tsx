'use client';

import { useRef, useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { useTheme, THEME_META, type Theme } from '@/lib/hooks/useTheme';

export function ThemePicker() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Close on click-outside
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

                    {/* Core Themes */}
                    <div className="theme-category-label">Core</div>
                    <div className="theme-grid">
                        {THEME_META.filter(t => t.category === 'Core').map((t) => (
                            <button
                                key={t.id}
                                className={`theme-card ${theme === t.id ? 'theme-card-active' : ''}`}
                                onClick={() => handleSelect(t.id)}
                                role="option"
                                aria-selected={theme === t.id}
                            >
                                <div className="theme-swatch">
                                    <div className="swatch-bar" style={{ background: t.swatches[0] }} />
                                    <div className="swatch-bar" style={{ background: t.swatches[1] }} />
                                    <div className="swatch-bar" style={{ background: t.swatches[2] }} />
                                </div>
                                {theme === t.id && <span className="theme-check">✓</span>}
                                <span className="theme-label">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Immersive Themes */}
                    <div className="theme-category-label">Immersive</div>
                    <div className="theme-grid">
                        {THEME_META.filter(t => t.category === 'Immersive').map((t) => (
                            <button
                                key={t.id}
                                className={`theme-card ${theme === t.id ? 'theme-card-active' : ''}`}
                                onClick={() => handleSelect(t.id)}
                                role="option"
                                aria-selected={theme === t.id}
                            >
                                <div className="theme-swatch">
                                    <div className="swatch-bar" style={{ background: t.swatches[0] }} />
                                    <div className="swatch-bar" style={{ background: t.swatches[1] }} />
                                    <div className="swatch-bar" style={{ background: t.swatches[2] }} />
                                </div>
                                {theme === t.id && <span className="theme-check">✓</span>}
                                <span className="theme-label">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Editorial Themes */}
                    <div className="theme-category-label">Editorial</div>
                    <div className="theme-grid">
                        {THEME_META.filter(t => t.category === 'Editorial').map((t) => (
                            <button
                                key={t.id}
                                className={`theme-card ${theme === t.id ? 'theme-card-active' : ''}`}
                                onClick={() => handleSelect(t.id)}
                                role="option"
                                aria-selected={theme === t.id}
                            >
                                <div className="theme-swatch">
                                    <div className="swatch-bar" style={{ background: t.swatches[0] }} />
                                    <div className="swatch-bar" style={{ background: t.swatches[1] }} />
                                    <div className="swatch-bar" style={{ background: t.swatches[2] }} />
                                </div>
                                {theme === t.id && <span className="theme-check">✓</span>}
                                <span className="theme-label">{t.label}</span>
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
                    width: 340px;
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
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--border);
                }
                .theme-category-label {
                    font-size: 10px;
                    font-weight: 600;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    margin: 10px 0 6px;
                }
                .theme-category-label:first-of-type {
                    margin-top: 0;
                }
                .theme-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin-bottom: 4px;
                }
                .theme-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 6px 8px;
                    border-radius: var(--radius-md);
                    border: 1.5px solid transparent;
                    background: var(--surface-secondary);
                    cursor: pointer;
                    transition: all 150ms ease;
                    position: relative;
                }
                .theme-card:hover {
                    border-color: var(--text-tertiary);
                    transform: translateY(-1px);
                }
                .theme-card-active {
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 0 1px var(--accent), 0 0 12px var(--accent-glow);
                }
                .theme-swatch {
                    display: flex;
                    gap: 3px;
                    width: 100%;
                    height: 32px;
                    border-radius: 4px;
                    overflow: hidden;
                    border: 1px solid rgba(128, 128, 128, 0.15);
                }
                .swatch-bar {
                    flex: 1;
                }
                .theme-check {
                    position: absolute;
                    top: 4px;
                    right: 4px;
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
                }
                .theme-label {
                    font-size: 10px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    text-align: center;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }
            `}</style>
        </div>
    );
}
