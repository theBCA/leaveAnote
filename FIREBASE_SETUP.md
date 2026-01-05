# Firebase Setup Guide for LeaveANote

## Step-by-Step Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `leaveanote` (or your choice)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database

1. In Firebase Console, click "Firestore Database" in left menu
2. Click "Create database"
3. Select "Start in production mode"
4. Choose your database location (closest to your users)
5. Click "Enable"

### 3. Set Firestore Security Rules

1. Go to Firestore Database > Rules tab
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      // Anyone can read notes (needed for recipients)
      allow read: if true;
      
      // Anyone can create notes
      allow create: if request.resource.data.keys().hasAll([
        'message', 'unlockTime', 'createdAt', 'status', 
        'senderToken', 'mediaUrls', 'timezone'
      ]) && request.resource.data.status == 'pending';
      
      // Allow updates for status changes and content edits
      allow update: if true;
      
      // Allow deletions (sender verification done client-side via token)
      allow delete: if true;
    }
  }
}
```

3. Click "Publish"

### 4. Enable Firebase Storage

1. Click "Storage" in left menu
2. Click "Get Started"
3. Select "Start in production mode"
4. Choose storage location
5. Click "Done"

### 5. Set Storage Security Rules

1. Go to Storage > Rules tab
2. Replace with these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /notes/{noteId}/{fileName} {
      // Allow uploads up to 10MB for images and videos
      allow write: if request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*|video/.*');
      
      // Allow anyone to read files (needed for recipients)
      allow read: if true;
      
      // Allow deletions (when notes are deleted)
      allow delete: if true;
    }
  }
}
```

3. Click "Publish"

### 6. Get Firebase Configuration

1. Go to Project Settings (gear icon near "Project Overview")
2. Scroll to "Your apps" section
3. Click the web icon `</>`
4. Register app:
   - App nickname: "LeaveANote Web"
   - Don't check "Firebase Hosting"
   - Click "Register app"
5. Copy the configuration object

### 7. Configure Environment Variables

1. In your project, create `.env` file:

```bash
cp .env.example .env
```

2. Fill in the values from Firebase config:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 8. Test Firebase Connection

Run the development server:

```bash
npm run dev
```

Try creating a note. Check Firebase Console:
- Firestore > Data: Should see new document in `notes` collection
- Storage > Files: Should see uploaded files in `notes/{id}/` folders

## Optional: Cloud Functions for Auto-Deletion

For production, you may want to auto-delete old notes.

### Setup Cloud Functions

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Functions:
```bash
firebase init functions
```

3. Create function in `functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Run daily at midnight
export const deleteExpiredNotes = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const db = admin.firestore();
    const storage = admin.storage();
    
    // Delete notes older than 30 days after reveal
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const expiredNotes = await db.collection('notes')
      .where('status', 'in', ['revealed', 'read'])
      .where('revealedAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
      .get();
    
    const batch = db.batch();
    const deletePromises: Promise<any>[] = [];
    
    for (const doc of expiredNotes.docs) {
      // Delete document
      batch.delete(doc.ref);
      
      // Delete associated files
      const noteData = doc.data();
      if (noteData.mediaUrls) {
        for (const url of noteData.mediaUrls) {
          const filePath = url.split('/o/')[1]?.split('?')[0];
          if (filePath) {
            deletePromises.push(
              storage.bucket().file(decodeURIComponent(filePath)).delete()
                .catch(err => console.error('Error deleting file:', err))
            );
          }
        }
      }
    }
    
    await batch.commit();
    await Promise.all(deletePromises);
    
    console.log(`Deleted ${expiredNotes.size} expired notes`);
  });
```

4. Deploy:
```bash
firebase deploy --only functions
```

## Firestore Data Structure

### Notes Collection

```typescript
{
  id: string (auto-generated document ID)
  message: string (encrypted)
  unlockTime: Timestamp
  createdAt: Timestamp
  status: "pending" | "revealed" | "read"
  senderToken: string (64-char random token)
  mediaUrls: string[]
  timezone: string
  revealedAt?: Timestamp
  readAt?: Timestamp
}
```

## Storage Structure

```
notes/
  {noteId}/
    image1.jpg
    video1.mp4
    ...
```

## Cost Estimation

Firebase free tier (Spark plan) includes:
- **Firestore**: 
  - 50K reads/day
  - 20K writes/day
  - 1 GB storage
- **Storage**: 
  - 5 GB storage
  - 1 GB download/day

For a small-to-medium app, this should be sufficient. Monitor usage in Firebase Console.

## Security Best Practices

1. **Never commit `.env` file** - Added to `.gitignore`
2. **Use security rules** - Don't rely only on client-side validation
3. **Monitor usage** - Set up billing alerts in Firebase Console
4. **Rate limiting** - Consider adding rate limits for note creation
5. **Data retention** - Implement auto-deletion of old notes
6. **HTTPS only** - Always use HTTPS in production

## Troubleshooting

### "Permission denied" errors
- Check security rules are published
- Verify rules syntax is correct
- Check browser console for specific errors

### Files not uploading
- Check file size (max 10MB)
- Verify Storage is enabled
- Check Storage security rules
- Verify CORS settings if needed

### Connection errors
- Verify `.env` file has correct values
- Check Firebase project is active
- Ensure you're using the correct project ID
- Check network connectivity

## Next Steps

After Firebase is set up:
1. Test creating a note
2. Test file uploads
3. Test viewing a note
4. Test countdown timer
5. Test sender controls
6. Deploy to production
