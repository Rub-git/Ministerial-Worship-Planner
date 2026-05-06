export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import MonthlyEmphasisClient from './monthly-emphasis-client';

export default async function MonthlyEmphasisPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = (session?.user as any)?.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/');
  }

  if (!user?.organizationId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">No organization found. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  return <MonthlyEmphasisClient />;
}
