/**
 * MINISTERIAL WORSHIP PLANNER - Multi-Tenant Data Isolation
 * 
 * This module provides utilities for tenant-scoped database operations.
 * All queries should use these helpers to ensure proper data isolation.
 */

import { getServerSession } from 'next-auth';
import { authOptions, canAccessOrganization } from './auth-options';
import { prisma } from './db';
import { Role, SubscriptionStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

export interface TenantContext {
  userId: string;
  userRole: Role;
  organizationId: string | null;
  organizationSlug: string | null;
  isSuperAdmin: boolean;
  subscriptionStatus: SubscriptionStatus | null;
}

export interface TenantValidationResult {
  valid: boolean;
  context?: TenantContext;
  error?: string;
  status?: number;
}

// ============================================================================
// TENANT CONTEXT RETRIEVAL
// ============================================================================

/**
 * Get the current tenant context from the session.
 * Returns null if not authenticated.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }
  
  return {
    userId: session.user.id,
    userRole: session.user.role,
    organizationId: session.user.organizationId ?? null,
    organizationSlug: session.user.organizationSlug ?? null,
    isSuperAdmin: session.user.isSuperAdmin,
    subscriptionStatus: session.user.subscriptionStatus ?? null,
  };
}

/**
 * Validate tenant context and return appropriate error response if invalid.
 * Use this at the start of API routes.
 */
export async function validateTenantAccess(
  requireOrganization: boolean = true
): Promise<TenantValidationResult> {
  const context = await getTenantContext();
  
  if (!context) {
    return {
      valid: false,
      error: 'Unauthorized',
      status: 401,
    };
  }
  
  // SUPER_ADMIN doesn't need organization
  if (requireOrganization && !context.isSuperAdmin && !context.organizationId) {
    return {
      valid: false,
      error: 'No organization assigned',
      status: 403,
    };
  }
  
  // Check subscription for non-SUPER_ADMIN
  if (!context.isSuperAdmin) {
    const status = context.subscriptionStatus;
    if (status === 'EXPIRED' || status === 'CANCELED') {
      return {
        valid: false,
        error: 'Subscription expired',
        status: 403,
      };
    }
  }
  
  return {
    valid: true,
    context,
  };
}

/**
 * Get error response for invalid tenant access
 */
export function tenantErrorResponse(result: TenantValidationResult): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.status || 403 }
  );
}

// ============================================================================
// TENANT-SCOPED QUERIES
// ============================================================================

/**
 * Build a where clause that includes organization filter.
 * For SUPER_ADMIN with no specific org, returns undefined (no filter).
 * For regular users, filters by their organization.
 */
export function buildOrgWhereClause(
  context: TenantContext,
  targetOrgId?: string
): { organizationId: string } | undefined {
  // If specific org requested, validate access
  if (targetOrgId) {
    if (!canAccessOrganization(context.userRole, context.organizationId, targetOrgId)) {
      throw new Error('Access denied to organization');
    }
    return { organizationId: targetOrgId };
  }
  
  // SUPER_ADMIN without specific org can see all
  if (context.isSuperAdmin) {
    return undefined;
  }
  
  // Regular users only see their org
  if (!context.organizationId) {
    throw new Error('No organization context');
  }
  
  return { organizationId: context.organizationId };
}

/**
 * Get organization ID for creating new records.
 * SUPER_ADMIN must specify org, regular users use their own.
 */
export function getOrgIdForCreate(
  context: TenantContext,
  targetOrgId?: string
): string {
  if (targetOrgId) {
    if (!canAccessOrganization(context.userRole, context.organizationId, targetOrgId)) {
      throw new Error('Access denied to organization');
    }
    return targetOrgId;
  }
  
  if (context.isSuperAdmin) {
    throw new Error('SUPER_ADMIN must specify organization');
  }
  
  if (!context.organizationId) {
    throw new Error('No organization context');
  }
  
  return context.organizationId;
}

// ============================================================================
// SUBSCRIPTION HELPERS
// ============================================================================

/**
 * Check if organization has active subscription
 */
export async function hasActiveSubscription(organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { subscriptionStatus: true, trialEndDate: true },
  });
  
  if (!org) return false;
  
  const status = org.subscriptionStatus;
  
  // Active or past due (grace period) are OK
  if (status === 'ACTIVE' || status === 'PAST_DUE') {
    return true;
  }
  
  // Trial is OK if not expired
  if (status === 'TRIAL') {
    if (!org.trialEndDate) return true;
    return new Date() < org.trialEndDate;
  }
  
  return false;
}

/**
 * Get remaining trial days for an organization
 */
export async function getTrialDaysRemaining(organizationId: string): Promise<number | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { subscriptionStatus: true, trialEndDate: true },
  });
  
  if (!org || org.subscriptionStatus !== 'TRIAL' || !org.trialEndDate) {
    return null;
  }
  
  const now = new Date();
  const end = new Date(org.trialEndDate);
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

// ============================================================================
// ROLE-BASED ACCESS HELPERS
// ============================================================================

/**
 * Check if user can perform admin actions in their organization
 */
export function canPerformAdminAction(context: TenantContext): boolean {
  return context.isSuperAdmin || context.userRole === 'ADMIN';
}

/**
 * Check if user can create/edit content
 */
export function canCreateContent(context: TenantContext): boolean {
  return (
    context.isSuperAdmin ||
    context.userRole === 'ADMIN' ||
    context.userRole === 'EDITOR'
  );
}

/**
 * Check if user can manage users in their organization
 */
export function canManageUsers(context: TenantContext): boolean {
  return context.isSuperAdmin || context.userRole === 'ADMIN';
}

/**
 * Check if user can access platform admin features
 */
export function canAccessPlatformAdmin(context: TenantContext): boolean {
  return context.isSuperAdmin;
}

// ============================================================================
// ORGANIZATION LOOKUP HELPERS
// ============================================================================

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameEs: true,
      denomination: true,
      logoPath: true,
      primaryColor: true,
      subscriptionStatus: true,
      isActive: true,
    },
  });
}

/**
 * Get organization with full details (for admin)
 */
export async function getOrganizationFull(id: string, context: TenantContext) {
  if (!canAccessOrganization(context.userRole, context.organizationId, id)) {
    throw new Error('Access denied');
  }
  
  return prisma.organization.findUnique({
    where: { id },
  });
}

/**
 * List all organizations (SUPER_ADMIN only)
 */
export async function listAllOrganizations(context: TenantContext) {
  if (!context.isSuperAdmin) {
    throw new Error('Access denied - SUPER_ADMIN only');
  }
  
  return prisma.organization.findMany({
    select: {
      id: true,
      slug: true,
      nameEn: true,
      denomination: true,
      subscriptionStatus: true,
      planTier: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          programs: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
