import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import VoiceSettingsContent from '@/components/settings/VoiceSettingsContent';

export default function VoiceSettingsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading Voice Settings...</div>}>
            <VoiceSettingsContent />
        </Suspense>
    );
}
