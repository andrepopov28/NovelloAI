import { Suspense } from 'react';
import { BoardContent } from '@/components/project/BoardContent';
export const dynamic = 'force-dynamic';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    return (
        <Suspense fallback={<div className="p-8">Loading Board...</div>}>
            <BoardContent projectId={projectId} />
        </Suspense>
    );
}
