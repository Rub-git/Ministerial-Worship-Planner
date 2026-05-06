/**
 * =============================================================================
 * RESEND VERIFICATION EMAIL API
 * POST /api/resend-verification
 * Generates new verification token and sends verification email
 * =============================================================================
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateVerificationToken, getTokenExpiry, sendVerificationEmail } from '@/lib/email-verification';

export const dynamic = 'force-dynamic';

// Rate limiting: minimum 60 seconds between resend requests per email
const RESEND_COOLDOWN_SECONDS = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organization: true,
      },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'This email has already been verified. You can log in.',
        alreadyVerified: true,
      });
    }

    // Check cooldown - prevent spam
    if (user.emailVerificationExpires) {
      const lastSent = new Date(user.emailVerificationExpires.getTime() - (24 * 60 * 60 * 1000)); // token expiry - 24h = sent time
      const timeSinceLastSent = (Date.now() - lastSent.getTime()) / 1000;
      
      if (timeSinceLastSent < RESEND_COOLDOWN_SECONDS) {
        const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceLastSent);
        return NextResponse.json(
          { error: `Please wait ${waitTime} seconds before requesting another verification email.` },
          { status: 429 }
        );
      }
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: tokenExpiry,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(
      user.email,
      user.name || 'User',
      verificationToken,
      user.organization?.nameEn || ''
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    console.log(`[RESEND] Verification email resent to ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.',
    });

  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email. Please try again.' },
      { status: 500 }
    );
  }
}
