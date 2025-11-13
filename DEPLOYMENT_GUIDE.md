# 🚀 TikTik Vercel Deployment Guide

## Complete Production Deployment Instructions

### ✅ What's Included

Your TikTik platform has:
1. **🔴 Live Streaming** - MediaRecorder API with auto-save
2. **🎬 Video Upload** - Full video uploads with Firebase Storage
3. **🎥 Short Videos** - Under 60 seconds, optimized uploads
4. **🔐 Secure Authentication** - Firebase Auth with Google Sign-In
5. **📦 Firebase Storage** - Admin SDK for secure server-side uploads

---

## 📋 Pre-Deployment Checklist

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `tiktikvideos-4e8e7`
3. Click ⚙️ **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file
6. **Important**: You'll paste this entire JSON content into Vercel

### 2. Enable Firebase Services

Make sure these are enabled in Firebase Console:
- ✅ **Authentication** → Google Sign-In enabled
- ✅ **Storage** → Storage bucket created
- ✅ **Firestore** → Database created (optional, for metadata)

---

## 🌐 Vercel Deployment Steps

### Step 1: Connect GitHub to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will detect it as a Node.js project

### Step 2: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

#### **Required Variables:**

```bash
# Firebase Client Configuration (Public - Safe to expose)
FIREBASE_API_KEY=AIzaSyBlWjogX3gTipSJK31AwVw0D6KxDv3ry7Y
FIREBASE_AUTH_DOMAIN=tiktikvideos-4e8e7.firebaseapp.com
FIREBASE_PROJECT_ID=tiktikvideos-4e8e7
FIREBASE_STORAGE_BUCKET=tiktikvideos-4e8e7.appspot.com
FIREBASE_MESSAGING_SENDER_ID=918908099153
FIREBASE_APP_ID=1:918908099153:web:c03e103fc6199b37513670

# Firebase Admin Service Account (PRIVATE - Keep Secret!)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tiktikvideos-4e8e7","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

#### **How to Add Service Account:**

1. Open the downloaded service account JSON file
2. Copy the **ENTIRE** JSON content (it's one long line)
3. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT`

**Example:**
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tiktikvideos-4e8e7",...}
```

⚠️ **Important**: The code automatically handles `\n` newlines using `.replace(/\\n/g, '\n')` so Vercel's environment variable format works correctly.

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Once deployed, you'll get a URL like: `https://your-app.vercel.app`

---

## 🔍 Verify Deployment

### Check Backend Status

Visit: `https://your-app.vercel.app/api/health`

**Expected Response:**
```json
{
  "status": "ok",
  "firebase": true,
  "timestamp": "2025-11-13T20:30:00.000Z"
}
```

If `"firebase": false`, check your environment variables.

### Check Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment → **"View Function Logs"**
3. Look for:
   - ✅ `Firebase Admin initialized successfully`
   - ✅ `Storage bucket: tiktikvideos-4e8e7.appspot.com`

### Test Upload

1. Visit your deployed URL
2. Click **"Login with Google"**
3. Click **"+"** → **"Upload Video"**
4. Select a video file
5. Should see: ✅ Video uploaded successfully

---

## 🔥 Firebase Storage Rules

