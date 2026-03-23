import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import ContinuityContent from '@/components/project/ContinuityContent';

export default async function ContinuityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading Continuity Checker...</div>}>
            <ContinuityContent projectId={projectId} />
        </Suspense>
    );
}
