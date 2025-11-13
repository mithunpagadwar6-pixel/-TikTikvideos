# TikTik Video Sharing Platform

## Overview

TikTik is a Progressive Web Application (PWA) that provides a video sharing platform similar to YouTube. The application enables users to discover, watch, search, and interact with videos. Built with vanilla JavaScript on the frontend and Express.js on the backend, it emphasizes security, offline capabilities, and a clean user experience. The platform supports Google authentication, video playback, comments, search functionality, and social features like likes and shares.

## Recent Changes

**November 13, 2025 - Google Authentication Setup Complete**
- Firebase configuration successfully integrated via environment variables
- Google Sign-In fully operational with proper error handling
- Firestore offline persistence enabled with graceful fallback to sample data
- Error handling improved to provide cleaner console output and better user feedback
- Authorized domain configured in Firebase Console for Replit deployment
- Server running on port 5000 with all Firebase services initialized

**Current Status**: Google login is fully functional. Users can click "Login with Google" button in the header to authenticate with their Google account.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Single Page Application (SPA)**
- Built with pure vanilla JavaScript without framework dependencies
- Client-side routing handles navigation between home, search, and video player views
- Dynamic DOM manipulation for rendering content without page reloads
- State management through a global application object pattern

**Progressive Web App Implementation**
- Service Worker (`sw.js`) provides offline functionality and asset caching
- Network-first caching strategy for HTML/JavaScript files ensures fresh content during development
- Cache-first strategy for static assets (CSS, fonts, images) improves performance
- Versioned cache management (`tiktik-v1.3.0`) allows controlled cache invalidation
- Web App Manifest enables installation on mobile devices with native-like experience

**Styling and Theming**
- CSS custom properties (CSS variables) enable dynamic theming
- Supports light and dark themes with `[data-theme="dark"]` attribute toggle
- Mobile-first responsive design approach
- Component-based CSS organization for maintainability
- FontAwesome integration for consistent iconography

### Backend Architecture

**Express.js Server Design**
- Minimal Node.js server with Express framework
- Static file serving for all frontend assets
- Single-purpose API endpoint architecture
- SPA-friendly routing with catch-all route serving `index.html`
- CORS enabled for development flexibility

**Security-First Configuration Management**
- Firebase credentials stored exclusively in environment variables
- Backend endpoint (`/api/get-config`) serves configuration to frontend
- Prevents exposure of API keys in client-side code or version control
- Configuration validation before serving ensures required variables are set
- Error handling returns appropriate status codes when configuration is missing

### Authentication & Authorization

**Firebase Authentication**
- Google Sign-In provider for user authentication
- Authentication state managed through Firebase Auth SDK
- Auth state listener pattern maintains user session across page navigations
- Token-based authentication for API requests (when implemented)

**Security Approach**
- Firebase configuration never exposed in frontend bundle
- Runtime configuration fetching from secure backend endpoint
- Environment variable validation before initialization
- Graceful degradation when Firebase services are unavailable

### Data Storage

**Firebase Firestore**
- NoSQL cloud database for storing video metadata, comments, and user data
- Offline persistence enabled with multi-tab synchronization
- Real-time updates for comments and interactions
- Graceful fallback to sample data when Firestore is unavailable

**Client-Side Storage**
- Service Worker cache for offline asset storage
- Local Storage for user preferences and temporary data (implied by architecture)
- IndexedDB through Firestore offline persistence

### PWA Capabilities

**Offline Support Strategy**
- Cached assets available offline through Service Worker
- Network-first for dynamic content ensures freshness when online
- Firestore offline persistence maintains data availability
- Fallback mechanisms when network is unavailable

**Installability**
- Manifest.json defines app metadata and icons
- Standalone display mode for app-like experience
- Portrait-primary orientation for mobile optimization
- SVG-based icons for scalability across device sizes

## External Dependencies

### Third-Party Services

**Firebase Platform**
- **Firebase Authentication**: Google Sign-In provider for user authentication
- **Firebase Firestore**: NoSQL database for video metadata, user data, and comments
- **Firebase SDKs**: Loaded via CDN (version 10.7.1 compat libraries)
  - `firebase-app-compat.js`
  - `firebase-auth-compat.js`
  - `firebase-firestore-compat.js`

**Content Delivery Networks**
- **FontAwesome CDN**: Icon library (version 6.0.0) for UI components

### NPM Dependencies

**Production Dependencies**
- **Express** (^4.21.2): Web application framework for Node.js backend
- **CORS** (^2.8.5): Cross-Origin Resource Sharing middleware for Express

### Environment Variables Required

The following environment variables must be configured for Firebase integration:
- `FIREBASE_API_KEY`: Firebase project API key
- `FIREBASE_AUTH_DOMAIN`: Firebase authentication domain
- `FIREBASE_PROJECT_ID`: Firebase project identifier
- `FIREBASE_STORAGE_BUCKET`: Firebase storage bucket URL
- `FIREBASE_MESSAGING_SENDER_ID`: Firebase Cloud Messaging sender ID
- `FIREBASE_APP_ID`: Firebase application identifier
- `PORT`: Server port (defaults to 5000 if not set)

### Runtime Requirements

- **Node.js**: Version 18.0.0 or higher (specified in package.json engines)
- **Modern Browser**: Support for Service Workers, ES6+, CSS Custom Properties, and Fetch API
- **Firebase Project**: Active Firebase project with Authentication and Firestore enabled