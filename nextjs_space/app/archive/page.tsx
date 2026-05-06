import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { ArchiveClient } from './archive-client';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <ArchiveClient />;
}
