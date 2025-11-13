const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 500 * 1024 * 1024
  }
});

let firebaseInitialized = false;
let bucket = null;

function initializeFirebase() {
  if (firebaseInitialized) return;
  
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    }
    
    bucket = admin.storage().bucket();
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.log('⚠️  Firebase Admin not initialized:', error.message);
  }
}

initializeFirebase();

app.get('/api/get-config', (req, res) => {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return res.status(500).json({ 
      error: 'Firebase configuration not set. Please configure environment variables.' 
    });
  }

  res.json({ firebase: firebaseConfig });
});

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!firebaseInitialized) {
      console.error('❌ Firebase Admin not initialized. Cannot verify authentication.');
      return res.status(503).json({ 
        error: 'Service unavailable: Authentication service not configured. Please set up Firebase Admin credentials.' 
      });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('❌ Invalid authentication token:', error.message);
      return res.status(401).json({ 
        error: 'Unauthorized: Invalid or expired token' 
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

app.post('/api/upload-video', verifyToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    console.log('📤 Uploading video:', req.file.originalname);

    if (!firebaseInitialized || !bucket) {
      console.log('⚠️  Firebase not initialized, using mock upload');
      return res.json({
        success: true,
        videoUrl: `https://storage.googleapis.com/demo/${req.file.originalname}`,
        message: 'Video uploaded successfully (demo mode)'
      });
    }

    const filename = `videos/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: req.body.userId || 'anonymous',
          title: req.body.title || 'Untitled',
        }
      },
      resumable: false
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    console.log('✅ Video uploaded successfully:', publicUrl);
    res.json({
      success: true,
      videoUrl: publicUrl,
      filename: filename
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload video', 
      details: error.message 
    });
  }
});

app.post('/api/upload-short', verifyToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No short video file uploaded' });
    }

    console.log('📤 Uploading short video:', req.file.originalname);

    if (!firebaseInitialized || !bucket) {
      console.log('⚠️  Firebase not initialized, using mock upload');
      return res.json({
        success: true,
        videoUrl: `https://storage.googleapis.com/demo/shorts/${req.file.originalname}`,
        message: 'Short video uploaded successfully (demo mode)'
      });
    }

    const filename = `shorts/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: req.body.userId || 'anonymous',
          title: req.body.title || 'Untitled Short',
          isShort: 'true'
        }
      },
      resumable: false
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    console.log('✅ Short video uploaded successfully:', publicUrl);
    res.json({
      success: true,
      videoUrl: publicUrl,
      filename: filename
    });

  } catch (error) {
    console.error('❌ Short upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload short video', 
      details: error.message 
    });
  }
});

app.post('/api/save-live-stream', verifyToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No live stream video uploaded' });
    }

    console.log('📤 Saving live stream recording:', req.file.originalname);

    if (!firebaseInitialized || !bucket) {
      console.log('⚠️  Firebase not initialized, using mock upload');
      return res.json({
        success: true,
        videoUrl: `https://storage.googleapis.com/demo/live/${req.file.originalname}`,
        message: 'Live stream saved successfully (demo mode)'
      });
    }

    const filename = `livestreams/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: req.body.userId || 'anonymous',
          title: req.body.title || 'Untitled Live Stream',
          isLive: 'true'
        }
      },
      resumable: false
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    console.log('✅ Live stream saved successfully:', publicUrl);
    res.json({
      success: true,
      videoUrl: publicUrl,
      filename: filename
    });

  } catch (error) {
    console.error('❌ Live stream save error:', error);
    res.status(500).json({ 
      error: 'Failed to save live stream', 
      details: error.message 
    });
  }
});

app.post('/api/generate-upload-url', verifyToken, async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🔗 Generating upload URL for:', fileName);

    if (!firebaseInitialized || !bucket) {
      console.log('⚠️  Firebase not initialized, returning mock URL');
      const mockFileKey = `videos/${Date.now()}_${fileName}`;
      return res.json({
        uploadUrl: `https://storage.googleapis.com/mock-upload/${mockFileKey}`,
        publicUrl: `https://storage.googleapis.com/demo/${mockFileKey}`,
        fileKey: mockFileKey,
        message: 'Demo mode - upload will not persist'
      });
    }

    const fileKey = `videos/${Date.now()}_${fileName}`;
    const file = bucket.file(fileKey);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: fileType
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileKey}`;

    console.log('✅ Upload URL generated successfully');
    res.json({
      uploadUrl: signedUrl,
      publicUrl: publicUrl,
      fileKey: fileKey
    });

  } catch (error) {
    console.error('❌ Error generating upload URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate upload URL', 
      details: error.message 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    firebase: firebaseInitialized,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export for Vercel serverless deployment
module.exports = app;

// Start server only in development (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 TikTik Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   - GET  /api/get-config`);
    console.log(`   - POST /api/upload-video (authenticated)`);
    console.log(`   - POST /api/upload-short (authenticated)`);
    console.log(`   - POST /api/save-live-stream (authenticated)`);
    console.log(`   - POST /api/generate-upload-url (authenticated)`);
    console.log(`   - GET  /api/health`);
    console.log(`\n✨ Firebase Admin: ${firebaseInitialized ? 'Initialized' : 'Not initialized (demo mode)'}\n`);
  });
}
