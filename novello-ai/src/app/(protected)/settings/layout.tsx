'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    User,
    Cpu,
    Palette,
    Database,
    Shield,
    Settings as SettingsIcon,
} from 'lucide-react';

const settingsNav = [
    { label: 'Profile', href: '/settings/profile', icon: User },
    { label: 'AI & Models', href: '/settings/ai', icon: Cpu },
    { label: 'Themes', href: '/settings/themes', icon: Palette },
    { label: 'Storage', href: '/settings/storage', icon: Database },
    { label: 'Security', href: '/settings/security', icon: Shield },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="settings-wrapper">
            <div className="settings-container">
                {/* Sidebar */}
                <aside className="settings-sidebar">
                    <div className="sidebar-header">
                        <SettingsIcon size={20} className="header-icon" />
                        <h1 className="sidebar-title">Settings</h1>
                    </div>
                    <nav className="sidebar-nav">
                        {settingsNav.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
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
                    min-height: calc(100vh - 64px);
                    background: var(--surface-primary);
                    color: var(--text-primary);
                }
                .settings-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    min-height: calc(100vh - 64px);
                }

                /* ── Sidebar ── */
                .settings-sidebar {
                    border-right: 1px solid var(--border);
                    padding: 40px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                    background: var(--surface-secondary);
                }
                .sidebar-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .header-icon {
                    color: var(--accent-warm);
                }
                .sidebar-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                }
                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all var(--transition-fast);
                }
                .sidebar-link:hover {
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                }
                .sidebar-link-active {
                    background: var(--accent-warm-muted) !important;
                    color: var(--accent-warm) !important;
                }

                /* ── Main Content ── */
                .settings-main {
                    padding: 40px 60px 80px;
                    background: var(--surface-primary);
                }

                @media (max-width: 1024px) {
                    .settings-container {
                        grid-template-columns: 1fr;
                    }
                    .settings-sidebar {
                        border-right: none;
                        border-bottom: 1px solid var(--border);
                        padding: 24px;
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-between;
                        overflow-x: auto;
                    }
                    .sidebar-nav {
                        flex-direction: row;
                    }
                    .sidebar-title {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
