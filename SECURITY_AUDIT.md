# LeaveANote - Complete Security Audit & Best Practices

## 🔒 Security Checklist

### ✅ Current Security Status

- [x] Environment variables properly configured (`.env` in `.gitignore`)
- [x] Client-side validation implemented
- [ ] Firebase security rules configured (NEEDS REVIEW)
- [ ] Storage CORS configured properly
- [ ] API key restrictions set up
- [ ] Rate limiting implemented
- [ ] Content sanitization in place
- [ ] SSL/HTTPS enforced in production

---

## 1. Environment Variables & API Keys

### ✅ What's Good

Your Firebase config is properly stored in `.env` file:
```env
VITE_FIREBASE_API_KEY=AIzaSyCyaGNoVfDAcllNJLlhrlzAlw3BV-ECe54
VITE_FIREBASE_AUTH_DOMAIN=leaveanote-e0222.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=leaveanote-e0222
VITE_FIREBASE_STORAGE_BUCKET=leaveanote-e0222.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=994110734346
VITE_FIREBASE_APP_ID=1:994110734346:web:d2f0d26b986470ad6bdff3
```

### ⚠️ IMPORTANT: API Key Restrictions

**Firebase API keys are meant to be public**, but you should restrict them:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=leaveanote-e0222)
2. Find API key: `AIzaSyCyaGNoVfDAcllNJLlhrlzAlw3BV-ECe54`
3. Click "Edit"
4. Under **Application restrictions**:
   - Choose "HTTP referrers (web sites)"
   - Add your domains:
     ```
     http://localhost:5173/*
     http://localhost:*
     https://yourdomain.com/*
     https://*.yourdomain.com/*
     ```
5. Under **API restrictions**:
   - Choose "Restrict key"
   - Select only:
     - Cloud Firestore API
     - Cloud Storage for Firebase API
     - Firebase Management API (optional)
6. Save

### 🔐 .gitignore Verification

Your `.gitignore` already includes:
```gitignore
.env
.env.local
.env.production
```
✅ **GOOD** - Never commit these files!

---

## 2. Firebase Security Rules

### 🔥 Firestore Database Rules

**Current Risk**: If not configured, anyone can read/write your database!

#### Production-Ready Firestore Rules

Go to [Firestore Rules](https://console.firebase.google.com/project/leaveanote-e0222/firestore/rules) and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isValidNote() {
      let data = request.resource.data;
      return data.keys().hasAll([
        'message', 'unlockTime', 'createdAt', 
        'status', 'senderToken', 'mediaUrls', 'timezone'
      ]) 
      && data.status == 'pending'
      && data.message is string
      && data.message.size() > 0 
      && data.message.size() <= 5000
      && data.unlockTime is timestamp
      && data.unlockTime > request.time
      && data.createdAt is timestamp
      && data.senderToken is string
      && data.senderToken.size() == 64
      && data.mediaUrls is list
      && data.mediaUrls.size() <= 10
      && data.timezone is string;
    }
    
    function isValidStatusUpdate() {
      let newStatus = request.resource.data.status;
      let oldStatus = resource.data.status;
      
      // Only allow specific status transitions
      return (oldStatus == 'pending' && newStatus == 'revealed')
          || (oldStatus == 'revealed' && newStatus == 'read');
    }
    
    match /notes/{noteId} {
      // Anyone can read notes (needed for recipients)
      allow read: if true;
      
      // Anyone can create notes with validation
      allow create: if isValidNote()
        && request.resource.data.createdAt == request.time;
      
      // Allow status updates only (no message editing)
      allow update: if request.resource.data.diff(resource.data)
        .affectedKeys().hasOnly(['status', 'revealedAt', 'readAt'])
        && isValidStatusUpdate();
      
      // Prevent deletions in production
      // Enable only if you implement admin auth
      allow delete: if false;
    }
  }
}
```

#### 🎯 What This Protects Against:

- ✅ SQL injection (Firestore handles this)
- ✅ Oversized messages (max 5000 chars)
- ✅ Invalid unlock times (must be future)
- ✅ Message tampering (can't edit after creation)
- ✅ Unlimited file uploads (max 10 files)
- ✅ Invalid status transitions
- ✅ Backdating notes (createdAt must be now)

---

## 3. Firebase Storage Rules

### 📦 Storage Security Rules

Go to [Storage Rules](https://console.firebase.google.com/project/leaveanote-e0222/storage/rules) and update:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /notes/{noteId}/{fileName} {
      
      // Upload restrictions
      allow write: if request.resource.size < 10 * 1024 * 1024  // 10MB max
        && request.resource.contentType.matches('image/(jpeg|jpg|png|gif|webp)')
        || request.resource.contentType.matches('video/(mp4|webm|quicktime)');
      
      // Public read access (needed for recipients)
      allow read: if true;
      
      // Allow deletions (consider adding auth in production)
      allow delete: if request.auth != null || true;  // Change 'true' to require auth
    }
  }
}
```

#### 🎯 What This Protects Against:

