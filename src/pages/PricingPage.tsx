import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { env } from '../config/env';
import { useAuth } from '../context/useAuth';
import { beginSubscriptionCheckout, createBillingPortalLink, listBillingPlans, type BillingPlan } from '../services/subscriptionService';
import AuthDialog from '../components/AuthDialog';
import InlineNotice from '../components/InlineNotice';

function formatPrice(plan: BillingPlan): string {
  if (plan.amount === null) return env.premiumPriceLabel;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: plan.currency.toUpperCase(),
  }).format(plan.amount / 100);
}

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authReady, isPremium, premiumPending, premiumStatusLabel, refreshPremiumStatus } = useAuth();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingBusy, setBillingBusy] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'error'>('info');

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      setLoadingPlans(true);
      try {
        const nextPlans = await listBillingPlans();
        if (!cancelled) {
          setPlans(nextPlans.filter((plan) => plan.role === 'premium'));
        }
      } catch (error) {
        if (!cancelled) {
          setStatusTone('info');
          setStatusMessage(error instanceof Error ? error.message : 'Premium checkout is not configured yet.');
        }
      } finally {
        if (!cancelled) {
          setLoadingPlans(false);
        }
      }
    };

    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkout = params.get('checkout');
    if (checkout === 'success') {
      setStatusTone('success');
      setStatusMessage('Checkout completed. Stripe may need a few seconds to sync your subscription. Refresh your billing status if Premium does not appear immediately.');
    } else if (checkout === 'cancel') {
      setStatusTone('info');
      setStatusMessage('Checkout was canceled before payment was completed.');
    }
  }, [location.search]);

  const premiumPlan = useMemo(() => plans[0] ?? null, [plans]);

  const handleSubscribe = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    if (!premiumPlan) {
      setStatusTone('info');
      setStatusMessage('No active Stripe Premium plan is available yet. Create a product and recurring price in Stripe, then let the extension sync them to Firestore.');
      return;
    }

    setBillingBusy(true);
    setStatusMessage(null);
    try {
      const session = await beginSubscriptionCheckout(premiumPlan.priceId);
      window.location.assign(session.url);
    } catch (error) {
      setStatusTone('error');
      setStatusMessage(error instanceof Error ? error.message : 'Unable to start checkout.');
    } finally {
      setBillingBusy(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    setBillingBusy(true);
    setStatusMessage(null);
    try {
      const url = await createBillingPortalLink(`${window.location.origin}/pricing`);
      window.location.assign(url);
    } catch (error) {
      setStatusTone('error');
      setStatusMessage(error instanceof Error ? error.message : 'Billing portal is unavailable.');
    } finally {
      setBillingBusy(false);
    }
  };

  const freePlan = {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Core timed notes for everyday use',
    features: ['Unlimited scheduled notes', 'Private sender control links', 'QR code sharing', 'Theme-based note reveals'],
    limitations: ['Luna AI writing assistant not included', 'Attachments unavailable in this secure baseline', 'Location lock unavailable in this secure baseline'],
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[15%] w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'var(--glow-1)' }} />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'var(--glow-2)' }} />
      </div>

      <div className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Pricing & Premium</h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Premium billing now uses Firebase Authentication plus Stripe's Firebase extension so AI access is tied to verified subscriptions instead of client-side flags.
            </p>
          </motion.div>

          {statusMessage && (
            <div className="max-w-4xl mx-auto mb-6">
              <InlineNotice tone={statusTone} message={statusMessage} />
            </div>
          )}

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl p-7 h-full"
                style={{
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-text)',
                  boxShadow: '0 20px 40px var(--accent-glow)',
                }}
              >
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{freePlan.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{freePlan.description}</p>
                <div className="my-5">
                  <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{freePlan.price}</span>
                  <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>{freePlan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {freePlan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--success-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                    </li>
                  ))}
                  {freePlan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span style={{ color: 'var(--text-faint)' }}>{limitation}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/')}
                  className="btn-primary w-full py-2.5 px-6 rounded-lg font-semibold text-sm"
                >
                  Keep using Free
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl p-7 h-full"
                style={{
                  background: 'linear-gradient(180deg, rgba(124,58,237,0.10), rgba(236,72,153,0.12))',
                  border: '1px solid rgba(124,58,237,0.25)',
                  boxShadow: '0 20px 40px rgba(124,58,237,0.10)',
                }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                    Stripe Subscription
                  </span>
                </div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Premium</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Luna AI writing and future Premium delivery tools, enforced from verified Stripe subscription data.
                </p>
                <div className="my-5">
                  <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {premiumPlan ? formatPrice(premiumPlan) : env.premiumPriceLabel}
                  </span>
                  <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>
                    {premiumPlan?.interval ? `/ ${premiumPlan.interval}` : '/ month'}
                  </span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {[
                    'Luna AI message writer',
                    'Server-side subscription enforcement',
                    'Stripe Checkout for upgrades',
                    'Stripe Customer Portal for billing management',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--success-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 text-sm">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span style={{ color: 'var(--text-faint)' }}>
                      Requires Firebase Auth and a live Stripe extension installation
                    </span>
                  </li>
                </ul>

                {loadingPlans ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading Stripe plans...</p>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => void handleSubscribe()}
                      disabled={billingBusy || !authReady || isPremium}
                      className="btn-primary w-full py-2.5 px-6 rounded-lg font-semibold text-sm disabled:opacity-50"
                    >
                      {isPremium ? 'Premium Active' : billingBusy ? 'Opening checkout...' : user ? 'Subscribe to Premium' : 'Sign in to subscribe'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleManageBilling()}
                      disabled={billingBusy || !user}
                      className="w-full py-2.5 px-6 rounded-lg font-semibold text-sm disabled:opacity-50"
                      style={{ background: 'var(--bg-hover)', border: '1px solid var(--divider)', color: 'var(--text-secondary)' }}
                    >
                      {billingBusy ? 'Opening portal...' : 'Manage subscription'}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Your account status</h2>
                {!authReady ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Checking your session...</p>
                ) : !user ? (
                  <div className="space-y-3">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      You need a signed-in account before Stripe can create a customer and sync subscriptions back into Firebase.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAuthDialogOpen(true)}
                      className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold"
                    >
                      Sign in
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Signed in as <strong>{user.email}</strong>
                    </p>
                    <InlineNotice
                      tone={isPremium ? 'success' : 'info'}
                      message={premiumPending
                        ? 'Your subscription exists but is not active yet. Finish checkout or update billing in Stripe.'
                        : `Current status: ${premiumStatusLabel}`}
                    />
                    <button
                      type="button"
                      onClick={() => void refreshPremiumStatus()}
                      className="text-sm font-semibold"
                      style={{ color: 'var(--accent-text)' }}
                    >
                      Refresh billing status
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>
                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>What needs to exist in Stripe?</h2>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li>1. Install the `invertase/firestore-stripe-payments` Firebase extension.</li>
                  <li>2. Enable Firebase Authentication and at least one sign-in method.</li>
                  <li>3. Create a Stripe product with a recurring price and a `premium` role.</li>
                  <li>4. Configure Stripe's customer portal and webhook as required by the extension.</li>
                </ul>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/" className="font-semibold" style={{ color: 'var(--accent-text)' }}>
                    Back to note creator
                  </Link>
                  {env.supportEmail && (
                    <a href={`mailto:${env.supportEmail}`} className="font-semibold" style={{ color: 'var(--accent-text)' }}>
                      Contact support
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AuthDialog isOpen={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
    </div>
  );
}
