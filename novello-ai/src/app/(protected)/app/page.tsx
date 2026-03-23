import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Suspense } from 'react';
export const dynamic = 'force-dynamic';


export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading Dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}

