# TikTik - Video Sharing Platform

A modern video sharing platform with live streaming, shorts, and admin approval system. Built with Firebase and deployed on Vercel.

## 🚀 Features

✅ **Video Upload** - Upload full-length videos with metadata  
✅ **Short Videos** - TikTok-style short videos (< 60 seconds)  
✅ **Live Streaming** - Stream live with MediaRecorder API  
✅ **Firebase Authentication** - Google Sign-In integration  
✅ **Admin Approval System** - All uploads require admin review  
✅ **Firebase Cloud Storage** - Scalable video storage  
✅ **Firestore Database** - Real-time video metadata  
✅ **Vercel Serverless Functions** - Production-ready API endpoints  

## 📋 API Endpoints

- `POST /api/upload-video` - Upload full-length video
- `POST /api/upload-short` - Upload short video (<60 seconds)
- `POST /api/save-live-stream` - Save live stream recording
- `GET /api/admin/pending` - Get pending videos (admin)
- `POST /api/admin/approve` - Approve video (admin)
- `POST /api/admin/reject` - Reject video (admin)
- `GET /api/health` - Health check
- `GET /api/get-config` - Get Firebase config for frontend

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Vercel Serverless Functions (Node.js)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Cloud Storage
- **Database**: Firestore
- **Deployment**: Vercel

## 📦 Installation

```bash
# Install dependencies
npm install

# Set environment variables (see VERCEL_DEPLOYMENT_GUIDE.md)
# Required variables:
# - FIREBASE_SERVICE_ACCOUNT
# - FIREBASE_STORAGE_BUCKET
# - VITE_FIREBASE_API_KEY
# - VITE_FIREBASE_APP_ID
# - VITE_FIREBASE_PROJECT_ID

# Deploy to Vercel
vercel --prod
```

## 🔧 Development

This project uses the Replit fullstack template for development:

```bash
npm run dev  # Starts Express server + Vite dev server
```

## 📖 Documentation

See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for:
- Complete deployment instructions
- Environment variable setup
- API usage examples
- Troubleshooting guide
- Firebase Storage Rules configuration

## 🔒 Security

- All API endpoints require Firebase ID token authentication
- Files are uploaded using streaming (busboy) to prevent memory issues
- Admin endpoints should be protected with role-based access control (implement in production)
- Firebase Storage Rules control file access permissions

## 🚨 Important Fix

This project fixes the common Vercel deployment error:

```
500: INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED
Error: Firebase app already exists
```

**Solution**: Firebase Admin SDK singleton pattern in `api/firebaseAdmin.ts` prevents re-initialization on every serverless function invocation.

## 📝 License

MIT License

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📧 Support

For issues or questions, please check the [Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md) or open an issue on GitHub.