Add these security rules in Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload videos
    match /videos/{videoId} {
      allow read: if true;
      allow write: if request.auth != null 
                  && request.resource.size < 500 * 1024 * 1024;
    }
    
    // Allow authenticated users to upload shorts
    match /shorts/{shortId} {
      allow read: if true;
      allow write: if request.auth != null 
                  && request.resource.size < 100 * 1024 * 1024;
    }
    
    // Allow authenticated users to upload live streams
    match /livestreams/{streamId} {
      allow read: if true;
      allow write: if request.auth != null 
                  && request.resource.size < 500 * 1024 * 1024;
    }
  }
}
```

Click **"Publish"** to apply rules.

---

## 🎯 Testing All Features

### 1. Test Video Upload
```
1. Login with Google
2. Click "+" → "Upload Video"
3. Select a video file
4. Fill title, description, category
5. Click "Publish"
6. ✅ Should see success message and video in "My Channel"
```

### 2. Test Short Video
```
1. Click "+" → "Create Short"
2. Select video under 60 seconds
3. Fill details
4. Click "Publish"
5. ✅ Should upload to /shorts/ folder
```

### 3. Test Live Streaming
```
1. Click "+" → "Go Live"
2. Allow camera/microphone permissions
3. Enter stream title
4. Click "Go Live"
5. Stream for a few seconds
6. Click "End Stream"
7. ✅ Recording should save to /livestreams/ folder
```

---

## 🐛 Troubleshooting

### Error: "Serverless Function has crashed"

**Cause**: Firebase Service Account not properly configured

**Fix**:
1. Check environment variable `FIREBASE_SERVICE_ACCOUNT` exists
2. Make sure it's valid JSON
3. Verify the private key has proper line breaks
4. Redeploy after fixing

### Error: "503 Service Unavailable"

**Cause**: Firebase Admin not initialized

**Fix**:
1. Verify all environment variables are set
2. Check Vercel function logs for initialization errors
3. Ensure service account has Storage Admin permissions

### Error: "401 Unauthorized"

**Cause**: User not logged in or token expired

**Fix**:
1. Make sure user is logged in with Google
2. Check Firebase Authentication is enabled
3. Add Vercel domain to Firebase authorized domains:
   - Firebase Console → Authentication → Settings
   - Add: `your-app.vercel.app`

### Videos not uploading

**Cause**: Storage rules or bucket permissions

**Fix**:
1. Check Firebase Storage rules (see above)
2. Verify storage bucket name matches in environment variables
3. Ensure service account has `Storage Object Admin` role

---

## 📊 API Endpoints Reference

### GET `/api/get-config`
Returns Firebase client configuration

**Response:**
```json
{
  "firebase": {
    "apiKey": "...",
    "authDomain": "...",
    "projectId": "...",
    "storageBucket": "...",
    "messagingSenderId": "...",
    "appId": "..."
  }
}
```

### POST `/api/upload-video`
Upload regular video

**Headers:**
- `Authorization: Bearer <firebase-id-token>`

**Body:** FormData
- `video`: File
- `userId`: String
- `title`: String

**Response:**
```json
{
  "success": true,
  "videoUrl": "https://storage.googleapis.com/...",
  "filename": "videos/1234567890_video.mp4"
}
```

### POST `/api/upload-short`
Upload short video (<60s)

**Same format as `/api/upload-video`**

### POST `/api/save-live-stream`
Save live stream recording

**Same format as `/api/upload-video`**

### GET `/api/health`
Health check

**Response:**
```json
{
  "status": "ok",
  "firebase": true,
  "timestamp": "2025-11-13T20:30:00.000Z"
}
```

---

## ✅ Production Checklist

Before going live:

- [ ] Firebase Service Account configured in Vercel
- [ ] All environment variables set correctly
- [ ] Firebase Storage rules published
- [ ] Firebase Authentication enabled
- [ ] Vercel domain added to Firebase authorized domains
- [ ] Test video upload works
- [ ] Test short video upload works
- [ ] Test live streaming works
- [ ] Check `/api/health` returns `"firebase": true`
- [ ] Review Vercel function logs for errors

---

## 🎉 Success Indicators

When everything works correctly, you'll see:

**In Vercel Logs:**
```
✅ Firebase Admin initialized successfully
🔥 Storage bucket: tiktikvideos-4e8e7.appspot.com
📤 Uploading video: test.mp4
✅ Video uploaded successfully: https://storage.googleapis.com/...
```

**In Browser:**
```
Firebase initialized successfully
User signed in: user@gmail.com
📤 Uploading video: test.mp4 Size: 15.23 MB
✅ Video uploaded successfully
```

---

## 🔒 Security Notes

1. **Never commit** `FIREBASE_SERVICE_ACCOUNT` to GitHub
2. Keep the service account JSON file secure
3. Use Firebase Storage rules to restrict uploads
4. Verify ID tokens on every upload (already implemented)
5. Set file size limits in multer config (already set to 500MB)

---

## 💡 Tips

- **Upload Progress**: Frontend shows real-time upload progress
- **File Size**: Videos up to 500MB supported
- **Formats**: Supports all common video formats (MP4, WebM, MOV, etc.)
- **Live Streaming**: Uses MediaRecorder API (works in Chrome, Edge, Firefox)
- **Offline Support**: PWA service worker caches static assets

---

## 📞 Support

If you encounter issues:
1. Check Vercel function logs
2. Verify Firebase Console for service status
3. Test `/api/health` endpoint
4. Check browser console for errors

---

**Made with ❤️ for TikTik Video Platform**
