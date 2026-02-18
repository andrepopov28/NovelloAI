'use client';

import { ReactNode, useEffect, useState } from 'react';
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

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // match transition duration
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-50 flex justify-end isolate">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`relative h-full bg-[var(--surface-primary)] border-l border-[var(--border)] shadow-2xl transition-transform duration-300 transform ${width} ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] rounded-full transition-colors"
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

    // Render to body
    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
}
