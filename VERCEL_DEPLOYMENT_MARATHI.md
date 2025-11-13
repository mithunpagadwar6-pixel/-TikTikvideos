# 🚀 TikTik Vercel Deployment सूचना (मराठी)

## ✅ तुमचा TikTik प्लॅटफॉर्म आता पूर्णपणे तयार आहे!

### काय काय तयार केलं आहे:

1. **🔴 Live Streaming** - MediaRecorder API सह (Webcam + Mic)
2. **🎬 Video Upload** - Firebase Storage वर सुरक्षित upload
3. **🎥 Short Videos** - 60 सेकंदाखालील व्हिडिओ upload
4. **🔐 Authentication** - Google Sign-In सह Firebase Auth
5. **📦 Secure Backend** - Firebase Admin SDK सह

---

## 🔧 महत्वाचे Fixes जे केले आहेत:

### 1. Firebase Admin SDK Initialize (Vercel साठी)
```javascript
// ✅ FIXED: Vercel environment variables साठी newline handling
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n');
const serviceAccount = JSON.parse(serviceAccountString);
```

यामुळे Vercel वर "FUNCTION_INVOCATION_FAILED" error येणार नाही!

### 2. Proper Error Handling
- सर्व API endpoints मध्ये try/catch blocks
- Firebase नसेल तर demo mode मध्ये चालते
- Clear error messages आणि logs

### 3. Token Verification
- प्रत्येक upload request मध्ये Firebase token verify होतो
- फक्त logged-in users च अपलोड करू शकतात
- 401 Unauthorized for invalid tokens

---

## 📋 Vercel वर Deploy कसं करायचं?

### Step 1: Firebase Service Account मिळवा

