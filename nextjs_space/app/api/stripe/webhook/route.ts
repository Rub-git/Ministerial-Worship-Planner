/**
 * =============================================================================
 * STRIPE WEBHOOK HANDLER
 * =============================================================================
 * Handles Stripe webhook events for subscription management
 * 
 * IMPORTANT: This is the ONLY source of truth for subscription activation.
 * Never activate/cancel subscriptions from redirects or API calls directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, PAST_DUE_GRACE_PERIOD_DAYS } from '@/lib/stripe';
import { prisma } from '@/lib/db';

// Disable body parsing - Stripe needs raw body
export const dynamic = 'force-dynamic';

/**
 * Handle invoice.paid event
 * Activates subscription and sets end date
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId = invoiceData.subscription as string;
  if (!subscriptionId) {
    console.log('Invoice paid but no subscription ID');
    return;
  }

  // Get subscription to find organization
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error('No organizationId in subscription metadata:', subscriptionId);
    return;
  }

  // Update organization status to ACTIVE
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionStatus: 'ACTIVE',
      stripeSubscriptionId: subscriptionId,
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      planTier: 'church',
    },
  });

  console.log(`✅ Subscription activated for org: ${organizationId}`);
}

/**
 * Handle invoice.payment_failed event
 * Sets status to PAST_DUE (5-day grace period)
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId = invoiceData.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error('No organizationId in subscription metadata:', subscriptionId);
    return;
  }

  // Update to PAST_DUE - grace period starts
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  });

  console.log(`⚠️ Payment failed for org: ${organizationId} - PAST_DUE grace period started`);
}

/**
 * Handle customer.subscription.updated event
 * Handles cancel_at_period_end changes
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subData = subscription as any;
  const organizationId = subData.metadata?.organizationId;

  if (!organizationId) {
    console.error('No organizationId in subscription metadata:', subData.id);
    return;
  }

  // Check if subscription is set to cancel at period end
  if (subData.cancel_at_period_end === true) {
    // User requested cancellation - set to CANCELED but keep access until period end
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionStatus: 'CANCELED',
        subscriptionEndDate: new Date(subData.current_period_end * 1000),
      },
    });
    console.log(`🔄 Subscription set to cancel at period end for org: ${organizationId}`);
  } else if (subData.cancel_at_period_end === false && subData.status === 'active') {
    // User reactivated - set back to ACTIVE
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionEndDate: new Date(subData.current_period_end * 1000),
      },
    });
    console.log(`✅ Subscription reactivated for org: ${organizationId}`);
  }
}

/**
 * Handle customer.subscription.deleted event
 * Sets status to EXPIRED (subscription fully ended)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subData = subscription as any;
  const organizationId = subData.metadata?.organizationId;

  if (!organizationId) {
    console.error('No organizationId in subscription metadata:', subData.id);
    return;
  }

  // Subscription fully ended - set to EXPIRED
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionStatus: 'EXPIRED',
      stripeSubscriptionId: null,
    },
  });

  console.log(`🚫 Subscription deleted/expired for org: ${organizationId}`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
