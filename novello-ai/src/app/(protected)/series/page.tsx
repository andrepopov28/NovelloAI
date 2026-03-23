import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import SeriesListContent from '@/components/series/SeriesListContent';

export default function SeriesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading Series Library...</div>}>
            <SeriesListContent />
        </Suspense>
    );
}
