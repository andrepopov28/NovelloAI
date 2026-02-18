'use client';

import { Card } from '@/components/ui/Card';
import { Database, HardDrive, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function StorageSettingsPage() {
    return (
        <div className="settings-content">
            <header className="content-header">
                <h2 className="content-title">Storage</h2>
                <p className="content-subtitle">Manage your project data and cloud synchronization</p>
            </header>

            <div className="settings-grid">
                <Card className="storage-info-card">
                    <div className="card-head">
                        <HardDrive size={18} className="head-icon" />
                        <h3 className="card-title">Local Storage Usage</h3>
                    </div>

                    <div className="storage-meter-wrap">
                        <div className="meter-info">
                            <span className="meter-label">Project Cache</span>
                            <span className="meter-value">12.4 MB</span>
                        </div>
                        <div className="meter-bar">
                            <div className="meter-fill" style={{ width: '15%' }}></div>
                        </div>
                    </div>

                    <div className="storage-actions">
                        <Button variant="secondary" className="clear-cache-btn">
                            <Trash2 size={14} />
                            <span>Clear Local Cache</span>
                        </Button>
                    </div>
                </Card>

                <Card className="data-management-card">
                    <div className="card-head">
                        <Database size={18} className="head-icon" />
                        <h3 className="card-title">Data Management</h3>
                    </div>
                    <p className="card-desc">Export your entire library or permanently delete your account data.</p>

                    <div className="management-buttons">
                        <Button variant="secondary" className="export-all-btn">
                            <Download size={14} />
                            <span>Export All Projects</span>
                        </Button>
                        <Button variant="destructive" className="delete-account-btn">
                            <Trash2 size={14} />
                            <span>Delete All Data</span>
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

                .storage-info-card, .data-management-card {
                    padding: 32px !important;
                }

                .storage-meter-wrap {
                    margin-bottom: 24px;
                }
                .meter-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 0.85rem;
                }
                .meter-label {
                    color: var(--text-secondary);
                    font-weight: 600;
                }
                .meter-value {
                    color: var(--text-primary);
                    font-weight: 700;
                }
                .meter-bar {
                    height: 8px;
                    background: var(--surface-tertiary);
                    border-radius: 4px;
                    overflow: hidden;
                    border: 1px solid var(--border);
                }
                .meter-fill {
                    height: 100%;
                    background: var(--accent-warm);
                    border-radius: 4px;
                }

                .management-buttons {
                    display: flex;
                    gap: 12px;
                }

                @media (max-width: 640px) {
                    .management-buttons {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
}
