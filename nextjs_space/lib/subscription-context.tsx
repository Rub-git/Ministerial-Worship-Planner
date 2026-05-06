'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useSession } from 'next-auth/react';

type SubscriptionStatus = 'PENDING_VERIFICATION' | 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

interface SubscriptionContextValue {
  status: SubscriptionStatus | null;
  trialEndDate: Date | null;
  remainingDays: number | null;
  isTrialWarning: boolean; // <= 5 days remaining
  isExpired: boolean;
  isViewOnly: boolean;
  canCreate: boolean;
  isSuperAdmin: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  status: null,
  trialEndDate: null,
  remainingDays: null,
  isTrialWarning: false,
  isExpired: false,
  isViewOnly: false,
  canCreate: true,
  isSuperAdmin: false,
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() || {};

  const value = useMemo<SubscriptionContextValue>(() => {
    const user = session?.user as any;
    
    if (!user) {
      return {
        status: null,
        trialEndDate: null,
        remainingDays: null,
        isTrialWarning: false,
        isExpired: false,
        isViewOnly: false,
        canCreate: false,
        isSuperAdmin: false,
      };
    }

    const isSuperAdmin = user.isSuperAdmin === true;
    
    // SUPER_ADMIN always has full access
    if (isSuperAdmin) {
      return {
        status: null,
        trialEndDate: null,
        remainingDays: null,
        isTrialWarning: false,
        isExpired: false,
        isViewOnly: false,
        canCreate: true,
        isSuperAdmin: true,
      };
    }

    const status = user.subscriptionStatus as SubscriptionStatus | null;
    const trialEndDateStr = user.trialEndDate as string | null;
    const trialEndDate = trialEndDateStr ? new Date(trialEndDateStr) : null;

    // Calculate remaining days for TRIAL
    let remainingDays: number | null = null;
    let isTrialWarning = false;
    let isExpired = false;

    if (status === 'TRIAL' && trialEndDate) {
      const now = new Date();
      const diffMs = trialEndDate.getTime() - now.getTime();
      remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (remainingDays <= 0) {
        isExpired = true;
        remainingDays = 0;
      } else if (remainingDays <= 5) {
        isTrialWarning = true;
      }
    }

    // Check if expired or canceled
    if (status === 'EXPIRED' || status === 'CANCELED') {
      isExpired = true;
    }

    // VIEW ONLY = expired/canceled OR trial ended
    const isViewOnly = isExpired;

    // Can create if not in VIEW ONLY mode
    const canCreate = !isViewOnly;

    return {
      status,
      trialEndDate,
      remainingDays,
      isTrialWarning,
      isExpired,
      isViewOnly,
      canCreate,
      isSuperAdmin,
    };
  }, [session]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
