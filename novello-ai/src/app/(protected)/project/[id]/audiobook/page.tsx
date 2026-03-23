import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import AudiobookContent from '@/components/audiobook/AudiobookContent';

export default async function AudiobookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading Audiobook Studio...</div>}>
            <AudiobookContent projectId={projectId} />
        </Suspense>
    );
}
