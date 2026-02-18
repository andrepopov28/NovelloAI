'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Send, Trash2, StopCircle, Mic, Headphones, Upload, Minimize2, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { useChat, ChatMessage } from '@/lib/hooks/useChat';
import { useVoiceInteraction } from '@/lib/hooks/useVoiceInteraction';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

// ─── Persona Definitions ──────────────────────
interface Persona {
    key: string;
    name: string;
    subtitle: string;
    avatar: string;
    greeting: string;
    description: string;
    suggestions: string[];
}

const personas: Record<string, Persona> = {
    default: {
        key: 'default',
        name: 'Novello AI',
        subtitle: 'Creative Assistant',
        avatar: '/images/personas/default.png',
        greeting: "Hi, I'm your writing assistant",
        description: 'Ask me to brainstorm ideas, refine your prose, build characters, or anything creative.',
        suggestions: [
            'Help me develop my protagonist',
            'Suggest a plot twist',
            'Critique my opening paragraph',
        ],
    },
    write: {
        key: 'write',
        name: 'The Novelist',
        subtitle: 'Writing Companion',
        avatar: '/images/personas/write.png',
        greeting: "Let's craft something extraordinary",
        description: 'I can help you with prose, dialogue, pacing, and narrative structure.',
        suggestions: [
            'Improve the pacing of this scene',
            'Rewrite this dialogue naturally',
            'Help me show, not tell',
        ],
    },
    brainstorm: {
        key: 'brainstorm',
        name: 'The Muse',
        subtitle: 'Creative Director',
        avatar: '/images/personas/brainstorm.png',
        greeting: "Let's unleash that creativity!",
        description: 'I spark ideas — plots, characters, twists, and world-building.',
        suggestions: [
            'Give me 5 wild plot twists',
            'Build a villain backstory',
            'Create a unique magic system',
        ],
    },
    codex: {
        key: 'codex',
        name: 'The Archivist',
        subtitle: 'Lore Keeper',
        avatar: '/images/personas/codex.png',
        greeting: 'Every detail matters in a great story',
        description: 'I help you track characters, locations, and lore for consistency.',
        suggestions: [
            'Check for timeline inconsistencies',
            'Expand this character profile',
            'Suggest details for this location',
        ],
    },
    audiobook: {
        key: 'audiobook',
        name: 'The Narrator',
        subtitle: 'Voice & Performance',
        avatar: '/images/personas/audiobook.png',
        greeting: "Let's bring your words to life",
        description: 'I help prepare your manuscript for narration and audio production.',
        suggestions: [
            'Which chapter sounds best aloud?',
            'Suggest pacing for narration',
            'Identify hard-to-pronounce names',
        ],
    },
    publish: {
        key: 'publish',
        name: 'The Publisher',
        subtitle: 'Publishing Advisor',
        avatar: '/images/personas/publish.png',
        greeting: "Ready to share your story with the world?",
        description: 'I guide you on metadata, cover design, blurbs, and export readiness.',
        suggestions: [
            'Write a compelling book blurb',
            'Suggest categories for my genre',
            'Review my manuscript checklist',
        ],
    },
};

function getPersonaFromPath(pathname: string): Persona {
    if (pathname.includes('/brainstorm')) return personas.brainstorm;
    if (pathname.includes('/codex')) return personas.codex;
    if (pathname.includes('/audiobook')) return personas.audiobook;
    if (pathname.includes('/publish')) return personas.publish;
    if (pathname.match(/\/project\/[^/]+$/)) return personas.write;
    return personas.default;
}

// ─── Main Component ──────────────────────

