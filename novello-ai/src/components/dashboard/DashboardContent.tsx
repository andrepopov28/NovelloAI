'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useProjects } from '@/lib/hooks/useProjects';
import { useTheme } from '@/lib/hooks/useTheme';
import { getThemeImage, isLightTheme } from '@/lib/theme-images';
import { useActiveProject } from '@/lib/context/ActiveProjectContext';
import { Plus, ArrowRight } from 'lucide-react';
import type { Project } from '@/lib/types';

/* ─── Module definitions ─────────────────────────────────────── */
const MODULE_STATIC = [
    { title: 'Brainstorm', subtitle: 'Mind maps & stickies', href: '', key: 'brainstorm' as const },
    { title: 'Data & Knowledge', subtitle: 'Uploads & citations', href: '', key: 'data' as const },
    { title: 'Audiobook Studio', subtitle: 'Voice & narration', href: '/audiobook', key: 'audiobook' as const },
    { title: 'Publish', subtitle: 'Export & finalize', href: '/publish', key: 'publish' as const },
    { title: 'Settings', subtitle: 'Models & workflow', href: '/settings', key: 'settings' as const },
];

/* ─── Compact Destination Card ───────────────────────────────── */
function DestCard({
    title,
    subtitle,
    href,
    imageSrc,
    lightTheme,
}: {
    title: string;
    subtitle: string;
    href: string;
    imageSrc: string;
    lightTheme: boolean;
}) {
    const overlay = lightTheme
        ? 'linear-gradient(180deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.82) 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.72) 100%)';
    const titleColor = lightTheme ? 'var(--text-primary)' : '#fff';
    const subtitleColor = lightTheme ? 'var(--text-secondary)' : 'rgba(255,255,255,0.75)';

    return (
        <Link
            href={href || '#'}
            className="dest-card group"
        >
            <div className="dest-card-img-wrap">
                <Image src={imageSrc} alt={title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="200px" />
                <div className="dest-card-overlay" style={{ background: overlay }} />
            </div>
            <div className="dest-card-text">
                <span className="dest-card-title" style={{ color: titleColor }}>{title}</span>
                <span className="dest-card-subtitle" style={{ color: subtitleColor }}>{subtitle}</span>
            </div>
        </Link>
    );
}

export function DashboardContent() {
    const { projects, loading } = useProjects();
    const { theme } = useTheme();
    const { activeProjectId } = useActiveProject();
    const lightTheme = isLightTheme(theme);

    const writeHref = activeProjectId ? `/project/${activeProjectId}` : '/app';

    const allModules = [
        { title: 'Write', subtitle: 'AI Core', href: writeHref, key: 'write' as const },
        ...MODULE_STATIC.map(m => ({
            ...m,
            href: m.href
                ? m.href
                : activeProjectId
                    ? `/project/${activeProjectId}/${m.key === 'data' ? 'codex' : m.key}`
                    : '/app',
        })),
    ];

    return (
        <div className="home-root">
            {/* ── Destinations (Full width) ── */}
            <div className="home-section-header">
                <h2 className="home-section-title">Destinations</h2>
                <p className="home-section-sub">Photorealistic shortcuts into the core areas.</p>
            </div>
            {loading ? (
                <div className="dest-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton-block" style={{ aspectRatio: '4/3' }} />
                    ))}
                </div>
            ) : (
                <div className="dest-grid">
                    {allModules.map(mod => (
                        <DestCard
                            key={mod.key}
                            title={mod.title}
                            subtitle={mod.subtitle}
                            href={mod.href}
                            imageSrc={getThemeImage(theme, mod.key)}
                            lightTheme={lightTheme}
                        />
                    ))}
                </div>
            )}

            <style jsx>{`
                .home-root {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    height: calc(100vh - 64px); 
                    max-height: calc(100vh - 64px);
                    overflow: hidden; 
                    padding: 24px 32px;
                    box-sizing: border-box;
                    max-width: 100%; 
                    margin: 0;
                }
                .home-section-header {
                    flex-shrink: 0;
                }
                .home-section-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--text-primary);
                    font-family: var(--font-display);
                    margin: 0 0 2px;
                    letter-spacing: -0.02em;
                }
                .home-section-sub {
                    font-size: 14px;
                    color: var(--text-tertiary);
                    font-family: var(--font-text);
                    margin: 0;
                }
                .dest-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr); 
                    grid-template-rows: repeat(3, 1fr); 
                    gap: 24px;
                    flex: 1;
                    height: 100%;
                    min-height: 0; 
                }
                @media (max-width: 1200px) {
                    .dest-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 768px) {
                    .dest-grid {
                        grid-template-columns: 1fr;
                        grid-template-rows: auto;
                        overflow-y: auto;
                    }
                }
                :global(.dest-card) {
                    position: relative;
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    text-decoration: none;
                    box-shadow: var(--shadow-md);
                    transition: box-shadow 0.4s, transform 0.4s;
                    height: 100%; 
                    background: var(--surface-tertiary);
                }
                :global(.dest-card:hover) {
                    box-shadow: var(--shadow-2xl);
                    transform: scale(1.01);
                }
                :global(.dest-card-img-wrap) {
                    position: absolute;
                    inset: 0;
                }
                :global(.dest-card-overlay) {
                    position: absolute;
                    inset: 0;
                }
                :global(.dest-card-text) {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 24px 28px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    z-index: 2;
                }
                :global(.dest-card-title) {
                    font-size: 22px;
                    font-weight: 800;
                    font-family: var(--font-display);
                    line-height: 1.1;
                    letter-spacing: -0.02em;
                }
                :global(.dest-card-subtitle) {
                    font-size: 14px;
                    font-weight: 400;
                    font-family: var(--font-text);
                    line-height: 1.4;
                    opacity: 0.9;
                }
                .skeleton-block {
                    border-radius: var(--radius-xl);
                    background: var(--surface-secondary);
                    animation: pulse 1.5s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
