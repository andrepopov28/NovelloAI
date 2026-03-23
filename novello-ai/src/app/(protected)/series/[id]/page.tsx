import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import SeriesDetailContent from '@/components/series/SeriesDetailContent';

interface SeriesDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
    const { id } = await params;

    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading Series Details...</div>}>
            <SeriesDetailContent id={id} />
        </Suspense>
    );
}
