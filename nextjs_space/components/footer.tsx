'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';

export function Footer() {
  const { language } = useLanguage();
  const pathname = usePathname();

  // Hide footer on public pages (they have their own layout)
  if (pathname === '/landing' || pathname === '/start') {
    return null;
  }

  return (
    <footer className="bg-mwp-gray border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/mwp-icon.svg"
              alt="MWP"
              width={20}
              height={16}
              className="w-5 h-4"
            />
            <p className="text-sm text-mwp-blue font-medium">
              © 2026 Ministerial Worship Planner
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {language === 'en'
              ? 'Structured Worship. Biblical Depth.'
              : 'Culto Estructurado. Profundidad Bíblica.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
