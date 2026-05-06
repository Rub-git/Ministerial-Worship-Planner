/**
 * =============================================================================
 * STRIPE SUBSCRIPTION STATUS API
 * =============================================================================
 * Gets current subscription status for the organization
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getSubscription } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        nameEn: true,
        subscriptionStatus: true,
        trialEndDate: true,
        subscriptionEndDate: true,
        stripeSubscriptionId: true,
        planTier: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get Stripe subscription details if exists
    let stripeDetails = null;
    if (organization.stripeSubscriptionId) {
      const subscription = await getSubscription(organization.stripeSubscriptionId) as any;
      if (subscription) {
        stripeDetails = {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        };
      }
    }

    return NextResponse.json({
      organizationName: organization.nameEn,
      subscriptionStatus: organization.subscriptionStatus,
      trialEndDate: organization.trialEndDate?.toISOString() || null,
      subscriptionEndDate: organization.subscriptionEndDate?.toISOString() || null,
      planTier: organization.planTier,
      stripe: stripeDetails,
    });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
