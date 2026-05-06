/**
 * =============================================================================
 * ORGANIZATION ONBOARDING API
 * POST /api/onboarding/organization
 * Creates a new organization with PENDING_VERIFICATION status
 * Sends email verification link - trial starts after verification
 * Sets up template access based on denomination
 * Includes anti-bot protection (honeypot + timing validation)
 * =============================================================================
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { mapDenominationToEnum, setupTemplatesForOrganization } from '@/lib/template-library';
import { generateVerificationToken, getTokenExpiry, sendVerificationEmail } from '@/lib/email-verification';

export const dynamic = 'force-dynamic';

// Minimum time (in ms) a human would need to fill the form (3 seconds)
const MIN_FORM_TIME_MS = 3000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      // Organization details
      organizationName,
      organizationNameEs,
      denomination,
      customDenomination,
      slug,
      // Admin user details
      adminEmail,
      adminPassword,
      adminName,
      // Anti-bot fields
      _hp, // Honeypot field - should be empty
      _ts, // Form start timestamp
    } = body;

    // ==========================================================================
    // Anti-bot Protection
    // ==========================================================================
    
    // 1. Honeypot check: If the hidden field was filled, it's likely a bot
    if (_hp && _hp.trim() !== '') {
      console.log('[ANTI-BOT] Honeypot field filled - blocking registration');
      // Return generic error to not reveal the protection mechanism
      return NextResponse.json(
        { error: 'Registration failed. Please try again.' },
        { status: 400 }
      );
    }

    // 2. Timing check: If form was submitted too quickly, it's likely a bot
    if (_ts) {
      const timeSpent = Date.now() - _ts;
      if (timeSpent < MIN_FORM_TIME_MS) {
        console.log(`[ANTI-BOT] Form submitted too quickly (${timeSpent}ms) - blocking registration`);
        return NextResponse.json(
          { error: 'Please take a moment to fill out the form correctly.' },
          { status: 400 }
        );
      }
    }

    // ==========================================================================
    // Standard Validation
    // ==========================================================================

    // Validation
    if (!organizationName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Organization name, admin email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (adminPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate slug from organization name if not provided
    const orgSlug = slug || organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });
    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this name/slug already exists' },
        { status: 409 }
      );
    }

    // Generate verification token and expiry (24 hours)
    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create organization and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization with PENDING_VERIFICATION status (trial NOT started yet)
      const organization = await tx.organization.create({
        data: {
          nameEn: organizationName,
          nameEs: organizationNameEs || null,
          denomination: denomination || 'OTHER',
          customDenomination: denomination === 'OTHER' ? (customDenomination || null) : null,
          slug: orgSlug,
          primaryLanguage: 'both',
          subscriptionStatus: 'PENDING_VERIFICATION', // Trial starts after email verification
          trialEndDate: null, // Will be set when email is verified
          planTier: 'free',
          isActive: true,
        },
      });

      // Create admin user with verification token
      const adminUser = await tx.user.create({
        data: {
          email: adminEmail.toLowerCase(),
          password: hashedPassword,
          name: adminName || 'Administrator',
          role: 'ADMIN',
          organizationId: organization.id,
          isActive: true,
          emailVerified: null, // Not verified yet
          emailVerificationToken: verificationToken,
          emailVerificationExpires: tokenExpiry,
        },
      });

      // Create default organization settings
      await tx.organizationSetting.createMany({
        data: [
          {
            organizationId: organization.id,
            key: 'church_name',
            valueEn: organizationName,
            valueEs: organizationNameEs || organizationName,
          },
          {
            organizationId: organization.id,
            key: 'pdf_footer_quote',
            valueEn: 'Come, let us worship the Lord.',
            valueEs: 'Venid, adoremos al Señor.',
          },
        ],
      });

      return { organization, adminUser };
    });

    // Setup template access based on denomination
    const denominationEnum = mapDenominationToEnum(denomination || 'Christian');
    await setupTemplatesForOrganization(
      result.organization.id,
      denominationEnum
    );

    // Send verification email
    const emailSent = await sendVerificationEmail(
      result.adminUser.email,
      result.adminUser.name || 'Administrator',
      verificationToken,
      organizationName
    );

    // Return success - user must verify email before logging in
    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Account created! Please check your email to verify your account and activate your 30-day free trial.'
        : 'Account created, but we had trouble sending the verification email. Please try resending it from the login page.',
      emailSent,
      requiresVerification: true,
      organization: {
        id: result.organization.id,
        name: result.organization.nameEn,
        slug: result.organization.slug,
        subscriptionStatus: result.organization.subscriptionStatus,
      },
      user: {
        email: result.adminUser.email,
        name: result.adminUser.name,
        role: result.adminUser.role,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization. Please try again.' },
      { status: 500 }
    );
  }
}
