import { ProjectSettingsContent } from '@/components/project/ProjectSettingsContent';
import { Suspense } from 'react';

export const dynamic = "force-dynamic";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    return (
        <Suspense fallback={<div className="p-8">Loading Settings...</div>}>
            <ProjectSettingsContent projectId={projectId} />
        </Suspense>
    );
}
