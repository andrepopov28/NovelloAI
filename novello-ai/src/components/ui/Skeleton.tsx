interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded-[var(--radius-md)] bg-[var(--border-strong)] ${className}`}
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-secondary)] p-5 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
        </div>
    );
}
