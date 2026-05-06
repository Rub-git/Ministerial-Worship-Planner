export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import CeremonyProgramClient from './ceremony-program-client';

export default async function CeremonyProgramPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const sessionUser = session.user as { id: string; email: string };
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true, organizationId: true },
  });

  if (!user) {
    redirect('/login');
  }

  const program = await prisma.ceremonyProgram.findUnique({
    where: { id: params.id },
    include: {
      template: {
        include: {
          sections: {
            orderBy: { order: 'asc' },
          },
        },
      },
      organization: {
        select: { nameEn: true, nameEs: true },
      },
      createdBy: {
        select: { name: true, email: true },
      },
    },
  });

  if (!program) {
    redirect('/ceremonies');
  }

  // Serialize for client component
  const serializedProgram = {
    ...program,
    date: program.date.toISOString(),
    variables: program.variables as Record<string, string>,
    sectionOverrides: program.sectionOverrides as any[],
  };

  return <CeremonyProgramClient program={serializedProgram} userRole={user.role} />;
}
