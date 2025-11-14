# TikTik - Quick Start Guide

## 🎯 What's Fixed

Your TikTik platform experienced "500: INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED" on Vercel. This has been fixed with:

1. ✅ **Firebase Admin SDK Singleton** - Prevents re-initialization errors on serverless functions
2. ✅ **Streaming File Uploads** - No memory buffering, prevents Vercel memory exhaustion
3. ✅ **Admin Role Verification** - Strict role-based access control for content moderation
4. ✅ **All API Endpoints** - Complete implementation for uploads, shorts, livestreams, and admin approval

## 🚀 Deploy to Vercel in 5 Steps

### 1. Copy API Files to Your GitHub Repository

```bash
# Copy these files/folders to your GitHub repo root:
/api                          # All serverless function endpoints
/vercel.json                  # Vercel configuration
/scripts                      # Admin setup scripts (optional)
```

### 2. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables:

```bash
# Admin SDK Service Account (REQUIRED)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tiktikvideos-4e8e7",...}

# Storage Bucket (REQUIRED)
FIREBASE_STORAGE_BUCKET=tiktikvideos-4e8e7.appspot.com

# Client-Side Config (REQUIRED - safe for public)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_APP_ID=1:918908099153:web:...
VITE_FIREBASE_PROJECT_ID=tiktikvideos-4e8e7
```

**Where to get FIREBASE_SERVICE_ACCOUNT:**
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the entire JSON contents
4. Paste as Vercel environment variable

### 3. Update Your Frontend Upload Code

Replace client-side Firebase Storage uploads with API calls:

```javascript
// OLD (causes 500 errors):
// const uploadTask = storage.ref(`videos/${userId}/${filename}`).put(file);

// NEW (works on Vercel):
async function uploadVideo(file, title, description) {
  const user = firebase.auth().currentUser;
  const idToken = await user.getIdToken();
  
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', title);
  formData.append('description', description);
  
  const response = await fetch('/api/upload-video', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${idToken}` },
    body: formData
  });
  
  return await response.json();
}
```

### 4. Set Up Admin Users

Choose one method:

**Option A: Using Setup Script**
```bash
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
npx tsx scripts/setup-admin.ts YOUR_USER_UID
```

**Option B: Manual in Firestore**
1. Firebase Console → Firestore Database
2. Create collection: `userRoles`
3. Create document with ID = your user UID
4. Add field: `role` = `"admin"`

### 5. Deploy

```bash
git add .
git commit -m "Fix: Vercel serverless functions for TikTik"
git push origin main
```

Vercel will auto-deploy. Check deployment logs for any errors.

## 🧪 Test Your Deployment

### Test Health Check
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

### Test Video Upload
1. Sign in with Google on your frontend
2. Open browser console: `const token = await firebase.auth().currentUser.getIdToken(); console.log(token);`
3. Test API:

```bash
curl -X POST https://your-app.vercel.app/api/upload-video \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@test.mp4" \
  -F "title=Test Video" \
  -F "description=Testing upload"
```

### Test Admin Approval
```bash
curl https://your-app.vercel.app/api/admin/pending \
  -H "Authorization: Bearer ADMIN_USER_TOKEN"
```

## 📁 File Structure

```
your-repo/
├── api/
│   ├── firebaseAdmin.ts          # Firebase Admin singleton
│   ├── upload-video.ts            # Video upload endpoint
│   ├── upload-short.ts            # Short video endpoint (<60s)
│   ├── save-live-stream.ts        # Live stream recording
│   ├── admin/
│   │   ├── approve.ts             # Approve video
│   │   ├── reject.ts              # Reject video
│   │   └── pending.ts             # Get pending videos
│   ├── health.ts                  # Health check
│   └── get-config.ts              # Get Firebase config
├── vercel.json                    # Vercel configuration
├── public/                        # Your existing HTML/CSS/JS
│   ├── index.html
│   ├── style.css
│   └── script.js
└── scripts/
    ├── setup-admin.ts             # Admin setup script
    └── README.md
```

## 🔧 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | No | Health check |
| `/api/get-config` | GET | No | Get Firebase client config |
| `/api/upload-video` | POST | Yes | Upload full video |
| `/api/upload-short` | POST | Yes | Upload short (<60s) |
| `/api/save-live-stream` | POST | Yes | Save livestream recording |
| `/api/admin/pending` | GET | Admin | Get pending videos |
| `/api/admin/approve` | POST | Admin | Approve video |
| `/api/admin/reject` | POST | Admin | Reject video |

## 🆘 Troubleshooting

### "500: FUNCTION_INVOCATION_FAILED"
- ✅ **FIXED** - Firebase Admin singleton prevents this

### "Unauthorized: No token provided"
- Ensure `Authorization: Bearer <token>` header is sent
- Get token: `await firebase.auth().currentUser.getIdToken()`

### "Forbidden: Admin access required"
- User is not an admin
- Run admin setup script or manually add to Firestore

### Videos not appearing in Firebase Storage
- Check `FIREBASE_STORAGE_BUCKET` environment variable
- Verify Firebase Storage Rules allow writes from authenticated users

### Large video uploads timing out
- Check Vercel function timeout limits (max 60s on Hobby plan)
- Consider upgrading Vercel plan or using resumable uploads

## 📖 Full Documentation

- **Detailed Deployment Guide**: See `VERCEL_DEPLOYMENT_GUIDE.md`
- **Admin Setup**: See `scripts/README.md`
- **Project Overview**: See `README.md`

## 🎉 Success!

Once deployed, your TikTik platform will:
- ✅ Upload videos without 500 errors
- ✅ Stream files efficiently without memory issues
- ✅ Require admin approval before videos go live
- ✅ Support shorts (<60s) and livestream recordings
- ✅ Authenticate all users with Firebase Auth

All features are production-ready for Vercel deployment!
