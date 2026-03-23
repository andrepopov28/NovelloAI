import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import ThemeSettingsContent from '@/components/settings/ThemeSettingsContent';

export default function ThemeSettingsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading Theme Settings...</div>}>
            <ThemeSettingsContent />
        </Suspense>
    );
}
