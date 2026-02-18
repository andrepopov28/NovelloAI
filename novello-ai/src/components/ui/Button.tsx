import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm',
    secondary:
        'bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border-strong)] hover:border-[var(--accent)]',
    ghost:
        'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-primary)]',
    destructive:
        'bg-[var(--destructive)] text-white hover:bg-[var(--destructive-hover)]',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2.5 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-9 w-9 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`
          inline-flex items-center justify-center gap-2
          font-medium
          rounded-[var(--radius-md)]
          transition-all duration-150 ease-in-out
          focus-ring
          disabled:opacity-50 disabled:pointer-events-none
          cursor-pointer
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
                {...props}
            >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
