import React, { useState, useEffect } from 'react';
import type { ExportJob } from '@/lib/types';
import { Download, Loader2, XCircle, Mic2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useVoices } from '@/lib/hooks/useVoices';
import { AudiobookPlayer } from './AudiobookPlayer';
import { useAuth } from '@/lib/hooks/useAuth';

const JOBS_KEY = (projectId: string) => `novello_audiobook_jobs_${projectId}`;

export function AudiobookExport({ projectId, userId }: { projectId: string; userId: string | undefined; }) {
  const { user } = useAuth();
  const { allVoices, loading: voicesLoading } = useVoices(userId);
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!selectedVoice && allVoices.length > 0) {
      setSelectedVoice(allVoices[0].id);
    }
  }, [allVoices, selectedVoice]);

  // Load jobs from localStorage
  useEffect(() => {
    if (!projectId) return;
    try {
      const stored = localStorage.getItem(JOBS_KEY(projectId));
      setJobs(stored ? JSON.parse(stored) : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const token = user?.uid ?? 'local';
      const res = await fetch('/api/ai/audiobook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          settings: {
            voiceId: selectedVoice,
            language: 'en',
            speed: 1,
            pauseDurationMs: 1000,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start job');
      }

      const newJob = await res.json() as ExportJob;
      const updated = [newJob, ...jobs];
      setJobs(updated);
      localStorage.setItem(JOBS_KEY(projectId), JSON.stringify(updated));
      toast.success('Audiobook generation started');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = async (exportId: string) => {
    try {
      const token = user?.uid ?? 'local';
      const res = await fetch('/api/ai/audiobook/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exportId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel job');
      }
      toast.success('Job cancelled');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="ab-export-container">
      <style>{`
        .ab-ex-section { background: var(--surface-secondary); padding: 24px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 24px; }
        .ab-ex-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 16px; color: var(--text-primary); }
        .ab-ex-p { color: var(--text-secondary); margin-bottom: 20px; font-size: 0.95rem; }
        .ab-ex-select { background: var(--surface-primary); border: 1px solid var(--border); color: var(--text-primary); padding: 10px 14px; border-radius: 8px; width: 100%; max-width: 400px; margin-bottom: 20px; font-size: 0.95rem; }
        .ab-ex-generate-btn { display: inline-flex; align-items: center; gap: 8px; background: var(--accent-warm); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
        .ab-ex-generate-btn:hover { opacity: 0.9; }
        .ab-ex-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ab-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .ab-ex-job-card { background: var(--surface-tertiary); border: 1px solid var(--border); padding: 16px; border-radius: 8px; margin-bottom: 12px; }
        .ab-ex-job-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .ab-ex-job-title { font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
        .ab-ex-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
        .st-queued { background: rgba(255,165,0,0.1); color: #ffa500; }
        .st-processing { background: rgba(56,189,248,0.1); color: #38bdf8; }
        .st-completed { background: rgba(16,185,129,0.1); color: #10b981; }
        .st-failed { background: rgba(239,68,68,0.1); color: #ef4444; }
        
        .ab-ex-progress-wrap { background: var(--surface-primary); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
        .ab-ex-progress-fill { background: var(--accent-warm); height: 100%; transition: width 0.3s ease; }
        .ab-ex-progress-text { font-size: 0.85rem; color: var(--text-secondary); display: flex; justify-content: space-between;}
        
        .ab-ex-job-actions { display: flex; gap: 12px; margin-top: 16px; }
        .ab-ex-btn-sm { padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; border: 1px solid var(--border); background: var(--surface-secondary); color: var(--text-primary); text-decoration: none;}
        .ab-ex-btn-sm:hover { background: var(--surface-primary); }
        .ab-ex-btn-cancel { color: #ef4444; }
      `}</style>

      <div className="ab-ex-section">
        <h2 className="ab-ex-title">Export Full Audiobook</h2>
        <p className="ab-ex-p">Generate a single, beautifully mastered MP3 of your entire manuscript to download.</p>

        {voicesLoading ? (
          <div style={{ padding: '10px 14px', marginBottom: 20 }}>
            <Loader2 size={16} className="ab-spin" /> Loading Library...
          </div>
        ) : (
          <select className="ab-ex-select" value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)}>
            {allVoices.map(v => (
              <option key={v.id} value={v.id}>
                {v.displayName} {v.isBuiltin ? '' : '(Custom)'}
              </option>
            ))}
          </select>
        )}
        <br />

        <button className="ab-ex-generate-btn" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? <Loader2 size={18} className="ab-spin" /> : <Mic2 size={18} />}
          {isGenerating ? 'Starting...' : 'Generate Audiobook'}
        </button>
      </div>

      <div className="ab-ex-section">
        <h2 className="ab-ex-title">Export History</h2>
        {loading && <Loader2 size={24} className="ab-spin" />}
        {!loading && jobs.length === 0 && <p className="ab-ex-p">No export jobs yet.</p>}

        {jobs.map(job => (
          <div key={job.id} className="ab-ex-job-card">
            <div className="ab-ex-job-header">
              <div className="ab-ex-job-title">
                Audiobook Generation
                <span className={`ab-ex-status st-${job.status}`}>{job.status}</span>
              </div>
              <div className="ab-ex-job-date">
                {job.createdAt ? new Date(job.createdAt as unknown as number).toLocaleDateString() : ''}
              </div>
            </div>

            {job.status === 'processing' || job.status === 'queued' ? (
              <>
                <div className="ab-ex-progress-wrap">
                  <div className="ab-ex-progress-fill" style={{ width: `${job.progress?.percentComplete || 0}%` }} />
                </div>
                <div className="ab-ex-progress-text">
                  <span>{job.progress?.stage === 'tts' ? `Generating Chapter ${job.progress.currentChapter} of ${job.progress.totalChapters}` : job.progress?.stage}</span>
                  <span>{job.progress?.percentComplete || 0}%</span>
                </div>
                <div className="ab-ex-job-actions">
                  <button className="ab-ex-btn-sm ab-ex-btn-cancel" onClick={() => handleCancel(job.id)}>
                    <XCircle size={14} /> Cancel
                  </button>
                </div>
              </>
            ) : job.status === 'completed' ? (
              <div className="ab-ex-player-wrap">
                <div style={{ marginBottom: 16 }}>
                  <AudiobookPlayer exportJob={job} userId={userId} />
                </div>
                <div className="ab-ex-job-actions">
                  {job.formats?.m4b?.path && (
                    <a href={job.formats.m4b.path} target="_blank" rel="noopener noreferrer" className="ab-ex-btn-sm" download>
                      <Download size={14} /> Download M4B (Apple Books)
                    </a>
                  )}
                  {job.formats?.mp3 && (
                    <a href={job.formats.mp3} target="_blank" rel="noopener noreferrer" className="ab-ex-btn-sm" download>
                      <Download size={14} /> Download MP3
                    </a>
                  )}
                  {job.formats?.wav && (
                    <a href={job.formats.wav} target="_blank" rel="noopener noreferrer" className="ab-ex-btn-sm" download>
                      <Download size={14} /> Download WAV (Lossless)
                    </a>
                  )}
                </div>
              </div>
            ) : job.status === 'failed' ? (
              <div className="ab-ex-progress-text" style={{ color: '#ef4444' }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
                {job.error || 'Unknown error occurred.'}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
