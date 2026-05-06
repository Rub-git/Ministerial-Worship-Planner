'use client';

import { usePathname } from 'next/navigation';

// Pages that use full-width layout
const FULL_WIDTH_PAGES = ['/landing', '/start'];

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Full width pages with no padding (have their own layout)
  if (FULL_WIDTH_PAGES.includes(pathname)) {
    return <main className="flex-1">{children}</main>;
  }

  // Regular pages use constrained width
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1">
      {children}
    </main>
  );
}
