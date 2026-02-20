'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
// Image import removed — using native <img> for nav thumbnails to avoid optimization overhead
import { usePathname, useRouter } from 'next/navigation';
import {
    Home,
    PenTool,
    Lightbulb,
    BookOpen,
    Headphones,
    Send,
    Settings,
    LogOut,
    User,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/lib/hooks/useTheme';
import { useProjects } from '@/lib/hooks/useProjects';
import { SyncIndicator } from './SyncIndicator';
import NovelloLogo from '@/components/ui/NovelloLogo';
import { ThemePicker } from '@/components/ui/ThemePicker';

/* ─── Nav Utils ─── */
const getProjectLink = (projectId: string | null, nodePath: string) => {
    if (!projectId) return '/app';
    return `/project/${projectId}${nodePath}`;
};

/* ─── Stitch-generated photorealistic nav thumbnails ──── */
const STITCH_IMGS = {
    home: '/images/kinetic/home.png',
    write: '/images/refined/write.png',
    brainstorm: '/images/refined/brainstorm.png',
    data: '/images/refined/data.png',
    audiobook: '/images/kinetic/audiobook.png', // Falling back to kinetic for now
    publish: '/images/refined/publish.png',
    settings: '/images/refined/settings.png',
    codex: '/images/refined/data.png',
    series: '/images/refined/data.png',
};

/* ─── Nav Items (always visible on dashboard) ────────── */
const dashboardNavItems = [
    { key: 'home', label: 'Home', icon: Home, href: '/app', image: STITCH_IMGS.home },
    { key: 'write', label: 'Write', icon: PenTool, href: '/app', image: STITCH_IMGS.write },
    { key: 'brainstorm', label: 'Brainstorm', icon: Lightbulb, href: '/app', image: STITCH_IMGS.brainstorm },
    { key: 'data', label: 'Data', icon: BookOpen, href: '/app', image: STITCH_IMGS.data },
    { key: 'audiobook', label: 'Audiobook', icon: Headphones, href: '/app', image: STITCH_IMGS.audiobook },
    { key: 'publish', label: 'Publish', icon: Send, href: '/app', image: STITCH_IMGS.publish },
    { key: 'series', label: 'Series', icon: BookOpen, href: '/series', image: STITCH_IMGS.series },
    { key: 'settings', label: 'Settings', icon: Settings, href: '/settings', image: STITCH_IMGS.settings },
];

const projectNavNodes = [
    { key: 'write', label: 'Write', icon: PenTool, path: '', image: STITCH_IMGS.write },
    { key: 'brainstorm', label: 'Brainstorm', icon: Lightbulb, path: '/brainstorm', image: STITCH_IMGS.brainstorm },
    { key: 'codex', label: 'Codex', icon: BookOpen, path: '/codex', image: STITCH_IMGS.codex },
    { key: 'audiobook', label: 'Audiobook', icon: Headphones, path: '/audiobook', image: STITCH_IMGS.audiobook },
    { key: 'publish', label: 'Publish', icon: Send, path: '/publish', image: STITCH_IMGS.publish },
    { key: 'settings', label: 'Settings', icon: Settings, path: '/settings', image: STITCH_IMGS.settings },
];

export function GlobalNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { theme, themeMeta } = useTheme();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const projectMatch = pathname.match(/\/project\/([^/]+)/);
    const projectId = projectMatch?.[1] || null;

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const { projects } = useProjects();
    const activeProject = projects[0] || null;

    // Build nav items depending on context
    const navItems = projectId
        ? [
            { href: '/app', label: 'Home', icon: Home, key: 'home', image: '' },
            ...projectNavNodes.map((n) => ({
                href: `/project/${projectId}${n.path}`,
                label: n.label,
                icon: n.icon,
                key: n.key,
                image: n.image,
            })),
        ]
        : [
            { key: 'home', label: 'Home', icon: Home, href: '/app', image: STITCH_IMGS.home },
            { key: 'write', label: 'Write', icon: PenTool, href: getProjectLink(activeProject?.id, ''), image: STITCH_IMGS.write },
            { key: 'brainstorm', label: 'Brainstorm', icon: Lightbulb, href: getProjectLink(activeProject?.id, '/brainstorm'), image: STITCH_IMGS.brainstorm },
            { key: 'data', label: 'Data', icon: BookOpen, href: getProjectLink(activeProject?.id, '/codex'), image: STITCH_IMGS.data },
            { key: 'audiobook', label: 'Audiobook', icon: Headphones, href: getProjectLink(activeProject?.id, '/audiobook'), image: STITCH_IMGS.audiobook },
            { key: 'publish', label: 'Publish', icon: Send, href: getProjectLink(activeProject?.id, '/publish'), image: STITCH_IMGS.publish },
            { key: 'series', label: 'Series', icon: BookOpen, href: '/series', image: STITCH_IMGS.series },
            { key: 'settings', label: 'Settings', icon: Settings, href: '/settings', image: STITCH_IMGS.settings },
        ];

    const getIsActive = (item: (typeof navItems)[0]) => {
        if (item.key === 'settings') return pathname.startsWith('/settings');
        if (item.key === 'series') return pathname.startsWith('/series');
        if (projectId && item.key === 'write') return pathname === `/project/${projectId}`;
        if (!projectId && item.key === 'home') return pathname === '/app';
        return pathname === item.href && item.key !== 'home';
    };

    const displayName = user?.displayName || 'Writer';
    const firstName = displayName.split(' ')[0];

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-[100] h-[80px] min-h-[80px] flex items-center justify-between px-10 border-b transition-all duration-300"
            style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                borderColor: 'var(--border)'
            }}
        >
            {/* Brand — Left */}
            <div className="flex-none flex items-center">
                <Link href="/app" className="flex items-center no-underline">
                    <div className="h-[50px] w-auto flex items-center">
                        <NovelloLogo />
                    </div>
                </Link>
            </div>

            {/* Center - Navigation Tabs */}
            <div className="flex-1 flex justify-center h-full">
                <div className="flex h-full items-stretch">
                    {navItems.map((item) => {
                        const isActive = getIsActive(item);
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                prefetch={false}
                                className={`
                                    flex items-center justify-center px-8 gap-3 min-w-[160px] 
                                    border-l relative overflow-hidden no-underline transition-all duration-300 group
                                    ${isActive ? 'bg-[rgba(255,255,255,0.08)]' : 'bg-transparent hover:bg-[rgba(255,255,255,0.04)]'}
                                `}
                                style={{
                                    borderColor: 'var(--border)',
                                }}
                            >
                                {/* Subtle active bar at top */}
                                {isActive && (
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent-blue)]" />
                                )}

                                {/* Photorealistic Icon/Image */}
                                {item.image && (
                                    <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <span
                                    className={`font-sans text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}
                                >
                                    {item.label}
                                </span>
                                {item.key === navItems[navItems.length - 1].key && (
                                    <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-[var(--border)]" />
                                )}
                            </Link>
                        );
                    })}
                    {/* Closing border for the last item handled via conditional or just implicit? 
                        The original CSS had .nav-tab:last-child { border-right: ... } 
                    */}
                    <div className="w-[1px] h-full bg-[var(--border)]" />
                </div>
            </div>

            {/* Right - User & Theme */}
            <div className="flex-none flex items-center">
                <div className="flex items-center pl-8 gap-5">
                    {user && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="bg-transparent border-none cursor-pointer p-0 flex items-center"
                            >
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-[var(--border)]" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[var(--surface-tertiary)] text-[var(--text-primary)] flex items-center justify-center border-2 border-[var(--border)]">
                                        <User size={14} />
                                    </div>
                                )}
                            </button>
                            {showUserMenu && (
                                <div
                                    className="absolute top-[calc(100%+15px)] right-0 min-w-[220px] p-2 rounded-lg border shadow-xl z-[200]"
                                    style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
                                >
                                    <div className="p-3">
                                        <span className="block text-sm font-bold text-[var(--text-primary)] mb-1">{displayName}</span>
                                        <span className="block text-xs text-[var(--text-secondary)]">{user.email}</span>
                                    </div>
                                    <div className="h-[1px] w-full my-2 bg-[var(--border)]" />
                                    <button
                                        onClick={() => { setShowUserMenu(false); signOut(); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 bg-transparent border-none text-[var(--text-secondary)] text-sm cursor-pointer hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-primary)] rounded transition-colors"
                                    >
                                        <LogOut size={14} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    <ThemePicker />
                </div>
            </div>
        </nav>
    );
}
