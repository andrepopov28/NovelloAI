'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    width?: string;
}

export function Sheet({ isOpen, onClose, title, children, width = 'w-[400px]' }: SheetProps) {
    const [isVisible, setIsVisible] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<Element | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Capture currently focused element so we can restore it on close
            previousFocusRef.current = document.activeElement;
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
            // Move focus into the panel after the animation starts
            requestAnimationFrame(() => closeButtonRef.current?.focus());
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            // Restore focus to the element that triggered the panel
            if (previousFocusRef.current && previousFocusRef.current instanceof HTMLElement) {
                previousFocusRef.current.focus();
            }
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Trap keyboard focus inside the panel while open
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isVisible && !isOpen) return null;

    const content = (
        <div
            className="fixed inset-0 z-50 flex justify-end isolate"
            onKeyDown={handleKeyDown}
        >
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`relative h-full bg-[var(--surface-primary)] border-l border-[var(--border)] shadow-2xl transition-transform duration-300 transform ${width} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] rounded-full transition-colors"
                        aria-label={`Close ${title || 'panel'}`}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="h-[calc(100%-60px)] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
}
