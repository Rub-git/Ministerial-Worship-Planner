import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { HymnsClient } from './hymns-client';

export const dynamic = 'force-dynamic';

export default async function HymnsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = (session?.user as any)?.role;
  if (role !== 'ADMIN') {
    redirect('/');
  }

  return <HymnsClient />;
}
