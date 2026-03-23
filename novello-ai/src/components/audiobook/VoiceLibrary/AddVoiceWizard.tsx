import React, { useState, useRef } from 'react';
import { X, Mic2, Upload, Loader2, CheckCircle2, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddVoiceWizardProps {
    onClose: () => void;
    userId: string | undefined;
}

export function AddVoiceWizard({ onClose, userId }: AddVoiceWizardProps) {
    const [step, setStep] = useState(1);

    // Form Data
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('en-US');
    const [styleTag, setStyleTag] = useState('Studio Neutral');
    const [description, setDescription] = useState('');

    // Audio Data
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Form submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createSuccess, setCreateSuccess] = useState(false);

    const STYLES = ['Studio Neutral', 'Warm Cinematic', 'Modern Corporate', 'Creative Artist', 'Expressive Narrator'];

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleRecord = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setAudioBlob(null);
            toast.info('Recording started. Speak for 10-30 seconds.');
        } catch (err) {
            toast.error('Microphone access denied.');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File too large (max 10MB).');
                return;
            }
            setAudioBlob(file);
            toast.success('Audio file attached.');
        }
    };

    const handleSubmit = async () => {
        if (!name || !audioBlob) {
            toast.error('Please complete all required fields and provide an audio sample.');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = userId || 'local';
            const formData = new FormData();
            formData.append('sample', audioBlob);
            formData.append('displayName', name);
            formData.append('language', language);
            formData.append('styleTag', styleTag);
            if (description) formData.append('description', description);

            const res = await fetch('/api/ai/voices/cloned/create', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create voice clone');
            }

            setCreateSuccess(true);
            setStep(3); // Success Screen
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="vl-modal-backdrop">
            <div className="vl-modal-container glass-strong animate-modal-pop">
                <div className="vl-modal-header">
                    <h3 className="vl-modal-title">Clone Your Voice</h3>
                    <button className="vl-modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="vl-modal-body">
                    {step === 1 && (
                        <div className="vl-step-content animate-fade-in">
                            <h4 className="vl-step-title">Step 1: Voice Details</h4>
                            <p className="vl-step-desc">Give your voice clone an identity to generate a photorealistic avatar.</p>

                            <div className="vl-form-group">
                                <label>Voice Name *</label>
                                <input
                                    className="vl-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. My Narrator Voice"
                                    autoFocus
                                />
                            </div>

                            <div className="vl-form-row">
                                <div className="vl-form-group">
                                    <label>Language</label>
                                    <select className="vl-select" value={language} onChange={e => setLanguage(e.target.value)}>
                                        <option value="en-US">English (US)</option>
                                        <option value="en-GB">English (UK)</option>
                                    </select>
                                </div>
                                <div className="vl-form-group">
                                    <label>Avatar Aesthetic Style</label>
                                    <select className="vl-select" value={styleTag} onChange={e => setStyleTag(e.target.value)}>
                                        {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="vl-form-group">
                                <label>Description (Optional)</label>
                                <textarea
                                    className="vl-input"
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief notes about the tone or usage of this voice..."
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="vl-step-content animate-fade-in">
                            <h4 className="vl-step-title">Step 2: Audio Sample</h4>
                            <p className="vl-step-desc">Provide a clear audio sample (10-30s) of the voice without background noise.</p>

                            <div className="vl-audio-options">
                                <div className={`vl-audio-card ${isRecording ? 'recording' : ''}`}>
                                    <div className="vl-card-icon"><Mic2 size={32} /></div>
                                    <h5>Record Directly</h5>
                                    <p>Read from a script naturally.</p>
                                    <button
                                        className={`vl-audio-btn ${isRecording ? 'btn-danger pulse' : 'btn-primary'}`}
                                        onClick={handleRecord}
                                    >
                                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                                    </button>
                                </div>

                                <div className="vl-audio-divider">OR</div>

                                <div className="vl-audio-card">
                                    <div className="vl-card-icon"><Upload size={32} /></div>
                                    <h5>Upload Audio File</h5>
                                    <p>MP3/WAV/WebM (max 10MB)</p>
                                    <label className="vl-audio-btn btn-secondary">
                                        Browse Files
                                        <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </div>

                            {audioBlob && (
                                <div className="vl-audio-success">
                                    <CheckCircle2 size={16} /> Audio sample ready ({Math.round(audioBlob.size / 1024)} KB)
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="vl-step-content animate-fade-in vl-success-view">
                            <div className="vl-success-icon-wrap">
                                <Sparkles size={48} className="vl-feature-icon spin-slow" />
                                <Wand2 size={32} className="vl-floating-wand" />
                            </div>
                            <h4 className="vl-success-title">Voice Clone Initialized!</h4>
                            <p className="vl-success-desc">
                                We are generating your photorealistic avatar and training the neural model in the background.
                                It will appear in your Library momentarily.
                            </p>
                            <button className="vl-primary-btn" onClick={onClose}>Return to Library</button>
                        </div>
                    )}
                </div>

                {step < 3 && (
                    <div className="vl-modal-footer">
                        {step > 1 ? (
                            <button className="vl-btn-outline" onClick={handleBack} disabled={isSubmitting}>Back</button>
                        ) : <div></div>}

                        {step === 1 ? (
                            <button className="vl-primary-btn" onClick={handleNext} disabled={!name}>Next Step</button>
                        ) : (
                            <button className="vl-primary-btn" onClick={handleSubmit} disabled={!audioBlob || isSubmitting}>
                                {isSubmitting ? <><Loader2 size={16} className="ab-spin" /> Submitting...</> : 'Create Voice Clone'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .vl-modal-backdrop {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
                    z-index: 100; display: flex; align-items: center; justify-content: center;
                    padding: 1rem;
                }
                .vl-modal-container {
                    width: 100%; max-width: 600px; background: var(--surface-primary);
                    border-radius: var(--radius-xl); border: 1px solid var(--border);
                    box-shadow: 0 24px 50px rgba(0,0,0,0.25); overflow: hidden;
                    display: flex; flex-direction: column;
                }
                .animate-modal-pop {
                    animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes scaleUp {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }

                .vl-modal-header {
                    padding: 1.5rem 2rem; border-bottom: 1px solid var(--border);
                    display: flex; justify-content: space-between; align-items: center;
                    background: var(--surface-secondary);
                }
                .vl-modal-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: var(--text-primary); }
                .vl-modal-close {
                    width: 32px; height: 32px; border-radius: 50%; border: none;
                    background: transparent; color: var(--text-secondary);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: background 0.2s;
                }
                .vl-modal-close:hover { background: var(--surface-tertiary); color: var(--text-primary); }

                .vl-modal-body { padding: 2rem; min-height: 380px; }
                
                .vl-step-title { font-size: 1.3rem; font-weight: 600; margin: 0 0 8px; color: var(--text-primary); }
                .vl-step-desc { font-size: 0.9rem; color: var(--text-secondary); margin: 0 0 1.5rem; line-height: 1.5; }
                
                .vl-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1.25rem; }
                .vl-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .vl-form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
                .vl-input, .vl-select {
                    width: 100%; padding: 12px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-secondary);
                    color: var(--text-primary); font-size: 0.95rem; font-family: inherit;
                }
                .vl-input:focus, .vl-select:focus { border-color: var(--accent); outline: none; background: var(--surface-primary); }

                .vl-audio-options {
                    display: flex; gap: 1rem; align-items: stretch; margin-top: 1rem;
                }
                .vl-audio-card {
                    flex: 1; border: 1px dashed var(--border-strong); border-radius: var(--radius-lg);
                    padding: 2rem 1.5rem; text-align: center; background: var(--surface-secondary);
                    transition: all 0.2s;
                }
                .vl-audio-card.recording { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); border-style: solid; box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
                .vl-card-icon { color: var(--accent); margin-bottom: 1rem; display: flex; justify-content: center; }
                .vl-audio-card h5 { font-size: 1rem; font-weight: 600; margin: 0 0 8px; color: var(--text-primary); }
                .vl-audio-card p { font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 1.5rem; }
                
                .vl-audio-btn {
                    width: 100%; padding: 10px; border-radius: var(--radius-md); font-weight: 500; font-size: 0.9rem;
                    cursor: pointer; display: inline-block; text-align: center; transition: all 0.2s; border: none;
                }
                .btn-primary { background: var(--accent); color: white; }
                .btn-primary:hover { background: var(--accent-hover); }
                .btn-secondary { background: var(--surface-tertiary); color: var(--text-primary); border: 1px solid var(--border); }
                .btn-secondary:hover { background: var(--surface-elevated); }
                .btn-danger { background: #ef4444; color: white; }
                
                .pulse { animation: pulse-red 1.5s infinite; }
                @keyframes pulse-red { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.98); } }

                .vl-audio-divider {
                    display: flex; align-items: center; color: var(--text-tertiary); font-size: 0.8rem; font-weight: 600;
                }

                .vl-audio-success {
                    margin-top: 1.5rem; padding: 12px; background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-md);
                    color: #10b981; font-weight: 500; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;
                    justify-content: center;
                }

                .vl-modal-footer {
                    padding: 1.5rem 2rem; border-top: 1px solid var(--border);
                    background: var(--surface-secondary); display: flex; justify-content: space-between;
                }
                
                .vl-primary-btn {
                    padding: 10px 24px; border-radius: var(--radius-md); background: var(--accent);
                    color: white; font-weight: 600; font-size: 0.95rem; border: none; cursor: pointer;
                    display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s;
                }
                .vl-primary-btn:hover:not(:disabled) { background: var(--accent-hover); }
                .vl-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .vl-btn-outline {
                    padding: 10px 20px; border-radius: var(--radius-md); background: transparent;
                    color: var(--text-primary); font-weight: 500; font-size: 0.95rem;
                    border: 1px solid var(--border); cursor: pointer; transition: background 0.2s;
                }
                .vl-btn-outline:hover:not(:disabled) { background: var(--surface-tertiary); }
                .vl-btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

                .vl-success-view { text-align: center; padding: 2rem 1rem; }
                .vl-success-icon-wrap {
                    width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(245,158,11,0.1));
                    display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; position: relative; color: var(--accent);
                }
                .vl-floating-wand { position: absolute; right: -10px; top: -10px; color: #f59e0b; animation: float 3s ease-in-out infinite; }
                .spin-slow { animation: spin 8s linear infinite; }
                
                .vl-success-title { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin: 0 0 12px; }
                .vl-success-desc { font-size: 0.95rem; color: var(--text-secondary); margin: 0 auto 2rem; max-width: 400px; line-height: 1.6; }

                @keyframes float { 0%, 100% { transform: translateY(0) rotate(10deg); } 50% { transform: translateY(-10px) rotate(-5deg); } }
            `}</style>
        </div>
    );
}
