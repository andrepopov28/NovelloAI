'use client';

import { ThemePicker } from '@/components/ui/ThemePicker';
import { Card } from '@/components/ui/Card';
import { Palette, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';

export default function ThemeSettingsContent() {
    const { theme, themeMeta } = useTheme();

    return (
        <div className="settings-content">
            <header className="content-header">
                <h2 className="content-title">Themes</h2>
                <p className="content-subtitle">Customize the appearance and feel of your writing environment</p>
            </header>

            <div className="settings-grid">
                <Card className="theme-selection-card">
                    <div className="card-head">
                        <Palette size={18} className="head-icon" />
                        <h3 className="card-title">Select Theme</h3>
                    </div>
                    <p className="card-desc">Choose from a variety of professionally curated typography and color systems.</p>

                    <div className="picker-wrap">
                        <ThemePicker />
                    </div>
                </Card>

                <Card className="visual-prefs-card">
                    <div className="card-head">
                        <Monitor size={18} className="head-icon" />
                        <h3 className="card-title">Visual Preferences</h3>
                    </div>

                    <div className="prefs-list">
                        <div className="pref-item">
                            <div className="pref-info">
                                <span className="pref-name">Interface Scaling</span>
                                <p className="pref-desc">Adjust the size of UI elements components.</p>
                            </div>
                            <select className="pref-select">
                                <option>Compact (90%)</option>
                                <option selected>Default (100%)</option>
                                <option>Large (110%)</option>
                            </select>
                        </div>

                        <div className="pref-item">
                            <div className="pref-info">
                                <span className="pref-name">Auto-Switch Appearance</span>
                                <p className="pref-desc">Sync appearance with your system settings.</p>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked />
                                <span className="slider"></span>
                            </label>
                        </div>
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
                    margin-bottom: 8px;
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
                    font-size: 0.8rem;
                    color: var(--text-tertiary);
                    margin-bottom: 24px;
                }

                .theme-selection-card {
                    padding: 32px !important;
                }
                .picker-wrap {
                    display: flex;
                    justify-content: flex-start;
                }

                .visual-prefs-card {
                    padding: 32px !important;
                }
                .prefs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    margin-top: 16px;
                }
                .pref-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    border-radius: var(--radius-md);
                    background: var(--surface-tertiary);
                    border: 1px solid var(--border);
                }
                .pref-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .pref-name {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .pref-desc {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
                .pref-select {
                    padding: 8px 12px;
                    border-radius: var(--radius-sm);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    color: var(--text-primary);
                    font-size: 0.85rem;
                    outline: none;
                }

                /* Custom Toggle Switch */
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: var(--surface-secondary);
                    transition: .4s;
                    border-radius: 24px;
                    border: 1px solid var(--border);
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 3px;
                    bottom: 3px;
                    background-color: var(--text-tertiary);
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: var(--accent-warm-muted);
                    border-color: var(--accent-warm);
                }
                input:checked + .slider:before {
                    transform: translateX(20px);
                    background-color: var(--accent-warm);
                }
            `}</style>
        </div>
    );
}
