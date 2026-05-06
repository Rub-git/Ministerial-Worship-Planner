import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { OrganizationSettingsClient } from './organization-client';

export const dynamic = 'force-dynamic';

export default async function AdminOrganizationPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  
  if (!userId) {
    redirect('/login');
  }

  // Check if user is ADMIN
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user || user.role !== 'ADMIN') {
    redirect('/');
  }

  if (!user.organization) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">No Organization Found</h1>
          <p className="text-gray-600 mt-2">Please contact support to set up your organization.</p>
        </div>
      </div>
    );
  }

  return <OrganizationSettingsClient initialData={user.organization} />;
}
