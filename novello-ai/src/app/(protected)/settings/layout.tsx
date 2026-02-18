'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings as SettingsIcon } from 'lucide-react';

const settingsNav = [
    {
        label: 'Profile',
        href: '/settings/profile',
        image: '/settings-heroes/profile.png',
        desc: 'Identity & account',
    },
    {
        label: 'AI & Models',
        href: '/settings/ai',
        image: '/settings-heroes/ai.png',
        desc: 'LLM providers & keys',
    },
    {
        label: 'Voice & TTS',
        href: '/settings/voice',
        image: '/settings-heroes/voice.png',
        desc: 'Text-to-speech voices',
    },
    {
        label: 'Themes',
        href: '/settings/themes',
        image: '/settings-heroes/themes.png',
        desc: 'Appearance & color',
    },
    {
        label: 'Storage',
        href: '/settings/storage',
        image: '/settings-heroes/storage.png',
        desc: 'Data & exports',
    },
    {
        label: 'Security',
        href: '/settings/security',
        image: '/settings-heroes/security.png',
        desc: 'Privacy & access',
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="settings-wrapper">
            <div className="settings-container">
                {/* Sidebar */}
                <aside className="settings-sidebar">
                    <div className="sidebar-header">
                        <SettingsIcon size={18} className="header-icon" />
                        <h1 className="sidebar-title">Settings</h1>
                    </div>
                    <nav className="sidebar-nav">
                        {settingsNav.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-card ${isActive ? 'sidebar-card-active' : ''}`}
                                >
                                    <div className="sidebar-card-image-wrap">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.image}
                                            alt={item.label}
                                            className="sidebar-card-image"
                                        />
                                        {isActive && <div className="sidebar-card-image-overlay" />}
                                    </div>
                                    <div className="sidebar-card-body">
                                        <span className="sidebar-card-label">{item.label}</span>
                                        <span className="sidebar-card-desc">{item.desc}</span>
                                    </div>
                                    {isActive && <div className="sidebar-card-active-bar" />}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content */}
                <main className="settings-main">
                    {children}
                </main>
            </div>

            <style jsx>{`
                .settings-wrapper {
                    min-height: calc(100vh - 80px);
                    background: var(--surface-primary);
                    color: var(--text-primary);
                }
                .settings-container {
                    max-width: 1280px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    min-height: calc(100vh - 80px);
                }

                /* ── Sidebar ── */
                .settings-sidebar {
                    border-right: 1px solid var(--border);
                    padding: 32px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    background: var(--surface-secondary);
                    overflow-y: auto;
                }
                .sidebar-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0 8px;
                    margin-bottom: 4px;
                }
                .header-icon {
                    color: var(--accent-warm);
                }
                .sidebar-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                    color: var(--text-primary);
                }
                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                /* ── Visual Nav Cards ── */
                .sidebar-card {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    border-radius: 14px;
                    overflow: hidden;
                    border: 1.5px solid var(--border);
                    text-decoration: none;
                    transition: all 0.2s ease;
                    background: var(--surface-tertiary);
                    cursor: pointer;
                }
                .sidebar-card:hover {
                    border-color: var(--border-strong);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
                }
                .sidebar-card-active {
                    border-color: var(--accent-warm) !important;
                    box-shadow: 0 0 0 1px var(--accent-warm), 0 4px 24px rgba(245, 158, 11, 0.2) !important;
                }

                .sidebar-card-image-wrap {
                    position: relative;
                    height: 90px;
                    overflow: hidden;
                }
                .sidebar-card-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    display: block;
                    transition: transform 0.3s ease;
                }
                .sidebar-card:hover .sidebar-card-image {
                    transform: scale(1.04);
                }
                .sidebar-card-image-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, transparent 40%, rgba(245, 158, 11, 0.15));
                }

                .sidebar-card-body {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    padding: 10px 14px 12px;
                }
                .sidebar-card-label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    letter-spacing: -0.01em;
                }
                .sidebar-card-desc {
                    font-size: 0.72rem;
                    color: var(--text-tertiary);
                }

                .sidebar-card-active-bar {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: var(--accent-warm);
                    border-radius: 0 2px 2px 0;
                }

                /* ── Main Content ── */
                .settings-main {
                    padding: 40px 60px 80px;
                    background: var(--surface-primary);
                    overflow-y: auto;
                }

                @media (max-width: 1024px) {
                    .settings-container {
                        grid-template-columns: 1fr;
                    }
                    .settings-sidebar {
                        border-right: none;
                        border-bottom: 1px solid var(--border);
                        padding: 20px 16px;
                        flex-direction: column;
                    }
                    .sidebar-nav {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 8px;
                    }
                    .sidebar-card-image-wrap {
                        height: 60px;
                    }
                    .settings-main {
                        padding: 24px;
                    }
                }
            `}</style>
        </div>
    );
}
