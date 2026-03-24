'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Send, Trash2, StopCircle, Mic, Headphones, Upload, Minimize2, Maximize2, Volume2, VolumeX } from 'lucide-react';
import './AIChatbox.css';
import { useChat, ChatMessage } from '@/lib/hooks/useChat';
import { useVoiceInteraction } from '@/lib/hooks/useVoiceInteraction';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '@/lib/hooks/useTheme';
import type { Theme } from '@/lib/hooks/useTheme';
import { usePersonas } from '@/lib/hooks/usePersonas';

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

// ─── Theme-aware avatar mapping ──────────────────
// Maps each theme to a photorealistic portrait that matches the aesthetic.
const THEME_AVATARS: Record<Theme, string> = {
    global: '/images/avatars/global/stylist.webp',
    futuro: '/images/avatars/futuro/stylist.webp',
    play: '/images/avatars/play/bugs.png', // Fallback for play
};

const PLAY_THEME_AVATARS: Record<string, string> = {
    default: '/images/avatars/play/bugs.png',
    write: '/images/avatars/play/charlie.png',
    brainstorm: '/images/avatars/play/panther.png',
    codex: '/images/avatars/play/kermit.png',
    audiobook: '/images/avatars/play/tomjerry.png',
    publish: '/images/avatars/play/bart.png',
};

const FUTURO_THEME_AVATARS: Record<string, string> = {
    default: '/images/avatars/futuro/narrator.png',
    write: '/images/avatars/futuro/narrator.png',
    brainstorm: '/images/avatars/futuro/stylist.png',
    codex: '/images/avatars/futuro/architect.png',
    audiobook: '/images/avatars/futuro/editor.png',
    publish: '/images/avatars/futuro/strategist.png',
};

const GLOBAL_THEME_AVATARS: Record<string, string> = {
    default: '/images/avatars/global/architect.png',
    write: '/images/avatars/global/architect.png',
    brainstorm: '/images/avatars/global/stylist.png',
    codex: '/images/avatars/global/architect.png',
    audiobook: '/images/avatars/global/narrator.png',
    publish: '/images/avatars/global/strategist.png',
};

