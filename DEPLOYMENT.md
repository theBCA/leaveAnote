# Deployment & Mobile App Guide

## Part 1: Deploy to Vercel (Web)

### Prerequisites
- A [Vercel account](https://vercel.com/signup) (free tier works)
- Your Firebase credentials ready (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
- This repository pushed to GitHub

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to** [vercel.com/new](https://vercel.com/new)
2. **Import** your GitHub repository (`leaveAnote`)
3. **Configure** the project:
   - Framework Preset: **Vite** (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Add Environment Variables** — click "Environment Variables" and add all 6:
   | Name | Value |
   |------|-------|
   | `VITE_FIREBASE_API_KEY` | Your Firebase API key |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | Your project ID |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
   | `VITE_FIREBASE_APP_ID` | Your app ID |
5. **Click Deploy** — Vercel will build and deploy automatically
6. Your app will be live at `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

When prompted, select the default settings. Vercel will auto-detect Vite.

Add environment variables via the dashboard or CLI:
```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
```

### Auto-Deploy

Once connected to GitHub, Vercel auto-deploys on every push:
- **Production**: deploys from `main` branch
- **Preview**: deploys from pull request branches

### Custom Domain

1. Go to your Vercel project **Settings > Domains**
2. Add your domain (e.g., `leaveanote.com`)
3. Vercel will provide DNS records to configure
4. **Option 1**: Use Vercel's nameservers (easiest)
5. **Option 2**: Add A/CNAME records to your domain registrar:
   - For apex domain: A record → `76.76.21.21`
   - For subdomain: CNAME → `cname.vercel-dns.com`
6. SSL is automatic and free

**Where to buy a domain:**
- [Namecheap](https://namecheap.com) — affordable, good UI
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) — at-cost pricing
- [Google Domains](https://domains.google) → now Squarespace Domains
- [Vercel Domains](https://vercel.com/domains) — buy directly in Vercel dashboard

---

## Part 2: iOS App (Priority)

The project uses [Capacitor](https://capacitorjs.com) to wrap the web app in a native iOS shell. This gives you a real App Store app with minimal code changes.

### Prerequisites for iOS Development

- **macOS** (required for iOS development — no way around this)
- **Xcode 15+** (free from Mac App Store)
- **Apple Developer Account** ($99/year) — required to publish to App Store
- **CocoaPods** (may be needed for some plugins): `sudo gem install cocoapods`

### Build the iOS App

```bash
# 1. Build the web app
npm run build

# 2. Sync web assets to iOS project
npx cap sync ios

# 3. Open in Xcode
npx cap open ios
```

Or use the convenience scripts:
```bash
npm run cap:sync        # Build + sync all platforms
npm run cap:open:ios    # Open in Xcode
```

### In Xcode

1. **Select your Team** in Signing & Capabilities
   - Open `ios/App/App.xcodeproj`
   - Select the "App" target
   - Go to "Signing & Capabilities"
   - Select your Apple Developer Team
   - Xcode will auto-create provisioning profiles

2. **Set Bundle Identifier** — it's pre-configured as `com.leaveanote.app`
   - Change this if you want a different ID

3. **Set Display Name** — already set to "LeaveANote"

4. **App Icons** — replace the default Capacitor icons:
   - Replace images in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Use a tool like [AppIcon.co](https://appicon.co/) to generate all sizes from a 1024x1024 source

5. **Test on Simulator** — select an iPhone simulator and click Run (Cmd+R)

6. **Test on Device** — connect your iPhone via USB, select it, and click Run

### Publish to App Store

1. **Create App in App Store Connect**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Click "My Apps" → "+" → "New App"
   - Fill in: Name, Bundle ID (`com.leaveanote.app`), SKU

2. **Prepare App Metadata**
   - Screenshots (required for each device size)
   - App description, keywords, categories
   - Privacy policy URL (required)
   - Age rating

3. **Archive and Upload**
   - In Xcode: Product → Archive
   - Click "Distribute App" → "App Store Connect"
   - Upload

4. **Submit for Review**
   - In App Store Connect, select the build
   - Submit for review (usually takes 24-48 hours)

### iOS-Specific Enhancements (Optional)

Install Capacitor plugins for native features:

```bash
# Status bar customization
npm install @capacitor/status-bar

# Share sheet (native share)
npm install @capacitor/share

# Local notifications (for countdown reminders)
npm install @capacitor/local-notifications

# Haptic feedback
npm install @capacitor/haptics

# App badge (show countdown)
npm install @capacitor/badge
```

After installing plugins, run:
```bash
npm run cap:sync
```

---

## Part 3: Android App

### Prerequisites for Android Development

- **Android Studio** (free, any OS)
- **JDK 17+**
- **Google Play Developer Account** ($25 one-time) — to publish

### Build the Android App

```bash
# 1. Build the web app
npm run build

# 2. Sync web assets to Android project
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

Or use convenience scripts:
```bash
npm run cap:sync           # Build + sync all platforms
npm run cap:open:android   # Open in Android Studio
```

### In Android Studio

1. Wait for Gradle sync to complete
2. Select a device/emulator
3. Click Run (Shift+F10)

### Publish to Google Play

1. **Generate Signed APK/AAB**
   - Build → Generate Signed Bundle/APK
   - Create a keystore (keep it safe — you need it for every update)
   - Select "Android App Bundle (AAB)"

2. **Create App in Google Play Console**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Create a new app
   - Fill in store listing, content rating, pricing

3. **Upload and Publish**
   - Upload the AAB file
   - Submit for review

---

## Development Workflow

After making web code changes:

```bash
# Build and sync to all platforms
npm run cap:sync

# Or sync individually
npx cap sync ios
npx cap sync android
```

For live reload during development (web changes reflected on device):

```bash
# Start dev server
npm run dev

# In capacitor.config.ts, temporarily add:
# server: { url: 'http://YOUR_LOCAL_IP:5173' }

# Then sync and run on device
npx cap sync ios
npx cap run ios
```

---

## Recommended Next Steps

1. **Set up Firebase** — see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. **Deploy to Vercel** — follow Part 1 above
3. **Build iOS app on Mac** — follow Part 2 above
4. **Add app icon** — design a 1024x1024 icon and use [AppIcon.co](https://appicon.co/)
5. **Add splash screen** — customize `ios/App/App/Assets.xcassets/Splash.imageset/`
6. **Write privacy policy** — required for both App Store and Google Play
