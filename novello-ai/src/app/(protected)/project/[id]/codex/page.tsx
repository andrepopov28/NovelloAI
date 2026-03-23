import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import CodexContent from '@/components/project/CodexContent';

export default async function CodexPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-tertiary)]">Loading World Bible...</div>}>
            <CodexContent projectId={projectId} />
        </Suspense>
    );
}
