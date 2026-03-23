'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Mail, Camera, Save } from 'lucide-react';

export default function ProfileSettingsContent() {
    const { user } = useAuth();

    return (
        <div className="settings-content">
            <header className="content-header">
                <h2 className="content-title">Profile</h2>
                <p className="content-subtitle">Manage your personal information and account details</p>
            </header>

            <div className="settings-grid">
                <Card className="profile-card">
                    <div className="profile-hero">
                        <div className="avatar-wrap">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="" className="profile-avatar" />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    <User size={32} />
                                </div>
                            )}
                            <button className="change-photo-btn">
                                <Camera size={14} />
                            </button>
                        </div>
                        <div className="hero-info">
                            <h3 className="hero-name">{user?.displayName || 'Novello Author'}</h3>
                            <p className="hero-role">Individual Account</p>
                        </div>
                    </div>

                    <div className="profile-fields">
                        <div className="field-group">
                            <label className="field-label">Display Name</label>
                            <div className="field-input-wrap">
                                <User size={16} className="field-icon" />
                                <input
                                    type="text"
                                    defaultValue={user?.displayName || ''}
                                    placeholder="Your Name"
                                    className="field-input"
                                />
                            </div>
                        </div>

                        <div className="field-group">
                            <label className="field-label">Email Address</label>
                            <div className="field-input-wrap">
                                <Mail size={16} className="field-icon" />
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    readOnly
                                    className="field-input field-input-readonly"
                                />
                            </div>
                            <p className="field-hint">Email cannot be changed from here.</p>
                        </div>

                        <Button className="save-profile-btn">
                            <Save size={16} />
                            <span>Save Changes</span>
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

                .profile-card {
                    padding: 32px !important;
                }
                .profile-hero {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    margin-bottom: 40px;
                }
                .avatar-wrap {
                    position: relative;
                }
                .profile-avatar, .profile-avatar-placeholder {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    border: 3px solid var(--border);
                }
                .profile-avatar-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--surface-tertiary);
                    color: var(--text-tertiary);
                }
                .change-photo-btn {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: var(--accent-warm);
                    color: white;
                    border: 2px solid var(--surface-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .change-photo-btn:hover {
                    transform: scale(1.1);
                }
                .hero-name {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .hero-role {
                    font-size: 0.82rem;
                    color: var(--text-tertiary);
                    margin-top: 2px;
                }

                .profile-fields {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    max-width: 480px;
                }
                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .field-label {
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .field-input-wrap {
                    position: relative;
                }
                .field-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-tertiary);
                }
                .field-input {
                    width: 100%;
                    padding: 12px 14px 12px 42px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .field-input:focus {
                    border-color: var(--accent-warm);
                }
                .field-input-readonly {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .field-hint {
                    font-size: 0.72rem;
                    color: var(--text-tertiary);
                }
                .save-profile-btn {
                    align-self: flex-start;
                    margin-top: 8px;
                }
            `}</style>
        </div>
    );
}
