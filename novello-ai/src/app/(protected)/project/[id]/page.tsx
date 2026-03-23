import { ProjectDashboardContent } from '@/components/project/ProjectDashboardContent';
import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    return (
        <Suspense fallback={<div className="p-8">Loading Project...</div>}>
            <ProjectDashboardContent projectId={projectId} />
        </Suspense>
    );
}