function getThemeAvatar(theme: Theme, persona: Persona): string {
    if (theme === 'play') {
        return PLAY_THEME_AVATARS[persona.key] || PLAY_THEME_AVATARS.default;
    }
    if (theme === 'futuro') {
        return FUTURO_THEME_AVATARS[persona.key] || FUTURO_THEME_AVATARS.default;
    }
    if (theme === 'global') {
        return GLOBAL_THEME_AVATARS[persona.key] || GLOBAL_THEME_AVATARS.default;
    }
    return THEME_AVATARS[theme] ?? persona.avatar;
}

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
    // Restore isOpen preference from localStorage on mount
    const [isOpen, setIsOpen] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [liveConvoMode, setLiveConvoMode] = useState(false);
    // Provider label shown in banner — read from localStorage on mount to avoid SSR mismatch
    const [resolvedProvider, setResolvedProvider] = useState<string>('OLLAMA');

    // Extract projectId from path /project/[id]
    const projectMatch = pathname.match(/\/project\/([^/]+)/);
    const projectId = projectMatch ? projectMatch[1] : undefined;

    // Get base persona definition from path
    const basePersona = getPersonaFromPath(pathname);

    // Fetch user remote persona custom settings
    const { getPersona } = usePersonas();
    const personaSettings = getPersona(basePersona.key);

    const { messages, isStreaming, sendMessage, cancelStream, clearMessages } = useChat({
        projectId,
        personaId: basePersona.key,
        systemPrompt: personaSettings.personality,
        provider: personaSettings.provider,
        model: personaSettings.model,
    });

    const voice = useVoiceInteraction();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const prevMsgCountRef = useRef(0);

    // Hydration-safe: read localStorage only on the client after mount
    useEffect(() => {
        const saved = localStorage.getItem('novello-chatbox-open');
        if (saved !== null) {
            setIsOpen(saved === 'true');
        }
        // Resolve provider label for banner
        const settings = localStorage.getItem('novello-settings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                setResolvedProvider((parsed.provider || 'ollama').toUpperCase());
            } catch { /* ignore */ }
        }
    }, []);

    // Persist chatbox open/close preference
    const handleSetIsOpen = (value: boolean) => {
        setIsOpen(value);
        localStorage.setItem('novello-chatbox-open', String(value));
    };

    const { theme } = useTheme();
    // Use base avatar since we haven't implemented avatar uploads for agents yet
    const themeAvatar = getThemeAvatar(theme, basePersona);
    const displayName = personaSettings.name || basePersona.name;

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
                voice.speakText(latestMsg.content, personaSettings.voiceId || undefined);
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
                    onClick={() => handleSetIsOpen(true)}
                    className="chatbox-fab animate-scale-in"
                    title={`Ask ${displayName}`}
                >
                    <Image
                        src={themeAvatar}
                        alt={displayName}
                        width={52}
                        height={52}
                        className="fab-avatar"
                    />
                    <span className="fab-pulse" />
                </button>
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
                            <Image src={themeAvatar} alt={displayName} width={28} height={28} className="minimized-avatar" />
                            <span className="minimized-name">{displayName}</span>
                        </div>
                        <div className="minimized-actions">
                            <button onClick={() => setIsMinimized(false)} className="minimized-btn" title="Expand">
                                <Maximize2 size={14} />
                            </button>
                            <button onClick={() => { handleSetIsOpen(false); setIsMinimized(false); }} className="minimized-btn" title="Close">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
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
                                <button className="banner-close" onClick={() => handleSetIsOpen(false)} title="Close">
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Full-width Photorealistic Persona Banner */}
                            <div className="banner-hero-wrap">
                                <Image
                                    src={themeAvatar}
                                    alt={displayName}
                                    fill
                                    className="object-cover object-[center_25%] transition-all duration-500"
                                    priority
                                />
                                {isStreaming && <div className="banner-thinking-glow" />}
                                <div className="banner-overlay-gradient" />
                            </div>

                            <div className="banner-label-glass">
                                <div className="flex flex-col">
                                    <span className="banner-agent-name">{displayName}</span>
                                    <span className="banner-agent-role">{basePersona.subtitle}</span>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    {isStreaming ? (
                                        <div className="flex items-center gap-2 text-[var(--accent-blue)]">
                                            <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
                                            <span className="text-[10px] font-bold tracking-widest uppercase">Thinking</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] tracking-widest opacity-50 uppercase font-bold">
                                            {personaSettings.provider?.toUpperCase() || resolvedProvider}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Messages ── */}
                        <div className="chatbox-messages">
                            {messages.length === 0 && !isStreaming && (
                                <div className="chatbox-empty">
                                    <p className="chatbox-empty-title">{basePersona.greeting}</p>
                                    <p className="chatbox-empty-desc">{basePersona.description}</p>
                                    <div className="chatbox-suggestions">
                                        {basePersona.suggestions.map((s) => (
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

                            {messages.map((msg) => (
                                <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
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
                                    aria-label={voice.isListening ? 'Stop listening' : 'Start voice note'}
                                    aria-pressed={voice.isListening}
                                >
                                    <Mic size={18} />
                                    <span>{voice.isListening ? 'Listening...' : 'Voice Note'}</span>
                                </button>
                                <button
                                    className={`action-btn ${liveConvoMode ? 'action-btn-active-convo' : ''}`}
                                    onClick={() => setLiveConvoMode(!liveConvoMode)}
                                    title={liveConvoMode ? 'Disable Live Conversation' : 'Enable Live Conversation'}
                                    aria-label={liveConvoMode ? 'Disable live conversation mode' : 'Enable live conversation mode'}
                                    aria-pressed={liveConvoMode}
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

                                {isStreaming ? (
                                    <button className="action-btn action-btn-stop" onClick={cancelStream} title="Stop" aria-label="Stop AI generation">
                                        <StopCircle size={18} />
                                        <span>STOP</span>
                                    </button>
                                ) : (
                                    <button
                                        className="action-btn action-btn-send"
                                        onClick={handleSend}
                                        disabled={!input.trim()}
                                        title="Send"
                                        aria-label="Send message"
                                    >
                                        <Send size={18} />
                                        <span>SEND</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )
            }
        </>
    );
}
