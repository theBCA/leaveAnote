const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const PENDING_SUBSCRIPTION_STATUSES = new Set(['incomplete', 'past_due']);

export function grantsPremiumAi(subscription) {
  return subscription?.role === 'premium' && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
}

export function hasPendingPremiumState(subscription) {
  return subscription?.role === 'premium' && PENDING_SUBSCRIPTION_STATUSES.has(subscription.status);
}
