# Firebase Storage Image Display Fix

If images are showing as black boxes, follow these steps to fix Firebase Storage CORS and permissions.

## 1. Enable Firebase Storage (If Not Already Done)

1. Go to [Firebase Console](https://console.firebase.google.com/project/leaveanote-e0222)
2. Click **Storage** in left menu
3. Click **Get Started**
4. Choose **Start in test mode** (we'll add proper rules after)
5. Select a location
6. Click **Done**

## 2. Update Storage Security Rules

1. Go to **Storage** → **Rules** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /notes/{noteId}/{fileName} {
      // Allow uploads up to 10MB for images and videos
      allow write: if request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*|video/.*');
      
      // Allow anyone to read files (public access)
      allow read: if true;
      
      // Allow deletions
      allow delete: if true;
    }
  }
}
```

3. Click **Publish**

## 3. Configure CORS for Firebase Storage

Firebase Storage needs CORS configuration to allow images to load from your web app.

### Option A: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:
```bash
firebase login
```

3. **Create a CORS configuration file** `cors.json`:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

4. **Set the CORS configuration**:
```bash
firebase storage:rules:deploy --project leaveanote-e0222
```

Or use Google Cloud CLI:
```bash
gcloud storage buckets update gs://leaveanote-e0222.appspot.com --cors-file=cors.json
```

### Option B: Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **leaveanote-e0222**
3. Go to **Cloud Storage** → **Browser**
4. Find your bucket: `leaveanote-e0222.appspot.com`
5. Click the 3 dots menu → **Edit CORS configuration**
6. Add:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```
7. Save

### Option C: Test Mode (Temporary)

For quick testing, use test mode rules (expires in 30 days):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.time < timestamp.date(2025, 1, 3);
    }
  }
}
```

## 4. Verify Firebase Configuration

Check that your `.env` file has the correct storage bucket:

```env
VITE_FIREBASE_STORAGE_BUCKET=leaveanote-e0222.firebasestorage.app
```

## 5. Clear Browser Cache

After making changes:
1. Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Or open in Incognito/Private mode
3. Restart the dev server:
```bash
npm run dev
```

## 6. Test Image Upload

1. Create a new note with an image attachment
2. Wait for upload to complete
3. View the note
4. Check browser console (F12) for any CORS errors

## Common Issues

### Black Image Boxes
**Cause**: CORS not configured or Storage rules blocking access
**Solution**: Follow steps 2 and 3 above

### "Permission denied" errors
**Cause**: Storage security rules too restrictive
**Solution**: Update rules in step 2

### Images not uploading
**Cause**: Storage not enabled or wrong bucket name
**Solution**: Verify step 1 and check `.env` file

### Images load but very slowly
**Cause**: Large file sizes
**Solution**: The app already limits to 10MB, but consider adding image compression

## Production Considerations

For production, consider:
1. **Restrict CORS origins** to your actual domain:
```json
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

2. **Add authentication** to storage rules if needed

3. **Implement file compression** before upload

4. **Set up CDN** for faster image delivery

5. **Add file type validation** on server side


