import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full px-3.5 py-2.5
            text-sm
            rounded-[var(--radius-md)]
            border transition-all duration-150
            placeholder:text-[var(--text-tertiary)]
            focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0
            disabled:opacity-50
            ${error
                            ? 'border-[var(--error)] bg-red-50 dark:bg-red-950/20'
                            : 'border-[var(--border-strong)] bg-[var(--surface-secondary)]'
                        }
            ${className}
          `}
                    style={{ color: 'var(--text-primary)' }}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-xs" style={{ color: 'var(--error)' }}>
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
