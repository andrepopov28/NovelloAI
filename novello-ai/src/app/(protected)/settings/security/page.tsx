'use client';

import { Card } from '@/components/ui/Card';
import { Shield, Key, Lock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SecuritySettingsPage() {
    const { signOut } = useAuth();

    return (
        <div className="settings-content">
            <header className="content-header">
                <h2 className="content-title">Security</h2>
                <p className="content-subtitle">Manage your account security and authentication sessions</p>
            </header>

            <div className="settings-grid">
                <Card className="security-card">
                    <div className="card-head">
                        <Lock size={18} className="head-icon" />
                        <h3 className="card-title">Authentication</h3>
                    </div>
                    <p className="card-desc">Your account uses Google Sign-In for secure authentication.</p>

                    <div className="security-status">
                        <div className="status-item">
                            <Shield size={16} className="status-icon" />
                            <span>Two-Factor Authentication managed by Google</span>
                        </div>
                    </div>
                </Card>

                <Card className="sessions-card">
                    <div className="card-head">
                        <Key size={18} className="head-icon" />
                        <h3 className="card-title">Active Session</h3>
                    </div>
                    <p className="card-desc">You are currently signed in on this device.</p>

                    <div className="session-actions">
                        <Button variant="destructive" onClick={signOut} className="sign-out-btn">
                            <LogOut size={16} />
                            <span>Sign Out of All Devices</span>
                        </Button>
                    </div>
                </Card>
            </div>

            <style jsx>{`
                .settings-content {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }
                .content-header {
                    margin-bottom: 8px;
                }
                .content-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .content-subtitle {
                    font-size: 0.9rem;
                    color: var(--text-tertiary);
                    margin-top: 4px;
                }
                .settings-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .card-head {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .head-icon {
                    color: var(--accent-warm);
                }
                .card-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .card-desc {
                    font-size: 0.82rem;
                    color: var(--text-tertiary);
                    margin-bottom: 24px;
                }

                .security-card, .sessions-card {
                    padding: 32px !important;
                }

                .security-status {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .status-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    padding: 12px;
                    border-radius: var(--radius-md);
                    background: var(--surface-tertiary);
                    border: 1px solid var(--border);
                }
                .status-icon {
                    color: #10b981;
                }

                .sign-out-btn {
                    margin-top: 8px;
                }
            `}</style>
        </div>
    );
}
