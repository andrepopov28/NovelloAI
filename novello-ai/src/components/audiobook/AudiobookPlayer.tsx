import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, BookmarkPlus, X, List, Bookmark as BookmarkIcon } from 'lucide-react';
import type { ExportJob } from '@/lib/types';
import { usePlaybackSync } from '@/lib/hooks/usePlaybackSync';

interface AudiobookPlayerProps {
    exportJob: ExportJob;
    userId: string | undefined;
}

function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function AudiobookPlayer({ exportJob, userId }: AudiobookPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTimeMs, setCurrentTimeMs] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showTabs, setShowTabs] = useState<'chapters' | 'bookmarks' | null>(null);

    // Safety destructure from export object
    const m4bMeta = exportJob.formats?.m4b;
    const mp3Url = exportJob.formats?.mp3;
    const chapters = exportJob.chapters || [];
    const bookMeta = exportJob.bookMeta || { title: 'Audiobook', author: 'Author', coverAssetRef: undefined };
    const durationMs = m4bMeta?.durationMs || 1; // Fallback to avoid div by 0

    const {
        initialPositionMs,
        initialSpeed,
        bookmarks,
        syncPosition,
        addBookmark,
        removeBookmark
    } = usePlaybackSync(userId, exportJob.id);

    // Speed controls
    const [speed, setSpeed] = useState(initialSpeed);
    const speedOptions = [0.75, 1, 1.25, 1.5, 2.0];

    // Load initial position
    const [hasLoaded, setHasLoaded] = useState(false);
    useEffect(() => {
        if (!hasLoaded && audioRef.current && initialPositionMs > 0) {
            audioRef.current.currentTime = initialPositionMs / 1000;
            setCurrentTimeMs(initialPositionMs);
            setHasLoaded(true);
        }
    }, [initialPositionMs, hasLoaded]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    }, [speed]);

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const currentMs = audioRef.current.currentTime * 1000;
        setCurrentTimeMs(currentMs);

        // Sync to cloud every ~5s handled smoothly by the hook's internal throttle
        syncPosition(currentMs, speed);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const newTimeMs = Number(e.target.value);
        audioRef.current.currentTime = newTimeMs / 1000;
        setCurrentTimeMs(newTimeMs);
        syncPosition(newTimeMs, speed, true);
    };

    const jumpFixed = (offsetSec: number) => {
        if (!audioRef.current) return;
        let newTimeMs = (audioRef.current.currentTime + offsetSec) * 1000;
        newTimeMs = Math.max(0, Math.min(newTimeMs, durationMs));
        audioRef.current.currentTime = newTimeMs / 1000;
        setCurrentTimeMs(newTimeMs);
        syncPosition(newTimeMs, speed, true);
    };

    const jumpToTime = (timeMs: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = timeMs / 1000;
        setCurrentTimeMs(timeMs);
        syncPosition(timeMs, speed, true);
        if (!isPlaying) {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            syncPosition(currentTimeMs, speed, true);
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleAddBookmark = () => {
        const title = prompt("Bookmark Name:", `Bookmark at ${formatTime(currentTimeMs)}`);
        if (title) {
            addBookmark(currentTimeMs, title);
        }
    };

    if (!mp3Url) return null;

    // Find current chapter
    const activeChapter = chapters.find(c => currentTimeMs >= c.startMs && currentTimeMs <= c.endMs);

    return (
        <div className="audiobook-player">
            <audio
                ref={audioRef}
                src={mp3Url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />

            <div className="ap-cover-area">
                {bookMeta.coverAssetRef ? (
                    <img src={bookMeta.coverAssetRef} alt="Cover" className="ap-cover" crossOrigin="anonymous" />
                ) : (
                    <div className="ap-cover-fallback" />
                )}
            </div>

            <div className="ap-controls-area">
                <div className="ap-header">
                    <div>
                        <h4 className="ap-title">{bookMeta.title}</h4>
                        <p className="ap-subtitle">{bookMeta.author}</p>
                        {activeChapter && <p className="ap-chapter">{activeChapter.title}</p>}
                    </div>
                    <div className="ap-tools">
                        <button className={`ap-tool-btn ${showTabs === 'chapters' ? 'active' : ''}`} onClick={() => setShowTabs(showTabs === 'chapters' ? null : 'chapters')}>
                            <List size={16} />
                        </button>
                        <button className={`ap-tool-btn ${showTabs === 'bookmarks' ? 'active' : ''}`} onClick={() => setShowTabs(showTabs === 'bookmarks' ? null : 'bookmarks')}>
                            <BookmarkIcon size={16} />
                        </button>
                    </div>
                </div>

                <div className="ap-progress-row">
                    <span className="ap-time">{formatTime(currentTimeMs)}</span>
                    <input
                        type="range"
                        min={0}
                        max={durationMs}
                        value={currentTimeMs}
                        onChange={handleSeek}
                        className="ap-slider"
                    />
                    <span className="ap-time">{formatTime(durationMs)}</span>
                </div>

                <div className="ap-playback-controls">
                    <button className="ap-speed" onClick={() => {
                        const idx = speedOptions.indexOf(speed);
                        const nextSpeed = speedOptions[(idx + 1) % speedOptions.length];
                        setSpeed(nextSpeed);
                        syncPosition(currentTimeMs, nextSpeed, true);
                    }}>
                        {speed}x
                    </button>

                    <button className="ap-icon-btn" onClick={() => jumpFixed(-15)}>
                        <SkipBack size={24} />
                    </button>

                    <button className="ap-play-btn" onClick={togglePlay}>
                        {isPlaying ? <Pause size={28} /> : <Play size={28} className="play-icon" />}
                    </button>

                    <button className="ap-icon-btn" onClick={() => jumpFixed(15)}>
                        <SkipForward size={24} />
                    </button>

                    <button className="ap-icon-btn ap-bookmark-btn" onClick={handleAddBookmark}>
                        <BookmarkPlus size={20} />
                    </button>
                </div>
            </div>

            {/* Slide-out Panels */}
            {showTabs === 'chapters' && (
                <div className="ap-panel">
                    <div className="ap-panel-header">
                        <h5>Chapters</h5>
                        <button onClick={() => setShowTabs(null)}><X size={16} /></button>
                    </div>
                    <div className="ap-list">
                        {chapters.map(c => (
                            <button
                                key={c.chapterId}
                                className={`ap-list-item ${activeChapter?.chapterId === c.chapterId ? 'active' : ''}`}
                                onClick={() => jumpToTime(c.startMs)}
                            >
                                <span>{c.title}</span>
                                <span>{formatTime(c.startMs)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showTabs === 'bookmarks' && (
                <div className="ap-panel">
                    <div className="ap-panel-header">
                        <h5>Bookmarks</h5>
                        <button onClick={() => setShowTabs(null)}><X size={16} /></button>
                    </div>
                    <div className="ap-list">
                        {bookmarks.length === 0 ? <p className="ap-empty">No bookmarks yet.</p> : bookmarks.map(b => (
                            <div key={b.id} className="ap-list-row">
                                <button
                                    className="ap-list-item"
                                    onClick={() => jumpToTime(b.positionMs)}
                                    style={{ flex: 1 }}
                                >
                                    <span>{b.label}</span>
                                    <span>{formatTime(b.positionMs)}</span>
                                </button>
                                <button className="ap-delete-btn" onClick={() => removeBookmark(b.id)}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .audiobook-player {
                    display: flex;
                    flex-direction: column;
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    position: relative;
                }

                .ap-cover-area {
                    width: 100%;
                    aspect-ratio: 1;
                    max-height: 250px;
                    background: var(--surface-tertiary);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                }
                .ap-cover {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .ap-cover-fallback {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, var(--surface-elevated), var(--border));
                }

                .ap-controls-area {
                    padding: 24px;
                }

                .ap-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }
                .ap-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin: 0;
                    color: var(--text-primary);
                }
                .ap-subtitle {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    margin: 4px 0;
                }
                .ap-chapter {
                    font-size: 0.8rem;
                    color: var(--accent);
                    margin: 4px 0 0 0;
                    font-weight: 500;
                }

                .ap-tools {
                    display: flex;
                    gap: 8px;
                }
                .ap-tool-btn {
                    background: var(--surface-elevated);
                    border: 1px solid var(--border);
                    color: var(--text-secondary);
                    width: 32px;
                    height: 32px;
                    border-radius: var(--radius-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .ap-tool-btn:hover { color: var(--text-primary); }
                .ap-tool-btn.active { background: var(--surface-tertiary); color: var(--accent); border-color: var(--accent); }

                .ap-progress-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .ap-time {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                    font-variant-numeric: tabular-nums;
                    min-width: 45px;
                }
                .ap-slider {
                    flex: 1;
                    accent-color: var(--accent);
                    height: 4px;
                    border-radius: 2px;
                    cursor: pointer;
                }

                .ap-playback-controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                }
                .ap-speed {
                    background: transparent;
                    border: 1px solid var(--border);
                    color: var(--text-secondary);
                    padding: 4px 8px;
                    border-radius: var(--radius-sm);
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                }
                .ap-speed:hover { background: var(--surface-elevated); }

                .ap-icon-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                .ap-icon-btn:hover { opacity: 1; }

                .ap-play-btn {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: var(--accent);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                }
                .ap-play-btn:hover { transform: scale(1.05); }
                .play-icon { margin-left: 4px; }

                .ap-bookmark-btn {
                    color: var(--text-secondary);
                }

                /* Panels */
                .ap-panel {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: var(--surface-secondary);
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    animation: slide-up 0.2s ease;
                }
                .ap-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    border-bottom: 1px solid var(--border);
                }
                .ap-panel-header h5 { margin: 0; font-size: 1rem; color: var(--text-primary); }
                .ap-panel-header button { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; }
                
                .ap-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .ap-empty { text-align: center; color: var(--text-tertiary); font-size: 0.9rem; margin-top: 24px; }
                
                .ap-list-row { display: flex; gap: 8px; align-items: center; }
                
                .ap-list-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: var(--surface-elevated);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .ap-list-item:hover { border-color: var(--accent); }
                .ap-list-item.active { background: var(--surface-tertiary); color: var(--accent); font-weight: 500; border-color: var(--accent); }
                .ap-list-item span:last-child { font-size: 0.8rem; color: var(--text-tertiary); }
                
                .ap-delete-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: var(--radius-sm);
                    border: none;
                    background: transparent;
                    color: #ef4444;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .ap-delete-btn:hover { background: rgba(239, 68, 68, 0.1); }

                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                /* Responsive */
                @media(min-width: 600px) {
                    .audiobook-player {
                        flex-direction: row;
                    }
                    .ap-cover-area {
                        width: 250px;
                        height: 250px;
                        border-right: 1px solid var(--border);
                    }
                    .ap-controls-area {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                }
            `}</style>
        </div>
    );
}
