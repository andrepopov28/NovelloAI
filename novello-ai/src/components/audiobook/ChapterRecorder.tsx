import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Loader2, Save } from 'lucide-react';
import { Chapter } from '@/lib/types';
import { toast } from 'sonner';

export function ChapterRecorder({
    chapter,
    onSave,
    onClose
}: {
    chapter: Chapter;
    onSave: (audioData: string) => Promise<void>;
    onClose: () => void;
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(chapter.audioUrl || null);
    const [isSaving, setIsSaving] = useState(false);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerInterval = useRef<NodeJS.Timeout | null>(null);
    const audioElement = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
            if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
                mediaRecorder.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    setAudioUrl(base64data);
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            setDuration(0);
            timerInterval.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            toast.error('Microphone access denied or unavailable.');
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
        }
        setIsRecording(false);
        if (timerInterval.current) clearInterval(timerInterval.current);
    };

    const handleSave = async () => {
        if (!audioUrl) return;
        setIsSaving(true);
        try {
            await onSave(audioUrl);
            toast.success('Recording saved as custom audiobook trace.');
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save recording.');
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="cr-root" onClick={e => e.stopPropagation()}>
            <div className="cr-header">
                <h4>Narrator Mode: {chapter.title}</h4>
                <button className="cr-close" onClick={onClose}>×</button>
            </div>
            
            <div className="cr-body">
                {isRecording ? (
                    <div className="cr-recording-pulse">
                        <div className="cr-pulse-dot" />
                        <span className="cr-time">{formatTime(duration)}</span>
                    </div>
                ) : (
                    <p className="cr-help">Record your own voice to override the TTS output for this chapter.</p>
                )}

                <div className="cr-actions">
                    {!isRecording && !audioUrl && (
                        <button className="cr-btn cr-btn-record" onClick={startRecording}>
                            <Mic size={16} /> Record Voice
                        </button>
                    )}
                    {isRecording && (
                        <button className="cr-btn cr-btn-stop" onClick={stopRecording}>
                            <Square size={16} /> Stop Recording
                        </button>
                    )}
                    {!isRecording && audioUrl && (
                        <div className="cr-playback">
                            <audio ref={audioElement} src={audioUrl} controls className="cr-audio" />
                            <div className="cr-playback-actions">
                                <button className="cr-btn cr-btn-delete" onClick={() => setAudioUrl(null)}>
                                    <Trash2 size={16} /> Retake
                                </button>
                                <button className="cr-btn cr-btn-save" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .cr-root {
                    background: var(--surface-tertiary);
                    border: 1px solid var(--border-strong);
                    border-radius: var(--radius-lg);
                    padding: 16px;
                    margin-top: 12px;
                    cursor: default;
                }
                .cr-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .cr-header h4 {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--text-primary);
                }
                .cr-close {
                    background: none;
                    border: none;
                    color: var(--text-tertiary);
                    font-size: 1.2rem;
                    cursor: pointer;
                }
                .cr-body {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .cr-help {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin: 0 0 16px;
                }
                .cr-recording-pulse {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                    padding: 8px 16px;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: var(--radius-full);
                }
                .cr-pulse-dot {
                    width: 12px;
                    height: 12px;
                    background: #ef4444;
                    border-radius: 50%;
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .cr-time {
                    font-family: monospace;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #ef4444;
                }
                .cr-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    width: 100%;
                }
                .cr-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border-radius: var(--radius-md);
                    border: none;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .cr-btn-record {
                    background: var(--surface-primary);
                    color: var(--text-primary);
                    border: 1px solid var(--border);
                }
                .cr-btn-record:hover { background: var(--surface-secondary); }
                .cr-btn-stop {
                    background: #ef4444;
                    color: white;
                }
                .cr-btn-stop:hover { background: #dc2626; }
                .cr-playback {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    width: 100%;
                }
                .cr-audio {
                    width: 100%;
                    height: 36px;
                }
                .cr-playback-actions {
                    display: flex;
                    gap: 12px;
                }
                .cr-btn-delete {
                    flex: 1;
                    background: var(--surface-primary);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }
                .cr-btn-save {
                    flex: 2;
                    background: var(--accent-warm);
                    color: white;
                }
            `}</style>
        </div>
    );
}
