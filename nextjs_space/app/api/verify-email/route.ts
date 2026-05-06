/**
 * =============================================================================
 * EMAIL VERIFICATION API
 * POST /api/verify-email
 * Validates verification token, activates organization, starts 30-day trial
 * =============================================================================
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification link. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified. You can log in.',
        alreadyVerified: true,
      });
    }

    // Check if token has expired (24 hours)
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      return NextResponse.json(
        { error: 'Verification link has expired. Please request a new one.', expired: true },
        { status: 400 }
      );
    }

    // Calculate trial end date (30 days from NOW - when they verify)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    // Update user and organization in a transaction
    await prisma.$transaction(async (tx) => {
      // Mark user email as verified, clear verification token
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });

      // Activate organization and start trial
      if (user.organizationId) {
        await tx.organization.update({
          where: { id: user.organizationId },
          data: {
            subscriptionStatus: 'TRIAL',
            trialEndDate: trialEndDate,
          },
        });
      }
    });

    console.log(`[VERIFY] Email verified for ${user.email}, trial started until ${trialEndDate.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Your 30-day free trial has started.',
      trialEndDate: trialEndDate.toISOString(),
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    );
  }
}
