/**
 * =============================================================================
 * MULTI-TENANT SECURITY HELPERS
 * =============================================================================
 * Centralized functions for tenant isolation and access control
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import { prisma } from './db';
import { NextResponse } from 'next/server';

export interface TenantContext {
  userId: string;
  userRole: string;
  organizationId: string | null;
  isSuperAdmin: boolean;
}

/**
 * Get tenant context from session
 * Returns null if not authenticated
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = session.user as any;
  return {
    userId: user.id,
    userRole: user.role || 'VIEWER',
    organizationId: user.organizationId || null,
    isSuperAdmin: user.role === 'SUPER_ADMIN',
  };
}

/**
 * Verify that the user can access a specific organization's data
 */
export function canAccessOrganization(
  ctx: TenantContext,
  targetOrgId: string | null
): boolean {
  // SUPER_ADMIN can access all organizations
  if (ctx.isSuperAdmin) return true;
  
  // Regular users can only access their own organization
  if (!ctx.organizationId || !targetOrgId) return false;
  return ctx.organizationId === targetOrgId;
}

/**
 * Verify user has edit permissions (SUPER_ADMIN, ADMIN, or EDITOR)
 */
export function canEdit(ctx: TenantContext): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(ctx.userRole);
}

/**
 * Verify user has admin permissions (SUPER_ADMIN or ADMIN)
 */
export function isAdmin(ctx: TenantContext): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(ctx.userRole);
}

/**
 * Get organizationId filter for Prisma queries
 * SUPER_ADMIN gets no filter (access to all)
 * Regular users get their organizationId filter
 */
export function getOrgFilter(ctx: TenantContext): { organizationId?: string } | {} {
  if (ctx.isSuperAdmin) return {};
  if (!ctx.organizationId) return { organizationId: '__NONE__' }; // Match nothing
  return { organizationId: ctx.organizationId };
}

/**
 * Verify program belongs to user's organization
 */
export async function verifyProgramAccess(
  programId: string,
  ctx: TenantContext
): Promise<{ allowed: boolean; program?: any; error?: string }> {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      items: { include: { hymnPair: true }, orderBy: [{ block: 'asc' }, { order: 'asc' }] },
      organization: true,
    },
  });

  if (!program) {
    return { allowed: false, error: 'Program not found' };
  }

  if (!canAccessOrganization(ctx, program.organizationId)) {
    return { allowed: false, error: 'Access denied to this program' };
  }

  return { allowed: true, program };
}

/**
 * Verify series belongs to user's organization
 */
export async function verifySeriesAccess(
  seriesId: string,
  ctx: TenantContext
): Promise<{ allowed: boolean; series?: any; error?: string }> {
  const series = await prisma.sermonSeries.findUnique({
    where: { id: seriesId },
  });

  if (!series) {
    return { allowed: false, error: 'Series not found' };
  }

  if (!canAccessOrganization(ctx, series.organizationId)) {
    return { allowed: false, error: 'Access denied to this series' };
  }

  return { allowed: true, series };
}

/**
 * Verify ceremony program belongs to user's organization
 */
export async function verifyCeremonyProgramAccess(
  programId: string,
  ctx: TenantContext
): Promise<{ allowed: boolean; program?: any; error?: string }> {
  const program = await prisma.ceremonyProgram.findUnique({
    where: { id: programId },
    include: {
      template: { include: { sections: { orderBy: { order: 'asc' } } } },
      organization: true,
    },
  });

  if (!program) {
    return { allowed: false, error: 'Program not found' };
  }

  if (!canAccessOrganization(ctx, program.organizationId)) {
    return { allowed: false, error: 'Access denied to this ceremony program' };
  }

  return { allowed: true, program };
}

// Grace period for PAST_DUE status (5 days)
const PAST_DUE_GRACE_PERIOD_DAYS = 5;

/**
 * Check subscription status - returns true if org can create new content
 * VIEW ONLY mode (expired/canceled) returns false
 * 
 * Access Logic:
 * - TRIAL: Full access until trialEndDate
 * - ACTIVE: Full access
 * - PAST_DUE: Full access for 5-day grace period, then EXPIRED
 * - CANCELED: Full access until subscriptionEndDate, then EXPIRED
 * - EXPIRED: View-only mode
 */
