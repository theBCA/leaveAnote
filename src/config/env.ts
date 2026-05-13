function optionalEnv(name: string): string | undefined {
  const value = import.meta.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requiredEnv(name: string): string {
  const value = optionalEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  firebaseApiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
  firebaseAuthDomain: requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  firebaseProjectId: requiredEnv('VITE_FIREBASE_PROJECT_ID'),
  firebaseStorageBucket: requiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  firebaseMessagingSenderId: requiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  firebaseAppId: requiredEnv('VITE_FIREBASE_APP_ID'),
  apiBaseUrl: optionalEnv('VITE_API_BASE_URL'),
  enableExperimentalEmailShare: optionalEnv('VITE_ENABLE_EXPERIMENTAL_EMAIL_SHARE') === 'true',
  stripeCustomersCollection: optionalEnv('VITE_STRIPE_CUSTOMERS_COLLECTION') || 'customers',
  stripeProductsCollection: optionalEnv('VITE_STRIPE_PRODUCTS_COLLECTION') || 'products',
  stripePortalFunctionName: optionalEnv('VITE_STRIPE_PORTAL_FUNCTION_NAME') || 'ext-firestore-stripe-payments-createPortalLink',
  stripeFunctionsRegion: optionalEnv('VITE_STRIPE_FUNCTIONS_REGION') || 'us-central1',
  premiumPriceLabel: optionalEnv('VITE_PREMIUM_PRICE_LABEL') || '$4.99',
  supportEmail: optionalEnv('VITE_SUPPORT_EMAIL'),
};
