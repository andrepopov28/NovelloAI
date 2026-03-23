import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import BrainstormContent from '@/components/project/BrainstormContent';

export default async function BrainstormPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading Brainstorming Studio...</div>}>
            <BrainstormContent projectId={projectId} />
        </Suspense>
    );
}