export async function canCreateContent(ctx: TenantContext): Promise<boolean> {
  // SUPER_ADMIN can always create
  if (ctx.isSuperAdmin) return true;

  if (!ctx.organizationId) return false;

  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { 
      subscriptionStatus: true, 
      trialEndDate: true,
      subscriptionEndDate: true,
    },
  });

  if (!org) return false;

  const now = new Date();

  // TRIAL: Full access until trialEndDate
  if (org.subscriptionStatus === 'TRIAL') {
    if (org.trialEndDate && new Date(org.trialEndDate) < now) {
      // Trial expired - should be marked as EXPIRED
      await prisma.organization.update({
        where: { id: ctx.organizationId },
        data: { subscriptionStatus: 'EXPIRED' },
      });
      return false;
    }
    return true;
  }

  // ACTIVE: Full access
  if (org.subscriptionStatus === 'ACTIVE') return true;

  // PAST_DUE: 5-day grace period
  if (org.subscriptionStatus === 'PAST_DUE') {
    // Grace period: subscriptionEndDate + 5 days
    if (org.subscriptionEndDate) {
      const graceDeadline = new Date(org.subscriptionEndDate);
      graceDeadline.setDate(graceDeadline.getDate() + PAST_DUE_GRACE_PERIOD_DAYS);
      
      if (now > graceDeadline) {
        // Grace period expired - mark as EXPIRED
        await prisma.organization.update({
          where: { id: ctx.organizationId },
          data: { subscriptionStatus: 'EXPIRED' },
        });
        return false;
      }
    }
    return true; // Still in grace period
  }

  // CANCELED: Full access until subscriptionEndDate
  if (org.subscriptionStatus === 'CANCELED') {
    if (org.subscriptionEndDate && new Date(org.subscriptionEndDate) > now) {
      return true; // Still within paid period
    }
    // Period ended - mark as EXPIRED
    await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: { subscriptionStatus: 'EXPIRED' },
    });
    return false;
  }

  // EXPIRED, PENDING_VERIFICATION = VIEW ONLY
  return false;
}

/**
 * Get subscription access details for UI display
 */
export async function getSubscriptionAccess(organizationId: string): Promise<{
  canCreate: boolean;
  status: string;
  daysRemaining: number | null;
  message: string;
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { 
      subscriptionStatus: true, 
      trialEndDate: true,
      subscriptionEndDate: true,
    },
  });

  if (!org) {
    return { canCreate: false, status: 'UNKNOWN', daysRemaining: null, message: 'Organization not found' };
  }

  const now = new Date();
  const status = org.subscriptionStatus;

  switch (status) {
    case 'ACTIVE':
      return { canCreate: true, status, daysRemaining: null, message: 'Active subscription' };
    
    case 'TRIAL': {
      if (org.trialEndDate) {
        const days = Math.ceil((new Date(org.trialEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 0) {
          return { canCreate: false, status: 'EXPIRED', daysRemaining: 0, message: 'Trial expired' };
        }
        return { canCreate: true, status, daysRemaining: days, message: `${days} days remaining in trial` };
      }
      return { canCreate: true, status, daysRemaining: null, message: 'Trial active' };
    }
    
    case 'PAST_DUE': {
      if (org.subscriptionEndDate) {
        const graceDeadline = new Date(org.subscriptionEndDate);
        graceDeadline.setDate(graceDeadline.getDate() + PAST_DUE_GRACE_PERIOD_DAYS);
        const days = Math.ceil((graceDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 0) {
          return { canCreate: false, status: 'EXPIRED', daysRemaining: 0, message: 'Grace period expired' };
        }
        return { canCreate: true, status, daysRemaining: days, message: `Payment failed - ${days} days to resolve` };
      }
      return { canCreate: true, status, daysRemaining: PAST_DUE_GRACE_PERIOD_DAYS, message: 'Payment failed - please update billing' };
    }
    
    case 'CANCELED': {
      if (org.subscriptionEndDate && new Date(org.subscriptionEndDate) > now) {
        const days = Math.ceil((new Date(org.subscriptionEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { canCreate: true, status, daysRemaining: days, message: `Access until subscription ends (${days} days)` };
      }
      return { canCreate: false, status: 'EXPIRED', daysRemaining: 0, message: 'Subscription ended' };
    }
    
    case 'EXPIRED':
      return { canCreate: false, status, daysRemaining: 0, message: 'Subscription expired - view only mode' };
    
    case 'PENDING_VERIFICATION':
      return { canCreate: false, status, daysRemaining: null, message: 'Please verify your email to start your trial' };
    
    default:
      return { canCreate: false, status, daysRemaining: null, message: 'Unknown status' };
  }
}

/**
 * Standard error response for unauthorized access
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Standard error response for forbidden access (wrong org)
 */
export function forbiddenResponse(message = 'Access denied'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Standard error response for VIEW ONLY mode
 */
export function viewOnlyResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Subscription expired - view only mode. Please renew to create new content.' },
    { status: 403 }
  );
}
