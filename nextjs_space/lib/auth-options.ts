import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { Role, SubscriptionStatus } from '@prisma/client';

// Extend NextAuth types for multi-tenant support
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: Role;
    organizationId?: string | null;
    organizationSlug?: string | null;
    organizationName?: string | null;
    subscriptionStatus?: SubscriptionStatus | null;
    trialEndDate?: string | null;
    isSuperAdmin?: boolean;
  }
  
  interface Session {
    user: User & {
      id: string;
      role: Role;
      organizationId?: string | null;
      organizationSlug?: string | null;
      organizationName?: string | null;
      subscriptionStatus?: SubscriptionStatus | null;
      trialEndDate?: string | null;
      isSuperAdmin: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    organizationId?: string | null;
    organizationSlug?: string | null;
    organizationName?: string | null;
    subscriptionStatus?: SubscriptionStatus | null;
    trialEndDate?: string | null;
    isSuperAdmin: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Fetch user with organization data for multi-tenant context
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organization: {
              select: {
                id: true,
                slug: true,
                nameEn: true,
                subscriptionStatus: true,
                isActive: true,
                trialEndDate: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        // Check if user account is active
        if (!user.isActive) {
          throw new Error('Account is disabled');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        const isSuperAdmin = user.role === 'SUPER_ADMIN';

        // For non-SUPER_ADMIN users, validate organization and email verification
        if (!isSuperAdmin) {
          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error('EMAIL_NOT_VERIFIED');
          }

          if (!user.organization) {
            throw new Error('No organization assigned');
          }
          
          if (!user.organization.isActive) {
            throw new Error('Organization is inactive');
          }

          // Check subscription status
          const status = user.organization.subscriptionStatus;
          if (status === 'PENDING_VERIFICATION') {
            throw new Error('EMAIL_NOT_VERIFIED');
          }
          if (status === 'EXPIRED' || status === 'CANCELED') {
            throw new Error('Subscription expired');
          }
        }

        // Update last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationSlug: user.organization?.slug ?? null,
          organizationName: user.organization?.nameEn ?? null,
          subscriptionStatus: user.organization?.subscriptionStatus ?? null,
          trialEndDate: user.organization?.trialEndDate?.toISOString() ?? null,
          isSuperAdmin,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationSlug = user.organizationSlug;
        token.organizationName = user.organizationName;
        token.subscriptionStatus = user.subscriptionStatus;
        token.trialEndDate = user.trialEndDate;
        token.isSuperAdmin = user.isSuperAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.organizationSlug = token.organizationSlug;
        session.user.organizationName = token.organizationName;
        session.user.subscriptionStatus = token.subscriptionStatus;
        session.user.trialEndDate = token.trialEndDate;
        session.user.isSuperAdmin = token.isSuperAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// ============================================================================
// MULTI-TENANT HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has permission to access a specific organization
 */
export function canAccessOrganization(
  userRole: Role,
  userOrgId: string | null | undefined,
  targetOrgId: string
): boolean {
  // SUPER_ADMIN can access all organizations
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }
  
  // Other users can only access their own organization
  return userOrgId === targetOrgId;
}

/**
 * Check if user has edit permissions (ADMIN or EDITOR)
 */
export function canEdit(role: Role): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'EDITOR';
}

/**
 * Check if user has admin permissions
 */
export function isAdmin(role: Role): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

/**
 * Check if user is platform super admin
 */
export function isSuperAdmin(role: Role): boolean {
  return role === 'SUPER_ADMIN';
}
