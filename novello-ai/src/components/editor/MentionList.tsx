'use client';

import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useCallback,
} from 'react';
import { Entity } from '@/lib/types';
import { BookOpen, MapPin, Package, Scroll } from 'lucide-react';

// =============================================
// MentionList — Autocomplete dropdown for @mentions
// =============================================

const typeIcons: Record<Entity['type'], typeof BookOpen> = {
    Character: BookOpen,
    Location: MapPin,
    Item: Package,
    Lore: Scroll,
};

const typeColors: Record<Entity['type'], string> = {
    Character: '#06b6d4',
    Location: '#22c55e',
    Item: '#f59e0b',
    Lore: '#a855f7',
};

export interface MentionListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
    items: Entity[];
    command: (item: { id: string; label: string; type: string }) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
    ({ items, command }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0);

        useEffect(() => setSelectedIndex(0), [items]);

        const selectItem = useCallback(
            (index: number) => {
                const item = items[index];
                if (item) {
                    command({ id: item.id, label: item.name, type: item.type });
                }
            },
            [items, command]
        );

        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === 'ArrowUp') {
                    setSelectedIndex((i) => (i + items.length - 1) % items.length);
                    return true;
                }
                if (event.key === 'ArrowDown') {
                    setSelectedIndex((i) => (i + 1) % items.length);
                    return true;
                }
                if (event.key === 'Enter') {
                    selectItem(selectedIndex);
                    return true;
                }
                return false;
            },
        }));

        if (items.length === 0) {
            return (
                <div
                    className="rounded-[var(--radius-md)] px-3 py-2 text-xs shadow-lg"
                    style={{
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-tertiary)',
                    }}
                >
                    No entities found
                </div>
            );
        }

        return (
            <div
                className="rounded-[var(--radius-lg)] py-1.5 shadow-xl overflow-hidden min-w-[200px] max-h-[200px] overflow-y-auto"
                style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border)',
                }}
            >
                {items.map((item, index) => {
                    const Icon = typeIcons[item.type] || BookOpen;
                    const color = typeColors[item.type] || '#06b6d4';
                    return (
                        <button
                            key={item.id}
                            onClick={() => selectItem(index)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-all cursor-pointer ${index === selectedIndex
                                    ? 'bg-[var(--accent-muted)]'
                                    : 'hover:bg-[var(--surface-tertiary)]'
                                }`}
                        >
                            <Icon size={14} style={{ color, flexShrink: 0 }} />
                            <div className="min-w-0">
                                <div
                                    className="font-medium text-xs truncate"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {item.name}
                                </div>
                                <div
                                    className="text-[10px] truncate"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    {item.type} · {item.description?.slice(0, 40)}
                                    {(item.description?.length || 0) > 40 ? '…' : ''}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }
);

MentionList.displayName = 'MentionList';
