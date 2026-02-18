import type { SyncStatus } from '@/lib/types';

const statusConfig: Record<SyncStatus, { color: string; label: string }> = {
    idle: { color: 'var(--text-tertiary)', label: '' },
    saving: { color: 'var(--warning)', label: 'Saving...' },
    saved: { color: 'var(--success)', label: 'Saved' },
    offline: { color: 'var(--warning)', label: 'Offline — saving locally' },
    error: { color: 'var(--error)', label: 'Sync failed' },
};

interface SyncIndicatorProps {
    status?: SyncStatus;
}

export function SyncIndicator({ status = 'idle' }: SyncIndicatorProps) {
    if (status === 'idle') return null;

    const { color, label } = statusConfig[status];

    return (
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
            <span
                className={`
          w-2 h-2 rounded-full
          ${status === 'saving' ? 'animate-pulse-dot' : ''}
        `}
                style={{ backgroundColor: color }}
            />
            {label}
        </div>
    );
}
