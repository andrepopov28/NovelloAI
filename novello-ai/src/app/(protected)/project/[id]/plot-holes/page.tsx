import { Suspense } from 'react';
import { PlotHoleContent } from '@/components/project/PlotHoleContent';
export const dynamic = 'force-dynamic';

export default async function PlotHolePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    return (
        <Suspense fallback={<div className="p-8">Loading Plot Hole Detector...</div>}>
            <PlotHoleContent projectId={projectId} />
        </Suspense>
    );
}
