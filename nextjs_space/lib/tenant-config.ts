/**
 * Phase 5: Multi-Tenant Architecture (Local Church Level)
 * 
 * SCOPE: Local church organizations ONLY
 * - Users belong to ONE organization (church)
 * - Programs belong to ONE organization
 * - Global hymnal is SHARED and READ-ONLY
 * - Local churches can add tags/metadata but NOT alter core hymn data
 * 
 * ROLES: ADMIN / EDITOR / VIEWER (church-level only)
 * NO institutional hierarchy (conference/union) permissions
 * 
 * KEY PRINCIPLES:
 * 1. GLOBAL_HYMNAL = true → Uses official Adventist hymnal base (HymnPair)
 * 2. LOCAL_TAGS = allowed → Churches can add local tags/notes to hymns
 * 3. Programs, Series, Settings are organization-scoped
 * 4. Doctrinal weighting is IMMUTABLE and cannot be modified per-tenant
 * 
 * FEATURE FLAG: INSTITUTIONAL_MODE=false (default)
 * - When false: Only local church permissions (ADMIN/EDITOR/VIEWER)
 * - When true: Reserved for future conference/union governance
 */

import type { HymnCategory } from './types';

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * INSTITUTIONAL MODE (Future Expansion)
 * 
 * When false (default): Only local church level permissions
 * - ADMIN, EDITOR, VIEWER roles within a single church
 * - No conference/union governance features
 * - No institutional dashboards
 * 
 * When true (future): Enables institutional hierarchy
 * - Conference and Union level roles
 * - Multi-church oversight dashboards
 * - Reporting and analytics across churches
 * 
 * DO NOT enable until institutional features are fully implemented.
 */
export const INSTITUTIONAL_MODE = false;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ChurchRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface TenantContext {
  organizationId: string | null;
  organizationName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  timezone: string;
  isGlobalMode: boolean;     // Uses official Adventist hymnal
  
  // Informational only (NOT used for permissions when INSTITUTIONAL_MODE=false)
  conference: string | null;
  union: string | null;
}

export interface OrganizationInfo {
  id: string;
  
  // Bilingual identity
  nameEn: string;
  nameEs: string;
  mottoEn: string | null;
  mottoEs: string | null;
  
  // Address
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  timezone: string;
  
  // Branding
  logoPath: string | null;
  logoSvg: string | null;
  
  // Leadership
  seniorPastor: string | null;
  associatePastor: string | null;
  
  // Contact/Social
  websiteUrl: string | null;
  facebookUrl: string | null;
  
  // Default verses
  defaultCoverVerseEn: string | null;
  defaultCoverVerseEs: string | null;
  defaultAnnouncementVerseEn: string | null;
  defaultAnnouncementVerseEs: string | null;
  
  // Welcome message
  welcomeMessageEn: string | null;
  welcomeMessageEs: string | null;
  
  // Service schedule
  sabbathSchoolTime: string | null;
  divineServiceTime: string | null;
  youthTime: string | null;
  wednesdayTime: string | null;
  fridayTime: string | null;
  foodDistributionTime: string | null;
  
  // System
  isActive: boolean;
  
  // Informational only (reserved for INSTITUTIONAL_MODE)
  conference: string | null;
  union: string | null;
}

export interface TenantRestrictions {
  // IMMUTABLE - Adventist Safe Mode (NEVER allowed)
  canModifyDoctrine: false;
  canModifyGlobalHymns: false;
  canModifyWeighting: false;
  canAccessOtherOrgs: false;
  
  // Church-level permissions (based on role)
  canAddLocalTags: boolean;      // ADMIN/EDITOR can add local hymn tags
  canCreatePrograms: boolean;    // ADMIN/EDITOR can create programs
  canManageUsers: boolean;       // ADMIN only
  canManageSettings: boolean;    // ADMIN only
}

// ============================================================================
// CONSTANTS - IMMUTABLE ADVENTIST SAFE MODE
// ============================================================================