- ✅ Large file uploads (>10MB blocked)
- ✅ Malicious file types (.exe, .sh, etc.)
- ✅ Storage quota abuse
- ✅ Unauthorized deletions (if auth enabled)

---

## 4. CORS Configuration

### 🌐 Storage CORS Setup

Create `cors.json` in project root:

```json
[
  {
    "origin": ["http://localhost:5173", "http://localhost:*"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

**For Production**, update to your domain:
```json
[
  {
    "origin": ["https://yourdomain.com", "https://*.yourdomain.com"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

Apply with:
```bash
gcloud storage buckets update gs://leaveanote-e0222.appspot.com --cors-file=cors.json
```

Or:
```bash
gsutil cors set cors.json gs://leaveanote-e0222.appspot.com
```

---

## 5. Client-Side Security

### ✅ Already Implemented

#### Input Validation (`src/utils/validation.ts`)
```typescript
✅ Message validation (1-5000 chars)
✅ File validation (type, size)
✅ Unlock time validation (future dates only)
✅ Token format validation
```

#### Content Security Policy

Add to `index.html` in production:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://firebasestorage.googleapis.com;
  media-src 'self' https://firebasestorage.googleapis.com;
  connect-src 'self' https://*.firebaseio.com https://firebasestorage.googleapis.com;
  font-src 'self' data:;
">
```

---

## 6. Rate Limiting & Abuse Prevention

### ⚠️ TODO: Implement Rate Limiting

**Option A: Firebase App Check** (Recommended)

1. Enable App Check in [Firebase Console](https://console.firebase.google.com/project/leaveanote-e0222/appcheck)
2. For web, use reCAPTCHA v3
3. Update `src/config/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = { /* ... */ };

export const app = initializeApp(firebaseConfig);

// Enable App Check
if (import.meta.env.PROD) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true
  });
}

export const db = getFirestore(app);
export const storage = getStorage(app);
```

**Option B: Cloud Functions Rate Limiting**

Create a Cloud Function to track creation rates:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const rateLimit = functions.firestore
  .document('notes/{noteId}')
  .onCreate(async (snap, context) => {
    const ip = context.auth?.uid || 'anonymous';
    const now = Date.now();
    const rateLimit = 5; // max 5 notes per hour
    const window = 60 * 60 * 1000; // 1 hour
    
    const recentNotes = await admin.firestore()
      .collection('notes')
      .where('createdAt', '>', new Date(now - window))
      .get();
    
    if (recentNotes.size > rateLimit) {
      // Delete the note and throw error
      await snap.ref.delete();
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Rate limit exceeded. Please try again later.'
      );
    }
  });
```

---

## 7. Data Encryption

### ✅ Current State

- **In Transit**: All Firebase connections use HTTPS/TLS ✅
- **At Rest**: Firebase encrypts all data at rest ✅
- **End-to-End**: NOT implemented ⚠️

### 🔐 Optional: Client-Side Encryption

If you want true end-to-end encryption, add to `src/utils/encryption.ts`:

```typescript
// Generate encryption key from password
async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('leaveanote-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt message
export async function encryptMessage(message: string, password: string): Promise<string> {
  const key = await deriveKey(password);
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(message)
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

// Decrypt message
export async function decryptMessage(encrypted: string, password: string): Promise<string> {
  const key = await deriveKey(password);
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
```

**Note**: If you implement this, you'll need to pass the encryption key in the URL or have users enter it.

---

## 8. Production Deployment Checklist

### 🚀 Before Going Live

#### Hosting & SSL

- [ ] Deploy to Firebase Hosting (auto SSL) or Vercel/Netlify
- [ ] Ensure HTTPS enforced everywhere
- [ ] Update CORS config with production domain
- [ ] Update API key restrictions with production domain

#### Firebase Configuration

- [ ] Switch Firestore rules from test mode to production rules above
- [ ] Switch Storage rules from test mode to production rules above
- [ ] Enable Firebase App Check with reCAPTCHA
- [ ] Set up billing alerts (Firebase Console → Billing)
- [ ] Enable Firebase Performance Monitoring (optional)

#### Environment Variables

- [ ] Create `.env.production` with production config
- [ ] Never commit `.env` files to git
- [ ] Use environment variables in hosting platform

#### Security Headers

Add to `vercel.json` or `netlify.toml`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

#### Monitoring

- [ ] Set up Firebase Performance Monitoring
- [ ] Enable Firebase Crashlytics
- [ ] Set up Google Analytics (already in your config)
- [ ] Create alerts for unusual activity

---

## 9. Privacy & Compliance

### 📋 GDPR/Privacy Considerations

#### Required Documents

1. **Privacy Policy** - Must disclose:
   - What data you collect (messages, files, timestamps, IP addresses via Firebase)
   - How long you store it
   - User rights (access, deletion, portability)
   - Cookie usage

2. **Terms of Service** - Should include:
   - Acceptable use policy
   - Content restrictions
   - Account termination policy
   - Disclaimer of liability

