'use client';

import { use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ShieldAlert, Clock, User, MapPin, AlertTriangle,
    X, RefreshCw, CheckCircle2, Loader2
} from 'lucide-react';
import { useContinuityChecker } from '@/lib/hooks/useContinuityChecker';
import { useChapters } from '@/lib/hooks/useChapters';
import { useProjects } from '@/lib/hooks/useProjects';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ContinuityAlert } from '@/lib/types';

// =============================================
// /project/[id]/continuity
// Dedicated Continuity Checker page (PRD V27 §5.5)
// =============================================

export default function ContinuityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const router = useRouter();

    const { projects } = useProjects();
    const { chapters, loading: chaptersLoading } = useChapters(projectId);
    const { alerts, checking, checkContinuity, dismissAlert } = useContinuityChecker(projectId);

    const project = projects.find((p) => p.id === projectId);

    // Run a full scan: concatenate all chapter content and use the last chapter's ID
    const handleFullScan = useCallback(() => {
        if (chapters.length === 0) return;
        const allContent = chapters.map((c) => c.content || '').join('\n\n');
        const lastChapterId = chapters[chapters.length - 1].id;
        checkContinuity(allContent, lastChapterId);
    }, [chapters, checkContinuity]);

    const getTypeIcon = (type: ContinuityAlert['type']) => {
        switch (type) {
            case 'timeline': return <Clock size={16} className="text-blue-500" />;
            case 'characterAttribute': return <User size={16} className="text-purple-500" />;
            case 'settingDetail': return <MapPin size={16} className="text-green-500" />;
            default: return <AlertTriangle size={16} className="text-orange-500" />;
        }
    };

    const getTypeLabel = (type: ContinuityAlert['type']) =>
        type.replace(/([A-Z])/g, ' $1').trim();

    const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
    const warningAlerts = alerts.filter((a) => a.severity === 'warning');

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--surface-primary)',
            color: 'var(--text-primary)',
        }}>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-primary)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '0 2rem',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => router.push(`/project/${projectId}`)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--text-secondary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                        <ArrowLeft size={16} />
                        Back to Editor
                    </button>

                    <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldAlert size={18} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Continuity Checker</span>
                        {project && (
                            <span style={{
                                fontSize: '0.8125rem',
                                color: 'var(--text-tertiary)',
                                marginLeft: '0.25rem',
                            }}>
                                — {project.title}
                            </span>
                        )}
                    </div>
                </div>

                <Button
                    onClick={handleFullScan}
                    disabled={checking || chaptersLoading || chapters.length === 0}
                    size="sm"
                >
                    {checking ? (
                        <>
                            <Loader2 size={14} className="animate-spin mr-1.5" />
                            Scanning…
                        </>
                    ) : (
                        <>
                            <RefreshCw size={14} style={{ marginRight: '0.375rem' }} />
                            Scan Now
                        </>
                    )}
                </Button>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 2rem' }}>

                {/* Stats Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginBottom: '2.5rem',
                }}>
                    {[
                        { label: 'Total Issues', value: alerts.length, color: 'var(--text-primary)' },
                        { label: 'Critical', value: criticalAlerts.length, color: '#f43f5e' },
                        { label: 'Warnings', value: warningAlerts.length, color: '#f59e0b' },
                    ].map((stat) => (
                        <div key={stat.label} style={{
                            padding: '1.25rem 1.5rem',
                            borderRadius: '1rem',
                            border: '1px solid var(--border)',
                            background: 'var(--surface-secondary)',
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '0.375rem' }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Loading State */}
                {chaptersLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                    </div>
                )}

                {/* Scanning State */}
                {checking && !chaptersLoading && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '5rem 2rem',
                        gap: '1.5rem',
                        color: 'var(--text-secondary)',
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            border: '3px solid var(--border)',
                            borderTopColor: 'var(--accent)',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Analyzing your manuscript…</p>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                Checking timelines, character attributes, and setting details across {chapters.length} chapters.
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!checking && !chaptersLoading && alerts.length === 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '5rem 2rem',
                        gap: '1rem',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                    }}>
                        <CheckCircle2 size={48} style={{ color: '#22c55e', opacity: 0.7 }} />
                        <div>
                            <p style={{ fontWeight: 600, fontSize: '1.0625rem', marginBottom: '0.375rem' }}>
                                No continuity issues detected
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                                Run a scan to check your manuscript for contradictions, timeline errors, and character inconsistencies.
                            </p>
                        </div>
                        <Button onClick={handleFullScan} disabled={chaptersLoading || chapters.length === 0}>
                            <RefreshCw size={14} style={{ marginRight: '0.375rem' }} />
                            Run First Scan
                        </Button>
                    </div>
                )}

                {/* Alerts List */}
                {!checking && alerts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {criticalAlerts.length > 0 && (
                            <>
                                <h2 style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#f43f5e',
                                    marginBottom: '0.25rem',
                                    marginTop: '0.5rem',
                                }}>
                                    Critical ({criticalAlerts.length})
                                </h2>
                                {criticalAlerts.map((alert) => (
                                    <AlertCard
                                        key={alert.id}
                                        alert={alert}
                                        onDismiss={dismissAlert}
                                        getTypeIcon={getTypeIcon}
                                        getTypeLabel={getTypeLabel}
                                    />
                                ))}
                            </>
                        )}

                        {warningAlerts.length > 0 && (
                            <>
                                <h2 style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#f59e0b',
                                    marginBottom: '0.25rem',
                                    marginTop: criticalAlerts.length > 0 ? '1.5rem' : '0.5rem',
                                }}>
                                    Warnings ({warningAlerts.length})
                                </h2>
                                {warningAlerts.map((alert) => (
                                    <AlertCard
                                        key={alert.id}
                                        alert={alert}
                                        onDismiss={dismissAlert}
                                        getTypeIcon={getTypeIcon}
                                        getTypeLabel={getTypeLabel}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                )}
            </main>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

// =============================================
// AlertCard sub-component
// =============================================
function AlertCard({
    alert,
    onDismiss,
    getTypeIcon,
    getTypeLabel,
}: {
    alert: ContinuityAlert;
    onDismiss: (id: string) => void;
    getTypeIcon: (type: ContinuityAlert['type']) => React.ReactNode;
    getTypeLabel: (type: ContinuityAlert['type']) => string;
}) {
    const isCritical = alert.severity === 'critical';

    return (
        <div style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '1rem',
            border: `1px solid ${isCritical ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
            background: isCritical ? 'rgba(244,63,94,0.04)' : 'rgba(245,158,11,0.03)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getTypeIcon(alert.type)}
                    <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-tertiary)',
                    }}>
                        {getTypeLabel(alert.type)}
                    </span>
                </div>
                <button
                    onClick={() => onDismiss(alert.id)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        padding: '0.25rem',
                        borderRadius: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                    aria-label="Dismiss alert"
                >
                    <X size={14} />
                </button>
            </div>

            <p style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                marginBottom: alert.flaggedExcerpt ? '0.75rem' : 0,
            }}>
                {alert.message}
            </p>

            {alert.flaggedExcerpt && (
                <blockquote style={{
                    fontSize: '0.8125rem',
                    fontStyle: 'italic',
                    color: 'var(--text-secondary)',
                    borderLeft: `3px solid ${isCritical ? '#f43f5e' : '#f59e0b'}`,
                    paddingLeft: '0.875rem',
                    marginTop: '0.75rem',
                    lineHeight: 1.6,
                }}>
                    &ldquo;{alert.flaggedExcerpt}&rdquo;
                </blockquote>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismiss(alert.id)}
                >
                    Dismiss
                </Button>
            </div>
        </div>
    );
}
