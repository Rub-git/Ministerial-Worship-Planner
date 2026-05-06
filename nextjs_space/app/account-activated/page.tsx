import { Suspense } from 'react';
import { AccountActivatedClient } from './account-activated-client';

export const dynamic = 'force-dynamic';

export default function AccountActivatedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <AccountActivatedClient />
    </Suspense>
  );
}
