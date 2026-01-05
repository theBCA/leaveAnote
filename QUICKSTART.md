# Quick Start Guide - LeaveANote

## Get Started in 5 Minutes

### Step 1: Install Dependencies (1 min)
```bash
cd leaveanote
npm install
```

### Step 2: Set Up Firebase (2 min)

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com/
   - Click "Add project" → Enter name → Create

2. **Enable Firestore**
   - Click "Firestore Database" → "Create database"
   - Choose "production mode" → Select region → Enable

3. **Enable Storage**
   - Click "Storage" → "Get Started"
   - Use default rules → Done

4. **Get Config**
   - Click gear icon (Settings) → "Project settings"
   - Scroll to "Your apps" → Click web icon `</>`
   - Register app → Copy config values

### Step 3: Configure App (1 min)

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` with your Firebase values:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 4: Update Firebase Rules (1 min)

**Firestore Rules** (Database → Rules tab):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read, write: if true;
    }
  }
}
```

**Storage Rules** (Storage → Rules tab):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /notes/{noteId}/{fileName} {
      allow read, write: if request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

Click "Publish" for both.

### Step 5: Run! (30 sec)

```bash
npm run dev
```

Open http://localhost:5173 🎉

## Test Your App

1. **Create a Note**
   - Write a message
   - Set unlock time to 1 minute from now
   - Click "Create Note"

2. **Share Link**
   - Copy the recipient link
   - Open in incognito/private window
   - Watch countdown!

3. **Test Sender Controls**
   - Copy the control link
   - Open it
   - Try editing or deleting

## Common Issues

### "Permission denied" error?
→ Check Firebase rules are published correctly

### Files not uploading?
→ Verify Storage is enabled and rules are set

### App not connecting to Firebase?
→ Double-check `.env` file has correct values

## Next Steps

- Deploy to production (see README.md)
- Customize styling in `tailwind.config.js`
- Add features from Future Enhancements list
- Share with friends!

## Need Help?

- Full docs: [README.md](./README.md)
- Firebase setup: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- Issues: Open a GitHub issue

---

Happy note creating! 🎉
