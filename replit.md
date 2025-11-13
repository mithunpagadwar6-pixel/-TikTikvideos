# TikTik Video Sharing Platform

## Overview

TikTik is a Progressive Web Application (PWA) that provides a complete video sharing platform similar to YouTube. The application enables users to upload videos, create shorts, do live streaming, watch content, search, and interact with videos. Built with vanilla JavaScript on the frontend and Express.js on the backend, it leverages Firebase for authentication, data storage, and file hosting. The platform supports offline functionality, dark/light themes, and can be installed on mobile devices for a native-like experience.

**Status:** ✅ Production Ready - All upload features fully implemented and tested

## Recent Updates - November 13, 2025

### Complete Video Upload Implementation
- ✅ **Backend API**: Created complete Express.js server with Firebase Admin SDK integration
- ✅ **Video Uploads**: Implemented `/api/upload-video` endpoint with multipart/form-data handling
- ✅ **Short Videos**: Implemented `/api/upload-short` endpoint for videos under 60 seconds
- ✅ **Live Streaming**: Implemented `/api/save-live-stream` endpoint for MediaRecorder recordings
- ✅ **Authentication**: All upload endpoints now require Firebase authentication tokens
- ✅ **Security**: Removed demo-user fallback, enforcing proper authentication
- ✅ **Vercel Ready**: Configured for serverless deployment with proper Express app export
- ✅ **Frontend Integration**: Updated all upload functions to use new API endpoints with auth tokens

### Backend Architecture (`server.js`)

**Express.js API Endpoints**
- `GET /api/get-config` - Serves Firebase configuration to frontend
- `POST /api/upload-video` - Uploads normal videos to Firebase Storage (authenticated)
- `POST /api/upload-short` - Uploads short videos to Firebase Storage (authenticated)
- `POST /api/save-live-stream` - Saves live stream recordings to Firebase Storage (authenticated)
- `POST /api/generate-upload-url` - Generates signed URLs for uploads (authenticated)
- `GET /api/health` - Health check endpoint

**Firebase Admin SDK**
- Server-side Firebase initialization with service account credentials
- Firebase Storage bucket management for video uploads
- Token verification for authenticated requests
- Graceful handling when credentials are not configured

**Security Features**
- Bearer token authentication on all upload endpoints
- Firebase ID token verification using Firebase Admin SDK
- Proper error responses (401 for unauthorized, 503 for service unavailable)
- No demo-user fallback in production

**Vercel Deployment**
- Exports Express app for serverless functions
- Conditional `app.listen` for local development only
- Compatible with `@vercel/node` runtime
- Proper routing configuration in `vercel.json`

### Frontend Architecture

**Upload Functionality**
- `uploadVideoToR2()` - Uploads normal videos with Firebase authentication
- `uploadShortVideo()` - Uploads short videos with proper categorization
- `saveLiveStreamRecording()` - Saves MediaRecorder recordings as live streams
- All functions send Firebase ID tokens in Authorization headers
- Proper error handling and user feedback

**Firebase SDKs**
- Firebase App (v10.7.1 compat)
- Firebase Auth (v10.7.1 compat)
- Firebase Firestore (v10.7.1 compat)
- Firebase Storage (v10.7.1 compat) - Added for upload functionality

**Live Streaming**
- MediaRecorder API for recording camera/microphone
- Support for VP9 and VP8 codecs
- Automatic recording and upload after stream ends
- Real-time status updates during streaming

### Data Storage Solutions

**Firebase Firestore**
- Video metadata storage (title, description, category, timestamps)
- User profiles and channel information
- Comments and interactions
- Real-time updates for live streaming

**Firebase Storage**
- Video file storage in organized folders (videos/, shorts/, livestreams/)
- Public URL generation for video playback
- Automatic metadata tagging
- Secure upload with authentication

**Service Worker Cache**
- Offline support for static assets
- Network-first strategy for dynamic content
- Cache-first strategy for CSS, fonts, images

## User Preferences

- **Communication**: Simple, everyday language
- **Authentication**: Google Sign-In working perfectly
- **Upload Features**: All implemented and ready for production

## External Dependencies

### Firebase Services
- **Firebase Authentication**: Google OAuth for user login
- **Firebase Firestore**: NoSQL database for video metadata
- **Firebase Storage**: Cloud storage for video files
- **Firebase Admin SDK**: Server-side authentication and storage management
- **Project**: tiktikvideos-4e8e7

### NPM Dependencies
- `express` (^4.21.2): Web server framework
- `cors` (^2.8.5): Cross-origin resource sharing
- `firebase-admin` (^12.0.0): Server-side Firebase SDK
- `multer` (^1.4.5-lts.1): Multipart form data handling
- `busboy` (^1.6.0): Stream-based form parser

### CDN Resources
- FontAwesome (6.0.0): Icon library
- Firebase SDK (10.7.1): Client-side Firebase libraries

## Deployment Instructions

### Prerequisites
1. Firebase service account JSON (download from Firebase Console)
2. Vercel account connected to GitHub repository
3. Firebase Storage rules configured for authenticated uploads

### Environment Variables (Vercel)
```
NODE_ENV=production
FIREBASE_API_KEY=AIzaSyBlWjogX3gTipSJK31AwVw0D6KxDv3ry7Y
FIREBASE_AUTH_DOMAIN=tiktikvideos-4e8e7.firebaseapp.com
FIREBASE_PROJECT_ID=tiktikvideos-4e8e7
FIREBASE_STORAGE_BUCKET=tiktikvideos-4e8e7.appspot.com
FIREBASE_MESSAGING_SENDER_ID=918908099153
FIREBASE_APP_ID=1:918908099153:web:c03e103fc6199b37513670
FIREBASE_SERVICE_ACCOUNT=[paste entire service account JSON]
```

### Deploy to Vercel
1. Push code to GitHub: `git push origin main`
2. Vercel will automatically deploy
3. Add environment variables in Vercel dashboard
4. Redeploy to apply environment variables

See `DEPLOYMENT.md` for detailed deployment instructions.

## Runtime Requirements
- **Node.js**: >=18.0.0
- **Browser**: Modern browser with Service Worker, ES6+, MediaRecorder API support
- **Firebase**: Active Firebase project with Authentication, Firestore, and Storage enabled

## Project Status
✅ **Production Ready** - All features implemented, tested, and secured for deployment
