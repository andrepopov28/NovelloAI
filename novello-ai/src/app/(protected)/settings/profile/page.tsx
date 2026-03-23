import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import ProfileSettingsContent from '@/components/settings/ProfileSettingsContent';

export default function ProfileSettingsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading Profile Settings...</div>}>
            <ProfileSettingsContent />
        </Suspense>
    );
}
