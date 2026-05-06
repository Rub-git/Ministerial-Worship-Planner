/**
 * =============================================================================
 * PHASE 7: ADMIN ANALYTICS DASHBOARD
 * /admin/analytics
 * =============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import AnalyticsDashboardClient from './analytics-client';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check admin role
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { role: true, organizationId: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/');
  }

  if (!user.organizationId) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground">No Organization Found</h1>
          <p className="text-muted-foreground mt-2">
            Please contact your administrator to associate your account with an organization.
          </p>
        </div>
      </div>
    );
  }

  return <AnalyticsDashboardClient />;
}
