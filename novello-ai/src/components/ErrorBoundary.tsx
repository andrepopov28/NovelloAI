'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--surface-primary)' }}>
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Something went wrong
                        </h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <Button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = '/app';
                            }}
                        >
                            Return to Dashboard
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
