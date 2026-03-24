import { Suspense } from 'react';
import { GhostWriterContent } from '@/components/project/GhostWriterContent';
export const dynamic = 'force-dynamic';

export default async function GhostWriterPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    return (
        <Suspense fallback={<div className="p-8">Loading Ghost Writer...</div>}>
            <GhostWriterContent projectId={projectId} />
        </Suspense>
    );
}
