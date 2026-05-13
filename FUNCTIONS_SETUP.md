# Functions & Billing Setup

The web app now expects two backend layers:

- Your own Firebase HTTPS function named `api`
- The Stripe Firebase extension `invertase/firestore-stripe-payments`

## Required server config

- Firebase Functions secret: `OPENAI_API_KEY`

The `api` function binds this secret. If it is missing, AI generation fails clearly while the rest of the app keeps working.

## Required frontend env

Add these to the web app `.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Optional billing-related env:

- `VITE_API_BASE_URL`
- `VITE_STRIPE_CUSTOMERS_COLLECTION=customers`
- `VITE_STRIPE_PRODUCTS_COLLECTION=products`
- `VITE_STRIPE_PORTAL_FUNCTION_NAME=ext-firestore-stripe-payments-createPortalLink`
- `VITE_STRIPE_FUNCTIONS_REGION=us-central1`
- `VITE_PREMIUM_PRICE_LABEL=$4.99`
- `VITE_SUPPORT_EMAIL=`

If you change the Stripe extension collection names during installation, update the matching `VITE_STRIPE_*` env values and set `STRIPE_CUSTOMERS_COLLECTION` for the `api` function runtime too.

## Stripe + Firebase dashboard steps

### 1. Firebase

1. Upgrade the Firebase project to the Blaze plan.
2. Enable Cloud Firestore.
3. Enable Firebase Authentication.
4. Turn on at least one sign-in method.
   - This repo currently implements email/password sign-in.
5. Install the extension:
   - `invertase/firestore-stripe-payments`

### 2. Stripe

1. Create a Product for Premium.
2. Create at least one recurring Price for that product.
3. Configure Stripe Customer Portal in the Stripe Dashboard.
4. Create the restricted Stripe API key required by the extension.
   - Per the extension docs, give write access to `Customers`, `Checkout Sessions`, and `Customer portal`, and read access to `Subscriptions` and `Prices`.

### 3. Extension install choices

Use these values consistently:

- Customers collection: `customers`
- Products collection: `products`
- Cloud Functions location: `us-central1`

During extension setup, keep the webhook secret blank until postinstall, then register the Stripe webhook and paste the generated signing secret back into the extension configuration.

## Firestore collections the app expects

From the Stripe extension:

- `products/{productId}`
- `products/{productId}/prices/{priceId}`
- `customers/{uid}`
- `customers/{uid}/checkout_sessions/{sessionId}`
- `customers/{uid}/subscriptions/{subscriptionId}`
- `customers/{uid}/payments/{paymentId}`

From this repo’s own backend:

- `notes/{noteId}`
- `noteControls/{token}`

## Premium entitlement model

Premium AI is no longer granted by email lookup.

It is enforced in two places:

1. Frontend:
   - user must be signed in
   - Stripe plans are loaded from Firestore
   - checkout is started with the Stripe extension SDK
   - subscription status is read from `customers/{uid}/subscriptions`
2. Backend:
   - `/api/ai/generate` requires a Firebase ID token
   - the function reads `customers/{uid}/subscriptions`
   - AI access is granted only when a subscription with role `premium` is `active` or `trialing`

`past_due` and `incomplete` are treated as pending, not premium-active.

## Local setup

1. Install root dependencies:
   - `npm install`
2. Install function dependencies:
   - `npm run functions:install`
3. Copy `functions/.secret.local.example` to `functions/.secret.local` and set `OPENAI_API_KEY`.
4. If using emulators, point the frontend at your local API:
   - `VITE_API_BASE_URL=http://127.0.0.1:5001/<firebase-project-id>/us-central1/api`
5. Start emulators:
   - `npm run emulators:start`

Notes:

- The Firestore emulator requires Java on `PATH`.
- The Stripe extension itself is not fully emulated by this repo; real checkout and portal flows still require a live Firebase + Stripe project.

## Production setup

1. Install function dependencies:
   - `npm run functions:install`
2. Create the OpenAI secret:
   - `firebase functions:secrets:set OPENAI_API_KEY`
3. Install and configure the Stripe Firebase extension in the target Firebase project.
4. Verify the extension is writing products and prices into Firestore.
5. Verify customer portal is enabled in Stripe.
6. Deploy hosting and your own functions:
   - `npm run deploy`

## Current backend scope

- Secure note creation
- Recipient note retrieval with server-enforced unlock timing
- Private sender management via tokenized control link
- Server-side AI generation protected by verified Stripe subscription entitlements

## Intentionally disabled in this release baseline

- Browser-side attachment uploads
- Browser-side location lock enforcement
- Browser-side email sending
