# Deploying LeaveANote (Free)

## Option 1: Firebase Hosting (Recommended)

Best choice — your backend (Firestore + Storage) and frontend stay in one place.

### One-time setup

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Log in
firebase login

# 3. Edit .firebaserc — replace YOUR_FIREBASE_PROJECT_ID with your actual project ID
#    (the same project ID you put in .env)
```

### Deploy

```bash
# Build and deploy in one command
npm run deploy
```

Your site will be live at: `https://YOUR_PROJECT_ID.web.app`

You also get a `https://YOUR_PROJECT_ID.firebaseapp.com` URL for free.

### Custom domain (optional, free)

```bash
firebase hosting:channel:deploy preview   # preview URL
firebase hosting:sites:list               # see your sites
```

Go to Firebase Console → Hosting → Add custom domain to connect your own domain.

---

## Option 2: Vercel (Easiest)

Zero-config deployment from GitHub.

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Import Project"** → select your `leaveAnote` repo
3. Vercel auto-detects Vite — just click **Deploy**
4. Add your environment variables in Vercel dashboard:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Every push to `main` auto-deploys

Free tier includes: custom domains, HTTPS, CDN, unlimited deploys.

---

## Option 3: Netlify

1. Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. Click **"Add new site"** → **"Import an existing project"** → select your repo
3. Set build settings:
   - **Build command:** `npm run build:prod`
   - **Publish directory:** `dist`
4. Add environment variables (same 6 `VITE_FIREBASE_*` vars)
5. Click **Deploy**

Free tier includes: custom domains, HTTPS, 100GB bandwidth/month.

---

## Option 4: GitHub Pages (Free, no account needed)

```bash
# 1. Install gh-pages
npm install --save-dev gh-pages

# 2. Add to vite.config.ts:
#    base: '/leaveAnote/'

# 3. Add deploy script to package.json:
#    "deploy:gh": "npm run build:prod && npx gh-pages -d dist"

# 4. Deploy
npm run deploy:gh
```

Site will be at: `https://YOUR_USERNAME.github.io/leaveAnote/`

---

## Quick comparison

| Platform | Setup time | Auto-deploy | Custom domain | Best for |
|----------|-----------|-------------|---------------|----------|
| **Firebase Hosting** | 5 min | No (CLI) | Yes (free) | Already using Firebase |
| **Vercel** | 2 min | Yes (on push) | Yes (free) | Easiest setup |
| **Netlify** | 3 min | Yes (on push) | Yes (free) | Similar to Vercel |
| **GitHub Pages** | 5 min | Manual | Yes (free) | No account needed |

All options are **100% free** for this app's scale.

## Prerequisites for all options

Make sure your `.env` file has valid Firebase credentials before deploying:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Without these, the app UI will load but no notes can be created or viewed.
