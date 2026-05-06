import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import WeeklyProgramsClient from './weekly-programs-client';

export const dynamic = 'force-dynamic';

export default async function WeeklyProgramsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { organization: true },
  });

  if (!user?.organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No organization found</p>
      </div>
    );
  }

  // Fetch only Weekly Programs templates
  const templates = await prisma.ceremonyTemplate.findMany({
    where: {
      isActive: true,
      category: 'Weekly Programs',
    },
    include: {
      sections: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Fetch programs created from Weekly Program templates
  const programs = await prisma.ceremonyProgram.findMany({
    where: {
      organizationId: user.organizationId,
      template: {
        category: 'Weekly Programs',
      },
    },
    include: {
      template: {
        select: {
          name: true,
          category: true,
          templateId: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { date: 'desc' },
    take: 20,
  });

  // Serialize dates for client component
  const serializedPrograms = programs.map((p: typeof programs[number]) => ({
    ...p,
    date: p.date.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    variables: (p.variables || {}) as Record<string, string>,
  }));

  return (
    <WeeklyProgramsClient
      templates={templates}
      programs={serializedPrograms}
      userRole={user.role}
    />
  );
}
