import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import PublishContent from '@/components/project/PublishContent';

export default async function PublishPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading Publishing Studio...</div>}>
            <PublishContent projectId={projectId} />
        </Suspense>
    );
}
