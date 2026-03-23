'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/lib/hooks/useProjects';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

export function NewProjectContent() {
    const router = useRouter();
    const { createProject } = useProjects();
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            setIsCreating(true);
            const projectId = await createProject({
                title,
                genre,
                synopsis: description,
            });
            toast.success('Project created successfully!');
            router.push(`/project/${projectId}`);
        } catch (error) {
            console.error('Failed to create project:', error);
            toast.error('Failed to create project');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-8 hover:bg-[var(--surface-elevated)]"
            >
                <ArrowLeft className="mr-2" size={16} />
                Back to Dashboard
            </Button>

            <header className="mb-12 text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--accent-warm-muted)] text-[var(--accent-warm)] mb-6 animate-pulse">
                    <Sparkles size={32} />
                </div>
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-tertiary)] bg-clip-text text-transparent">
                    Ignite Your Next Masterpiece
                </h1>
                <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
                    Every great story begins with a single spark. Tell us about your vision, and our AI agents will help you bring it to life.
                </p>
            </header>

            <Card className="glass-card p-8 border-[var(--border-strong)] relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent-warm)] opacity-5 blur-[100px] rounded-full" />
                
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                                Project Title
                            </label>
                            <Input
                                placeholder="e.g. The Silence of the Stars"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="bg-[var(--surface-tertiary)] border-[var(--border)] focus:border-[var(--accent-warm)] transition-all h-12 text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                                Genre / Style
                            </label>
                            <Input
                                placeholder="e.g. Space Opera, Dark Fantasy"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                className="bg-[var(--surface-tertiary)] border-[var(--border)] focus:border-[var(--accent-warm)] transition-all h-12"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                            One-Sentence Premise
                        </label>
                        <textarea
                            placeholder="What is the core conflict or theme that drives this story?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-100 min-h-[120px] p-4 bg-[var(--surface-tertiary)] border border-[var(--border)] rounded-[var(--radius-md)] focus:border-[var(--accent-warm)] transition-all outline-none text-base resize-none text-[var(--text-primary)]"
                        />
                    </div>

                    <div className="pt-4 flex justify-center">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={!title.trim() || isCreating}
                            className="px-12 h-14 text-lg font-bold bg-[var(--accent-warm)] hover:bg-[var(--accent-warm-strong)] text-white shadow-lg hover:shadow-[var(--accent-warm-muted)] transition-all group rounded-xl"
                        >
                            {isCreating ? (
                                <Loader2 className="animate-spin mr-2" />
                            ) : (
                                <Wand2 className="mr-2 group-hover:rotate-12 transition-transform" />
                            )}
                            Initialize World-Building
                        </Button>
                    </div>
                </form>
            </Card>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Character Forge', desc: 'AI-assisted deep persona development' },
                    { label: 'Plot Weaver', desc: 'Dynamic story arc orchestration' },
                    { label: 'Voice Clone', desc: 'Personalized narration synthesis' }
                ].map((feature, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[var(--surface-tertiary)] border border-[var(--border)] text-center">
                        <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-1">{feature.label}</h4>
                        <p className="text-xs text-[var(--text-tertiary)]">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
