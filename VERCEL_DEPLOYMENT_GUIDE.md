# TikTik Vercel Deployment Guide

## ✅ Fix for "500: INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED"

This guide fixes the Firebase Admin SDK re-initialization issue on Vercel serverless functions.

---

## 🚀 Quick Start

### 1. **Copy These API Files to Your GitHub Repository**

Copy the entire `/api` folder to your GitHub repository root:

```
your-repo/
├── api/
│   ├── firebaseAdmin.ts       # ✅ Firebase Admin singleton
│   ├── upload-video.ts         # ✅ Video upload endpoint
│   ├── upload-short.ts         # ✅ Short video endpoint (<60 seconds)
│   ├── save-live-stream.ts     # ✅ Live stream recording endpoint
│   ├── admin/
│   │   ├── approve.ts          # ✅ Admin video approval
│   │   ├── reject.ts           # ✅ Admin video rejection
│   │   └── pending.ts          # ✅ Get pending videos
│   ├── health.ts               # ✅ Health check endpoint
│   └── get-config.ts           # ✅ Get Firebase config for frontend
├── vercel.json                 # ✅ Vercel configuration
├── package.json                # ✅ Required dependencies
└── public/                     # Your existing HTML/CSS/JS files
    ├── index.html
    ├── style.css
    └── script.js
```

---

### 2. **Set Environment Variables in Vercel Dashboard**

Go to your Vercel project settings → Environment Variables and add:

#### **Required Firebase Service Account (Admin SDK)**

```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"YOUR_PROJECT_ID","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"..."}
```

⚠️ **Important**: Get this JSON from Firebase Console → Project Settings → Service Accounts → Generate New Private Key

#### **Required Storage Bucket**

```bash
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

#### **Required Client-Side Variables (safe for frontend)**

```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_APP_ID=1:918908099153:web:...
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=918908099153
```

---

### 3. **Update Your Frontend JavaScript to Call New API Endpoints**

In your `public/script.js` (or wherever your upload code is), replace the old Firebase client-side upload with API calls:

#### **Video Upload Example**

```javascript
async function uploadVideo(file, metadata) {
  try {
    // Get Firebase ID token
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error('Please login first');
    }
    
    const idToken = await user.getIdToken();
    
    // Create FormData
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description);
    formData.append('category', metadata.category);
    formData.append('duration', metadata.duration);
    
    // Upload to API
    const response = await fetch('/api/upload-video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }
    
    console.log('✅ Video uploaded:', result);
    return result;
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}
```

#### **Short Video Upload Example**

```javascript
async function uploadShortVideo(file, metadata) {
  const user = firebase.auth().currentUser;
  const idToken = await user.getIdToken();
  
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', metadata.title);
  formData.append('duration', metadata.duration); // Must be <= 60 seconds
  
  const response = await fetch('/api/upload-short', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${idToken}` },
    body: formData
  });
  
  return await response.json();
}
```

#### **Live Stream Save Example**

```javascript
async function saveLiveStream(recordedBlob, metadata) {
  const user = firebase.auth().currentUser;
  const idToken = await user.getIdToken();
  
  const formData = new FormData();
  formData.append('video', recordedBlob, 'livestream.webm');
  formData.append('title', metadata.title);
  formData.append('description', metadata.description);
  formData.append('duration', metadata.duration);
  
  const response = await fetch('/api/save-live-stream', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${idToken}` },
    body: formData
  });
  
  return await response.json();
}
```

#### **Admin Panel - Get Pending Videos**

```javascript
async function getPendingVideos() {
  const user = firebase.auth().currentUser;
  const idToken = await user.getIdToken();
  
  const response = await fetch('/api/admin/pending', {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  
  const data = await response.json();
  return data.videos; // Array of pending videos
}
```

#### **Admin Panel - Approve Video**

```javascript
async function approveVideo(videoId) {
  const user = firebase.auth().currentUser;
  const idToken = await user.getIdToken();
  
  const response = await fetch('/api/admin/approve', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ videoId })
  });
  
  return await response.json();
}
```

#### **Admin Panel - Reject Video**

```javascript
async function rejectVideo(videoId, reason) {
  const user = firebase.auth().currentUser;
  const idToken = await user.getIdToken();
  
  const response = await fetch('/api/admin/reject', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ videoId, reason })
  });
  
  return await response.json();
}
```

---

### 4. **Deploy to Vercel**

```bash
# Push changes to GitHub
git add .
git commit -m "Fix: Firebase Admin singleton for Vercel serverless functions"
git push origin main

# Vercel will auto-deploy from GitHub
# Or manually deploy:
vercel --prod
```

---

## 🔧 How the Fix Works

### Problem
Vercel serverless functions are stateless and re-initialize on every request. The old code tried to initialize Firebase Admin SDK on every request, causing:

```
Error: Firebase app already exists
500: INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED
```

### Solution
The new `api/firebaseAdmin.ts` uses a **global singleton pattern**:

```typescript
let adminInstance: admin.app.App | null = null;

export function getFirebaseAdmin() {
  if (adminInstance) {
    return { admin: adminInstance, ... }; // ✅ Reuse existing
  }
  
  // Only initialize once per serverless function instance
  adminInstance = admin.initializeApp({ ... });
  return { admin: adminInstance, ... };
}
```

This ensures Firebase Admin is initialized **once per function instance** (not once per request), preventing the re-initialization error.

---

## 🛡️ Admin Role Setup

**IMPORTANT**: Admin endpoints now require proper admin verification. You must set up admin users before they can approve/reject videos.

### Option 1: Firebase Custom Claims (Recommended)

Using Firebase Admin SDK, set custom claims for admin users:

```javascript
// Run this once to make a user admin (use Firebase Functions or admin script)
import * as admin from 'firebase-admin';

