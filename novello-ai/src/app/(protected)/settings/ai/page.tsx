import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import AISettingsContent from '@/components/settings/AISettingsContent';

export default function AISettingsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading AI Settings...</div>}>
            <AISettingsContent />
        </Suspense>
    );
}