/**
 * GLOBAL HYMNAL MODE
 * When true (default), all organizations share the official Adventist hymnal.
 * This ensures doctrinal consistency across all congregations.
 */
export const GLOBAL_HYMNAL = true;

/**
 * ADVENTIST SAFE MODE RESTRICTIONS
 * These restrictions CANNOT be overridden by any organization or user.
 * They protect the integrity of Adventist doctrine and hymnal.
 */
export const ADVENTIST_SAFE_MODE = {
  // Doctrinal integrity - IMMUTABLE
  ALLOW_DOCTRINE_MODIFICATION: false,
  ALLOW_HYMN_ALTERATION: false,
  ALLOW_WEIGHTING_OVERRIDE: false,
  
  // Local church features
  ALLOW_LOCAL_HYMN_TAGS: true,     // Churches can add local tags/notes
  ALLOW_LOCAL_FAVORITES: true,     // Churches can mark favorite hymns
  
  // Data isolation
  ENFORCE_ORG_ISOLATION: true,     // Strict data separation
  SHARE_GLOBAL_HYMNAL: true,       // All orgs share official hymnal
} as const;

/**
 * PROTECTED DOCTRINAL CATEGORIES
 * These categories have immutable weighting in the Smart Generator.
 * No organization can modify these priorities.
 */
export const PROTECTED_DOCTRINAL_CATEGORIES: HymnCategory[] = [
  'SECOND_COMING',   // Core Adventist emphasis
  'SABBATH',         // Distinctive doctrine
  'FAITH',           // Foundational
  'SALVATION',       // Gospel-centered
  'HOPE',            // Eschatological focus
  'RESURRECTION',    // Key doctrine
];

/**
 * IMMUTABLE DOCTRINAL WEIGHTING
 * These values are protected and cannot be modified per-tenant.
 * They represent the Adventist doctrinal priorities.
 */
export const IMMUTABLE_DOCTRINAL_WEIGHTS: Partial<Record<HymnCategory, number>> = {
  SECOND_COMING: 15,
  SABBATH: 12,
  FAITH: 10,
  SALVATION: 10,
  HOPE: 8,
  RESURRECTION: 8,
  DEDICATION: 6,
  PRAYER: 6,
  PRAISE: 5,
  HOLY_SPIRIT: 5,
};

// ============================================================================
// TENANT CONTEXT FUNCTIONS
// ============================================================================

/**
 * Create a tenant context for request processing
 */
export function createTenantContext(
  organization: OrganizationInfo | null
): TenantContext {
  return {
    organizationId: organization?.id ?? null,
    organizationName: organization?.nameEn ?? null,
    city: organization?.city ?? null,
    state: organization?.state ?? null,
    country: organization?.country ?? null,
    timezone: organization?.timezone ?? 'America/Los_Angeles',
    isGlobalMode: GLOBAL_HYMNAL,
    
    // Informational only (not used for permissions)
    conference: organization?.conference ?? null,
    union: organization?.union ?? null,
  };
}

/**
 * Get restrictions for a church user
 * 
 * ROLES (church-level only):
 * - ADMIN: Full access within their church
 * - EDITOR: Can create/edit programs, add hymn tags
 * - VIEWER: Read-only access
 * 
 * Note: Core Adventist Safe Mode restrictions are ALWAYS enforced
 */
export function getTenantRestrictions(
  _tenantContext: TenantContext,
  userRole: ChurchRole
): TenantRestrictions {
  return {
    // IMMUTABLE - Never allowed (Adventist Safe Mode)
    canModifyDoctrine: false,
    canModifyGlobalHymns: false,
    canModifyWeighting: false,
    canAccessOtherOrgs: false,
    
    // Church-level permissions based on role
    canAddLocalTags: (userRole === 'ADMIN' || userRole === 'EDITOR') && ADVENTIST_SAFE_MODE.ALLOW_LOCAL_HYMN_TAGS,
    canCreatePrograms: userRole === 'ADMIN' || userRole === 'EDITOR',
    canManageUsers: userRole === 'ADMIN',
    canManageSettings: userRole === 'ADMIN',
  };
}

