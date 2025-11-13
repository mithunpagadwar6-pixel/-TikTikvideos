# TikTik - Deployment Guide

## 🚀 Complete Video Sharing Platform

Your TikTik platform is now ready with working video upload, shorts upload, and live streaming functionality!

## ✅ What's Been Implemented

### Backend API (`server.js`)
- ✅ `/api/upload-video` - Upload normal videos to Firebase Storage (authenticated)
- ✅ `/api/upload-short` - Upload short videos under 60 seconds (authenticated)
- ✅ `/api/save-live-stream` - Save recorded live streams (authenticated)
- ✅ `/api/generate-upload-url` - Generate signed URLs for uploads (authenticated)
- ✅ `/api/get-config` - Serve Firebase configuration to frontend
- ✅ `/api/health` - Health check endpoint

### Frontend Features
- ✅ Video upload with preview and metadata
- ✅ Short video upload (under 60 seconds)
- ✅ Live streaming with MediaRecorder API
- ✅ Google Sign-In authentication
- ✅ Firebase Storage integration
- ✅ Progressive Web App (PWA) support

### Security
- ✅ All upload endpoints require Firebase authentication
- ✅ Token verification on every upload request
- ✅ Proper error handling for unauthorized access

## 📋 Prerequisites

Before deploying to Vercel, you need:

1. **Firebase Project** (already configured)
   - Project ID: `tiktikvideos-4e8e7`
   - Already has Authentication and Firestore enabled

2. **Firebase Admin Service Account** (required for production)
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

## 🌐 Deploy to Vercel

### Step 1: Push to GitHub
Your repository is already connected to Vercel. Push your latest changes:

```bash
git add .
git commit -m "Complete video upload implementation"
git push origin main
```

### Step 2: Configure Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

#### Required Variables:
```
NODE_ENV=production

# Firebase Client Configuration (already in your code)
FIREBASE_API_KEY=AIzaSyBlWjogX3gTipSJK31AwVw0D6KxDv3ry7Y
FIREBASE_AUTH_DOMAIN=tiktikvideos-4e8e7.firebaseapp.com
FIREBASE_PROJECT_ID=tiktikvideos-4e8e7
FIREBASE_STORAGE_BUCKET=tiktikvideos-4e8e7.appspot.com
FIREBASE_MESSAGING_SENDER_ID=918908099153
FIREBASE_APP_ID=1:918908099153:web:c03e103fc6199b37513670

# Firebase Admin (paste entire service account JSON as one line)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tiktikvideos-4e8e7",...}
```

**Important:** For `FIREBASE_SERVICE_ACCOUNT`, copy the entire contents of your downloaded service account JSON file and paste it as a single line.

### Step 3: Deploy

Vercel will automatically deploy when you push to GitHub, or you can manually deploy:

```bash
vercel --prod
```

## 🔥 Firebase Storage Rules

Make sure your Firebase Storage rules allow authenticated uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload videos
    match /videos/{videoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to upload shorts
    match /shorts/{shortId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to upload live streams
    match /livestreams/{streamId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Apply these rules in Firebase Console → Storage → Rules

## 🔐 Firebase Authentication Setup

Add your Vercel domain to Firebase authorized domains:

1. Go to Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. Add your Vercel domain: `your-app.vercel.app`

## 🧪 Testing Uploads

After deployment, test each feature:

### 1. Test Video Upload
1. Login with Google
2. Click the "+" button → "Upload Video"
3. Select a video file
4. Fill in title and description
5. Click "Publish"

### 2. Test Short Upload
1. Click "+" → "Create Short"
2. Select a video under 60 seconds
3. Fill in details and publish

### 3. Test Live Streaming
1. Click "+" → "Go Live"
2. Allow camera/microphone permissions
3. Enter stream details
4. Click "Go Live"
5. Recording will automatically save after 5 minutes (or manual stop)

## 📁 Project Structure

```
tiktik/
├── server.js              # Backend API with all endpoints
├── script.js              # Frontend JavaScript with upload logic
├── index.html             # Main HTML with Firebase SDKs
├── style.css              # Complete styling
├── sw.js                  # Service Worker for PWA
├── manifest.json          # PWA manifest
├── package.json           # Dependencies
├── vercel.json            # Vercel configuration
└── DEPLOYMENT.md          # This file
```

## 🐛 Troubleshooting

### Uploads returning 503 error
- Check that `FIREBASE_SERVICE_ACCOUNT` is properly set in Vercel environment variables
- Verify the service account JSON is valid

### Uploads returning 401 error
- Make sure user is logged in with Google
- Check that Firebase Authentication is enabled
- Verify authorized domains include your Vercel domain

### Videos not appearing after upload
- Check Firestore rules allow authenticated writes
- Verify Firebase Storage rules are configured
- Check browser console for errors

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Vercel function logs
3. Verify all environment variables are set correctly
4. Ensure Firebase services are properly configured

## 🎉 Success!

Your TikTik platform is now fully functional with:
- ✅ Video uploads to Firebase Storage
- ✅ Short video uploads
- ✅ Live streaming with recording
- ✅ Secure authentication
- ✅ Production-ready Vercel deployment

Happy streaming! 🎬
