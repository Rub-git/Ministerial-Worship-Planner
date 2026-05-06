'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';
import { LanguageProvider } from '@/lib/language-context';
import { SubscriptionProvider } from '@/lib/subscription-context';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <SessionProvider>
      <SubscriptionProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </SubscriptionProvider>
    </SessionProvider>
  );
}