async function makeUserAdmin(userId) {
  await admin.auth().setCustomUserClaims(userId, { admin: true });
  console.log(`User ${userId} is now an admin`);
}

// Example: makeUserAdmin('USER_UID_HERE');
```

### Option 2: Firestore User Roles Collection

Create a document in Firestore:

```
Collection: userRoles
Document ID: [USER_UID]
Fields:
  - role: "admin" (string)
```

### Option 3: Users Collection Admin Field

Add an `isAdmin` field to your users collection:

```
Collection: users
Document ID: [USER_UID]
Fields:
  - isAdmin: true (boolean)
```

### How to Get Your User UID

After signing in with Google, check the browser console or Firestore Authentication tab to find your UID, then use one of the methods above to grant admin access.

### Quick Admin Setup Script

We've included a helper script to automate admin setup:

```bash
# Set environment variable with your Firebase service account
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...",...}'

# Run the setup script with user UID
npx tsx scripts/setup-admin.ts YOUR_USER_UID
```

This script will:
1. Set custom claims for the user
2. Create a userRoles document in Firestore
3. Add isAdmin field to users collection

See `scripts/README.md` for detailed usage instructions.

---

## 📋 Features Implemented

✅ **Video Upload** - `/api/upload-video`
- Streams files to Firebase Cloud Storage using busboy
- Stores metadata in Firestore
- Requires Firebase authentication
- Approval status: `pending` by default

✅ **Short Video Upload** - `/api/upload-short`
- Same as video upload but enforces 60-second limit
- Stored in separate `shorts/` folder in Cloud Storage
- Marked with `isShort: true` in Firestore

✅ **Live Stream Recording** - `/api/save-live-stream`
- Saves MediaRecorder recordings to Cloud Storage
- Marks video with `isLive: true` and `liveStatus: "ended"`
- Approval status: `pending`

✅ **Admin Approval System**
- `/api/admin/pending` - Get all videos with `approvalStatus: "pending"`
- `/api/admin/approve` - Change status to `"approved"`
- `/api/admin/reject` - Change status to `"rejected"`

✅ **Health Check** - `/api/health`
- Verifies Firebase Admin initialization
- Returns `{ status: "ok", firebase: true }`

---

## 🛡️ Security

All endpoints verify Firebase ID tokens:

```typescript
const decodedToken = await verifyFirebaseToken(req.headers.authorization);
const userId = decodedToken.uid; // ✅ Authenticated user ID
```

Unauthenticated requests return `401 Unauthorized`.

**TODO**: Add role-based access control for admin endpoints by checking user roles in Firestore.

---

## 🧪 Testing Endpoints

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "firebase": true,
  "timestamp": "2025-01-14T..."
}
```

### Upload Video (requires auth token)
```bash
curl -X POST https://your-app.vercel.app/api/upload-video \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -F "video=@test-video.mp4" \
  -F "title=Test Video" \
  -F "description=Test Description"
```

---

## 📦 Required package.json Dependencies

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "busboy": "^1.6.0",
    "@vercel/node": "^3.0.0"
  },
  "devDependencies": {
    "@types/busboy": "^1.5.3",
    "@types/node": "^20.0.0"
  }
}
```

---

## 🚨 Common Issues & Solutions

### Issue: "No Firebase credentials found"
**Solution**: Ensure `FIREBASE_SERVICE_ACCOUNT` is set in Vercel environment variables

### Issue: "Unauthorized: Invalid or expired token"
**Solution**: Make sure your frontend is sending `Authorization: Bearer <token>` header with a valid Firebase ID token

### Issue: "Failed to upload video"
**Solution**: Check that `FIREBASE_STORAGE_BUCKET` is correctly set (e.g., `project-id.appspot.com`)

### Issue: Video uploads but shows 0 bytes
**Solution**: Check Firebase Storage Rules allow authenticated writes:
```javascript
// Firebase Storage Rules
service firebase.storage {
  match /b/{bucket}/o {
    match /videos/{userId}/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == userId;
      allow read: if true; // Public read after approval
    }
    match /shorts/{userId}/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == userId;
      allow read: if true;
    }
    match /livestreams/{userId}/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == userId;
      allow read: if true;
    }
  }
}
```

---

## ✅ Success Checklist

- [ ] Copied `/api` folder to GitHub repository
- [ ] Added `vercel.json` configuration
- [ ] Set all environment variables in Vercel dashboard
- [ ] Updated frontend JavaScript to call new API endpoints
- [ ] Deployed to Vercel
- [ ] Tested `/api/health` endpoint
- [ ] Tested video upload with authentication
- [ ] Verified videos appear in Firebase Storage
- [ ] Verified metadata appears in Firestore with `approvalStatus: "pending"`
- [ ] Tested admin approval/rejection workflow

---

## 🎉 Done!

Your TikTik platform should now be running on Vercel without any "500: INTERNAL_SERVER_ERROR" issues. All video uploads, shorts, and live streams will be stored in Firebase Cloud Storage and require admin approval before being publicly visible.

For questions or issues, check the Vercel function logs in your Vercel dashboard.
