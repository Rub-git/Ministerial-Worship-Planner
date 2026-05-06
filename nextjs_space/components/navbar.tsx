'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { Home, Archive, Settings, LogOut, User, Globe, Building2, Calendar, BarChart3, Heart, Music } from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession() || {};
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;
  const isAdmin = role === 'ADMIN';

  // Hide navbar on public pages
  if (pathname === '/landing' || pathname === '/start') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/assets/mwp-icon.svg"
              alt="MWP"
              width={28}
              height={22}
              className="w-7 h-6 sm:w-8 sm:h-6"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-mwp-blue font-bold text-sm sm:text-base whitespace-nowrap leading-tight">
                {t?.appName ?? 'Ministerial Worship Planner'}
              </span>
              <span className="text-[10px] text-gray-500 font-normal tracking-wide">
                {t?.appTagline ?? 'Structured Worship. Biblical Depth.'}
              </span>
            </div>
            <span className="sm:hidden text-mwp-blue font-bold text-sm">MWP</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {session && (
              <>
                <Link
                  href="/"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-mwp-blue/10 hover:text-mwp-blue transition-colors text-sm font-medium"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">{t?.home ?? 'Home'}</span>
                </Link>
                <Link
                  href="/archive"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-mwp-blue/10 hover:text-mwp-blue transition-colors text-sm font-medium"
                >
                  <Archive className="w-4 h-4" />
                  <span className="hidden sm:inline">{t?.archive ?? 'Archive'}</span>
                </Link>
                <Link
                  href="/weekly-programs"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-mwp-blue/10 hover:text-mwp-blue transition-colors text-sm font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === 'en' ? 'Weekly' : 'Semanales'}</span>
                </Link>
                <Link
                  href="/ceremonies"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-mwp-blue/10 hover:text-mwp-blue transition-colors text-sm font-medium"
                >
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === 'en' ? 'Ceremonies' : 'Ceremonias'}</span>
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href="/hymns"
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-mwp-blue/10 hover:text-mwp-blue transition-colors text-sm font-medium"
                    >
                      <Music className="w-4 h-4" />
                      <span className="hidden sm:inline">{t?.hymns ?? 'Hymns'}</span>
                    </Link>
                    <Link
                      href="/admin/organization"
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-mwp-blue/10 hover:text-mwp-blue transition-colors text-sm font-medium"
                    >
                      <Building2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{language === 'en' ? 'Church' : 'Iglesia'}</span>
                    </Link>
                    <Link
                      href="/admin/monthly-emphasis"
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-mwp-blue/10 hover:text-mwp-blue transition-colors text-sm font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">{language === 'en' ? 'Emphasis' : 'Énfasis'}</span>
                    </Link>
                    <Link
                      href="/admin/analytics"
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-mwp-blue/10 hover:text-mwp-blue transition-colors text-sm font-medium"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="hidden sm:inline">{language === 'en' ? 'Analytics' : 'Análisis'}</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-mwp-blue/10 hover:text-mwp-blue transition-colors text-sm font-medium"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">{t?.settings ?? 'Settings'}</span>
                    </Link>
                  </>
                )}
              </>
            )}

            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-mwp-blue/10 hover:text-mwp-blue transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              <span>{language?.toUpperCase?.() ?? 'EN'}</span>
            </button>

            {session ? (
              <div className="flex items-center gap-2">
                <span className="hidden md:flex items-center gap-1 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  {session?.user?.email ?? ''}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-mwp-blue text-white hover:bg-mwp-blue/90 transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t?.logout ?? 'Logout'}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-mwp-blue text-white hover:bg-mwp-blue/90 transition-colors text-sm font-medium"
              >
                {t?.login ?? 'Login'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
