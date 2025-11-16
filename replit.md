# TikTik Video Sharing Platform

## Overview

TikTik is a YouTube-inspired video sharing platform with support for full-length videos, short-form content (similar to TikTok/YouTube Shorts), and live streaming capabilities. The platform features an admin approval system where all uploaded content requires review before becoming publicly visible. Built with React/Vite on the frontend and Firebase for backend services, the application is deployed as serverless functions on Vercel.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite as the build tool

**UI Component System**: The application uses shadcn/ui component library built on Radix UI primitives, providing a comprehensive set of accessible components including dialogs, dropdowns, forms, and navigation elements. Styling is managed through Tailwind CSS with a custom design system featuring HSL-based color tokens for theme consistency.

**Design Philosophy**: YouTube-inspired interface with familiar patterns for video discovery and playback. The design includes a fixed header, collapsible sidebar navigation, video grid layouts, channel pages with tabbed navigation, and a full-featured video player. Design tokens are defined using CSS custom properties for colors, spacing, shadows, and typography.

**State Management**: React Query (@tanstack/react-query) for server state management, providing caching, background refetching, and optimistic updates. Query functions are configured with custom fetch wrappers that handle authentication credentials and error responses.

**Routing**: wouter for lightweight client-side routing

### Backend Architecture

**Serverless Functions**: The backend has been converted from Express.js to Vercel serverless functions to support the platform's deployment model. Each API endpoint is implemented as a standalone JavaScript function in the `/api` directory.

**Key Design Pattern - Firebase Admin Singleton**: A critical architectural decision implements a singleton pattern for Firebase Admin SDK initialization. This prevents re-initialization errors in serverless environments where function instances may be reused across invocations. The singleton is cached in a module-level variable (`adminInstance` and `bucketInstance`) to persist across warm function invocations.

**Streaming File Uploads**: Large video files are handled using the Busboy library for streaming multipart/form-data directly from the request to Firebase Cloud Storage. This end-to-end streaming approach prevents memory exhaustion by avoiding buffering entire files in serverless function memory (which has a 150MB limit).

**API Endpoints**:
- `/api/upload-video` - Full-length video uploads with metadata
- `/api/upload-short` - Short videos under 60 seconds
- `/api/save-live-stream` - Live stream recording storage
- `/api/admin/pending` - Retrieve pending videos (admin-only)
- `/api/admin/approve` - Approve pending content (admin-only)
- `/api/admin/reject` - Reject pending content (admin-only)
- `/api/health` - Health check endpoint
- `/api/get-config` - Firebase client configuration

**Authentication & Authorization**: Firebase Authentication handles user identity with Google Sign-In integration. Authorization is implemented through Firebase ID token verification on each API request. Admin privileges are verified by checking user roles stored in Firestore before granting access to admin endpoints.

**Content Moderation Workflow**: All uploaded content (videos, shorts, live streams) is initially stored with `approvalStatus: 'pending'`. Admin users can review pending content and change the status to either 'approved' or 'rejected'. Only approved content appears in public feeds.

### Data Storage

**Firebase Firestore**: NoSQL document database storing video metadata, user profiles, and approval statuses. Collections include:
- `videos` - Video metadata, upload timestamps, approval status, user references
- `users` - User profiles, roles, authentication details

**Firebase Cloud Storage**: Object storage for video files, thumbnails, and live stream recordings. Files are organized by type (videos, shorts, live-streams) and include metadata for duration, size, and content type.

**Database Schema Note**: The repository includes Drizzle ORM configuration for PostgreSQL, suggesting the application may have originally used or plans to use a relational database. However, the current production implementation relies entirely on Firebase services.

### Deployment Configuration

**Platform**: Vercel serverless platform with automatic GitHub integration

**Build Configuration**: 
- Frontend: Vite builds React application to `/dist/public`
- API Functions: Located in `/api` directory, automatically detected by Vercel
- Route Mapping: `vercel.json` defines explicit routes to serverless functions

**Environment Variables**:
- `FIREBASE_SERVICE_ACCOUNT` - Full service account JSON for Admin SDK
- `FIREBASE_STORAGE_BUCKET` - Storage bucket identifier
- `VITE_FIREBASE_API_KEY` - Public API key for client SDK
- `VITE_FIREBASE_PROJECT_ID` - Firebase project identifier
- `VITE_FIREBASE_APP_ID` - Firebase app identifier

**Request Limits**: 150MB maximum request body size configured for large video uploads

## External Dependencies

### Firebase Services

**Firebase Authentication**: User authentication with Google Sign-In provider. Handles user sessions and generates ID tokens for API authentication.

**Firebase Admin SDK**: Server-side Firebase access for privileged operations including storage management, Firestore database access, and ID token verification. Requires service account credentials.

**Firebase Cloud Storage**: Scalable object storage for video files with support for streaming uploads, custom metadata, and signed URLs for secure downloads.

**Firestore**: Real-time NoSQL database for structured data storage with support for queries, indexes, and security rules.

### UI & Component Libraries

**Radix UI**: Unstyled, accessible component primitives including Dialog, Dropdown Menu, Accordion, Popover, Toast, and form controls. Provides keyboard navigation, focus management, and ARIA attributes.

**shadcn/ui**: Pre-styled component library built on Radix UI with Tailwind CSS integration. Components are copied into the project rather than installed as dependencies.

**Tailwind CSS**: Utility-first CSS framework with custom configuration for design tokens, theme colors, and responsive breakpoints.

### Development & Build Tools

**Vite**: Next-generation frontend build tool providing fast HMR, optimized builds, and native ESM support.

**TypeScript**: Type safety across frontend and shared code with strict mode enabled.

**React Query**: Async state management for API calls with automatic caching and background synchronization.

**Busboy**: Streaming multipart form data parser for efficient file upload handling without memory buffering.

### Deployment Platform

**Vercel**: Serverless deployment platform with automatic builds from Git, environment variable management, edge network CDN, and serverless function execution. Provides zero-configuration deployment for Vite applications and Node.js functions.