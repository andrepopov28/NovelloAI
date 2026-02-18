import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    variant?: 'default' | 'glass';
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export function Card({
    children,
    variant = 'default',
    className = '',
    onClick,
    hoverable = false,
}: CardProps) {
    const base = `
    rounded-[var(--radius-lg)]
    border border-[var(--border)]
    transition-all duration-200
    ${hoverable ? 'hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
  `;

    const variants = {
        default: `bg-[var(--surface-secondary)] shadow-[var(--shadow-sm)]`,
        glass: `glass`,
    };

    return (
        <div
            className={`${base} ${variants[variant]} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}
