'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleCard } from '@/components/dashboard/ModuleCard';
import { useProjects } from '@/lib/hooks/useProjects';
import { useAuth } from '@/lib/hooks/useAuth';
import { Plus, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { Project } from '@/lib/types';

const modules = [
    {
        title: 'Write',
        description: 'Continue your manuscript with AI assistance',
        href: '',
        imageSrc: '/images/modules/write.png',
        imageAlt: 'Vintage typewriter on oak desk',
    },
    {
        title: 'Brainstorm',
        description: 'Generate ideas and develop your story',
        href: '/brainstorm',
        imageSrc: '/images/modules/brainstorm.png',
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
    const { projects, loading, createProject, deleteProject } = useProjects();
    const { user } = useAuth();
    const router = useRouter();
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreateProject = async () => {
        if (!newProjectTitle.trim() || !user) return;
        setCreating(true);
        try {
            const projectId = await createProject({
                title: newProjectTitle,
                genre: 'literary',
                synopsis: '',
            });
            toast.success('Project created!');
            setShowCreateProject(false);
            setNewProjectTitle('');
            router.push(`/project/${projectId}`);
        } catch (err) {
            console.error('Failed to create project:', err);
            toast.error('Failed to create project');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteProject = async (projectId: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            await deleteProject(projectId);
            toast.success('Project deleted');
        } catch (err) {
            console.error('Failed to delete project:', err);
            toast.error('Failed to delete project');
        }
    };

    const handleProjectClick = (project: Project) => {
        router.push(`/project/${project.id}`);
    };

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
                            fontFamily: 'var(--font-display)',
                        }}
                    >
                        Novello AI
                    </h1>
                    <p
                        style={{
                            fontSize: 'var(--text-lg)',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-text)',
                        }}
                    >
                        Your autonomous publishing studio
                    </p>
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-2 gap-6 mb-16">
                    {modules.map((module) => (
                        <ModuleCard key={module.title} {...module} />
                    ))}
                </div>

                {/* Projects Section */}
                <div className="mt-16">
                    <div className="flex items-center justify-between mb-6">
                        <h2
                            className="font-semibold"
                            style={{
                                fontSize: 'var(--text-2xl)',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            Your Projects
                        </h2>
                        <Button
                            onClick={() => setShowCreateProject(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] font-medium transition-all"
                            style={{
                                background: 'var(--accent)',
                                color: 'var(--text-inverse)',
                                fontSize: 'var(--text-sm)',
                            }}
                        >
                            <Plus size={16} />
                            New Project
                        </Button>
                    </div>

                    {/* Create Project Modal */}
                    {showCreateProject && (
                        <div
                            className="fixed inset-0 flex items-center justify-center z-50"
                            style={{ background: 'rgba(0,0,0,0.4)' }}
                            onClick={() => setShowCreateProject(false)}
                        >
                            <div
                                className="rounded-[var(--radius-lg)] p-6 w-full max-w-md"
                                style={{
                                    background: 'var(--surface-secondary)',
                                    boxShadow: 'var(--shadow-xl)',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3
                                    className="font-semibold mb-4"
                                    style={{
                                        fontSize: 'var(--text-xl)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    Create New Project
                                </h3>
                                <Input
                                    value={newProjectTitle}
                                    onChange={(e) => setNewProjectTitle(e.target.value)}
                                    placeholder="Project title"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                                    autoFocus
                                    className="mb-4"
                                />
                                <div className="flex gap-3 justify-end">
                                    <Button
                                        onClick={() => setShowCreateProject(false)}
                                        variant="ghost"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateProject}
                                        disabled={!newProjectTitle.trim() || creating}
                                        style={{ background: 'var(--accent)', color: 'white' }}
                                    >
                                        {creating ? 'Creating...' : 'Create'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Projects List */}
                    {loading ? (
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-32 rounded-[var(--radius-md)] animate-pulse"
                                    style={{ background: 'var(--surface-tertiary)' }}
                                />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div
                            className="text-center py-16 rounded-[var(--radius-lg)]"
                            style={{
                                background: 'var(--surface-secondary)',
                                border: '1px dashed var(--border-strong)',
                            }}
                        >
                            <p
                                className="mb-4"
                                style={{
                                    fontSize: 'var(--text-base)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                No projects yet. Create your first project to get started.
                            </p>
                            <Button
                                onClick={() => setShowCreateProject(true)}
                                style={{ background: 'var(--accent)', color: 'white' }}
                            >
                                Create Project
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="group cursor-pointer rounded-[var(--radius-md)] p-4 transition-all hover:scale-[1.02]"
                                    style={{
                                        background: 'var(--surface-secondary)',
                                        boxShadow: 'var(--shadow-sm)',
                                    }}
                                    onClick={() => handleProjectClick(project)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3
                                            className="font-semibold line-clamp-1"
                                            style={{
                                                fontSize: 'var(--text-lg)',
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {project.title}
                                        </h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProject(project.id, project.title);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <p
                                        className="mb-3"
                                        style={{
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        {project.wordCount?.toLocaleString() || 0} words
                                    </p>
                                    <div
                                        className="flex items-center gap-1"
                                        style={{
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        <Clock size={12} />
                                        {project.updatedAt
                                            ? formatDistanceToNow(project.updatedAt.toDate(), {
                                                addSuffix: true,
                                            })
                                            : 'Just now'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