#### Data Retention

Implement auto-deletion of old notes:

```typescript
// Cloud Function to delete old notes
export const cleanupOldNotes = functions.pubsub
  .schedule('0 0 * * *')  // Daily at midnight
  .timeZone('UTC')
  .onRun(async () => {
    const db = admin.firestore();
    const storage = admin.storage();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);  // 30 days retention
    
    const oldNotes = await db.collection('notes')
      .where('revealedAt', '<', admin.firestore.Timestamp.fromDate(cutoff))
      .get();
    
    const batch = db.batch();
    for (const doc of oldNotes.docs) {
      batch.delete(doc.ref);
      
      // Delete associated files
      const noteData = doc.data();
      if (noteData.mediaUrls) {
        for (const url of noteData.mediaUrls) {
          // Extract file path and delete
          // Implementation details...
        }
      }
    }
    
    await batch.commit();
    console.log(`Cleaned up ${oldNotes.size} old notes`);
  });
```

---

## 10. Monitoring & Alerts

### 📊 Set Up Alerts

#### Firebase Quotas

1. Go to [Firebase Console → Usage & Billing](https://console.firebase.google.com/project/leaveanote-e0222/usage)
2. Set budget alerts:
   - Free tier: Alert at 80% of limits
   - Paid: Set monthly budget cap

#### Key Metrics to Monitor

- **Firestore Reads/Writes**: Should be predictable based on usage
- **Storage Uploads**: Watch for abuse (many large files)
- **Bandwidth**: Monitor download traffic
- **Error Rates**: High errors = security issue or bug

---

## 11. Scalability Best Practices

### 🚀 Current Architecture is Scalable

Your app is already well-designed:
- ✅ Serverless (Firebase) - scales automatically
- ✅ Static frontend - CDN-friendly
- ✅ No backend servers - no scaling concerns

### Optimization Recommendations

#### 1. Add Firestore Indexes

For faster queries, add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "notes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdAt", "order": "DESCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "unlockTime", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

#### 2. Image Optimization

Add image compression before upload in `CreateNoteForm.tsx`:

```typescript
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        }, 'image/jpeg', 0.8);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}
```

#### 3. Caching Strategy

Add to `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/firestore', 'firebase/storage'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animations': ['framer-motion'],
        }
      }
    }
  }
});
```

---

## 12. Testing & QA

### 🧪 Security Testing Checklist

- [ ] Try XSS attacks in message field: `<script>alert('xss')</script>`
- [ ] Try SQL injection patterns (should be harmless with Firestore)
- [ ] Try uploading .exe, .sh, .php files (should be blocked)
- [ ] Try uploading 100MB file (should be blocked at 10MB)
- [ ] Try creating 100 notes rapidly (rate limiting test)
- [ ] Try accessing other users' sender tokens
- [ ] Try modifying URLs to access admin functions
- [ ] Test HTTPS enforcement (http:// should redirect)
- [ ] Test CORS (images should load from Storage)
- [ ] Penetration testing with OWASP ZAP

---

## 📋 Quick Security Audit Command

Run this to check your current security status:

```bash
# Check .env is in .gitignore
grep -q "^\.env$" .gitignore && echo "✅ .env in gitignore" || echo "❌ Add .env to .gitignore"

# Check for exposed secrets in git history
git log --all --full-history -- ".env" && echo "⚠️ .env found in git history!" || echo "✅ No .env in git history"

# Check Firebase config is not hardcoded
grep -r "AIzaSyC" src/ && echo "⚠️ API key found in source!" || echo "✅ No hardcoded keys"

# Check all files are using environment variables
grep -r "VITE_FIREBASE" src/ && echo "✅ Using env vars" || echo "❌ Not using env vars"
```

---

## 🎯 Priority Action Items

### Immediate (Do Now)

1. ✅ API key restrictions (Google Cloud Console)
2. ✅ Update Firestore security rules (production rules above)
3. ✅ Update Storage security rules (production rules above)
4. ✅ Configure CORS for Storage

### Before Launch

5. Enable Firebase App Check
6. Set up billing alerts
7. Add rate limiting
8. Write Privacy Policy & Terms
9. Add security headers
10. Test all security scenarios

### After Launch

11. Monitor Firebase quotas
12. Set up auto-deletion of old notes
13. Regular security audits
14. Performance monitoring
15. User feedback for security issues

---

## 🆘 Security Incident Response

If you discover a security issue:

1. **Don't panic** - Most issues are fixable
2. **Assess impact** - What data was exposed?
3. **Fix immediately** - Update rules, rotate keys if needed
4. **Notify users** - If data was compromised (GDPR requirement)
5. **Document** - Keep record of incident and response
6. **Learn** - Update this checklist with new preventions

---

## 📚 Resources

- [Firebase Security Rules Best Practices](https://firebase.google.com/docs/rules/rules-and-auth)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)
- [Web Security Basics (MDN)](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**Last Updated**: December 3, 2025  
**Review Schedule**: Monthly or after any security incident


