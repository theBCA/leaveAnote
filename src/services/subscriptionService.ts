import { httpsCallable } from 'firebase/functions';
import { createCheckoutSession, getProducts, getStripePayments, getCurrentUserSubscriptions, type Price, type Product, type Subscription } from '@stripe/firestore-stripe-payments';
import { app, functions } from '../config/firebase';
import { env } from '../config/env';

export interface BillingPlan {
  productId: string;
  productName: string;
  description: string | null;
  role: string | null;
  priceId: string;
  amount: number | null;
  currency: string;
  interval: string | null;
  intervalCount: number | null;
  trialPeriodDays: number | null;
}

export interface PremiumEntitlementSummary {
  isPremium: boolean;
  isPending: boolean;
  primaryRole: string | null;
  label: string;
}

const payments = getStripePayments(app, {
  customersCollection: env.stripeCustomersCollection,
  productsCollection: env.stripeProductsCollection,
});

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const PENDING_SUBSCRIPTION_STATUSES = new Set(['incomplete', 'past_due']);

function sortPlansByPrice(a: BillingPlan, b: BillingPlan) {
  if (a.amount === null && b.amount === null) return 0;
  if (a.amount === null) return 1;
  if (b.amount === null) return -1;
  return a.amount - b.amount;
}

function mapPlan(product: Product, price: Price): BillingPlan {
  return {
    productId: product.id,
    productName: product.name,
    description: price.description || product.description || null,
    role: product.role || null,
    priceId: price.id,
    amount: price.unit_amount,
    currency: price.currency,
    interval: price.interval,
    intervalCount: price.interval_count,
    trialPeriodDays: price.trial_period_days,
  };
}

export function summarizePremiumEntitlements(subscriptions: Subscription[]): PremiumEntitlementSummary {
  const premiumSubscriptions = subscriptions.filter((subscription) => subscription.role === 'premium');
  const activeSubscription = premiumSubscriptions.find((subscription) => ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status));
  if (activeSubscription) {
    return {
      isPremium: true,
      isPending: false,
      primaryRole: activeSubscription.role || 'premium',
      label: activeSubscription.status === 'trialing' ? 'Premium trial active' : 'Premium active',
    };
  }

  const pendingSubscription = premiumSubscriptions.find((subscription) => PENDING_SUBSCRIPTION_STATUSES.has(subscription.status));
  if (pendingSubscription) {
    return {
      isPremium: false,
      isPending: true,
      primaryRole: pendingSubscription.role || 'premium',
      label: pendingSubscription.status === 'past_due' ? 'Payment update needed' : 'Subscription pending',
    };
  }

  return {
    isPremium: false,
    isPending: false,
    primaryRole: premiumSubscriptions[0]?.role || null,
    label: 'Free plan',
  };
}

export async function listBillingPlans(): Promise<BillingPlan[]> {
  const products = await getProducts(payments, {
    activeOnly: true,
    includePrices: true,
  });

  return products
    .flatMap((product) =>
      (product.prices || [])
        .filter((price) => price.active && price.type === 'recurring')
        .map((price) => mapPlan(product, price)),
    )
    .sort(sortPlansByPrice);
}

export async function beginSubscriptionCheckout(priceId: string) {
  const origin = window.location.origin;
  return createCheckoutSession(payments, {
    price: priceId,
    success_url: `${origin}/pricing?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancel`,
    allow_promotion_codes: true,
  });
}

export async function getUserSubscriptions(): Promise<Subscription[]> {
  return getCurrentUserSubscriptions(payments);
}

export async function createBillingPortalLink(returnUrl: string): Promise<string> {
  const createPortalLink = httpsCallable<
    { returnUrl: string; locale?: string },
    { url: string }
  >(functions, env.stripePortalFunctionName);

  const result = await createPortalLink({
    returnUrl,
    locale: 'auto',
  });

  const url = result.data?.url;
  if (!url) {
    throw new Error('Billing portal is unavailable right now.');
  }

  return url;
}
