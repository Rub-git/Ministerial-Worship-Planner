import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { EditProgramClient } from './edit-program-client';

export const dynamic = 'force-dynamic';

export default async function EditProgramPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = (session?.user as any)?.role;
  if (role !== 'ADMIN' && role !== 'EDITOR') {
    redirect('/');
  }

  const program = await prisma.program.findUnique({
    where: { id: params?.id },
    include: {
      items: {
        include: { hymnPair: true },
        orderBy: [{ block: 'asc' }, { order: 'asc' }],
      },
    },
  });

  if (!program) {
    redirect('/');
  }

  const initialData = {
    date: program?.date?.toISOString?.()?.split?.('T')?.[0] ?? '',
    type: program?.type,
    languageMode: program?.languageMode,
    coverImageUrl: program?.coverImageUrl ?? null,
    coverVerseEn: program?.coverVerseEn ?? null,
    coverVerseEs: program?.coverVerseEs ?? null,
    announcements: program?.announcements ?? null,
    items: (program?.items ?? []).map(item => ({
      sectionKey: item?.sectionKey ?? '',
      block: item?.block,
      order: item?.order ?? 0,
      textEn: item?.textEn ?? null,
      textEs: item?.textEs ?? null,
      hymnPairId: item?.hymnPairId ?? null,
      hymnPair: item?.hymnPair ?? null,
      personName: item?.personName ?? null,
    })),
  };

  return <EditProgramClient programId={params?.id} initialData={initialData} />;
}