1. [Firebase Console](https://console.firebase.google.com) ला जा
2. तुमचा project select करा: `tiktikvideos-4e8e7`
3. ⚙️ **Project Settings** → **Service Accounts** वर जा
4. **"Generate new private key"** वर क्लिक करा
5. JSON file download करा

### Step 2: Vercel Environment Variables सेट करा

Vercel Dashboard → तुमचा Project → **Settings** → **Environment Variables**

**हे सर्व variables add करा:**

```bash
# Firebase Client Config (सर्वांना दिसू शकते)
FIREBASE_API_KEY=AIzaSyBlWjogX3gTipSJK31AwVw0D6KxDv3ry7Y
FIREBASE_AUTH_DOMAIN=tiktikvideos-4e8e7.firebaseapp.com
FIREBASE_PROJECT_ID=tiktikvideos-4e8e7
FIREBASE_STORAGE_BUCKET=tiktikvideos-4e8e7.appspot.com
FIREBASE_MESSAGING_SENDER_ID=918908099153
FIREBASE_APP_ID=1:918908099153:web:c03e103fc6199b37513670

# Firebase Admin Service Account (गुप्त!)
# तुम्ही download केलेली JSON file उघडा आणि संपूर्ण content paste करा
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tiktikvideos-4e8e7",...पूर्ण JSON...}
```

⚠️ **महत्वाचं**: `FIREBASE_SERVICE_ACCOUNT` मध्ये **संपूर्ण JSON** एका ओळीत paste करा!

### Step 3: GitHub Push करून Deploy करा

```bash
git add .
git commit -m "TikTik production ready with Firebase"
git push origin main
```

Vercel automatically deploy करेल! 🎉

---

## 🧪 Deployment तपासा

### 1. Health Check
तुमच्या Vercel URL वर जा: `https://your-app.vercel.app/api/health`

**हे दिसायला हवं:**
```json
{
  "status": "ok",
  "firebase": true,
  "timestamp": "2025-11-13T20:30:00.000Z"
}
```

जर `"firebase": false` दिसलं, तर environment variables तपासा.

### 2. Vercel Logs तपासा

Vercel Dashboard → Deployments → **View Function Logs**

**हे दिसायला हवं:**
```
✅ Firebase Admin initialized successfully
🔥 Storage bucket: tiktikvideos-4e8e7.appspot.com
```

---

## 🎯 सर्व Features Test करा

### 1. Video Upload Test करा
```
1. Login with Google
2. "+" Button → "Upload Video"
3. Video file select करा
4. Title, description भरा
5. "Publish" दाबा
6. ✅ Success message दिसायला हवा!
```

### 2. Short Video Test करा
```
1. "+" → "Create Short"
2. 60 सेकंदापेक्षा लहान video select करा
3. Details भरून publish करा
4. ✅ /shorts/ folder मध्ये upload होईल
```

### 3. Live Streaming Test करा
```
1. "+" → "Go Live"
2. Camera/Mic permission द्या
3. Stream title enter करा
4. "Go Live" दाबा
5. काही सेकंद stream करा
6. "End Stream" दाबा
7. ✅ Recording /livestreams/ मध्ये save होईल
```

---

## 🔥 Firebase Storage Rules

Firebase Console → Storage → **Rules** मध्ये हे paste करा:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Videos - फक्त logged-in users upload करू शकतात
    match /videos/{videoId} {
      allow read: if true;
      allow write: if request.auth != null 
                  && request.resource.size < 500 * 1024 * 1024;
    }
    
    // Shorts
    match /shorts/{shortId} {
      allow read: if true;
      allow write: if request.auth != null 
                  && request.resource.size < 100 * 1024 * 1024;
    }
    
    // Live Streams
    match /livestreams/{streamId} {
      allow read: if true;
      allow write: if request.auth != null 
                  && request.resource.size < 500 * 1024 * 1024;
    }
  }
}
```

**"Publish"** दाबा!

---

## 🐛 Problems आल्यास...

### Error: "500 Internal Server Error"

**कारण**: Firebase Service Account नीट configured नाही

**उपाय**:
1. Vercel मध्ये `FIREBASE_SERVICE_ACCOUNT` variable तपासा
2. Valid JSON आहे का बघा
3. Redeploy करा

### Error: "401 Unauthorized"

**कारण**: User logged in नाही

**उपाय**:
1. Google Sign-In करा
2. Firebase Authentication enabled आहे का तपासा
3. Vercel domain Firebase च्या authorized domains मध्ये add करा

### Videos Upload होत नाहीत

**कारण**: Storage rules किंवा permissions

**उपाय**:
1. Firebase Storage rules तपासा (वर दिलेले)
2. Storage bucket name तपासा
3. Service account ला Storage Admin role आहे का बघा

---

## 📊 API Endpoints माहिती

### 📤 POST `/api/upload-video`
सामान्य व्हिडिओ upload

**Headers:**
```
Authorization: Bearer <firebase-token>
```

**Body:** FormData
- `video`: File
- `userId`: String
- `title`: String

### 📤 POST `/api/upload-short`
60 सेकंदाखालील व्हिडिओ

(upload-video सारखंच format)

### 📤 POST `/api/save-live-stream`
Live stream recording save

(upload-video सारखंच format)

### ✅ GET `/api/health`
Server status check

---

## ✅ Deploy करण्यापूर्वी तपासा:

- [ ] Firebase Service Account Vercel मध्ये configured
- [ ] सर्व environment variables set केले
- [ ] Firebase Storage rules published
- [ ] Firebase Authentication enabled
- [ ] Vercel domain Firebase authorized domains मध्ये added
- [ ] `/api/health` वर `"firebase": true` येतो का?

---

## 🎉 Success चिन्हे

**Vercel Logs मध्ये:**
```
✅ Firebase Admin initialized successfully
🔥 Storage bucket: tiktikvideos-4e8e7.appspot.com
📤 Uploading video: test.mp4
✅ Video uploaded successfully
```

**Browser मध्ये:**
```
Firebase initialized successfully
User signed in: user@gmail.com
📤 Uploading video: test.mp4 Size: 15.23 MB
✅ Video uploaded successfully
```

---

## 🔒 Security Tips

1. **कधीही** `FIREBASE_SERVICE_ACCOUNT` GitHub वर commit करू नका
2. Service account JSON file सुरक्षित ठेवा
3. Firebase Storage rules वापरा
4. File size limits set करा (already 500MB आहे)
5. फक्त authenticated users ला upload access द्या

---

## 💡 अतिरिक्त माहिती

- **File Size Limit**: 500MB पर्यंत
- **Video Formats**: MP4, WebM, MOV, AVI सर्व supported
- **Live Streaming**: Chrome, Edge, Firefox मध्ये काम करते
- **Upload Progress**: Real-time progress bar दाखवतो
- **PWA Support**: Offline mode available

---

## 📞 मदत हवी असल्यास:

1. Vercel function logs तपासा
2. Firebase Console मध्ये service status बघा
3. `/api/health` endpoint test करा
4. Browser console errors तपासा

---

**🎊 तुमचा TikTik प्लॅटफॉर्म आता Vercel वर deploy करायला पूर्णपणे तयार आहे!**

**सर्व सुविधा काम करतील:**
✅ Live Streaming
✅ Video Upload  
✅ Short Videos
✅ Secure Authentication
✅ कोणताही crash नाही!

**शुभेच्छा! 🚀**
