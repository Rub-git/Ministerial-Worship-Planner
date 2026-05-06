'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSubscription } from '@/lib/subscription-context';
import { useLanguage } from '@/lib/language-context';
import { AlertTriangle, Clock, Lock, CreditCard } from 'lucide-react';
import Link from 'next/link';

// Pages where the banner should NOT show
const PUBLIC_PAGES = ['/landing', '/login', '/register', '/signup', '/start', '/subscription', '/verify-email', '/account-activated'];

export function TrialBanner() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const { status, remainingDays, isTrialWarning, isExpired, isViewOnly, isSuperAdmin } = useSubscription();
  const { language } = useLanguage();

  // Don't show on public pages
  if (PUBLIC_PAGES.includes(pathname)) return null;

  // Don't show if not logged in
  if (!session?.user) return null;

  // Don't show banner for SUPER_ADMIN
  if (isSuperAdmin) return null;

  // Don't show banner if no status or ACTIVE subscription
  if (!status || status === 'ACTIVE') return null;

  // PAST_DUE - Payment failed warning
  if (status === 'PAST_DUE') {
    return (
      <div className="bg-yellow-500 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            {language === 'en' 
              ? 'Payment failed. Please update your billing information to avoid service interruption.'
              : 'Pago fallido. Actualiza tu informaci\u00f3n de facturaci\u00f3n para evitar interrupci\u00f3n del servicio.'}
          </p>
          <Link 
            href="/subscription"
            className="ml-4 bg-white text-yellow-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-yellow-50 transition-colors"
          >
            {language === 'en' ? 'Update Billing' : 'Actualizar Pago'}
          </Link>
        </div>
      </div>
    );
  }

  // VIEW ONLY MODE (Expired/Canceled)
  if (isViewOnly) {
    return (
      <div className="bg-gray-700 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            {language === 'en' 
              ? 'You are currently in View-Only mode. Subscribe to create new programs.'
              : 'Est\u00e1s en modo Solo Lectura. Suscr\u00edbete para crear nuevos programas.'}
          </p>
          <Link 
            href="/subscription"
            className="ml-4 bg-[#C9A227] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#B8911F] transition-colors flex items-center gap-1"
          >
            <CreditCard className="w-4 h-4" />
            {language === 'en' ? 'Subscribe' : 'Suscribirse'}
          </Link>
        </div>
      </div>
    );
  }

  // CANCELED but still has access
  if (status === 'CANCELED') {
    return (
      <div className="bg-orange-500 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            {language === 'en' 
              ? 'Your subscription is canceled. Access continues until the end of your billing period.'
              : 'Tu suscripci\u00f3n est\u00e1 cancelada. El acceso contin\u00faa hasta el final del per\u00edodo de facturaci\u00f3n.'}
          </p>
          <Link 
            href="/subscription"
            className="ml-4 bg-white text-orange-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-orange-50 transition-colors"
          >
            {language === 'en' ? 'Reactivate' : 'Reactivar'}
          </Link>
        </div>
      </div>
    );
  }

  // TRIAL MODE
  if (status === 'TRIAL' && remainingDays !== null) {
    // Warning style (5 days or less)
    if (isTrialWarning) {
      return (
        <div className="bg-[#C9A227] text-[#1E3A8A] px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold">
              {language === 'en' 
                ? `Trial ends in ${remainingDays} day${remainingDays !== 1 ? 's' : ''}! Subscribe to continue creating programs.`
                : `\u00a1La prueba termina en ${remainingDays} d\u00eda${remainingDays !== 1 ? 's' : ''}! Suscr\u00edbete para seguir creando programas.`}
            </p>
            <Link 
              href="/subscription"
              className="ml-4 bg-[#1E3A8A] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#152d6b] transition-colors flex items-center gap-1"
            >
              <CreditCard className="w-4 h-4" />
              {language === 'en' ? 'Subscribe Now' : 'Suscribirse'}
            </Link>
          </div>
        </div>
      );
    }

    // Normal trial banner with upgrade option
    return (
      <div className="bg-[#1E3A8A] text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
          <Clock className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            {language === 'en' 
              ? `Free Trial: ${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`
              : `Prueba Gratuita: ${remainingDays} d\u00eda${remainingDays !== 1 ? 's' : ''} restante${remainingDays !== 1 ? 's' : ''}`}
          </p>
          <Link 
            href="/subscription"
            className="ml-4 bg-[#C9A227] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#B8911F] transition-colors"
          >
            {language === 'en' ? 'Upgrade' : 'Mejorar'}
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
