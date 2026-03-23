import React, { useState } from 'react';
import { useVoices, UnifiedVoice } from '@/lib/hooks/useVoices';
import { VoiceGrid } from './VoiceGrid';
import { VoiceDetailDrawer } from './VoiceDetailDrawer';
import { AddVoiceWizard } from './AddVoiceWizard';
import { Search, Plus, SlidersHorizontal, Loader2 } from 'lucide-react';

export function VoiceLibrary({ userId }: { userId: string | undefined }) {
    const { allVoices, loading, builtinVoices } = useVoices(userId);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'Built-in' | 'Cloned'>('All');

    // Selection state
    const [selectedVoice, setSelectedVoice] = useState<UnifiedVoice | null>(null);
    const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);

    const filteredVoices = allVoices.filter(voice => {
        if (typeFilter === 'Built-in' && !voice.isBuiltin) return false;
        if (typeFilter === 'Cloned' && voice.isBuiltin) return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchName = voice.displayName.toLowerCase().includes(query);
            const matchLang = (voice.language || '').toLowerCase().includes(query);
            const matchTags = voice.tags?.some(t => t.toLowerCase().includes(query));
            if (!matchName && !matchLang && !matchTags) return false;
        }

        return true;
    });

    return (
        <div className="voice-library animate-fade-in">
            {/* Header */}
            <div className="vl-header glass-panel">
                <div className="vl-header-content">
                    <div>
                        <h2 className="vl-title">Voice Library</h2>
                        <p className="vl-subtitle">Manage built-in and cloned voices</p>
                    </div>
                    <button className="vl-btn-primary" onClick={() => setIsAddWizardOpen(true)}>
                        <Plus size={16} /> Add Voice
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="vl-toolbar">
                    <div className="vl-search">
                        <Search size={16} className="vl-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, tags, or language..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="vl-filters">
                        <SlidersHorizontal size={14} className="vl-filter-icon" />
                        {(['All', 'Built-in', 'Cloned'] as const).map(f => (
                            <button
                                key={f}
                                className={`vl-filter-btn ${typeFilter === f ? 'active' : ''}`}
                                onClick={() => setTypeFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            {loading ? (
                <div className="vl-loading">
                    <Loader2 size={24} className="ab-spin" />
                    <span>Loading voices...</span>
                </div>
            ) : (
                <VoiceGrid
                    voices={filteredVoices}
                    onVoiceSelect={(voice) => setSelectedVoice(voice)}
                    userId={userId}
                />
            )}

            {/* Drawer */}
            <VoiceDetailDrawer
                voice={selectedVoice}
                onClose={() => setSelectedVoice(null)}
                userId={userId}
            />

            {/* Add Wizard Modal */}
            {isAddWizardOpen && (
                <AddVoiceWizard
                    onClose={() => setIsAddWizardOpen(false)}
                    userId={userId}
                />
            )}

            <style jsx>{`
                .voice-library {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .vl-header {
                    padding: 1.5rem;
                    border-radius: var(--radius-xl);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                }
                .vl-header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.25rem;
                }
                .vl-title { font-size: 1.4rem; font-weight: 700; margin: 0 0 4px; color: var(--text-primary); }
                .vl-subtitle { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
                
                .vl-btn-primary {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: var(--accent); color: white; border: none;
                    padding: 10px 16px; border-radius: var(--radius-md);
                    font-size: 0.9rem; font-weight: 500; cursor: pointer;
                    transition: background 0.2s;
                }
                .vl-btn-primary:hover { background: var(--accent-hover); }

                .vl-toolbar {
                    display: flex; gap: 1rem; align-items: center; justify-content: space-between;
                    flex-wrap: wrap;
                }
                .vl-search {
                    position: relative; flex: 1; min-width: 250px;
                }
                .vl-search-icon {
                    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
                    color: var(--text-tertiary);
                }
                .vl-search input {
                    width: 100%; padding: 10px 12px 10px 36px;
                    border-radius: var(--radius-md); border: 1px solid var(--border);
                    background: var(--surface-primary); color: var(--text-primary);
                    font-size: 0.9rem;
                }
                .vl-search input:focus { border-color: var(--accent); outline: none; }

                .vl-filters {
                    display: flex; gap: 4px; background: var(--surface-primary);
                    padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border);
                    align-items: center;
                }
                .vl-filter-icon { margin-left: 8px; color: var(--text-tertiary); margin-right: 4px; }
                .vl-filter-btn {
                    padding: 6px 14px; border-radius: var(--radius-sm); font-size: 0.8rem;
                    background: transparent; border: none; color: var(--text-tertiary);
                    cursor: pointer; font-weight: 500; transition: all 0.2s;
                }
                .vl-filter-btn.active {
                    background: var(--surface-elevated); color: var(--text-primary);
                    box-shadow: var(--shadow-sm);
                }
                .vl-loading {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 4rem; gap: 1rem; color: var(--text-tertiary);
                }
            `}</style>
        </div>
    );
}
