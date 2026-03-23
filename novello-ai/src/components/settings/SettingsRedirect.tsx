'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/settings/profile');
    }, [router]);

    return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-warm"></div>
        </div>
    );
}
