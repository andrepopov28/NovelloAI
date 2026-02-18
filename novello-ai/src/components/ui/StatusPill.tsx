interface StatusPillProps {
    status: 'draft' | 'review' | 'final';
}

const config = {
    draft: { label: 'Draft', color: 'var(--text-tertiary)', bg: 'var(--surface-tertiary)' },
    review: { label: 'Review', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.12)' },
    final: { label: 'Final', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.12)' },
};

export function StatusPill({ status }: StatusPillProps) {
    const { label, color, bg } = config[status];

    return (
        <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ color, backgroundColor: bg }}
        >
            {label}
        </span>
    );
}
