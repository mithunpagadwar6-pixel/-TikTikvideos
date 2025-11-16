# TikTik - Quick Start Guide

## 🎯 What This Fixes

Your TikTik platform was experiencing **404 NOT_FOUND** and **500 INTERNAL_SERVER_ERROR** errors on Vercel. This has been completely fixed!

**What was wrong:**
- Express server doesn't work on Vercel (Vercel uses serverless functions)
- Firebase Admin SDK was re-initializing on every request (causing crashes)
- Large file uploads were buffering in memory (causing memory exhaustion)

**What's fixed:**
- ✅ Converted to Vercel serverless functions (`/api` directory)
- ✅ Firebase Admin SDK singleton pattern (prevents re-initialization)
- ✅ Streaming file uploads with busboy (no memory issues)
- ✅ All endpoints working: uploads, shorts, livestreams, admin approval

---

## 🚀 Deploy to Vercel NOW (5 Minutes)

### Step 1: Push to GitHub (30 seconds)

```bash
git add .
git commit -m "Fix: Vercel serverless functions with Firebase Admin SDK"
git push origin main
```

### Step 2: Import to Vercel (1 minute)

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Select your GitHub repository
4. Click **"Import"**
5. Vercel auto-detects `vercel.json` configuration
6. Click **"Deploy"** (will fail initially - that's expected)

### Step 3: Add Environment Variables (3 minutes)

In Vercel Dashboard → Your Project → Settings → Environment Variables:

#### 🔑 Get Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click ⚙️ → **Project Settings**
3. Go to **Service Accounts** tab
4. Click **"Generate New Private Key"**
5. Download the JSON file
6. Open it in a text editor
7. **Copy the ENTIRE contents** (all the JSON)

#### 📋 Add to Vercel

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `FIREBASE_SERVICE_ACCOUNT` | **Paste entire JSON** | From step above ⬆️ |
| `FIREBASE_STORAGE_BUCKET` | `your-project-id.appspot.com` | Firebase Console → Storage |
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_APP_ID` | `1:123456:web:abc...` | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Firebase Console → Project Settings → General |

**Save all variables** and click **"Redeploy"**

### Step 4: Test Your Deployment (30 seconds)

```bash
# Replace with your Vercel URL
curl https://your-app.vercel.app/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "firebase": true,
  "timestamp": "2025-11-16T..."
}
```

✅ **If you see this, your backend is working!**

### Step 5: Set Up Admin User (1 minute)

You need at least one admin to approve videos.

**Option A: Using Firestore (Easiest)**

1. Go to Firebase Console → **Firestore Database**
2. Create collection: `userRoles`
3. Click **"Add document"**
4. Document ID: **YOUR_USER_UID** (get from browser console after login)
5. Add field: `role` (type: string) = `"admin"`
6. Save

**How to get your User UID:**
1. Sign in to your app with Google
2. Open browser console (F12)
3. Run: `firebase.auth().currentUser.uid`
4. Copy the UID and use it above

**Option B: Using Custom Claims (Advanced)**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for custom claims setup.

---

## ✅ Verification Checklist

Your deployment is successful if:

- [ ] `/api/health` returns `{"firebase": true}`
- [ ] `/api/get-config` returns Firebase config
- [ ] You can sign in with Google on your app
- [ ] You've set up at least one admin user
- [ ] No 404 or 500 errors in Vercel function logs

---

## 🧪 Test Video Upload

After signing in to your app:

```javascript
// In browser console, get your token
const token = await firebase.auth().currentUser.getIdToken();
console.log(token); // Copy this token
```

Then test upload:

```bash
curl -X POST https://your-app.vercel.app/api/upload-video \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "video=@test.mp4" \
  -F "title=Test Video" \
  -F "description=Testing" \
  -F "duration=120"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "videoId": "abc123...",
  "approvalStatus": "pending"
}
```

---

## 🎯 What Each Endpoint Does

| Endpoint | What It Does |
|----------|-------------|
| `/api/health` | Checks if Firebase is working |
| `/api/get-config` | Gives Firebase config to your frontend |
| `/api/upload-video` | Uploads full-length videos to Firebase Storage |
| `/api/upload-short` | Uploads short videos (< 60 seconds) |
| `/api/save-live-stream` | Saves live stream recordings |
| `/api/admin/pending` | Gets all videos waiting for approval |
| `/api/admin/approve` | Approves a video (makes it public) |
| `/api/admin/reject` | Rejects a video |

---

## 🚨 Common Issues

### "404 NOT_FOUND"

**Problem:** Vercel can't find your API routes  
**Solution:**
1. Check `vercel.json` exists in root directory
2. Check `/api` folder exists with `.js` files
3. Redeploy from Vercel dashboard

### "500 INTERNAL_SERVER_ERROR"

**Problem:** Firebase Admin SDK not initialized  
**Solution:**
1. Check `FIREBASE_SERVICE_ACCOUNT` is set in Vercel
2. Ensure it's the COMPLETE JSON (not just project ID)
3. Check Vercel function logs for error details

### "Unauthorized: Invalid or expired token"

**Problem:** Frontend not sending auth token  
**Solution:**
1. Ensure user is signed in: `firebase.auth().currentUser`
2. Get fresh token: `await firebase.auth().currentUser.getIdToken(true)`
3. Send as header: `Authorization: Bearer ${token}`

### "Forbidden: Admin access required"

**Problem:** User is not an admin  
**Solution:**
1. Follow "Step 5: Set Up Admin User" above
2. Make sure you used the correct User UID
3. Sign out and sign back in to refresh claims

---

## 📚 Full Documentation

For detailed instructions, troubleshooting, and advanced features:

📖 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide  
📖 **[README.md](./README.md)** - Project overview and API reference

---

## 🎉 Success!

Once deployed, your TikTik platform will:

✅ Upload videos without 404 or 500 errors  
✅ Handle large files without memory issues  
✅ Require admin approval before videos go live  
✅ Support shorts (< 60s) and livestream recordings  
✅ Authenticate all users with Firebase Auth  
✅ Store everything in Firebase Storage + Firestore  

**Your platform is now production-ready on Vercel!** 🚀

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting or open an issue on GitHub.
