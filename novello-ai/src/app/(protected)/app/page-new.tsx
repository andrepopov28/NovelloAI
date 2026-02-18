'use client';

import { ModuleCard } from '@/components/dashboard/ModuleCard';

const modules = [
    {
        title: 'Write',
        description: 'Continue your manuscript with AI assistance',
        href: '/app/write',
        imageSrc: '/Users/andrepopov/.gemini/antigravity/brain/3bfcf949-a8b8-441e-8871-64791785dd00/write_module_hero_1771379282625.png',
        imageAlt: 'Vintage typewriter on oak desk',
    },
    {
        title: 'Brainstorm',
        description: 'Generate ideas and develop your story',
        href: '/brainstorm',
        imageSrc: '/Users/andrepopov/.gemini/antigravity/brain/3bfcf949-a8b8-441e-8871-64791785dd00/brainstorm_module_hero_1771379297198.png',
        imageAlt: 'Creative mind map with colorful connections',
    },
    {
        title: 'Data',
        description: 'Manage characters, places, and world-building',
        href: '/codex',
        imageSrc: '/images/kinetic/data.png',
        imageAlt: 'Ancient library with leather-bound books',
    },
    {
        title: 'Audiobook',
        description: 'Create professional narration with AI voices',
        href: '/audiobook',
        imageSrc: '/images/kinetic/audiobook.png',
        imageAlt: 'Professional studio microphone',
    },
    {
        title: 'Publish',
        description: 'Export and distribute your finished work',
        href: '/publish',
        imageSrc: '/images/kinetic/publish.png',
        imageAlt: 'Modern bookstore shelf',
    },
    {
        title: 'Settings',
        description: 'Configure your writing environment',
        href: '/settings',
        imageSrc: '/images/kinetic/settings.png',
        imageAlt: 'Swiss watch mechanism',
    },
];

export default function DashboardPage() {
    return (
        <div
            className="min-h-screen"
            style={{
                background: 'var(--surface-primary)',
                paddingTop: 'calc(var(--nav-height) + var(--space-12))',
                paddingBottom: 'var(--space-16)',
            }}
        >
            <div className="max-w-7xl mx-auto px-8">
                {/* Header */}
                <div className="mb-12">
                    <h1
                        className="font-bold mb-2"
                        style={{
                            fontSize: 'var(--text-4xl)',
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Novello AI
                    </h1>
                    <p
                        style={{
                            fontSize: 'var(--text-lg)',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        Your autonomous publishing studio
                    </p>
                </div>

                {/* Module Grid */}
                <div
                    className="grid grid-cols-2 gap-6"
                    style={{
                        gridTemplateColumns: 'repeat(2, 1fr)',
                    }}
                >
                    {modules.map((module) => (
                        <ModuleCard key={module.title} {...module} />
                    ))}
                </div>
            </div>
        </div>
    );
}