/**
 * Check if institutional features are enabled
 * Use this to guard any future institutional code
 */
export function isInstitutionalModeEnabled(): boolean {
  return INSTITUTIONAL_MODE;
}

// ============================================================================
// DATA ISOLATION HELPERS
// ============================================================================

/**
 * Build organization filter for Prisma queries
 * Ensures users only see their organization's data
 */
export function buildOrgFilter(organizationId: string | null | undefined): {
  organizationId?: string | null;
} {
  if (!organizationId) {
    // Legacy mode: no org filter (for migration period)
    return {};
  }
  return { organizationId };
}

/**
 * Build hymn access query
 * Returns both global hymnal AND approved local extensions for the org
 */
export function buildHymnAccessFilter(organizationId: string | null | undefined): {
  includeGlobal: true;
  localOrgId: string | null;
} {
  return {
    includeGlobal: true, // Always include official Adventist hymnal
    localOrgId: organizationId ?? null,
  };
}

/**
 * Validate that an action respects Adventist Safe Mode
 */
export function validateAdventistSafeMode(action: string): {
  allowed: boolean;
  reason: string;
} {
  const blockedActions = [
    'modify_doctrine',
    'alter_hymn',
    'change_weighting',
    'override_category_boost',
    'remove_doctrinal_priority',
  ];
  
  if (blockedActions.includes(action)) {
    return {
      allowed: false,
      reason: `Action '${action}' is blocked by Adventist Safe Mode to protect doctrinal integrity.`,
    };
  }
  
  return { allowed: true, reason: '' };
}

// ============================================================================
// ORGANIZATION HIERARCHY
// ============================================================================

/**
 * Adventist organizational structure hierarchy:
 * World Church → Division → Union → Conference → Church/Congregation
 */
export interface AdventistHierarchy {
  division?: string;     // e.g., "North American Division"
  union: string;         // e.g., "Pacific Union Conference"
  conference: string;    // e.g., "Southern California Conference"
  church: string;        // e.g., "Adelanto Spanish SDA Church"
}

/**
 * Get hierarchy display for an organization
 */
export function getOrganizationHierarchy(org: OrganizationInfo): string {
  const parts: string[] = [];
  
  if (org.union) parts.push(org.union);
  if (org.conference) parts.push(org.conference);
  parts.push(org.nameEn);
  
  return parts.join(' › ');
}

// ============================================================================
// TENANT ISOLATION MIDDLEWARE HELPER
// ============================================================================

/**
 * Verify user has access to the specified organization
 */
export function verifyOrgAccess(
  userOrgId: string | null | undefined,
  requestedOrgId: string | null | undefined
): boolean {
  // If no organization context, allow (legacy mode)
  if (!userOrgId && !requestedOrgId) return true;
  
  // If user has org, they can only access their own
  if (userOrgId && requestedOrgId) {
    return userOrgId === requestedOrgId;
  }
  
  // If user has org but resource doesn't, allow (global resource)
  if (userOrgId && !requestedOrgId) return true;
  
  // If resource has org but user doesn't, deny
  if (!userOrgId && requestedOrgId) return false;
  
  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TenantConfig = {
  // Feature flags
  INSTITUTIONAL_MODE,
  GLOBAL_HYMNAL,
  
  // Constants
  ADVENTIST_SAFE_MODE,
  PROTECTED_DOCTRINAL_CATEGORIES,
  IMMUTABLE_DOCTRINAL_WEIGHTS,
  
  // Functions
  createTenantContext,
  getTenantRestrictions,
  isInstitutionalModeEnabled,
  buildOrgFilter,
  buildHymnAccessFilter,
  validateAdventistSafeMode,
  verifyOrgAccess,
  getOrganizationHierarchy,
};

export default TenantConfig;
