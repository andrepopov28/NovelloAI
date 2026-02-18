'use client';

import { ContinuityAlert } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { AlertTriangle, Clock, MapPin, User, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AlertsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    alerts: ContinuityAlert[];
    checking: boolean;
    onDismiss: (id: string) => void;
    onCheckNow: () => void;
}

export function AlertsPanel({
    isOpen,
    onClose,
    alerts,
    checking,
    onDismiss,
    onCheckNow
}: AlertsPanelProps) {
    const getIcon = (type: ContinuityAlert['type']) => {
        switch (type) {
            case 'timeline': return <Clock size={16} className="text-blue-500" />;
            case 'characterAttribute': return <User size={16} className="text-purple-500" />;
            case 'settingDetail': return <MapPin size={16} className="text-green-500" />;
            default: return <AlertTriangle size={16} className="text-orange-500" />;
        }
    };

    const getSeverityColor = (severity: ContinuityAlert['severity']) => {
        if (severity === 'critical') {
            return {
                border: '1px solid rgba(244, 63, 94, 0.2)',
                background: 'rgba(244, 63, 94, 0.05)',
                glow: '0 0 15px rgba(244, 63, 94, 0.1)'
            };
        }
        return {
            border: '1px solid rgba(184, 134, 11, 0.2)',
            background: 'rgba(184, 134, 11, 0.03)',
            glow: '0 0 15px rgba(184, 134, 11, 0.05)'
        };
    };

    return (
        <Sheet isOpen={isOpen} onClose={onClose} title="Continuity Alerts">
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-sm text-[var(--text-secondary)]">
                        AI-detected continuity issues.
                    </p>
                    <Button
                        onClick={onCheckNow}
                        size="sm"
                        disabled={checking}
                    >
                        {checking ? 'Scanning...' : 'Scan Now'}
                    </Button>
                </div>

                {checking && (
                    <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mb-4"></div>
                        <p className="text-sm">Analyzing timeline & facts...</p>
                    </div>
                )}

                {!checking && alerts.length === 0 && (
                    <div className="text-center p-8 text-[var(--text-secondary)] bg-[var(--surface-secondary)] rounded-lg">
                        <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No issues detected.</p>
                        <p className="text-xs mt-2 text-[var(--text-tertiary)]">Run a scan to check for contradictions.</p>
                    </div>
                )}

                <div className="space-y-3">
                    {alerts.map((alert) => {
                        const colors = getSeverityColor(alert.severity);
                        return (
                            <div
                                key={alert.id}
                                className="p-4 rounded-lg transition-all animate-slide-up"
                                style={{
                                    border: colors.border,
                                    background: colors.background,
                                    boxShadow: colors.glow
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {getIcon(alert.type)}
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--text-tertiary)' }}>
                                            {alert.type.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onDismiss(alert.id)}
                                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <p className="text-sm font-medium mb-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                    {alert.message}
                                </p>

                                {alert.flaggedExcerpt && (
                                    <div className="bg-black/5 dark:bg-white/5 p-2 rounded text-[11px] italic mb-2 border border-black/5 dark:border-white/5" style={{ color: 'var(--text-secondary)' }}>
                                        "{alert.flaggedExcerpt}"
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-[10px] uppercase tracking-wider font-bold"
                                        onClick={() => onDismiss(alert.id)}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Sheet>
    );
}
