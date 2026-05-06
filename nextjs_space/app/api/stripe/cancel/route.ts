/**
 * =============================================================================
 * STRIPE CANCEL/REACTIVATE SUBSCRIPTION API
 * =============================================================================
 * Cancels subscription at period end via Stripe API
 * 
 * IMPORTANT: This endpoint ONLY calls Stripe API.
 * Status changes are handled by the webhook when Stripe confirms.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { cancelSubscription, reactivateSubscription } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Only ADMIN can cancel subscription
    if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action } = await request.json();

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!organization?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    if (action === 'cancel') {
      // Only allow cancel for ACTIVE or PAST_DUE subscriptions
      if (!['ACTIVE', 'PAST_DUE'].includes(organization.subscriptionStatus)) {
        return NextResponse.json(
          { error: 'Subscription is not active' },
          { status: 400 }
        );
      }

      // Call Stripe to set cancel_at_period_end = true
      // DO NOT update local status - webhook will handle it
      await cancelSubscription(organization.stripeSubscriptionId);

      return NextResponse.json({
        success: true,
        message: 'Cancellation requested. Status will update shortly.',
        pendingWebhook: true,
      });
    } else if (action === 'reactivate') {
      // Only allow reactivate for CANCELED subscriptions
      if (organization.subscriptionStatus !== 'CANCELED') {
        return NextResponse.json(
          { error: 'Subscription is not in canceled state' },
          { status: 400 }
        );
      }

      // Call Stripe to set cancel_at_period_end = false
      // DO NOT update local status - webhook will handle it
      await reactivateSubscription(organization.stripeSubscriptionId);

      return NextResponse.json({
        success: true,
        message: 'Reactivation requested. Status will update shortly.',
        pendingWebhook: true,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Subscription cancel error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
