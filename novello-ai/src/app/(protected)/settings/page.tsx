import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import SettingsRedirect from '@/components/settings/SettingsRedirect';

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="p-20 flex items-center justify-center animate-spin rounded-full h-8 w-8 border-b-2 border-accent-warm"></div>}>
            <SettingsRedirect />
        </Suspense>
    );
}
