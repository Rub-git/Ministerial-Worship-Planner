export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import CeremoniesClient from './ceremonies-client';

export default async function CeremoniesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const sessionUser = session.user as { id: string; email: string; organizationId?: string | null };
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true, organizationId: true },
  });

  if (!user || !user.organizationId) {
    redirect('/login');
  }

  const organizationId = user.organizationId;

  // Fetch templates - exclude Weekly Programs (they have their own page)
  const templates = await prisma.ceremonyTemplate.findMany({
    where: { 
      isActive: true,
      NOT: { category: 'Weekly Programs' },
    },
    include: {
      sections: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  // Fetch existing ceremony programs for this org - exclude Weekly Programs
  const programsRaw = await prisma.ceremonyProgram.findMany({
    where: { 
      organizationId,
      template: {
        NOT: { category: 'Weekly Programs' },
      },
    },
    include: {
      template: {
        select: { name: true, category: true, templateId: true },
      },
      createdBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { date: 'desc' },
    take: 20,
  });

  // Serialize dates for client component - only include fields needed by client
  const programs = programsRaw.map(p => ({
    id: p.id,
    date: p.date.toISOString(),
    status: p.status,
    variables: (p.variables || {}) as Record<string, string>,
    template: p.template,
    createdBy: p.createdBy,
  }));

  return <CeremoniesClient templates={templates} programs={programs} userRole={user.role} />;
}
