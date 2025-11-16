# TikTik - Video Sharing Platform

A modern video sharing platform with live streaming, shorts, and admin approval system. Built with Firebase and optimized for Vercel serverless deployment.

## 🚀 Features

✅ **Video Upload** - Upload full-length videos with metadata  
✅ **Short Videos** - TikTok-style short videos (< 60 seconds)  
✅ **Live Streaming** - Stream live and save recordings  
✅ **Firebase Authentication** - Google Sign-In integration  
✅ **Admin Approval System** - All uploads require admin review before going live  
✅ **Firebase Cloud Storage** - Scalable video storage  
✅ **Firestore Database** - Real-time video metadata  
✅ **Vercel Serverless** - Production-ready serverless API endpoints  

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Vercel Serverless Functions (Node.js)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Cloud Storage
- **Database**: Firestore
- **Deployment**: Vercel

---

## 📋 Quick Start

### Prerequisites

- Node.js 20+
- Firebase project with Firestore and Cloud Storage enabled
- Vercel account
- GitHub account

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables (create .env file)
# See DEPLOYMENT.md for required variables

# Run development server
npm run dev
```

The app will run at `http://localhost:5000`

---

## 🚀 Deploy to Vercel

**Full deployment guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy TikTik to Vercel"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects configuration

3. **Set Environment Variables**
   - Required: `FIREBASE_SERVICE_ACCOUNT` (complete JSON)
   - Required: `FIREBASE_STORAGE_BUCKET`
   - Required: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID`, etc.
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for details

4. **Deploy**
   - Vercel deploys automatically
   - Check deployment logs for any errors

5. **Set Up Admin Users**
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for admin setup instructions

---

## 📡 API Endpoints

All endpoints are serverless functions in the `/api` directory:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | No | Health check |
| `/api/get-config` | GET | No | Get Firebase client config |
| `/api/upload-video` | POST | Yes | Upload full-length video |
| `/api/upload-short` | POST | Yes | Upload short video (<60s) |
| `/api/save-live-stream` | POST | Yes | Save live stream recording |
| `/api/admin/pending` | GET | Admin | Get pending videos |
| `/api/admin/approve` | POST | Admin | Approve video |
| `/api/admin/reject` | POST | Admin | Reject video |

---

## 🔒 Security

- All upload endpoints require Firebase ID token authentication
- Admin endpoints verify user admin status (custom claims, userRoles, or users collection)
- Files are uploaded using streaming to prevent memory exhaustion
- Firebase Storage Rules control file access permissions

---

## 🐛 Fixed Issues

This project fixes common Vercel deployment errors:

- ✅ **404 NOT_FOUND** - Proper routing configuration
- ✅ **500 INTERNAL_SERVER_ERROR** - Firebase Admin SDK singleton pattern
- ✅ **FUNCTION_INVOCATION_FAILED** - Prevents re-initialization errors
- ✅ **Memory exhaustion** - Streaming file uploads with busboy

---

## 📁 Project Structure

```
tiktik/
├── api/                           # Vercel serverless functions
│   ├── firebaseAdmin.js           # Firebase Admin singleton
│   ├── health.js                  # Health check
│   ├── get-config.js              # Get Firebase config
│   ├── upload-video.js            # Video upload
│   ├── upload-short.js            # Short video upload
│   ├── save-live-stream.js        # Live stream recording
│   └── admin/
│       ├── pending.js             # Get pending videos
│       ├── approve.js             # Approve video
│       └── reject.js              # Reject video
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── lib/                   # Utilities
│   │   └── App.tsx                # Main app component
│   └── index.html
├── server/                        # Express server (for local dev only)
├── shared/                        # Shared types and schemas
├── vercel.json                    # Vercel configuration
├── package.json
└── DEPLOYMENT.md                  # Comprehensive deployment guide
```

---

## 🧪 Testing

Test your deployed API endpoints:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Get Firebase config
curl https://your-app.vercel.app/api/get-config

# Upload video (requires auth token)
curl -X POST https://your-app.vercel.app/api/upload-video \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@test.mp4" \
  -F "title=Test Video" \
  -F "description=Testing"
```

---

## 📖 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide with troubleshooting
- **[design_guidelines.md](./design_guidelines.md)** - UI/UX design guidelines

---

## 🤝 Contributing

This is a production video platform. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

MIT License

---

## 📧 Support

For deployment issues or questions:

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
2. Check Vercel function logs in your Vercel dashboard
3. Verify Firebase Console for auth/storage errors
4. Open an issue on GitHub

---

## 🎉 Success Indicators

Your deployment is successful if:

- ✅ `/api/health` returns `{"status":"ok","firebase":true}`
- ✅ `/api/get-config` returns complete Firebase config
- ✅ Video uploads work without 404/500 errors
- ✅ Admin users can approve/reject videos
- ✅ Videos appear in Firebase Storage after upload
- ✅ Metadata saved in Firestore `videos` collection

---

**Built with ❤️ for video creators worldwide**