export function AIChatbox() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true); // Open by default
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [liveConvoMode, setLiveConvoMode] = useState(false);

    // Extract projectId from path /project/[id]
    const projectMatch = pathname.match(/\/project\/([^/]+)/);
    const projectId = projectMatch ? projectMatch[1] : undefined;

    const { messages, isStreaming, sendMessage, cancelStream, clearMessages } = useChat(projectId);
    const voice = useVoiceInteraction();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const prevMsgCountRef = useRef(0);

    const persona = getPersonaFromPath(pathname);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    // Auto-speak new assistant messages when in Live Convo mode
    useEffect(() => {
        if (!liveConvoMode) return;
        if (messages.length > prevMsgCountRef.current) {
            const latestMsg = messages[messages.length - 1];
            if (latestMsg?.role === 'assistant' && latestMsg.content && !isStreaming) {
                voice.speakText(latestMsg.content);
            }
        }
        prevMsgCountRef.current = messages.length;
    }, [messages, isStreaming, liveConvoMode, voice]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || isStreaming) return;
        setInput('');
        sendMessage(text);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleVoiceNote = async () => {
        if (voice.isListening) {
            voice.stopListening();
            return;
        }
        try {
            const transcript = await voice.startListening();
            if (transcript) {
                setInput(transcript);
                // Auto-send in live convo mode
                if (liveConvoMode) {
                    sendMessage(transcript);
                }
            }
        } catch {
            // Error handled by the hook
        }
    };

    if (!isOpen) {
        return (
            <>
                <button
                    onClick={() => setIsOpen(true)}
                    className="chatbox-fab animate-scale-in"
                    title={`Ask ${persona.name}`}
                >
                    <Image
                        src={persona.avatar}
                        alt={persona.name}
                        width={52}
                        height={52}
                        className="fab-avatar"
                    />
                    <span className="fab-pulse" />
                </button>
                <style jsx>{`
                    .chatbox-fab {
                        position: fixed;
                        bottom: 24px;
                        right: 24px;
                        z-index: 90; /* Below GlobalNav (z-100) */
                        width: 52px;
                        height: 52px;
                        border-radius: 50%;
                        border: 2px solid var(--accent-warm);
                        background: var(--surface-secondary);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        box-shadow: var(--shadow-lg), 0 0 20px var(--accent-warm-glow);
                        transition: all var(--transition-normal);
                        padding: 0;
                        overflow: hidden;
                    }
                    .chatbox-fab:hover {
                        transform: scale(1.08);
                        box-shadow: var(--shadow-xl), 0 0 30px var(--accent-warm-glow);
                    }
                    .chatbox-fab :global(.fab-avatar) {
                        width: 52px;
                        height: 52px;
                        border-radius: 50%;
                        object-fit: cover;
                    }
                    .fab-pulse {
                        position: absolute;
                        inset: -3px;
                        border-radius: 50%;
                        border: 2px solid var(--accent-warm);
                        animation: fabPulse 2.5s ease-in-out infinite;
                        pointer-events: none;
                    }
                    @keyframes fabPulse {
                        0%, 100% { opacity: 0.5; transform: scale(1); }
                        50% { opacity: 0; transform: scale(1.3); }
                    }
                `}</style>
            </>
        );
    }

    return (
        <>
            {/* ── Minimized Strip ── */}
            {isMinimized && (
                <>
                    <div className="chatbox-minimized">
                        <div className="minimized-left">
                            <Image src={persona.avatar} alt={persona.name} width={28} height={28} className="minimized-avatar" />
                            <span className="minimized-name">{persona.name}</span>
                        </div>
                        <div className="minimized-actions">
                            <button onClick={() => setIsMinimized(false)} className="minimized-btn" title="Expand">
                                <Maximize2 size={14} />
                            </button>
                            <button onClick={() => { setIsOpen(false); setIsMinimized(false); }} className="minimized-btn" title="Close">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                    <style jsx>{`
                        .chatbox-minimized {
                            position: fixed;
                            bottom: 24px;
                            right: 24px;
                            z-index: 91;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            width: 280px;
                            padding: 8px 12px;
                            border-radius: var(--radius-lg);
                            background: var(--glass-bg-strong);
                            backdrop-filter: var(--glass-blur);
                            -webkit-backdrop-filter: var(--glass-blur);
                            border: 1px solid var(--border);
                            box-shadow: var(--shadow-lg);
                        }
                        .minimized-left {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        .minimized-left :global(.minimized-avatar) {
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            object-fit: cover;
                            border: 1.5px solid var(--accent-warm);
                        }
                        .minimized-name {
                            font-size: 0.78rem;
                            font-weight: 600;
                            color: var(--text-primary);
                        }
                        .minimized-actions {
                            display: flex;
                            gap: 4px;
                        }
                        .minimized-btn {
                            width: 28px;
                            height: 28px;
                            border-radius: var(--radius-sm);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border: none;
                            background: transparent;
                            color: var(--text-tertiary);
                            cursor: pointer;
                            transition: all var(--transition-fast);
                        }
                        .minimized-btn:hover {
                            background: var(--surface-tertiary);
                            color: var(--text-primary);
                        }
                    `}</style>
                </>
            )}

            {/* ── Full Panel ── */}
            {!isMinimized && (
                <>

                    <div className="chatbox-panel animate-slide-in-right">
                        {/* ── Agent Avatar Banner ── */}
                        <div className="chatbox-banner">
                            <div className="banner-close-row">
                                <button className="banner-clear" onClick={clearMessages} title="Clear Chat">
                                    <Trash2 size={14} />
                                </button>
                                <button className="banner-close" onClick={() => setIsMinimized(true)} title="Minimize">
                                    <Minimize2 size={14} />
                                </button>
                                <button className="banner-close" onClick={() => setIsOpen(false)} title="Close">
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Full-width Photorealistic Persona Banner */}
                            <div className="banner-hero-wrap">
                                <Image
                                    src={persona.avatar}
                                    alt={persona.name}
                                    fill
                                    className="object-cover transition-all duration-500"
                                    priority
                                />
                                {isStreaming && <div className="banner-thinking-glow" />}
                                <div className="banner-overlay-gradient" />
                            </div>

                            <div className="banner-label-glass">
                                <div className="flex flex-col">
                                    <span className="banner-agent-name">{persona.name}</span>
                                    <span className="banner-agent-role">{persona.subtitle}</span>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    {isStreaming ? (
                                        <div className="flex items-center gap-2 text-[var(--accent-blue)]">
                                            <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
                                            <span className="text-[10px] font-bold tracking-widest uppercase">Thinking</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] tracking-widest opacity-50 uppercase font-bold">
                                            {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('novello-settings') || '{}').provider?.toUpperCase() || 'OLLAMA'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Messages ── */}
                        <div className="chatbox-messages">
                            {messages.length === 0 && !isStreaming && (
                                <div className="chatbox-empty">
                                    <p className="chatbox-empty-title">{persona.greeting}</p>
                                    <p className="chatbox-empty-desc">{persona.description}</p>
                                    <div className="chatbox-suggestions">
                                        {persona.suggestions.map((s) => (
                                            <button
                                                key={s}
                                                className="chatbox-suggestion"
                                                onClick={() => {
                                                    setInput(s);
                                                    inputRef.current?.focus();
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                                    <span className="msg-role">
                                        {msg.role === 'user' ? 'USER:' : 'NOVELLO:'}
                                    </span>
                                    <div className="msg-bubble">
                                        <span className="msg-text">{msg.content}</span>
                                    </div>
                                </div>
                            ))}

                            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                                <div className="chat-msg chat-msg-assistant">
                                    <span className="msg-role">NOVELLO:</span>
                                    <div className="msg-bubble">
                                        <div className="typing-indicator">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Input Area ── */}
                        <div className="chatbox-input-area">
                            <div className="input-row">
                                <span className="input-prompt">&gt;</span>
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Input creative command or story prompt..."
                                    rows={1}
                                    className="chatbox-input"
                                />
                            </div>
                            <div className="action-bar">
                                <button
                                    className={`action-btn ${voice.isListening ? 'action-btn-active-mic' : ''}`}
                                    onClick={handleVoiceNote}
                                    title={voice.isListening ? 'Stop Listening' : 'Voice Note'}
                                >
                                    <Mic size={18} />
                                    <span>{voice.isListening ? 'Listening...' : 'Voice Note'}</span>
                                </button>
                                <button
                                    className={`action-btn ${liveConvoMode ? 'action-btn-active-convo' : ''}`}
                                    onClick={() => setLiveConvoMode(!liveConvoMode)}
                                    title={liveConvoMode ? 'Disable Live Conversation' : 'Enable Live Conversation'}
                                >
                                    {liveConvoMode ? <Volume2 size={18} /> : <Headphones size={18} />}
                                    <span>{liveConvoMode ? 'Live ●' : 'Live Convo'}</span>
                                </button>
                                {voice.isSpeaking && (
                                    <button
                                        className="action-btn action-btn-stop"
                                        onClick={voice.stopSpeaking}
                                        title="Stop Speaking"
                                    >
                                        <VolumeX size={18} />
                                        <span>Mute</span>
                                    </button>
                                )}
                                <button className="action-btn" title="File Upload">
                                    <Upload size={18} />
                                    <span>File Upload</span>
                                </button>
                                {isStreaming ? (
                                    <button className="action-btn action-btn-stop" onClick={cancelStream} title="Stop">
                                        <StopCircle size={18} />
                                        <span>STOP</span>
                                    </button>
                                ) : (
                                    <button
                                        className="action-btn action-btn-send"
                                        onClick={handleSend}
                                        disabled={!input.trim()}
                                        title="Send"
                                    >
                                        <Send size={18} />
                                        <span>SEND</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <style jsx>{`
                /* ── Panel ── */
                .chatbox-panel {
                    position: fixed;
                    top: var(--nav-height);
                    right: 0;
                    bottom: 0;
                    width: var(--chatbox-width);
                    z-index: 99;
                    display: flex;
                    flex-direction: column;
                    background: var(--glass-bg-strong);
                    backdrop-filter: var(--glass-blur-heavy);
                    -webkit-backdrop-filter: var(--glass-blur-heavy);
                    border-left: 1px solid var(--border);
                    box-shadow: var(--shadow-xl);
                }

                /* ── Banner ── */
                .chatbox-banner {
                    position: relative;
                    width: 100%;
                    overflow: hidden;
                    border-bottom: 1px solid var(--border);
                }
                .banner-hero-wrap {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16 / 10;
                    background: #000;
                    overflow: hidden;
                }
                .banner-overlay-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);
                }
                .banner-thinking-glow {
                    position: absolute;
                    inset: 0;
                    box-shadow: inset 0 0 40px rgba(0, 113, 227, 0.4);
                    animation: pulseGlow 2s infinite ease-in-out;
                    z-index: 1;
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.8; }
                }

                .banner-close-row {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    z-index: 20;
                    display: flex;
                    gap: 8px;
                }
                .banner-close, .banner-clear {
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    color: rgba(255,255,255,0.8);
                    border: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .banner-close:hover, .banner-clear:hover {
                    background: rgba(255,255,255,0.9);
                    color: #000;
                    transform: scale(1.05);
                }
                
                .banner-label-glass {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.08);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(255,255,255,0.1);
                }
                .banner-agent-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: -0.01em;
                }
                .banner-agent-role {
                    font-size: 10px;
                    color: rgba(255,255,255,0.6);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* ── Messages ── */
                .chatbox-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 14px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .chatbox-messages::-webkit-scrollbar { width: 4px; }
                .chatbox-messages::-webkit-scrollbar-thumb {
                    background: var(--border-strong);
                    border-radius: 2px;
                }

                /* ── Empty State ── */
                .chatbox-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 1rem 0.5rem;
                    gap: 6px;
                }
                .chatbox-empty-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }
                .chatbox-empty-desc {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin: 0;
                    max-width: 260px;
                    line-height: 1.5;
                }
                .chatbox-suggestions {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    margin-top: 10px;
                    width: 100%;
                }
                .chatbox-suggestion {
                    padding: 8px 14px;
                    border-radius: var(--radius-md);
                    background: var(--surface-tertiary);
                    border: 1px solid var(--border);
                    color: var(--text-secondary);
                    font-size: 0.72rem;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    text-align: left;
                }
                .chatbox-suggestion:hover {
                    background: var(--surface-elevated);
                    color: var(--text-primary);
                    border-color: var(--border-strong);
                }

                /* ── Chat Bubbles ── */
                .chat-msg {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .msg-role {
                    font-size: 0.6rem;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    color: var(--text-tertiary);
                    padding-left: 2px;
                }
                .msg-bubble {
                    padding: 10px 14px;
                    border-radius: var(--radius-md);
                    font-size: 0.78rem;
                    line-height: 1.55;
                }
                .chat-msg-user .msg-bubble {
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                    border: 1px solid var(--border);
                    box-shadow: var(--shadow-xs);
                }
                .chat-msg-assistant .msg-bubble {
                    background: var(--glass-bg-subtle);
                    backdrop-filter: var(--glass-blur);
                    -webkit-backdrop-filter: var(--glass-blur);
                    color: var(--text-primary);
                    border: 1px solid var(--accent-warm-glow);
                    box-shadow: 0 4px 15px var(--accent-warm-muted);
                    font-family: var(--font-serif);
                    font-size: 0.82rem;
                    line-height: 1.6;
                }
                .msg-text {
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                /* ── Typing ── */
                .typing-indicator {
                    display: flex;
                    gap: 4px;
                    padding: 2px 0;
                }
                .typing-indicator span {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--accent-warm);
                    animation: typeBounce 1.2s ease-in-out infinite;
                }
                .typing-indicator span:nth-child(2) { animation-delay: 0.15s; }
                .typing-indicator span:nth-child(3) { animation-delay: 0.3s; }
                @keyframes typeBounce {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-4px); opacity: 1; }
                }

                /* ── Input Area ── */
                .chatbox-input-area {
                    padding: 12px 16px 14px;
                    border-top: 1px solid var(--border);
                    background: var(--surface-secondary);
                }
                .input-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 14px;
                    border-radius: var(--radius-lg);
                    background: var(--surface-tertiary);
                    border: 1px solid var(--border);
                    margin-bottom: 10px;
                    transition: border-color var(--transition-fast);
                }
                .input-row:focus-within {
                    border-color: var(--accent-warm);
                }
                .input-prompt {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--accent-warm);
                    flex-shrink: 0;
                }
                .chatbox-input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    color: var(--text-primary);
                    font-size: 0.78rem;
                    font-family: inherit;
                    resize: none;
                    outline: none;
                    max-height: 80px;
                }
                .chatbox-input::placeholder {
                    color: var(--text-tertiary);
                }

                /* ── Action Bar ── */
                .action-bar {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                }
                .action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3px;
                    padding: 8px 4px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-secondary);
                    font-size: 0.55rem;
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .action-btn:hover {
                    background: var(--surface-elevated);
                    color: var(--text-primary);
                    border-color: var(--border-strong);
                }
                .action-btn-send {
                    background: var(--accent-warm-muted);
                    color: var(--accent-warm);
                    border-color: var(--accent-warm-glow);
                }
                .action-btn-send:hover {
                    background: var(--accent-warm);
                    color: #fff;
                }
                .action-btn-send:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .action-btn-stop {
                    background: rgba(244, 63, 94, 0.1);
                    color: var(--destructive);
                    border-color: rgba(244, 63, 94, 0.2);
                }
                .action-btn-active-mic {
                    background: rgba(239, 68, 68, 0.15) !important;
                    color: #ef4444 !important;
                    border-color: #ef4444 !important;
                    animation: pulse-mic 1.2s infinite;
                }
                @keyframes pulse-mic {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
                    50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                }
                .action-btn-active-convo {
                    background: rgba(16, 185, 129, 0.15) !important;
                    color: #10b981 !important;
                    border-color: #10b981 !important;
                }
            `}</style>
                </>
            )
            }
        </>
    );
}
