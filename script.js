// TikTik - YouTube Clone Application
// Pure JavaScript implementation with local storage persistence

// Firebase Configuration - loaded from backend
let firebaseApp = null;
let firebaseAuth = null;
let firestore = null;

// Initialize Firebase by fetching config from backend
async function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
    return false;
  }

  try {
    // Fetch Firebase config from backend endpoint (no keys in frontend!)
    const response = await fetch('/api/get-config');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to load Firebase config');
    }

    // Initialize Firebase with config from backend
    firebaseApp = firebase.initializeApp(data.firebase);
    firebaseAuth = firebase.auth();
    
    // Initialize Firestore with offline persistence settings
    try {
      firestore = firebase.firestore();
      // Enable offline persistence
      firestore.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.log('Firestore: Multiple tabs open, persistence disabled');
          } else if (err.code === 'unimplemented') {
            console.log('Firestore: Persistence not supported');
          }
        });
    } catch (err) {
      console.log('Firestore initialization: Using sample videos only');
    }
    
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
}

// Initialize Firebase when page loads
if (typeof firebase !== 'undefined') {
  // Start Firebase initialization immediately
  initializeFirebase().then(async (success) => {
    if (success) {
      console.log('Firebase initialized successfully');
      // If app is already created, set up auth and load videos
      if (window.tiktikApp) {
        // Set up auth state listener now that Firebase is ready
        window.tiktikApp.setupAuthStateListener();
        // Load videos from Firestore
        await window.tiktikApp.loadAllVideosFromFirestore();
        window.tiktikApp.loadHomePage();
        console.log('Firebase auth listener setup and videos loaded');
      }
    }
  });
}

class TikTikApp {
    constructor() {
        this.currentVideo = null;
        this.currentPage = 'home';
        this.sidebarCollapsed = false;
        this.settings = this.loadSettings();
        this.watchHistory = this.loadWatchHistory();
        this.likedVideos = this.loadLikedVideos();
        this.savedVideos = this.loadSavedVideos();
        this.comments = this.loadComments();
        this.myVideos = [];
        this.channelData = this.loadChannelData();
        this.myShorts = [];
        this.liveStreams = [];
        this.subscriptions = this.loadSubscriptions();
        this.cameraStream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isCameraOn = false;
        this.isMicOn = false;
        this.isRecording = false;
        this.currentUserId = null;

        // Videos array - populated from Firestore with sample videos as fallback
        this.videos = this.getSampleVideos();

        this.init();
    }

    // Sample videos for demonstration when Firestore is empty or has permission issues
    getSampleVideos() {
        return [
            {
                id: 'sample1',
                title: 'Welcome to TikTik - Getting Started Guide',
                thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=320&h=180&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                channel: 'TikTik Official',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
                views: '1.2M views',
                uploadTime: '2 days ago',
                duration: '10:24',
                likes: 45000,
                description: 'Learn how to use TikTik and start sharing your videos with the world!'
            },
            {
                id: 'sample2',
                title: 'Amazing Nature Photography - 4K',
                thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=320&h=180&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                channel: 'Nature Explorer',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
                views: '850K views',
                uploadTime: '5 days ago',
                duration: '15:32',
                likes: 32000,
                description: 'Experience the beauty of nature in stunning 4K resolution'
            },
            {
                id: 'sample3',
                title: 'Coding Tutorial - JavaScript Basics',
                thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=320&h=180&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                channel: 'Code Academy',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
                views: '2.3M views',
                uploadTime: '1 week ago',
                duration: '23:15',
                likes: 98000,
                description: 'Learn JavaScript from scratch with this comprehensive tutorial'
            },
            {
                id: 'sample4',
                title: 'Travel Vlog - Exploring Tokyo',
                thumbnail: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=320&h=180&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                channel: 'Travel Diaries',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
                views: '1.5M views',
                uploadTime: '3 days ago',
                duration: '18:42',
                likes: 67000,
                description: 'Join me as I explore the vibrant streets of Tokyo!'
            },
            {
                id: 'sample5',
                title: 'Cooking Recipe - Italian Pasta',
                thumbnail: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=320&h=180&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                channel: 'Chef Kitchen',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
                views: '950K views',
                uploadTime: '4 days ago',
                duration: '12:20',
                likes: 42000,
                description: 'Learn to make authentic Italian pasta from scratch'
            },
            {
                id: 'sample6',
                title: 'Music Production - FL Studio Tutorial',
                thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=320&h=180&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
                channel: 'Beat Maker',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
                views: '680K views',
                uploadTime: '6 days ago',
                duration: '25:18',
                likes: 28000,
                description: 'Create professional beats with FL Studio'
            },
            {
                id: 'sample7',
                title: 'Fitness Workout - Full Body Training',
                thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=320&h=180&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
                channel: 'Fit Life',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
                views: '1.8M views',
                uploadTime: '2 days ago',
                duration: '30:45',
                likes: 75000,
                description: 'Complete full body workout routine for beginners'
            },
            {
                id: 'sample8',
                title: 'Gaming Highlights - Best Moments',
                thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=320&h=180&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                channel: 'Pro Gamer',
                avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop',
                views: '3.2M views',
                uploadTime: '1 day ago',
                duration: '14:52',
                likes: 120000,
                description: 'Epic gaming moments compilation'
            }
        ];
    }

    async init() {
        this.setupEventListeners();
        this.applyTheme();
        this.updateAdminSettings();
        
        // Wait for Firebase to initialize before loading videos and auth
        if (firestore) {
            this.setupAuthStateListener();
            await this.loadAllVideosFromFirestore();
        } else {
            console.log('Waiting for Firebase to initialize...');
            // Will be loaded after Firebase init completes
        }
        
        this.loadHomePage();
    }

    // Setup Firebase authentication state listener
    setupAuthStateListener() {
        if (firebaseAuth) {
            firebaseAuth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUserId = user.uid;
                    console.log('User logged in:', user.uid);
                    // Load user's videos when they log in
                    await this.loadUserVideos();
                } else {
                    this.currentUserId = null;
                    console.log('User logged out');
                }
            });
        }
    }

    // Load ALL videos from Firestore for main feed
    async loadAllVideosFromFirestore() {
        if (!firestore) {
            console.log('Firestore not available, using sample videos');
            return;
        }

        try {
            const videosSnapshot = await firestore.collection('videos')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const firestoreVideos = [];
            videosSnapshot.forEach(doc => {
                const data = doc.data();
                firestoreVideos.push({
                    id: doc.id,
                    ...data,
                    views: this.formatNumber(data.views || 0) + ' views',
                    uploadTime: this.formatUploadTime(data.timestamp),
                });
            });

            // Merge with default videos
            this.videos = [...firestoreVideos, ...this.videos];
            this.loadHomePage();
        } catch (error) {
            console.log('Using sample videos (Firestore connection issue)');
        }
    }

    // Load ONLY current user's videos for "My Channel"
    async loadUserVideos() {
        if (!firestore || !this.currentUserId) return;

        try {
            // Load all videos from current user (single where clause, no composite index needed)
            const allVideosSnapshot = await firestore.collection('videos')
                .where('uploaderId', '==', this.currentUserId)
                .get();

            // Filter client-side to avoid composite index requirement
            this.myVideos = [];
            this.myShorts = [];
            this.liveStreams = [];

            allVideosSnapshot.forEach(doc => {
                const data = doc.data();
                const videoData = {
                    id: doc.id,
                    ...data,
                    views: this.formatNumber(data.views || 0) + ' views',
                    uploadTime: this.formatUploadTime(data.timestamp),
                };

                // Filter by type
                if (data.isShort === true) {
                    this.myShorts.push(videoData);
                } else if (data.isLive === true) {
                    videoData.views = this.formatNumber(data.viewers || 0) + ' viewers';
                    videoData.uploadTime = data.endTime ? this.formatUploadTime(data.endTime) : 'Live now';
                    this.liveStreams.push(videoData);
                } else {
                    this.myVideos.push(videoData);
                }
            });

            // Sort by timestamp (client-side)
            const sortByTimestamp = (a, b) => {
                const aTime = a.timestamp?.toMillis?.() || 0;
                const bTime = b.timestamp?.toMillis?.() || 0;
                return bTime - aTime;
            };

            this.myVideos.sort(sortByTimestamp);
            this.myShorts.sort(sortByTimestamp);
            this.liveStreams.sort(sortByTimestamp);

            // Update channel page if currently viewing
            if (this.currentPage === 'library') {
                this.loadLibraryPage();
            }
        } catch (error) {
            console.error('Error loading user videos:', error);
        }
    }

    formatUploadTime(timestamp) {
        if (!timestamp) return 'Just now';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
        return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
    }

    
   setupEventListeners() {
        // Sidebar toggle
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.navigateToPage(page);
                }
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Admin panel
        document.getElementById('adminPanelBtn').addEventListener('click', () => {
            this.openAdminPanel();
        });

        document.getElementById('closeAdminBtn').addEventListener('click', () => {
            this.closeAdminPanel();
        });

        // Video modal
        document.getElementById('closeVideoBtn').addEventListener('click', () => {
            this.closeVideoModal();
        });

        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Close modals on backdrop click
        document.getElementById('videoModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeVideoModal();
            }
        });

        document.getElementById('adminModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeAdminPanel();
            }
        });

        // Video player events
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.addEventListener('play', () => {
            if (this.currentVideo) {
                this.addToHistory(this.currentVideo);
            }
        });

        // Video player controls
        this.setupVideoControls();

        // Like/Dislike buttons
        document.getElementById('likeBtn').addEventListener('click', () => {
            this.toggleLike();
        });

        document.getElementById('dislikeBtn').addEventListener('click', () => {
            this.toggleDislike();
        });

        // Share, Save, Download buttons
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareVideo();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.toggleSave();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadVideo();
        });

        // Comment functionality
        document.getElementById('commentInput').addEventListener('focus', () => {
            this.showCommentActions();
        });

        document.getElementById('cancelComment').addEventListener('click', () => {
            this.hideCommentActions();
        });

        document.getElementById('submitComment').addEventListener('click', () => {
            this.submitComment();
        });

        document.getElementById('commentInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitComment();
            }
        });

        // Create button and modals
        document.getElementById('createBtn').addEventListener('click', () => {
            this.openCreateModal();
        });

        document.getElementById('closeCreateBtn').addEventListener('click', () => {
            this.closeCreateModal();
        });

        // Create options
        document.getElementById('uploadVideoOption').addEventListener('click', () => {
            this.closeCreateModal();
            this.openUploadModal();
        });

        document.getElementById('createShortOption').addEventListener('click', () => {
            this.closeCreateModal();
            this.openShortModal();
        });

        document.getElementById('goLiveOption').addEventListener('click', () => {
            this.closeCreateModal();
            this.openLiveModal();
        });

        // Upload modal
        document.getElementById('closeUploadBtn').addEventListener('click', () => {
            this.closeUploadModal();
        });

        document.getElementById('videoFileInput').addEventListener('change', (e) => {
            this.handleVideoFileSelect(e);
        });

        document.getElementById('publishVideoBtn').addEventListener('click', () => {
            this.publishVideo();
        });

        document.getElementById('cancelUploadBtn').addEventListener('click', () => {
            this.closeUploadModal();
        });

        // Upload video button in channel page
        const uploadVideoBtnEl = document.getElementById('uploadVideoBtn');
        if (uploadVideoBtnEl) {
            uploadVideoBtnEl.addEventListener('click', () => {
                this.openUploadModal();
            });
        }

        // Upload short button in channel page
        const uploadShortBtnEl = document.getElementById('uploadShortBtn');
        if (uploadShortBtnEl) {
            uploadShortBtnEl.addEventListener('click', () => {
                this.openShortModal();
            });
        }

        // Go live button in channel page
        const goLiveBtnEl = document.getElementById('goLiveBtn');
        if (goLiveBtnEl) {
            goLiveBtnEl.addEventListener('click', () => {
                this.openLiveModal();
            });
        }

        // Channel edit modal
        document.getElementById('editChannelBtn').addEventListener('click', () => {
            this.openChannelEditModal();
        });

        document.getElementById('closeChannelEditBtn').addEventListener('click', () => {
            this.closeChannelEditModal();
        });

        document.getElementById('saveChannelBtn').addEventListener('click', () => {
            this.saveChannelChanges();
        });

        document.getElementById('cancelChannelEditBtn').addEventListener('click', () => {
            this.closeChannelEditModal();
        });

        // Avatar and Banner inputs
        document.getElementById('avatarInput').addEventListener('change', (e) => {
            this.handleAvatarChange(e);
        });

        document.getElementById('bannerInput').addEventListener('change', (e) => {
            this.handleBannerChange(e);
        });

        // Channel tabs
        document.querySelectorAll('.channel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchChannelTab(e.target.dataset.tab);
            });
        });

        // Short modal
        document.getElementById('closeShortBtn').addEventListener('click', () => {
            this.closeShortModal();
        });

        document.getElementById('shortFileInput').addEventListener('change', (e) => {
            this.handleShortFileSelect(e);
        });

        document.getElementById('publishShortBtn').addEventListener('click', () => {
            this.publishShort();
        });

        document.getElementById('cancelShortBtn').addEventListener('click', () => {
            this.closeShortModal();
        });

        // Live modal
        document.getElementById('closeLiveBtn').addEventListener('click', () => {
            this.closeLiveModal();
        });

        document.getElementById('startLiveBtn').addEventListener('click', () => {
            this.startLiveStream();
        });

        document.getElementById('cancelLiveBtn').addEventListener('click', () => {
            this.closeLiveModal();
        });

        document.getElementById('toggleCameraBtn').addEventListener('click', () => {
            this.toggleCamera();
        });

        document.getElementById('toggleMicBtn').addEventListener('click', () => {
            this.toggleMicrophone();
        });

        this.setupAdminControls();
    }

    setupVideoControls() {
        const videoPlayer = document.getElementById('videoPlayer');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const timeDisplay = document.getElementById('timeDisplay');
        const muteBtn = document.getElementById('muteBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeFill = document.getElementById('volumeFill');

        // New YouTube-style controls
        const nextVideoBtn = document.getElementById('nextVideoBtn');
        const autoplayToggleBtn = document.getElementById('autoplayToggleBtn');
        const captionsBtn = document.getElementById('captionsBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsDropdown = document.getElementById('settingsDropdown');
        const miniplayerBtn = document.getElementById('miniplayerBtn');
        const theaterModeBtn = document.getElementById('theaterModeBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        // Player state controls
        const minimizeBtn = document.getElementById('minimizeBtn');
        const theaterBtn = document.getElementById('theaterBtn');
        const restoreBtn = document.getElementById('restoreBtn');

        // Navigation controls
        const prevVideoBtn = document.getElementById('prevVideoBtn');

        // Miniplayer controls
        const miniplayerPlayBtn = document.getElementById('miniplayerPlayBtn');

        // Play/Pause functionality
        playPauseBtn.addEventListener('click', () => {
            if (videoPlayer.paused) {
                videoPlayer.play();
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                miniplayerPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                videoPlayer.pause();
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                miniplayerPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });

        miniplayerPlayBtn.addEventListener('click', () => {
            playPauseBtn.click();
        });

        // Video player events
        videoPlayer.addEventListener('play', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            miniplayerPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });

        videoPlayer.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            miniplayerPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        });

        // Progress bar
        videoPlayer.addEventListener('timeupdate', () => {
            if (videoPlayer.duration) {
                const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
                progressFill.style.width = progress + '%';

                const currentTime = this.formatTime(videoPlayer.currentTime);
                const duration = this.formatTime(videoPlayer.duration);
                timeDisplay.textContent = `${currentTime} / ${duration}`;
            }
        });

        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const progress = clickX / rect.width;
            videoPlayer.currentTime = progress * videoPlayer.duration;
        });

        // Volume controls
        muteBtn.addEventListener('click', () => {
            if (videoPlayer.muted) {
                videoPlayer.muted = false;
                muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                volumeFill.style.width = (videoPlayer.volume * 100) + '%';
            } else {
                videoPlayer.muted = true;
                muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                volumeFill.style.width = '0%';
            }
        });

        volumeSlider.addEventListener('click', (e) => {
            const rect = volumeSlider.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const volume = clickX / rect.width;
            videoPlayer.volume = Math.max(0, Math.min(1, volume));
            volumeFill.style.width = (volume * 100) + '%';
            videoPlayer.muted = false;
            muteBtn.innerHTML = volume > 0 ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
        });

        // Autoplay toggle
        autoplayToggleBtn.addEventListener('click', () => {
            this.settings.autoPlay = !this.settings.autoPlay;
            autoplayToggleBtn.classList.toggle('active', this.settings.autoPlay);
            autoplayToggleBtn.title = this.settings.autoPlay ? 'Autoplay is on' : 'Autoplay is off';
            this.saveSettings();
        });

        // Captions toggle
        captionsBtn.addEventListener('click', () => {
            const isActive = captionsBtn.classList.toggle('active');
            document.getElementById('captionsStatus').textContent = isActive ? 'On' : 'Off';
            this.toggleCaptions(isActive);
        });

        // Settings dropdown
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdown.classList.toggle('active');
        });

        // Close settings dropdown when clicking outside
        document.addEventListener('click', () => {
            settingsDropdown.classList.remove('active');
        });

        // Settings items
        document.querySelectorAll('.settings-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const setting = e.currentTarget.dataset.setting;
                this.handleSettingChange(setting);
            });
        });

        // Miniplayer button
        miniplayerBtn.addEventListener('click', () => {
            this.minimizeVideo();
        });

        // Theater mode button
        theaterModeBtn.addEventListener('click', () => {
            this.toggleTheaterMode();
        });

        // Player state controls
        minimizeBtn.addEventListener('click', () => {
            this.minimizeVideo();
        });

        theaterBtn.addEventListener('click', () => {
            this.toggleTheaterMode();
        });

        fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        restoreBtn.addEventListener('click', () => {
            this.restoreVideo();
        });

        // Navigation controls
        prevVideoBtn.addEventListener('click', () => {
            this.playPreviousVideo();
        });

        nextVideoBtn.addEventListener('click', () => {
            this.playNextVideo();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.currentVideo && document.getElementById('videoModal').classList.contains('active')) {
                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        playPauseBtn.click();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 10);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
                        volumeFill.style.width = (videoPlayer.volume * 100) + '%';
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
                        volumeFill.style.width = (videoPlayer.volume * 100) + '%';
                        break;
                    case 'KeyM':
                        e.preventDefault();
                        muteBtn.click();
                        break;
                    case 'KeyF':
                        e.preventDefault();
                        fullscreenBtn.click();
                        break;
                    case 'KeyT':
                        e.preventDefault();
                        theaterBtn.click();
                        break;
                    case 'KeyI':
                        e.preventDefault();
                        minimizeBtn.click();
                        break;
                }
            }
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    minimizeVideo() {
        const modal = document.getElementById('videoModal');
        const minimizeBtn = document.getElementById('minimizeBtn');
        const miniplayerTitle = document.getElementById('miniplayerTitle');

        if (modal.classList.contains('minimized')) {
            return;
        }

        modal.classList.add('minimized');
        minimizeBtn.innerHTML = '<i class="fas fa-expand"></i>';
        minimizeBtn.title = 'Restore';

        if (this.currentVideo) {
            miniplayerTitle.textContent = this.currentVideo.title;
        }

        this.showToast('Video minimized. Click to restore.', 'info');
    }

    restoreVideo() {
        const modal = document.getElementById('videoModal');
        const minimizeBtn = document.getElementById('minimizeBtn');

        modal.classList.remove('minimized');
        modal.classList.remove('theater');
        minimizeBtn.innerHTML = '<i class="fas fa-compress"></i>';
        minimizeBtn.title = 'Minimize';

        this.showToast('Video restored', 'info');
    }

    toggleTheaterMode() {
        const modal = document.getElementById('videoModal');
        const theaterBtn = document.getElementById('theaterBtn');

        if (modal.classList.contains('theater')) {
            modal.classList.remove('theater');
            theaterBtn.innerHTML = '<i class="fas fa-expand"></i>';
            theaterBtn.title = 'Theater mode';
            this.showToast('Theater mode disabled', 'info');
        } else {
            modal.classList.remove('minimized');
            modal.classList.add('theater');
            theaterBtn.innerHTML = '<i class="fas fa-compress"></i>';
            theaterBtn.title = 'Exit theater mode';
            this.showToast('Theater mode enabled', 'info');
        }
    }

    toggleFullscreen() {
        const videoPlayer = document.getElementById('videoPlayer');

        if (!document.fullscreenElement) {
            videoPlayer.requestFullscreen().catch(err => {
                this.showToast('Fullscreen not supported', 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }

    playPreviousVideo() {
        if (!this.currentVideo) return;

        const currentIndex = this.videos.findIndex(v => v.id === this.currentVideo.id);
        if (currentIndex > 0) {
            const prevVideo = this.videos[currentIndex - 1];
            this.switchToVideo(prevVideo);
            this.showToast('Playing previous video', 'info');
        } else {
            this.showToast('This is the first video', 'info');
        }
    }

    playNextVideo() {
        if (!this.currentVideo) return;

        const currentIndex = this.videos.findIndex(v => v.id === this.currentVideo.id);
        if (currentIndex < this.videos.length - 1) {
            const nextVideo = this.videos[currentIndex + 1];
            this.switchToVideo(nextVideo);
            this.showToast('Playing next video', 'info');
        } else {
            this.showToast('This is the last video', 'info');
        }
    }

    switchToVideo(video) {
        const videoPlayer = document.getElementById('videoPlayer');
        const wasPlaying = !videoPlayer.paused;

        this.currentVideo = video;

        // Update video source
        videoPlayer.src = video.videoUrl;

        // Update video info
        document.getElementById('modalVideoTitle').textContent = video.title;
        document.getElementById('modalChannelName').textContent = video.channel;
        document.getElementById('modalChannelAvatar').src = video.avatar;
        document.getElementById('modalVideoStats').textContent = `${video.views} • ${video.uploadTime}`;
        document.getElementById('modalVideoDescription').textContent = video.description;
        document.getElementById('likeCount').textContent = this.formatNumber(video.likes);
        document.getElementById('miniplayerTitle').textContent = video.title;

        // Update like button state
        const likeBtn = document.getElementById('likeBtn');
        if (this.likedVideos.includes(video.id)) {
            likeBtn.classList.add('active');
        } else {
            likeBtn.classList.remove('active');
        }

        // Update save button state
        const saveBtn = document.getElementById('saveBtn');
        if (this.savedVideos.includes(video.id)) {
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
            saveBtn.classList.add('active');
        } else {
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Save';
            saveBtn.classList.remove('active');
        }

        // Auto-play if was playing or autoplay is enabled
        if (wasPlaying || this.settings.autoPlay) {
            videoPlayer.play();
        }

        // Load comments and recommendations
        this.loadComments(video.id);
        this.loadRecommendedVideos(video);
    }

    setupAdminControls() {
        // Theme settings
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.settings.theme = e.target.value;
                    this.applyTheme();
                }
            });
        });

        // Other settings
        document.getElementById('autoPlay').addEventListener('change', (e) => {
            this.settings.autoPlay = e.target.checked;
        });

        document.getElementById('showDescriptions').addEventListener('change', (e) => {
            this.settings.showDescriptions = e.target.checked;
        });

        document.getElementById('videosPerPage').addEventListener('change', (e) => {
            this.settings.videosPerPage = parseInt(e.target.value);
        });

        // Action buttons
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        document.getElementById('resetSettingsBtn').addEventListener('click', () => {
            this.resetSettings();
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');

        this.sidebarCollapsed = !this.sidebarCollapsed;

        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }

    navigateToPage(page) {
        // Remove active class from all nav items and pages
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        // Add active class to current nav item and page
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        document.getElementById(`${page}Page`).classList.add('active');

        this.currentPage = page;

        // Load page content
        switch(page) {
            case 'home':
                this.loadHomePage();
                break;
            case 'trending':
                this.loadTrendingPage();
                break;
            case 'subscriptions':
                this.loadSubscriptionsPage();
                break;
            case 'library':
                this.loadLibraryPage();
                break;
            case 'history':
                this.loadHistoryPage();
                break;
            case 'liked':
                this.loadLikedPage();
                break;
            case 'music':
                this.loadMusicPage();
                break;
            case 'sports':
                this.loadSportsPage();
                break;
            case 'gaming':
                this.loadGamingPage();
                break;
            case 'news':
                this.loadNewsPage();
                break;
            case 'learning':
                this.loadLearningPage();
                break;
            case 'settings':
                this.loadSettingsPage();
                break;
            case 'help':
                this.loadHelpPage();
                break;
            case 'feedback':
                this.loadFeedbackPage();
                break;
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        this.settings.theme = newTheme;
        this.applyTheme();
        this.saveSettings();
    }

    applyTheme() {
        const theme = this.settings.theme === 'auto' ? 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
            this.settings.theme;

        document.documentElement.setAttribute('data-theme', theme);

        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    openAdminPanel() {
        document.getElementById('adminModal').classList.add('active');
        this.updateAdminSettings();
    }

    closeAdminPanel() {
        document.getElementById('adminModal').classList.remove('active');
    }

    updateAdminSettings() {
        // Update theme radio buttons
        document.querySelector(`input[name="theme"][value="${this.settings.theme}"]`).checked = true;

        // Update other settings
        document.getElementById('autoPlay').checked = this.settings.autoPlay;
        document.getElementById('showDescriptions').checked = this.settings.showDescriptions;
        document.getElementById('videosPerPage').value = this.settings.videosPerPage;
    }

    loadHomePage() {
        const grid = document.getElementById('videoGrid');
        if (!grid) {
            console.error('Video grid element not found');
            return;
        }
        
        grid.innerHTML = '';

        console.log('Loading home page with videos:', this.videos.length);
        
        // Load videos based on settings
        const videosToShow = this.videos.slice(0, this.settings.videosPerPage);
        console.log('Videos to show:', videosToShow.length);
        
        videosToShow.forEach(video => {
            const videoCard = this.createVideoCard(video);
            grid.appendChild(videoCard);
        });
        
        if (videosToShow.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-video"></i><p>No videos available</p><span>Check back later for new content</span></div>';
        }
    }

    loadTrendingPage() {
        const grid = document.getElementById('trendingGrid');
        grid.innerHTML = '';

        // Sort videos by views (mock trending)
        const trendingVideos = [...this.videos].sort((a, b) => {
            const aViews = parseInt(a.views.replace(/[^\d]/g, ''));
            const bViews = parseInt(b.views.replace(/[^\d]/g, ''));
            return bViews - aViews;
        });

        trendingVideos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            grid.appendChild(videoCard);
        });
    }

    loadSubscriptionsPage() {
        // Subscriptions page shows empty state by default
    }

    loadLibraryPage() {
        // Update channel info
        document.getElementById('channelName').textContent = this.channelData.name;
        document.getElementById('subscriberCount').textContent = `${this.channelData.subscribers} subscribers`;
        document.getElementById('videoCount').textContent = `${this.channelData.videoCount} videos`;
        document.getElementById('channelDescription').textContent = this.channelData.description;
        document.getElementById('joinDate').textContent = this.channelData.joinDate;
        document.getElementById('totalViews').textContent = this.formatNumber(this.channelData.totalViews);

        // Update avatar and banner
        if (this.channelData.avatar) {
            document.getElementById('channelAvatar').src = this.channelData.avatar;
        }
        if (this.channelData.banner) {
            document.getElementById('channelBanner').src = this.channelData.banner;
        }

        // Make sure videos tab is active and load videos
        this.switchChannelTab('videos');
    }

    loadMyVideos() {
        const grid = document.getElementById('myVideosGrid');
        const uploadSection = document.querySelector('.upload-section');
        
        if (!grid) return;
        
        grid.innerHTML = '';

        if (this.myVideos.length === 0) {
            // Show upload prompt
            if (uploadSection) {
                uploadSection.style.display = 'block';
            }
            return;
        }

        // Hide upload prompt when videos exist
        if (uploadSection) {
            uploadSection.style.display = 'none';
        }

        this.myVideos.forEach(video => {
            const videoCard = this.createVideoCard(video, true);
            grid.appendChild(videoCard);
        });
    }

    deleteVideo(videoId) {
        if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
            return;
        }

        // Remove from myVideos
        this.myVideos = this.myVideos.filter(v => v.id !== videoId);
        
        // Remove from main videos array
        this.videos = this.videos.filter(v => v.id !== videoId);
        
        // Remove from shorts if it's a short
        this.myShorts = this.myShorts.filter(s => s.id !== videoId);
        
        // Remove from live streams if it's a live stream
        this.liveStreams = this.liveStreams.filter(l => l.id !== videoId);
        
        // Save to localStorage
        this.saveMyVideos();
        this.saveMyShorts();
        this.saveLiveStreams();
        
        // Update channel stats
        this.channelData.videoCount = this.myVideos.length + this.myShorts.length;
        this.saveChannelData();
        
        this.showToast('Video deleted successfully', 'success');
        
        // Refresh current page
        if (this.currentPage === 'library') {
            this.loadLibraryPage();
        } else {
            this.loadHomePage();
        }
    }

    loadHistoryPage() {
        const grid = document.getElementById('historyGrid');
        grid.innerHTML = '';

        if (this.watchHistory.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No watch history</p>
                    <span>Videos you watch will appear here</span>
                </div>
            `;
            return;
        }

        this.watchHistory.forEach(videoId => {
            const video = this.videos.find(v => v.id === videoId);
            if (video) {
                const videoCard = this.createVideoCard(video);
                grid.appendChild(videoCard);
            }
        });
    }

    loadLikedPage() {
        const grid = document.getElementById('likedGrid');
        grid.innerHTML = '';

        if (this.likedVideos.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-thumbs-up"></i>
                    <p>No liked videos</p>
                    <span>Videos you like will appear here</span>
                </div>
            `;
            return;
        }

        this.likedVideos.forEach(videoId => {
            const video = this.videos.find(v => v.id === videoId);
            if (video) {
                const videoCard = this.createVideoCard(video);
                grid.appendChild(videoCard);
            }
        });
    }

    loadMusicPage() {
        const grid = document.getElementById('musicGrid');
        grid.innerHTML = '';

        const musicVideos = this.videos.filter(video => video.category === 'music');
        musicVideos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            grid.appendChild(videoCard);
        });
    }

    loadSportsPage() {
        const grid = document.getElementById('sportsGrid');
        grid.innerHTML = '';

        const sportsVideos = this.videos.filter(video => video.category === 'sports');
        sportsVideos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            grid.appendChild(videoCard);
        });
    }

    loadGamingPage() {
        const grid = document.getElementById('gamingGrid');
        grid.innerHTML = '';

        const gamingVideos = this.videos.filter(video => video.category === 'gaming');
        gamingVideos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            grid.appendChild(videoCard);
        });
    }

    loadNewsPage() {
        const grid = document.getElementById('newsGrid');
        grid.innerHTML = '';

        const newsVideos = this.videos.filter(video => video.category === 'news');
        newsVideos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            grid.appendChild(videoCard);
        });
    }

    loadLearningPage() {
        const grid = document.getElementById('learningGrid');
        grid.innerHTML = '';

        const learningVideos = this.videos.filter(video => video.category === 'learning');
        learningVideos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            grid.appendChild(videoCard);
        });
    }

    loadSettingsPage() {
        // Initialize settings tabs
        this.setupSettingsTabs();
    }

    setupSettingsTabs() {
        // Settings tab navigation
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                this.switchSettingsTab(tabName);
            });
        });

        // Additional settings event listeners
        this.setupSettingsControls();
    }

    switchSettingsTab(tabName) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.settings-tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-content`).classList.add('active');
    }

    setupSettingsControls() {
        // Language setting
        const languageSelect = document.getElementById('language');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.settings.language = e.target.value;
                this.saveSettings();
                this.applyLanguage(e.target.value);
                this.showToast('Language updated', 'success');
            });
        }

        // Location setting
        const locationSelect = document.getElementById('location');
        if (locationSelect) {
            locationSelect.addEventListener('change', (e) => {
                this.settings.location = e.target.value;
                this.saveSettings();
                this.showToast('Location updated', 'success');
            });
        }

        // Video quality setting
        const videoQualitySelect = document.getElementById('videoQuality');
        if (videoQualitySelect) {
            videoQualitySelect.addEventListener('change', (e) => {
                this.settings.videoQuality = e.target.value;
                this.saveSettings();
                this.applyVideoQuality(e.target.value);
                this.showToast('Video quality updated', 'success');
            });
        }

        // Download quality setting
        const downloadQualitySelect = document.getElementById('download-quality');
        if (downloadQualitySelect) {
            downloadQualitySelect.addEventListener('change', (e) => {
                this.settings.downloadQuality = e.target.value;
                this.saveSettings();
                this.showToast('Download quality updated', 'success');
            });
        }

        // Caption language setting
        const captionLanguageSelect = document.getElementById('caption-language');
        if (captionLanguageSelect) {
            captionLanguageSelect.addEventListener('change', (e) => {
                this.settings.captionLanguage = e.target.value;
                this.saveSettings();
                this.showToast('Caption language updated', 'success');
            });
        }

        // Caption size setting
        const captionSizeSelect = document.getElementById('caption-size');
        if (captionSizeSelect) {
            captionSizeSelect.addEventListener('change', (e) => {
                this.settings.captionSize = e.target.value;
                this.saveSettings();
                this.applyCaptionSize(e.target.value);
                this.showToast('Caption size updated', 'success');
            });
        }

        // All checkbox settings with enhanced functionality
        const checkboxSettings = [
            'restrictedMode', 'subscriptions-notif', 'recommended-notif', 'comment-notif', 
            'live-notif', 'pause-watch-history', 'pause-search-history', 'private-subscriptions',
            'private-playlists', 'private-liked', 'new-ui', 'ai-features', 'always-choose-quality',
            'autoplay-on-home', 'annotations', 'show-captions', 'data-saver', 'smart-downloads',
            'download-on-wifi', 'live-chat-enabled', 'chat-filter', 'high-contrast',
            'keyboard-navigation', 'screen-reader', 'double-tap-seek', 'zoom-to-fill',
            'ambient-mode', 'theater-mode', 'miniplayer-auto', 'picture-in-picture',
            'auto-quality', 'stable-volume', 'speed-controls', 'gesture-controls'
        ];

        checkboxSettings.forEach(settingId => {
            const checkbox = document.getElementById(settingId);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.settings[settingId] = e.target.checked;
                    this.saveSettings();
                    this.applySettingChange(settingId, e.target.checked);
                    this.showToast('Setting updated', 'success');
                });
            }
        });

        // Playback speed setting
        const playbackSpeedSelect = document.getElementById('playback-speed');
        if (playbackSpeedSelect) {
            playbackSpeedSelect.addEventListener('change', (e) => {
                this.settings.playbackSpeed = e.target.value;
                this.saveSettings();
                this.applyPlaybackSpeed(e.target.value);
                this.showToast('Playback speed updated', 'success');
            });
        }

        // Seek duration setting
        const seekDurationSelect = document.getElementById('seek-duration');
        if (seekDurationSelect) {
            seekDurationSelect.addEventListener('change', (e) => {
                this.settings.seekDuration = e.target.value;
                this.saveSettings();
                this.showToast('Seek duration updated', 'success');
            });
        }

        // Volume normalization slider
        const volumeSlider = document.getElementById('volume-normalization');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.settings.volumeNormalization = e.target.value;
                this.saveSettings();
                this.applyVolumeNormalization(e.target.value);
            });
        }

        // Add account button
        const addAccountBtn = document.querySelector('.add-account-btn');
        if (addAccountBtn) {
            addAccountBtn.addEventListener('click', () => {
                this.showGoogleLoginPopup();
            });
        }

        // Switch account functionality
        document.querySelectorAll('.account-item').forEach(item => {
            if (!item.classList.contains('active')) {
                item.addEventListener('click', () => {
                    this.switchAccount(item.dataset.accountId);
                });
            }
        });

        // Family Centre setup
        const familyCentreBtn = document.querySelector('.family-centre-info .btn-primary');
        if (familyCentreBtn) {
            familyCentreBtn.addEventListener('click', () => {
                this.setupFamilyCentre();
            });
        }

        // Payment method setup
        const addPaymentBtn = document.querySelector('.payment-methods .btn-primary');
        if (addPaymentBtn) {
            addPaymentBtn.addEventListener('click', () => {
                this.addPaymentMethod();
            });
        }

        // Data download request
        const requestDownloadBtn = document.querySelector('.data-info .btn-primary');
        if (requestDownloadBtn) {
            requestDownloadBtn.addEventListener('click', () => {
                this.requestDataDownload();
            });
        }

        // Account deletion
        const deleteAccountBtn = document.querySelector('.data-info .btn-danger');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                this.deleteAccount();
            });
        }

        // Feedback form
        const feedbackForm = document.querySelector('.feedback-form button');
        if (feedbackForm) {
            feedbackForm.addEventListener('click', () => {
                const category = document.getElementById('feedback-category').value;
                const text = document.getElementById('feedback-text').value.trim();

                if (!text) {
                    this.showToast('Please enter your feedback', 'error');
                    return;
                }

                this.submitFeedback(category, text);
                document.getElementById('feedback-text').value = '';
                this.showToast('Thank you for your feedback!', 'success');
            });
        }

        // Connect to TV button
        const connectTvBtn = document.querySelector('.tv-info .btn-primary');
        if (connectTvBtn) {
            connectTvBtn.addEventListener('click', () => {
                this.connectToTV();
            });
        }

        // History management buttons
        const clearWatchBtn = document.querySelector('.history-actions .btn-secondary:first-child');
        const clearSearchBtn = document.querySelector('.history-actions .btn-secondary:last-child');
        const deleteAllBtn = document.querySelector('.history-actions .btn-danger');

        if (clearWatchBtn) {
            clearWatchBtn.addEventListener('click', () => {
                this.clearWatchHistory();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearchHistory();
            });
        }

        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', () => {
                this.deleteAllActivity();
            });
        }

        // Help center links
        document.querySelectorAll('.help-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const helpType = link.querySelector('span').textContent;
                this.openHelpCenter(helpType);
            });
        });

        // Terms and policies
        document.querySelectorAll('.about-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.openTermsPolicy(link.textContent);
            });
        });

        // Notification preferences with advanced controls
        this.setupNotificationControls();

        // Accessibility features
        this.setupAccessibilityControls();

        // Load saved settings
        this.loadSettingsFromStorage();
    }

    // Enhanced functionality methods
    applyLanguage(language) {
        // Apply language changes to UI
        document.documentElement.setAttribute('lang', language);
        // In a real app, this would load translation files
    }

    applyVideoQuality(quality) {
        // Apply video quality to current player
        const videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer && videoPlayer.src) {
            // Store current time and apply quality
            const currentTime = videoPlayer.currentTime;
            const wasPlaying = !videoPlayer.paused;

            // Apply quality setting
            videoPlayer.addEventListener('loadedmetadata', () => {
                videoPlayer.currentTime = currentTime;
                if (wasPlaying) videoPlayer.play();
            }, { once: true });
        }
    }

    applyCaptionSize(size) {
        const sizeMap = { small: '14px', medium: '16px', large: '18px' };
        document.documentElement.style.setProperty('--caption-size', sizeMap[size]);
    }

    applyPlaybackSpeed(speed) {
        const videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer) {
            videoPlayer.playbackRate = parseFloat(speed);
        }
    }

    applyVolumeNormalization(level) {
        const videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer) {
            videoPlayer.volume = level / 100;
        }
    }

    applySettingChange(settingId, value) {
        switch(settingId) {
            case 'high-contrast':
                document.body.classList.toggle('high-contrast', value);
                break;
            case 'keyboard-navigation':
                document.body.classList.toggle('keyboard-nav', value);
                break;
            case 'screen-reader':
                document.body.setAttribute('aria-live', value ? 'polite' : 'off');
                break;
            case 'double-tap-seek':
                this.enableDoubleTapSeek = value;
                break;
            case 'zoom-to-fill':
                this.enableZoomToFill = value;
                break;
            case 'ambient-mode':
                this.enableAmbientMode = value;
                break;
            case 'theater-mode':
                this.enableTheaterMode = value;
                break;
            case 'picture-in-picture':
                this.enablePictureInPicture = value;
                break;
            case 'data-saver':
                this.applyDataSaver(value);
                break;
        }
    }

    applyDataSaver(enabled) {
        if (enabled) {
            this.settings.videoQuality = '480p';
            this.settings.autoplay = false;
            this.showToast('Data saver enabled - Lower quality and autoplay disabled', 'info');
        }
    }

    // Account management
    showGoogleLoginPopup() {
        // Trigger Google login
        if (typeof signInWithGoogle === 'function') {
            signInWithGoogle();
        } else {
            this.showToast('Google login not available', 'error');
        }
    }

    switchAccount(accountId) {
        this.showToast('Switching account...', 'info');
        // In a real app, this would switch to the selected account
        setTimeout(() => {
            this.showToast('Account switched successfully', 'success');
        }, 1000);
    }

    setupFamilyCentre() {
        this.showToast('Opening Family Centre setup...', 'info');
        // Open family centre configuration
    }

    addPaymentMethod() {
        this.showToast('Opening payment method setup...', 'info');
        // Open payment method modal
    }

    requestDataDownload() {
        if (confirm('Request a download of your TikTik data? This may take some time to prepare.')) {
            this.showToast('Data download request submitted. You will be notified when ready.', 'success');
        }
    }

    deleteAccount() {
        const confirmText = prompt('To delete your account, type "DELETE" to confirm:');
        if (confirmText === 'DELETE') {
            if (confirm('This will permanently delete your account and all data. This action cannot be undone.')) {
                this.showToast('Account deletion process initiated. You will receive an email with next steps.', 'warning');
            }
        }
    }

    submitFeedback(category, text) {
        // Store feedback locally or send to server
        const feedback = {
            category,
            text,
            timestamp: new Date().toISOString(),
            userId: 'current-user'
        };

        let feedbacks = JSON.parse(localStorage.getItem('tiktik_feedbacks') || '[]');
        feedbacks.push(feedback);
        localStorage.setItem('tiktik_feedbacks', JSON.stringify(feedbacks));
    }

    connectToTV() {
        if ('presentation' in navigator) {
            this.showToast('Searching for available devices...', 'info');
            // Implement cast functionality
            setTimeout(() => {
                this.showToast('No compatible devices found nearby', 'warning');
            }, 2000);
        } else {
            this.showToast('TV casting not supported on this device', 'error');
        }
    }

    clearWatchHistory() {
        if (confirm('Clear all watch history? This action cannot be undone.')) {
            this.watchHistory = [];
            this.saveWatchHistory();
            this.showToast('Watch history cleared', 'success');
            if (this.currentPage === 'history') {
                this.loadHistoryPage();
            }
        }
    }

    clearSearchHistory() {
        if (confirm('Clear all search history?')) {
            localStorage.removeItem('tiktik_search_history');
            this.showToast('Search history cleared', 'success');
        }
    }

    deleteAllActivity() {
        if (confirm('Delete ALL activity including watch history, search history, comments, and interactions? This cannot be undone.')) {
            this.watchHistory = [];
            this.likedVideos = [];
            this.savedVideos = [];
            this.comments = {};

            localStorage.removeItem('tiktik_search_history');
            this.saveWatchHistory();
            this.saveLikedVideos();
            this.saveSavedVideos();
            this.saveComments();

            this.showToast('All activity deleted', 'success');
        }
    }

    openHelpCenter(helpType) {
        this.showToast(`Opening ${helpType}...`, 'info');
        // Open help modal or navigate to help section
    }

    openTermsPolicy(type) {
        this.showToast(`Opening ${type}...`, 'info');
        // Open terms/policy modal
    }

    setupNotificationControls() {
        // Advanced notification scheduling
        const notificationTime = document.getElementById('notification-time');
        if (notificationTime) {
            notificationTime.addEventListener('change', (e) => {
                this.settings.notificationTime = e.target.value;
                this.saveSettings();
                this.scheduleNotifications();
            });
        }

        // Notification sound selection
        const notificationSound = document.getElementById('notification-sound');
        if (notificationSound) {
            notificationSound.addEventListener('change', (e) => {
                this.settings.notificationSound = e.target.value;
                this.saveSettings();
                this.playNotificationPreview(e.target.value);
            });
        }
    }

    setupAccessibilityControls() {
        // Font size control
        const fontSizeSlider = document.getElementById('font-size');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                const size = e.target.value;
                document.documentElement.style.setProperty('--base-font-size', `${size}px`);
                this.settings.fontSize = size;
                this.saveSettings();
            });
        }

        // Motion reduction
        const reduceMotion = document.getElementById('reduce-motion');
        if (reduceMotion) {
            reduceMotion.addEventListener('change', (e) => {
                document.documentElement.style.setProperty('--animation-duration', e.target.checked ? '0s' : '0.3s');
                this.settings.reduceMotion = e.target.checked;
                this.saveSettings();
            });
        }
    }

    scheduleNotifications() {
        // Implementation for notification scheduling
        this.showToast('Notification preferences updated', 'success');
    }

    playNotificationPreview(sound) {
        // Play notification sound preview
        const audio = new Audio(`/sounds/${sound}.mp3`);
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Fallback for when audio files are not available
        });
    }

    loadSettingsFromStorage() {
        // Load and apply all saved settings
        Object.keys(this.settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[key];
                } else {
                    element.value = this.settings[key];
                }
            }
        });
    }

    loadHelpPage() {
        // Help page content is already in HTML
    }

    loadFeedbackPage() {
        // Feedback page content is already in HTML
    }

    createVideoCard(video, showDeleteButton = false) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = (e) => {
            if (!e.target.closest('.delete-video-btn')) {
                this.openVideoModal(video);
            }
        };

        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNDQuNSA5MEwxNjUgMTAyLjU5VjU3LjQxTDE0NC41IDkwWiIgZmlsbD0iIzk0QTNBOCIvPgo8L3N2Zz4K';">
                <span class="video-duration">${video.duration}</span>
                ${showDeleteButton ? `<button class="delete-video-btn" onclick="event.stopPropagation(); window.tiktikApp.deleteVideo('${video.id}');" title="Delete video"><i class="fas fa-trash"></i></button>` : ''}
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                <div class="channel-info">
                    <img class="channel-avatar" src="${video.avatar}" alt="${video.channel}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNGM0Y0RjYiLz4KPGF0aCBkPSJNMzIgMTZDMzguNjI3NyAxNiA0NCAyMS4zNzIzIDQ0IDI4QzQ0IDM0LjYyNzcgMzguNjI3NyA0MCAzMiA0MEMyNS4zNzIzIDQwIDIwIDM0LjYyNzcgMjAgMjhDMjAgMjEuMzcyMyAyNS4zNzIzIDE2IDMyIDE2WiIgZmlsbD0iIzk0QTNBOCIvPgo8L3N2Zz4K';">
                    <span class="channel-name">${video.channel}</span>
                </div>
                <div class="video-stats">${video.views} • ${video.uploadTime}</div>
            </div>
        `;

        return card;
    }

    openVideoModal(video) {
        this.currentVideo = video;
        const modal = document.getElementById('videoModal');
        const player = document.getElementById('videoPlayer');

        // Update video player
        player.src = video.videoUrl;

        // Update video info
        document.getElementById('modalVideoTitle').textContent = video.title;
        document.getElementById('modalChannelName').textContent = video.channel;
        document.getElementById('modalChannelAvatar').src = video.avatar;
        document.getElementById('modalVideoStats').textContent = `${video.views} • ${video.uploadTime}`;
        document.getElementById('modalVideoDescription').textContent = video.description;
        document.getElementById('likeCount').textContent = this.formatNumber(video.likes);

        // Update like button state
        const likeBtn = document.getElementById('likeBtn');
        if (this.likedVideos.includes(video.id)) {
            likeBtn.classList.add('active');
        } else {
            likeBtn.classList.remove('active');
        }

        // Update save button state
        const saveBtn = document.getElementById('saveBtn');
        if (this.savedVideos.includes(video.id)) {
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
            saveBtn.classList.add('active');
        } else {
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Save';
            saveBtn.classList.remove('active');
        }

        // Update subscribe button state
        const subscribeBtn = document.getElementById('subscribeBtn');
        const notificationBtn = document.getElementById('notificationBtn');
        const isSubscribed = this.isSubscribed(video.channel);
        
        if (isSubscribed) {
            subscribeBtn.innerHTML = '<span class="subscribe-text">Subscribed</span>';
            subscribeBtn.classList.add('subscribed');
            notificationBtn.style.display = 'block';
            
            // Update notification icon based on preference
            const preference = this.getNotificationPreference(video.channel);
            if (preference === 'all') {
                notificationBtn.classList.add('active');
                notificationBtn.innerHTML = '<i class="fas fa-bell"></i>';
            } else if (preference === 'personalized') {
                notificationBtn.classList.remove('active');
                notificationBtn.innerHTML = '<i class="fas fa-bell"></i>';
            } else {
                notificationBtn.classList.remove('active');
                notificationBtn.innerHTML = '<i class="fas fa-bell-slash"></i>';
            }
        } else {
            subscribeBtn.innerHTML = '<span class="subscribe-text">Subscribe</span>';
            subscribeBtn.classList.remove('subscribed');
            notificationBtn.style.display = 'none';
        }

        // Load comments
        this.loadComments(video.id);

        // Load recommended videos
        this.loadRecommendedVideos(video);

        modal.classList.add('active');

        // Auto-play if enabled
        if (this.settings.autoPlay) {
            player.play();
        }
    }

    closeVideoModal() {
        const modal = document.getElementById('videoModal');
        const player = document.getElementById('videoPlayer');

        modal.classList.remove('active', 'minimized', 'theater');
        player.pause();
        player.src = '';

        // Reset control states
        document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-play"></i>';
        document.getElementById('miniplayerPlayBtn').innerHTML = '<i class="fas fa-play"></i>';
        document.getElementById('minimizeBtn').innerHTML = '<i class="fas fa-compress"></i>';
        document.getElementById('theaterBtn').innerHTML = '<i class="fas fa-expand"></i>';
        document.getElementById('speedBtn').textContent = '1x';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('volumeFill').style.width = '80%';

        this.currentVideo = null;
    }

    loadComments(videoId) {
        const commentsList = document.getElementById('commentsList');
        const videoComments = this.comments[videoId] || [];

        commentsList.innerHTML = '';

        if (videoComments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-state">
                    <p>No comments yet</p>
                    <span>Be the first to comment!</span>
                </div>
            `;
            return;
        }

        videoComments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });

        document.getElementById('commentCount').textContent = videoComments.length;
    }

    createCommentElement(comment) {
        const element = document.createElement('div');
        element.className = 'comment-item';

        element.innerHTML = `
            <img class="user-avatar-small" src="${comment.avatar}" alt="${comment.author}">
            <div class="comment-content">
                <div class="comment-author">
                    ${comment.author}
                    <span class="comment-time">${comment.time}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-actions-bar">
                    <button class="comment-like-btn">
                        <i class="fas fa-thumbs-up"></i>
                        ${comment.likes || 0}
                    </button>
                    <button class="comment-reply-btn">Reply</button>
                </div>
            </div>
        `;

        return element;
    }

    loadRecommendedVideos(currentVideo) {
        const recommendedList = document.getElementById('recommendedList');
        recommendedList.innerHTML = '';

        // Get videos from same category or random videos
        const recommendations = this.videos
            .filter(video => video.id !== currentVideo.id)
            .slice(0, 5);

        recommendations.forEach(video => {
            const item = document.createElement('div');
            item.className = 'recommended-item';
            item.onclick = () => {
                this.closeVideoModal();
                setTimeout(() => this.openVideoModal(video), 100);
            };

            item.innerHTML = `
                <img class="recommended-thumbnail" src="${video.thumbnail}" alt="${video.title}">
                <div class="recommended-info">
                    <div class="recommended-title">${video.title}</div>
                    <div class="recommended-stats">${video.channel} • ${video.views}</div>
                </div>
            `;

            recommendedList.appendChild(item);
        });
    }

    performSearch() {
        const query = document.getElementById('searchInput').value.trim().toLowerCase();

        if (!query) return;

        this.showLoading();

        // Simulate search delay
        setTimeout(() => {
            const results = this.videos.filter(video => 
                video.title.toLowerCase().includes(query) ||
                video.channel.toLowerCase().includes(query) ||
                video.description.toLowerCase().includes(query)
            );

            this.displaySearchResults(results, query);
            this.hideLoading();
        }, 500);
    }

    displaySearchResults(results, query) {
        const grid = document.getElementById('videoGrid');
        grid.innerHTML = '';

        if (results.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No results for "${query}"</p>
                    <span>Try different keywords</span>
                </div>
            `;
            return;
        }

        results.forEach(video => {
            const videoCard = this.createVideoCard(video);
            grid.appendChild(videoCard);
        });

        // Update page title
        const homeTitle = document.querySelector('#homePage h2');
        if (!homeTitle) {
            const title = document.createElement('h2');
            title.textContent = `Search results for "${query}"`;
            document.getElementById('homePage').insertBefore(title, grid);
        } else {
            homeTitle.textContent = `Search results for "${query}"`;
        }

        // Navigate to home page to show results
        this.navigateToPage('home');
    }

    addToHistory(video) {
        // Remove if already exists
        this.watchHistory = this.watchHistory.filter(id => id !== video.id);

        // Add to beginning
        this.watchHistory.unshift(video.id);

        // Keep only last 50 videos
        if (this.watchHistory.length > 50) {
            this.watchHistory = this.watchHistory.slice(0, 50);
        }

        this.saveWatchHistory();
    }

    toggleLike() {
        if (!this.currentVideo) return;

        const likeBtn = document.getElementById('likeBtn');
        const videoId = this.currentVideo.id;

        if (this.likedVideos.includes(videoId)) {
            // Unlike
            this.likedVideos = this.likedVideos.filter(id => id !== videoId);
            likeBtn.classList.remove('active');
            this.showToast('Removed from liked videos', 'info');
        } else {
            // Like
            this.likedVideos.push(videoId);
            likeBtn.classList.add('active');
            this.showToast('Added to liked videos', 'success');
        }

        this.saveLikedVideos();
    }

    toggleDislike() {
        const dislikeBtn = document.getElementById('dislikeBtn');

        if (dislikeBtn.classList.contains('active')) {
            dislikeBtn.classList.remove('active');
        } else {
            dislikeBtn.classList.add('active');
            // Remove from liked if disliked
            if (this.currentVideo && this.likedVideos.includes(this.currentVideo.id)) {
                this.toggleLike();
            }
        }
    }

    shareVideo() {
        if (!this.currentVideo) return;

        const url = `${window.location.origin}?video=${this.currentVideo.id}`;

        if (navigator.share) {
            navigator.share({
                title: this.currentVideo.title,
                text: `Check out this video: ${this.currentVideo.title}`,
                url: url
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Link copied to clipboard', 'success');
            });
        }
    }

    toggleSave() {
        if (!this.currentVideo) return;

        const saveBtn = document.getElementById('saveBtn');
        const videoId = this.currentVideo.id;

        if (this.savedVideos.includes(videoId)) {
            // Remove from saved
            this.savedVideos = this.savedVideos.filter(id => id !== videoId);
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Save';
            saveBtn.classList.remove('active');
            this.showToast('Removed from saved videos', 'info');
        } else {
            // Add to saved
            this.savedVideos.push(videoId);
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
            saveBtn.classList.add('active');
            this.showToast('Saved to watch later', 'success');
        }

        this.saveSavedVideos();
    }

    downloadVideo() {
        if (!this.currentVideo) return;

        this.showToast('Download started', 'success');

        // Simulate download
        const link = document.createElement('a');
        link.href = this.currentVideo.videoUrl;
        link.download = `${this.currentVideo.title}.mp4`;
        link.click();
    }

    showCommentActions() {
        document.querySelector('.comment-actions').style.display = 'flex';
    }

    hideCommentActions() {
        document.querySelector('.comment-actions').style.display = 'none';
        document.getElementById('commentInput').value = '';
    }

    submitComment() {
        const commentInput = document.getElementById('commentInput');
        const commentText = commentInput.value.trim();

        if (!commentText || !this.currentVideo) return;

        const newComment = {
            id: Date.now(),
            author: 'You',
            avatar: 'https://pixabay.com/get/g1882a617f55023cde87198feea9e830686b0a69ae7f315295cebe2b111a575a3d2dd94672359c9d34b332edd722a8e7d502b680acae2e35040353fd2a2ee0f9a_1280.jpg',
            text: commentText,
            time: 'now',
            likes: 0
        };

        if (!this.comments[this.currentVideo.id]) {
            this.comments[this.currentVideo.id] = [];
        }

        this.comments[this.currentVideo.id].unshift(newComment);
        this.saveComments();

        // Refresh comments
        this.loadComments(this.currentVideo.id);

        // Clear input and hide actions
        this.hideCommentActions();

        this.showToast('Comment added', 'success');
    }

    openCreateModal() {
        document.getElementById('createModal').classList.add('active');
    }

    closeCreateModal() {
        document.getElementById('createModal').classList.remove('active');
    }

    openUploadModal() {
        document.getElementById('uploadModal').classList.add('active');
    }

    closeUploadModal() {
        document.getElementById('uploadModal').classList.remove('active');
        this.resetUploadForm();
    }

    resetUploadForm() {
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('uploadForm').style.display = 'none';
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoDescription').value = '';
        document.getElementById('videoCategory').value = 'general';
        document.getElementById('videoFileInput').value = '';
    }

   handleVideoFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
        this.showToast('Please select a valid video file', 'error');
        return;
    }

    // Check file size (max 10MB for localStorage compatibility)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        this.showToast(`File too large! Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`, 'error');
        return;
    }

    this.tempUploadedVideo = file;

    // Preview दिखाएं
    const previewEl = document.getElementById('uploadPreview');
    if (previewEl) {
        previewEl.src = URL.createObjectURL(file);
        previewEl.style.display = 'block';
    }

    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('uploadForm').style.display = 'block';
    document.getElementById('videoTitle').value = file.name.replace(/\.[^/.]+$/, '');
}


    async publishVideo() {
        const title = document.getElementById('videoTitle').value.trim();
        const description = document.getElementById('videoDescription').value.trim();
        const category = document.getElementById('videoCategory').value;

        if (!title) {
            this.showToast('Please enter a title', 'error');
            return;
        }

        if (!this.tempUploadedVideo) {
            this.showToast('Please select a video file first', 'error');
            return;
        }

        if (!this.currentUserId) {
            this.showToast('Please login first', 'error');
            return;
        }

        try {
            this.showLoading();
            this.showToast('Uploading video to cloud storage...', 'info');

            // Upload video to R2
            const videoUrl = await uploadVideoToR2(this.tempUploadedVideo);

            // Save to Firestore
            if (firestore) {
                await firestore.collection('videos').add({
                    uploaderId: this.currentUserId,
                    title: title,
                    description: description,
                    category: category,
                    videoUrl: videoUrl,
                    channel: this.channelData.name,
                    avatar: this.channelData.avatar || '',
                    thumbnail: videoUrl,
                    isShort: false,
                    isLive: false,
                    views: 0,
                    likes: 0,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }

            this.hideLoading();
            this.tempUploadedVideo = null;
            this.closeUploadModal();
            this.showToast('Video uploaded successfully!', 'success');

            // Reload user's videos
            await this.loadUserVideos();

            // Refresh feed and channel page
            await this.loadAllVideosFromFirestore();
            if (this.currentPage === 'library') {
                this.loadLibraryPage();
            } else {
                this.loadHomePage();
            }
        } catch (error) {
            this.hideLoading();
            console.error('Error publishing video:', error);
            this.showToast('Failed to upload video: ' + error.message, 'error');
        }
    }

    fileToDataURL(file, callback) {
        const reader = new FileReader();
        
        // Set timeout for large files
        const timeout = setTimeout(() => {
            reader.abort();
            this.showToast('Upload timeout - file may be too large', 'error');
            callback(null);
        }, 30000); // 30 second timeout
        
        reader.onload = (e) => {
            clearTimeout(timeout);
            callback(e.target.result);
        };
        
        reader.onerror = () => {
            clearTimeout(timeout);
            this.showToast('Error reading video file', 'error');
            callback(null);
        };
        
        reader.onabort = () => {
            clearTimeout(timeout);
            callback(null);
        };
        
        try {
            reader.readAsDataURL(file);
        } catch (error) {
            clearTimeout(timeout);
            this.showToast('Error reading file: ' + error.message, 'error');
            callback(null);
        }
    }

    generateThumbnailAsDataURL(videoFile, callback) {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let hasCalledBack = false;
        
        // Timeout for thumbnail generation
        const timeout = setTimeout(() => {
            if (!hasCalledBack) {
                hasCalledBack = true;
                URL.revokeObjectURL(video.src);
                this.showToast('Thumbnail generation timeout', 'warning');
                callback(null);
            }
        }, 10000); // 10 second timeout
        
        video.preload = 'metadata';
        video.muted = true;
        video.src = URL.createObjectURL(videoFile);
        
        video.addEventListener('loadeddata', () => {
            try {
                video.currentTime = Math.min(1, video.duration / 2);
            } catch (e) {
                video.currentTime = 0;
            }
        });
        
        video.addEventListener('seeked', () => {
            if (hasCalledBack) return;
            
            try {
                canvas.width = video.videoWidth || 320;
                canvas.height = video.videoHeight || 180;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                clearTimeout(timeout);
                hasCalledBack = true;
                URL.revokeObjectURL(video.src);
                callback(thumbnailDataUrl);
            } catch (error) {
                clearTimeout(timeout);
                hasCalledBack = true;
                URL.revokeObjectURL(video.src);
                console.error('Thumbnail error:', error);
                callback(null);
            }
        });
        
        video.addEventListener('error', (e) => {
            if (hasCalledBack) return;
            clearTimeout(timeout);
            hasCalledBack = true;
            URL.revokeObjectURL(video.src);
            console.error('Video load error:', e);
            callback(null);
        });
        
        // Try to load the video
        video.load();
    }

    generateThumbnail(videoFile, callback) {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        
        video.addEventListener('loadeddata', () => {
            video.currentTime = 1;
        });
        
        video.addEventListener('seeked', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                const thumbnailUrl = URL.createObjectURL(blob);
                callback(thumbnailUrl);
            }, 'image/jpeg', 0.7);
        });
        
        video.addEventListener('error', () => {
            callback(null);
        });
    }

    openChannelEditModal() {
        const modal = document.getElementById('channelEditModal');

        // Populate current values
        document.getElementById('editChannelName').value = this.channelData.name;
        document.getElementById('editChannelDescription').value = this.channelData.description;

        modal.classList.add('active');
    }

    closeChannelEditModal() {
        document.getElementById('channelEditModal').classList.remove('active');
    }

    saveChannelChanges() {
        const name = document.getElementById('editChannelName').value.trim();
        const description = document.getElementById('editChannelDescription').value.trim();

        if (!name) {
            this.showToast('Please enter a channel name', 'error');
            return;
        }

        this.channelData.name = name;
        this.channelData.description = description;

        this.saveChannelData();
        this.closeChannelEditModal();
        this.showToast('Channel updated successfully!', 'success');

        // Refresh if on library page
        if (this.currentPage === 'library') {
            this.loadLibraryPage();
        }
    }

    handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            this.channelData.avatar = event.target.result;
            this.saveChannelData();
            this.showToast('Avatar updated successfully!', 'success');
            
            // Update display immediately
            if (this.currentPage === 'library') {
                this.loadLibraryPage();
            }
        };
        reader.readAsDataURL(file);
    }

    handleBannerChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            this.channelData.banner = event.target.result;
            this.saveChannelData();
            this.showToast('Banner updated successfully!', 'success');
            
            // Update display immediately
            if (this.currentPage === 'library') {
                this.loadLibraryPage();
            }
        };
        reader.readAsDataURL(file);
    }

    switchChannelTab(tab) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.channel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Add active class to selected tab and content
        const tabButton = document.querySelector(`[data-tab="${tab}"]`);
        const tabContent = document.getElementById(`${tab}Tab`);
        
        if (tabButton && tabContent) {
            tabButton.classList.add('active');
            tabContent.classList.add('active');
        }

        // Load content based on selected tab with smooth transition
        switch(tab) {
            case 'videos':
                this.loadMyVideos();
                break;
            case 'shorts':
                this.displayMyShorts();
                break;
            case 'live':
                this.loadMyLiveStreams();
                break;
            case 'playlists':
                this.showToast('Playlists feature coming soon', 'info');
                break;
            case 'about':
                this.loadChannelAbout();
                break;
        }
    }

    displayMyShorts() {
        const shortsGrid = document.getElementById('myShortsGrid');
        if (!shortsGrid) return;
        
        shortsGrid.innerHTML = '';
        
        if (this.myShorts.length === 0) {
            return;
        }
        
        this.myShorts.forEach(short => {
            const shortCard = this.createVideoCard(short);
            shortsGrid.appendChild(shortCard);
        });
    }

    loadMyLiveStreams() {
        const liveGrid = document.getElementById('myLiveGrid');
        if (!liveGrid) return;
        
        liveGrid.innerHTML = '';
        
        if (this.liveStreams.length === 0) {
            return;
        }
        
        this.liveStreams.forEach(stream => {
            const streamCard = this.createVideoCard(stream);
            liveGrid.appendChild(streamCard);
        });
    }

    loadChannelAbout() {
        // Channel about information is already loaded in the HTML
        // Just update any dynamic content if needed
        const joinDate = document.getElementById('joinDate');
        const totalViews = document.getElementById('totalViews');
        
        if (joinDate) {
            joinDate.textContent = this.channelData.joinDate || 'Today';
        }
        
        if (totalViews) {
            const totalViewCount = this.myVideos.reduce((sum, video) => {
                const views = parseInt(video.views.replace(/[^0-9]/g, '')) || 0;
                return sum + views;
            }, 0);
            totalViews.textContent = totalViewCount > 0 ? totalViewCount.toLocaleString() : '0';
        }
    }

    openCreateChannelModal() {
        const channelName = prompt('Enter your channel name:');
        if (!channelName || !channelName.trim()) {
            this.showToast('Channel name is required', 'error');
            return;
        }

        this.channelData.name = channelName.trim();
        this.channelData.joinDate = new Date().toLocaleDateString();
        this.saveChannelData();
        
        this.showToast('Channel created successfully!', 'success');
        this.navigateToPage('library');
    }

    openShortModal() {
        document.getElementById('shortModal').classList.add('active');
    }

    closeShortModal() {
        document.getElementById('shortModal').classList.remove('active');
        this.resetShortForm();
    }

    resetShortForm() {
        document.getElementById('shortUploadArea').style.display = 'block';
        document.getElementById('shortForm').style.display = 'none';
        document.getElementById('shortTitle').value = '';
        document.getElementById('shortDescription').value = '';
        document.getElementById('shortCategory').value = 'general';
        document.getElementById('shortFileInput').value = '';
    }

    handleShortFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            this.showToast('Please select a video file', 'error');
            return;
        }

        // Create video preview
        const preview = document.getElementById('shortPreview');
        preview.src = URL.createObjectURL(file);

        document.getElementById('shortUploadArea').style.display = 'none';
        document.getElementById('shortForm').style.display = 'flex';
        document.getElementById('shortTitle').value = file.name.replace(/\.[^/.]+$/, '');
    }

    async publishShort() {
        const title = document.getElementById('shortTitle').value.trim();
        const description = document.getElementById('shortDescription').value.trim();
        const category = document.getElementById('shortCategory').value;
        const fileInput = document.getElementById('shortFileInput');
        const file = fileInput.files[0];

        if (!title) {
            this.showToast('Please enter a title', 'error');
            return;
        }

        if (!file) {
            this.showToast('Please select a video file', 'error');
            return;
        }

        if (!this.currentUserId) {
            this.showToast('Please login first', 'error');
            return;
        }

        try {
            this.showLoading();

            // Upload video to R2
            const videoUrl = await uploadVideoToR2(file);

            // Save to Firestore
            if (firestore) {
                await firestore.collection('videos').add({
                    uploaderId: this.currentUserId,
                    title: title,
                    description: description,
                    category: category,
                    videoUrl: videoUrl,
                    channel: this.channelData.name,
                    avatar: this.channelData.avatar || '',
                    thumbnail: videoUrl,
                    isShort: true,
                    isLive: false,
                    views: 0,
                    likes: 0,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }

            this.hideLoading();
            this.closeShortModal();
            this.showToast('Short published successfully!', 'success');

            // Reload user's shorts
            await this.loadUserVideos();

            // Refresh feed and channel page
            await this.loadAllVideosFromFirestore();
            if (this.currentPage === 'library') {
                this.loadLibraryPage();
            }
        } catch (error) {
            this.hideLoading();
            console.error('Error publishing short:', error);
            this.showToast('Failed to publish short: ' + error.message, 'error');
        }
    }

    openLiveModal() {
        document.getElementById('liveModal').classList.add('active');
        this.initializeCamera();
    }

    closeLiveModal() {
        document.getElementById('liveModal').classList.remove('active');
        this.stopCamera();
        this.resetLiveForm();
    }

    resetLiveForm() {
        document.getElementById('liveTitle').value = '';
        document.getElementById('liveDescription').value = '';
        document.getElementById('liveCategory').value = 'gaming';
        document.querySelector('input[name="livePrivacy"][value="public"]').checked = true;
    }

    async initializeCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const preview = document.getElementById('cameraPreview');
            preview.srcObject = stream;
            this.cameraStream = stream;
            this.isCameraOn = true;
            this.isMicOn = true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showToast('Camera access denied', 'error');
        }
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
            this.isCameraOn = false;
            this.isMicOn = false;
        }
    }

    toggleCamera() {
        if (!this.cameraStream) return;

        const videoTracks = this.cameraStream.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
        });

        this.isCameraOn = !this.isCameraOn;
        const btn = document.getElementById('toggleCameraBtn');
        btn.innerHTML = this.isCameraOn ? '<i class="fas fa-video"></i> Camera' : '<i class="fas fa-video-slash"></i> Camera';
    }

    toggleMicrophone() {
        if (!this.cameraStream) return;

        const audioTracks = this.cameraStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });

        this.isMicOn = !this.isMicOn;
        const btn = document.getElementById('toggleMicBtn');
        btn.innerHTML = this.isMicOn ? '<i class="fas fa-microphone"></i> Microphone' : '<i class="fas fa-microphone-slash"></i> Microphone';
    }

    async startLiveStream() {
        const title = document.getElementById('liveTitle').value.trim();
        const description = document.getElementById('liveDescription').value.trim();
        const category = document.getElementById('liveCategory').value;
        const privacy = document.querySelector('input[name="livePrivacy"]:checked').value;

        if (!title) {
            this.showToast('Please enter a stream title', 'error');
            return;
        }

        if (!this.currentUserId) {
            this.showToast('Please login first', 'error');
            return;
        }

        if (!this.cameraStream) {
            this.showToast('Camera not initialized', 'error');
            return;
        }

        try {
            this.showLoading();

            // Capture frame from camera for thumbnail
            const preview = document.getElementById('cameraPreview');
            let thumbnailDataUrl = '';
            
            if (preview && preview.srcObject) {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = preview.videoWidth || 320;
                    canvas.height = preview.videoHeight || 180;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
                    thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                } catch (e) {
                    console.log('Could not capture thumbnail from camera');
                }
            }

            // Initialize MediaRecorder for actual recording
            this.recordedChunks = [];
            const options = { mimeType: 'video/webm;codecs=vp9' };
            
            // Fallback to vp8 if vp9 not supported
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8';
            }

            this.mediaRecorder = new MediaRecorder(this.cameraStream, options);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                try {
                    // Create video blob from recorded chunks
                    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                    const videoFile = new File([blob], `live-${Date.now()}.webm`, { type: 'video/webm' });

                    this.showToast('Uploading recorded stream...', 'info');

                    // Upload to R2
                    const videoUrl = await uploadVideoToR2(videoFile);

                    // Save to Firestore as completed live stream
                    if (firestore) {
                        await firestore.collection('videos').add({
                            uploaderId: this.currentUserId,
                            title: title,
                            description: description,
                            category: category,
                            videoUrl: videoUrl,
                            channel: this.channelData.name,
                            avatar: this.channelData.avatar || '',
                            thumbnail: thumbnailDataUrl || videoUrl,
                            isShort: false,
                            isLive: true,
                            wasLive: true,
                            endTime: firebase.firestore.FieldValue.serverTimestamp(),
                            views: 0,
                            likes: 0,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        });
                    }

                    this.showToast('Live stream saved successfully!', 'success');
                    
                    // Reload user's videos
                    await this.loadUserVideos();
                    await this.loadAllVideosFromFirestore();
                    
                    if (this.currentPage === 'library') {
                        this.loadLibraryPage();
                    }
                } catch (error) {
                    console.error('Error saving live stream:', error);
                    this.showToast('Failed to save live stream: ' + error.message, 'error');
                } finally {
                    this.hideLoading();
                    this.recordedChunks = [];
                }
            };

            // Start recording (collect data every 1 second)
            this.mediaRecorder.start(1000);
            this.isRecording = true;

            this.hideLoading();
            this.closeLiveModal();
            this.showToast('Live stream started! Recording in progress...', 'success');

            // Show a notification that stream is live
            const streamDuration = 5 * 60 * 1000; // 5 minutes for demo
            setTimeout(() => {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                    this.isRecording = false;
                    this.showToast('Live stream ended. Processing and uploading...', 'info');
                }
            }, streamDuration);

        } catch (error) {
            this.hideLoading();
            console.error('Error starting live stream:', error);
            this.showToast('Failed to start live stream: ' + error.message, 'error');
        }
    }

    clearHistory() {
        this.watchHistory = [];
        this.saveWatchHistory();
        this.showToast('Watch history cleared', 'success');

        if (this.currentPage === 'history') {
            this.loadHistoryPage();
        }
    }

    resetSettings() {
        this.settings = {
            theme: 'light',
            autoPlay: true,
            showDescriptions: true,
            videosPerPage: 20
        };
        this.saveSettings();
        this.applyTheme();
        this.updateAdminSettings();
        this.showToast('Settings reset to default', 'success');
    }

    saveSettings() {
        localStorage.setItem('tiktik_settings', JSON.stringify(this.settings));
        this.showToast('Settings saved', 'success');
    }

    // Data persistence methods
    loadSettings() {
        const saved = localStorage.getItem('tiktik_settings');
        return saved ? JSON.parse(saved) : {
            theme: 'light',
            autoPlay: true,
            showDescriptions: true,
            videosPerPage: 20
        };
    }

    loadWatchHistory() {
        const saved = localStorage.getItem('tiktik_history');
        return saved ? JSON.parse(saved) : [];
    }

    saveWatchHistory() {
        localStorage.setItem('tiktik_history', JSON.stringify(this.watchHistory));
    }

    loadLikedVideos() {
        const saved = localStorage.getItem('tiktik_liked');
        return saved ? JSON.parse(saved) : [];
    }

    saveLikedVideos() {
        localStorage.setItem('tiktik_liked', JSON.stringify(this.likedVideos));
    }

    loadSavedVideos() {
        const saved = localStorage.getItem('tiktik_saved_videos');
        return saved ? JSON.parse(saved) : [];
    }

    saveSavedVideos() {
        localStorage.setItem('tiktik_saved_videos', JSON.stringify(this.savedVideos));
    }

    loadComments() {
        const saved = localStorage.getItem('tiktik_comments');
        return saved ? JSON.parse(saved) : {};
    }

    saveComments() {
        localStorage.setItem('tiktik_comments', JSON.stringify(this.comments));
    }

    loadMyVideosFromStorage() {
        const saved = localStorage.getItem('tiktik_my_videos');
        return saved ? JSON.parse(saved) : [];
    }

    saveMyVideos() {
        localStorage.setItem('tiktik_my_videos', JSON.stringify(this.myVideos));
    }

    loadChannelData() {
        const saved = localStorage.getItem('tiktik_channel_data');
        return saved ? JSON.parse(saved) : {
            name: 'My Channel',
            description: 'Welcome to my channel! Here you\'ll find amazing content.',
            subscribers: 0,
            videoCount: 0,
            joinDate: new Date().toLocaleDateString(),
            totalViews: 0,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
            banner: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=300&fit=crop'
        };
    }

    saveChannelData() {
        localStorage.setItem('tiktik_channel_data', JSON.stringify(this.channelData));
    }

    loadMyShorts() {
        const saved = localStorage.getItem('tiktik_my_shorts');
        return saved ? JSON.parse(saved) : [];
    }

    saveMyShorts() {
        localStorage.setItem('tiktik_my_shorts', JSON.stringify(this.myShorts));
    }

    loadLiveStreams() {
        const saved = localStorage.getItem('tiktik_live_streams');
        return saved ? JSON.parse(saved) : [];
    }

    saveLiveStreams() {
        localStorage.setItem('tiktik_live_streams', JSON.stringify(this.liveStreams));
    }

    loadSubscriptions() {
        const saved = localStorage.getItem('tiktik_subscriptions');
        return saved ? JSON.parse(saved) : {};
    }

    saveSubscriptions() {
        localStorage.setItem('tiktik_subscriptions', JSON.stringify(this.subscriptions));
    }

    isSubscribed(channelName) {
        return this.subscriptions.hasOwnProperty(channelName);
    }

    subscribe(channelName) {
        if (!this.isSubscribed(channelName)) {
            this.subscriptions[channelName] = {
                subscribedAt: new Date().toISOString(),
                notificationPreference: 'all'
            };
            this.saveSubscriptions();
            this.showToast(`Subscribed to ${channelName}`, 'success');
            return true;
        }
        return false;
    }

    unsubscribe(channelName) {
        if (this.isSubscribed(channelName)) {
            delete this.subscriptions[channelName];
            this.saveSubscriptions();
            this.showToast(`Unsubscribed from ${channelName}`, 'info');
            return true;
        }
        return false;
    }

    setNotificationPreference(channelName, preference) {
        if (this.isSubscribed(channelName)) {
            this.subscriptions[channelName].notificationPreference = preference;
            this.saveSubscriptions();
            const messages = {
                'all': 'All notifications enabled',
                'personalized': 'Personalized notifications enabled',
                'none': 'Notifications turned off'
            };
            this.showToast(messages[preference] || 'Notification preference updated', 'success');
        }
    }

    getNotificationPreference(channelName) {
        return this.isSubscribed(channelName) ? this.subscriptions[channelName].notificationPreference : 'none';
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    toggleCaptions(show) {
        const videoPlayer = document.getElementById('videoPlayer');

        if (show) {
            // Enable captions/subtitles
            if (videoPlayer.textTracks && videoPlayer.textTracks.length > 0) {
                for (let track of videoPlayer.textTracks) {
                    track.mode = 'showing';
                }
            }
            this.showToast('Captions enabled', 'info');
        } else {
            // Disable captions/subtitles
            if (videoPlayer.textTracks && videoPlayer.textTracks.length > 0) {
                for (let track of videoPlayer.textTracks) {
                    track.mode = 'hidden';
                }
            }
            this.showToast('Captions disabled', 'info');
        }
    }

    handleSettingChange(setting) {
        switch(setting) {
            case 'quality':
                this.showQualityMenu();
                break;
            case 'speed':
                this.showSpeedMenu();
                break;
            case 'captions':
                this.showCaptionsMenu();
                break;
        }
    }

    showQualityMenu() {
        const qualities = ['Auto', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p'];
        this.showSubMenu('Quality', qualities, 'Auto', (quality) => {
            document.getElementById('currentQuality').textContent = quality;
            this.setVideoQuality(quality);
        });
    }

    showSpeedMenu() {
        const speeds = ['0.25', '0.5', '0.75', 'Normal', '1.25', '1.5', '1.75', '2'];
        this.showSubMenu('Playback speed', speeds, 'Normal', (speed) => {
            document.getElementById('currentSpeed').textContent = speed;
            this.setPlaybackSpeed(speed);
        });
    }

    showCaptionsMenu() {
        const options = ['Off', 'English', 'Hindi', 'Spanish', 'French'];
        this.showSubMenu('Subtitles/CC', options, 'Off', (option) => {
            document.getElementById('captionsStatus').textContent = option;
            this.setCaptionLanguage(option);
        });
    }

    showSubMenu(title, options, current, callback) {
        const dropdown = document.getElementById('settingsDropdown');
        dropdown.innerHTML = `
            <div class="settings-item" onclick="this.parentElement.classList.remove('active')">
                <i class="fas fa-chevron-left"></i>
                <span>${title}</span>
            </div>
            ${options.map(option => `
                <div class="settings-item" data-value="${option}">
                    <span>${option}</span>
                    ${option === current ? '<i class="fas fa-check"></i>' : ''}
                </div>
            `).join('')}
        `;

        dropdown.querySelectorAll('[data-value]').forEach(item => {
            item.addEventListener('click', () => {
                callback(item.dataset.value);
                dropdown.classList.remove('active');
            });
        });
    }

    setVideoQuality(quality) {
        this.showToast(`Video quality set to ${quality}`, 'info');
    }

    setPlaybackSpeed(speed) {
        const videoPlayer = document.getElementById('videoPlayer');
        const speedValue = speed === 'Normal' ? 1 : parseFloat(speed);
        videoPlayer.playbackRate = speedValue;
        this.showToast(`Playback speed set to ${speed}`, 'info');
    }

    setCaptionLanguage(language) {
        if (language === 'Off') {
            this.toggleCaptions(false);
            document.getElementById('captionsBtn').classList.remove('active');
        } else {
            this.toggleCaptions(true);
            document.getElementById('captionsBtn').classList.add('active');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.remove('active');
    }
}

// Profile dropdown toggle function
  function toggleProfileMenu() {
    const menu = document.getElementById('profile-menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }

  // Click outside to close dropdown
  document.addEventListener('click', function(event) {
    const container = document.getElementById('profile-container');
    const menu = document.getElementById('profile-menu');
    if (!container.contains(event.target)) {
      menu.style.display = 'none';
    }
  });

  // Profile menu functions
  function switchAccount() {
    alert('Switch Account feature - You can add multiple accounts here');
    toggleProfileMenu();
  }

  function openTikTikStudio() {
    alert('Opening TikTik Studio - Content creation and analytics dashboard');
    toggleProfileMenu();
  }

  function openCreatorAcademy() {
    alert('Opening Creator Academy - Learn content creation tips and tricks');
    toggleProfileMenu();
  }

  function openPurchases() {
    alert('Opening Purchases and Memberships - Manage your subscriptions');
    toggleProfileMenu();
  }

  function openYourData() {
    alert('Opening Your Data in TikTik - Download or delete your data');
    toggleProfileMenu();
  }

  function openAppearance() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);

    // Update theme icon
    const themeIcon = document.querySelector('#themeToggle i');
    themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    alert(`Appearance changed to ${newTheme} theme`);
    toggleProfileMenu();
  }

  function openLanguage() {
    alert('Language Settings - Choose your preferred language');
    toggleProfileMenu();
  }

  function openRestrictedMode() {
    alert('Restricted Mode - Filter potentially mature content');
    toggleProfileMenu();
  }

  function openLocation() {
    alert('Location Settings - Set your country/region');
    toggleProfileMenu();
  }

  function openKeyboardShortcuts() {
    alert('Keyboard Shortcuts:\n\nSpace - Play/Pause\nArrow Left - Seek backward\nArrow Right - Seek forward\nM - Mute/Unmute\nF - Fullscreen\nT - Theater mode\nI - Miniplayer');
    toggleProfileMenu();
  }

  function openSettings() {
    // Navigate to settings page
    if (window.tiktikApp) {
      window.tiktikApp.navigateToPage('settings');
    }
    toggleProfileMenu();
  }

  function openHelp() {
    // Navigate to help page
    if (window.tiktikApp) {
      window.tiktikApp.navigateToPage('help');
    }
    toggleProfileMenu();
  }

  function sendFeedback() {
    // Navigate to feedback page
    if (window.tiktikApp) {
      window.tiktikApp.navigateToPage('feedback');
    }
    toggleProfileMenu();
  }

// Real Google Sign-in with Firebase Authentication
function signInWithGoogle() {
  // Check if Firebase SDK is loaded
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
    if (window.tiktikApp) {
      window.tiktikApp.showToast('Firebase is loading, please wait...', 'info');
    }
    // Wait and retry
    setTimeout(() => {
      if (typeof firebase !== 'undefined' && firebaseAuth) {
        signInWithGoogle();
      } else {
        alert('Firebase could not be loaded. Please refresh the page.');
      }
    }, 2000);
    return;
  }

  // Check if Firebase is initialized
  if (!firebaseAuth) {
    console.error('Firebase Auth not initialized yet, waiting...');
    if (window.tiktikApp) {
      window.tiktikApp.showToast('Initializing Google Sign-In...', 'info');
    }
    // Wait for initialization
    setTimeout(() => {
      if (firebaseAuth) {
        signInWithGoogle();
      } else {
        alert('Google Sign-In is not available. Please refresh the page.');
      }
    }, 2000);
    return;
  }

  // Create Google Auth Provider
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  // Sign in with popup
  firebaseAuth.signInWithPopup(provider)
    .then((result) => {
      // Get user info
      const user = result.user;
      const userData = {
        displayName: user.displayName || 'User',
        email: user.email,
        photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        uid: user.uid
      };

      // Save user to localStorage
      localStorage.setItem('tiktik_user', JSON.stringify(userData));

      // Update UI
      updateUIAfterLogin(userData);

      if (window.tiktikApp) {
        window.tiktikApp.channelData.name = userData.displayName;
        window.tiktikApp.saveChannelData();
        window.tiktikApp.showToast('Signed in successfully with Google!', 'success');
      }
    })
    .catch((error) => {
      console.error('Google Sign-in Error:', error);
      if (window.tiktikApp) {
        window.tiktikApp.showToast('Sign-in failed: ' + error.message, 'error');
      }
    });
}

// Fallback sign-in for when Firebase is not available
function signInWithGoogleFallback() {
  const name = prompt("Enter your name:") || "Guest User";
  const email = prompt("Enter your email:") || "guest@tiktik.com";
  
  if (!name || !email) {
    if (window.tiktikApp) {
      window.tiktikApp.showToast('Login cancelled', 'info');
    }
    return;
  }

  const userData = {
    displayName: name,
    email: email,
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
  };

  localStorage.setItem('tiktik_user', JSON.stringify(userData));
  updateUIAfterLogin(userData);

  if (window.tiktikApp) {
    window.tiktikApp.channelData.name = name;
    window.tiktikApp.saveChannelData();
    window.tiktikApp.showToast('Signed in successfully as ' + name, 'success');
  }
}

// Update UI after successful login
function updateUIAfterLogin(userData) {
  document.getElementById("googleLoginBtn").style.display = "none";
  document.getElementById("profile-container").style.display = "flex";
  document.getElementById("profile-pic").src = userData.photoURL;
  document.getElementById("profile-avatar").src = userData.photoURL;
  document.getElementById("profile-name").innerText = userData.displayName;
  document.getElementById("profile-email").innerText = userData.email;
}

// Toggle profile dropdown menu visibility
function toggleProfileMenu() {
  const profileMenu = document.getElementById("profile-menu");
  if (profileMenu.style.display === "block") {
    profileMenu.style.display = "none";
  } else {
    profileMenu.style.display = "block";
  }
}

// Close profile menu when clicking outside
document.addEventListener('click', function(event) {
  const profileContainer = document.getElementById('profile-container');
  const profileMenu = document.getElementById('profile-menu');
  
  if (profileContainer && !profileContainer.contains(event.target)) {
    if (profileMenu) {
      profileMenu.style.display = 'none';
    }
  }
});

function logout() {
  // Sign out from Firebase if available
  if (firebaseAuth) {
    firebaseAuth.signOut()
      .then(() => {
        console.log('Firebase sign-out successful');
      })
      .catch((error) => {
        console.error('Firebase sign-out error:', error);
      });
  }

  // Remove user from localStorage
  localStorage.removeItem('tiktik_user');

  // UI update
  document.getElementById("googleLoginBtn").style.display = "block";
  document.getElementById("profile-container").style.display = "none";

  if (window.tiktikApp) {
    window.tiktikApp.showToast('Signed out successfully', 'info');
  }
  
  toggleProfileMenu();
}

// Profile menu functions
function switchAccount() {
  if (window.tiktikApp) {
    window.tiktikApp.showToast('Switch account feature coming soon', 'info');
  }
  toggleProfileMenu();
}

function openTikTikStudio() {
  if (window.tiktikApp) {
    window.tiktikApp.navigateToPage('library');
    window.tiktikApp.showToast('Opening TikTik Studio...', 'info');
  }
  toggleProfileMenu();
}

function openCreatorAcademy() {
  if (window.tiktikApp) {
    window.tiktikApp.showToast('Opening Creator Academy...', 'info');
  }
  toggleProfileMenu();
}

function openPurchases() {
  if (window.tiktikApp) {
    window.tiktikApp.showToast('Opening Purchases and Memberships...', 'info');
  }
  toggleProfileMenu();
}

function openYourData() {
  if (window.tiktikApp) {
    window.tiktikApp.navigateToPage('settings');
    window.tiktikApp.showToast('Opening Your Data settings...', 'info');
  }
  toggleProfileMenu();
}

function openAppearance() {
  if (window.tiktikApp) {
    window.tiktikApp.toggleTheme();
  }
  toggleProfileMenu();
}

function openLanguage() {
  if (window.tiktikApp) {
    window.tiktikApp.navigateToPage('settings');
    window.tiktikApp.showToast('Opening Language settings...', 'info');
  }
  toggleProfileMenu();
}

function openRestrictedMode() {
  if (window.tiktikApp) {
    window.tiktikApp.showToast('Restricted Mode toggle coming soon', 'info');
  }
  toggleProfileMenu();
}

function openLocation() {
  if (window.tiktikApp) {
    window.tiktikApp.navigateToPage('settings');
    window.tiktikApp.showToast('Opening Location settings...', 'info');
  }
  toggleProfileMenu();
}

function openKeyboardShortcuts() {
  if (window.tiktikApp) {
    window.tiktikApp.showToast('Keyboard Shortcuts: Space=Play/Pause, ←→=Seek, ↑↓=Volume, F=Fullscreen, M=Mute', 'info');
  }
  toggleProfileMenu();
}

function openSettings() {
  if (window.tiktikApp) {
    window.tiktikApp.navigateToPage('settings');
  }
  toggleProfileMenu();
}

function openHelp() {
  if (window.tiktikApp) {
    window.tiktikApp.navigateToPage('help');
  }
  toggleProfileMenu();
}

function sendFeedback() {
  if (window.tiktikApp) {
    window.tiktikApp.navigateToPage('feedback');
  }
  toggleProfileMenu();
}

// Create Channel button function
function createChannel() {
  if (window.tiktikApp) {
    window.tiktikApp.openCreateChannelModal();
  }
  toggleProfileMenu();
}

// Check if user is already signed-in on page load
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('tiktik_user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    document.getElementById("googleLoginBtn").style.display = "none";
    document.getElementById("profile-container").style.display = "flex";
    document.getElementById("profile-pic").src = user.photoURL;
    document.getElementById("profile-avatar").src = user.photoURL;
    document.getElementById("profile-name").innerText = user.displayName;
    document.getElementById("profile-email").innerText = user.email;
  }
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.tiktikApp = new TikTikApp();
    
    // If Firebase is already initialized, set up auth and load videos
    if (firestore && firebaseAuth) {
        window.tiktikApp.setupAuthStateListener();
        await window.tiktikApp.loadAllVideosFromFirestore();
        window.tiktikApp.loadHomePage();
        console.log('Firebase was already ready, auth and videos loaded');
    }

    // Subscribe button functionality
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', function() {
            if (!window.tiktikApp || !window.tiktikApp.currentVideo) return;
            
            const channelName = window.tiktikApp.currentVideo.channel;
            const isSubscribed = window.tiktikApp.isSubscribed(channelName);
            
            if (isSubscribed) {
                window.tiktikApp.unsubscribe(channelName);
                this.innerHTML = '<span class="subscribe-text">Subscribe</span>';
                this.classList.remove('subscribed');
                document.getElementById('notificationBtn').style.display = 'none';
            } else {
                window.tiktikApp.subscribe(channelName);
                this.innerHTML = '<span class="subscribe-text">Subscribed</span>';
                this.classList.add('subscribed');
                document.getElementById('notificationBtn').style.display = 'block';
            }
        });
    }

    // Notification bell button functionality
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
        });

        // Handle notification preference selection
        const notificationOptions = notificationDropdown.querySelectorAll('.notification-option');
        notificationOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                if (!window.tiktikApp || !window.tiktikApp.currentVideo) return;
                
                const preference = this.getAttribute('data-value');
                const channelName = window.tiktikApp.currentVideo.channel;
                
                window.tiktikApp.setNotificationPreference(channelName, preference);
                
                // Update UI
                notificationOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                // Update bell icon
                if (preference === 'all') {
                    notificationBtn.classList.add('active');
                    notificationBtn.innerHTML = '<i class="fas fa-bell"></i>';
                } else if (preference === 'personalized') {
                    notificationBtn.classList.remove('active');
                    notificationBtn.innerHTML = '<i class="fas fa-bell"></i>';
                } else {
                    notificationBtn.classList.remove('active');
                    notificationBtn.innerHTML = '<i class="fas fa-bell-slash"></i>';
                }
                
                notificationDropdown.classList.remove('show');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            notificationDropdown.classList.remove('show');
        });
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }
});
// Wallet and Payment Functions - Added to existing script.js

// Wallet Management Class
class WalletManager {
  constructor() {
    this.currentWallet = null;
  }

  // Get user wallet from Firestore
  async getUserWallet(userId) {
    if (!firestore) {
      console.error('Firestore not initialized');
      return null;
    }

    try {
      const walletDoc = await firestore.collection('wallets').doc(userId).get();
      
      if (walletDoc.exists) {
        return walletDoc.data();
      } else {
        // Create new wallet if doesn't exist
        const newWallet = {
          userId: userId,
          balance: 0,
          totalEarnings: 0,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await firestore.collection('wallets').doc(userId).set(newWallet);
        return newWallet;
      }
    } catch (error) {
      console.error('Error getting wallet:', error);
      return null;
    }
  }

  // Get user transactions
  async getUserTransactions(userId, limit = 20) {
    if (!firestore) return [];

    try {
      const transactions = await firestore.collection('transactions')
        .where('senderId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const received = await firestore.collection('transactions')
        .where('receiverId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const allTransactions = [];
      
      transactions.forEach(doc => {
        allTransactions.push({ id: doc.id, ...doc.data(), direction: 'sent' });
      });
      
      received.forEach(doc => {
        allTransactions.push({ id: doc.id, ...doc.data(), direction: 'received' });
      });

      // Sort by date
      allTransactions.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      return allTransactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // Send tip to creator
  async sendTip(receiverId, amount, videoId, message) {
    try {
      const user = JSON.parse(localStorage.getItem('tiktik_user') || '{}');
      
      if (!user.uid) {
        throw new Error('User not authenticated');
      }

      // Get Firebase ID token
      const idToken = await firebase.auth().currentUser.getIdToken();

      // Call backend API to process tip
      const response = await fetch('/api/process-tip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          receiverId,
          amount: Math.round(amount * 100), // Convert to cents
          videoId,
          message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process tip');
      }

      return data;
    } catch (error) {
      console.error('Error sending tip:', error);
      throw error;
    }
  }

  // Confirm tip after Stripe payment
  async confirmTip(transactionId, paymentIntentId) {
    try {
      const idToken = await firebase.auth().currentUser.getIdToken();

      const response = await fetch('/api/confirm-tip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          transactionId,
          paymentIntentId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm tip');
      }

      return data;
    } catch (error) {
      console.error('Error confirming tip:', error);
      throw error;
    }
  }

  // Request payout
  async requestPayout(amount, method = 'stripe') {
    try {
      const idToken = await firebase.auth().currentUser.getIdToken();

      const response = await fetch('/api/request-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          payoutMethod: method
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request payout');
      }

      return data;
    } catch (error) {
      console.error('Error requesting payout:', error);
      throw error;
    }
  }

  // Format currency
  formatCurrency(cents) {
    return `\$${(cents / 100).toFixed(2)}`;
  }
}

// Initialize wallet manager
const walletManager = new WalletManager();

// Video Upload to Cloudflare R2 with signed URL
async function uploadVideoToR2(file) {
  try {
    const user = JSON.parse(localStorage.getItem('tiktik_user') || '{}');
    
    if (!user.uid) {
      throw new Error('User not authenticated');
    }

    // Get Firebase ID token
    const idToken = await firebase.auth().currentUser.getIdToken();

    // Request signed upload URL from backend
    const response = await fetch('/api/generate-upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get upload URL');
    }

    // Upload file to R2 using signed URL
    const uploadResponse = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload video to R2');
    }

    // Save video metadata to Firestore
    if (firestore) {
      await firestore.collection('videos').add({
        uploaderId: user.uid,
        videoUrl: data.publicUrl,
        fileKey: data.fileKey,
        fileName: file.name,
        fileSize: file.size,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        title: '',
        description: '',
        views: 0,
        likes: 0
      });
    }

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading video to R2:', error);
    throw error;
  }
}

// Live Chat Manager
class LiveChatManager {
    constructor() {
        this.currentStreamId = null;
        this.chatUnsubscribe = null;
        this.viewerUnsubscribe = null;
        this.lastMessageTime = 0;
        this.messageLimit = 2000;
        this.slowModeEnabled = false;
        this.slowModeDuration = 5000;
        this.bannedUsers = new Set();
        this.timedOutUsers = new Map();
        this.isModerator = false;
        this.currentQuality = '720p';
        this.viewerPresenceRef = null;
        this.streamAnalytics = {
            joinTime: null,
            watchTime: 0,
            messagesCount: 0,
            peakViewers: 0
        };
    }

    async openLivePlayer(streamId, streamData) {
        this.currentStreamId = streamId;
        const modal = document.getElementById('livePlayerModal');
        const videoPlayer = document.getElementById('liveVideoPlayer');
        
        modal.classList.add('active');
        
        document.getElementById('liveStreamTitle').textContent = streamData.title || 'Live Stream';
        document.getElementById('liveStreamDescription').textContent = streamData.description || '';
        document.getElementById('liveChannelName').textContent = streamData.channel || 'Channel';
        document.getElementById('liveChannelAvatar').src = streamData.avatar || '';
        
        if (streamData.videoUrl) {
            videoPlayer.src = streamData.videoUrl;
            videoPlayer.play().catch(e => console.log('Autoplay prevented:', e));
        }
        
        const currentUser = firebaseAuth?.currentUser;
        if (currentUser && streamData.uploaderId === currentUser.uid) {
            document.getElementById('streamOwnerControls').style.display = 'flex';
            this.isModerator = true;
        } else {
            document.getElementById('streamOwnerControls').style.display = 'none';
            this.isModerator = false;
        }
        
        await this.joinAsViewer(streamId);
        this.initializeLiveChat(streamId);
        this.initializeViewerTracking(streamId);
        this.loadStreamSettings(streamId);
        this.setupEventListeners();
        this.startAnalyticsTracking();
    }

    async closeLivePlayer() {
        const modal = document.getElementById('livePlayerModal');
        const videoPlayer = document.getElementById('liveVideoPlayer');
        
        modal.classList.remove('active');
        videoPlayer.pause();
        videoPlayer.src = '';
        
        if (this.chatUnsubscribe) {
            this.chatUnsubscribe();
            this.chatUnsubscribe = null;
        }
        
        if (this.viewerUnsubscribe) {
            this.viewerUnsubscribe();
            this.viewerUnsubscribe = null;
        }
        
        await this.leaveAsViewer();
        await this.saveAnalytics();
        
        this.currentStreamId = null;
    }

    async joinAsViewer(streamId) {
        if (!firebaseAuth?.currentUser || !firestore) return;
        
        const user = firebaseAuth.currentUser;
        const viewerRef = firestore
            .collection('liveStreams')
            .doc(streamId)
            .collection('viewers')
            .doc(user.uid);
        
        this.viewerPresenceRef = viewerRef;
        
        await viewerRef.set({
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userAvatar: user.photoURL || '',
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true
        });
        
        await firestore.collection('videos').doc(streamId).update({
            currentViewers: firebase.firestore.FieldValue.increment(1)
        });
    }

    async leaveAsViewer() {
        if (!this.viewerPresenceRef || !this.currentStreamId) return;
        
        try {
            await this.viewerPresenceRef.delete();
            await firestore.collection('videos').doc(this.currentStreamId).update({
                currentViewers: firebase.firestore.FieldValue.increment(-1)
            });
        } catch (error) {
            console.error('Error leaving stream:', error);
        }
    }

    initializeViewerTracking(streamId) {
        if (!firestore) return;
        
        this.viewerUnsubscribe = firestore
            .collection('videos')
            .doc(streamId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    const viewerCount = data.currentViewers || 0;
                    const viewerElement = document.querySelector('#liveViewerCount span');
                    if (viewerElement) {
                        viewerElement.textContent = `${viewerCount} viewer${viewerCount !== 1 ? 's' : ''}`;
                    }
                    
                    if (viewerCount > this.streamAnalytics.peakViewers) {
                        this.streamAnalytics.peakViewers = viewerCount;
                    }
                }
            });
    }

    async loadStreamSettings(streamId) {
        if (!firestore) return;
        
        try {
            const settingsDoc = await firestore
                .collection('liveStreams')
                .doc(streamId)
                .collection('settings')
                .doc('chatSettings')
                .get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                this.slowModeEnabled = settings.slowModeEnabled || false;
                this.slowModeDuration = settings.slowModeDuration || 5000;
                this.bannedUsers = new Set(settings.bannedUsers || []);
            }
        } catch (error) {
            console.error('Error loading stream settings:', error);
        }
    }

    initializeLiveChat(streamId) {
        if (!firestore) return;
        
        const messagesContainer = document.getElementById('liveChatMessages');
        messagesContainer.innerHTML = '<div class="chat-welcome">Welcome to live chat! Be respectful to others.</div>';
        
        this.chatUnsubscribe = firestore
            .collection('liveChats')
            .doc(streamId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .limit(100)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.addChatMessage(change.doc.data());
                    }
                });
            });
    }

    addChatMessage(messageData) {
        const messagesContainer = document.getElementById('liveChatMessages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        if (messageData.isSuperChat) {
            messageDiv.classList.add('superchat');
            if (messageData.highlightColor) {
                messageDiv.style.setProperty('--superchat-color', messageData.highlightColor);
            }
        }
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'chat-message-header';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'chat-user-avatar';
        avatarDiv.textContent = (messageData.userName || 'U')[0].toUpperCase();
        
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'chat-username';
        usernameSpan.textContent = messageData.userName || 'Anonymous';
        
        if (messageData.isSuperChat && messageData.superChatAmount) {
            const amountSpan = document.createElement('span');
            amountSpan.className = 'superchat-amount';
            amountSpan.textContent = `$${messageData.superChatAmount}`;
            usernameSpan.appendChild(amountSpan);
        }
        
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'chat-timestamp';
        timestampSpan.textContent = this.formatTimestamp(messageData.timestamp);
        
        headerDiv.appendChild(avatarDiv);
        headerDiv.appendChild(usernameSpan);
        
        if (this.isModerator && messageData.userId !== firebaseAuth?.currentUser?.uid) {
            const modActionsDiv = document.createElement('div');
            modActionsDiv.className = 'chat-mod-actions';
            
            const timeoutBtn = document.createElement('button');
            timeoutBtn.className = 'mod-action-btn';
            timeoutBtn.innerHTML = '<i class="fas fa-clock"></i>';
            timeoutBtn.title = 'Timeout (60s)';
            timeoutBtn.onclick = () => this.timeoutUser(messageData.userId, messageData.userName, 60000);
            
            const banBtn = document.createElement('button');
            banBtn.className = 'mod-action-btn';
            banBtn.innerHTML = '<i class="fas fa-ban"></i>';
            banBtn.title = 'Ban User';
            banBtn.onclick = () => this.banUser(messageData.userId, messageData.userName);
            
            modActionsDiv.appendChild(timeoutBtn);
            modActionsDiv.appendChild(banBtn);
            headerDiv.appendChild(modActionsDiv);
        }
        
        headerDiv.appendChild(timestampSpan);
        
        const textDiv = document.createElement('div');
        textDiv.className = 'chat-message-text';
        textDiv.textContent = messageData.message;
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(textDiv);
        
        messagesContainer.appendChild(messageDiv);
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async sendMessage(isSuperChat = false, amount = 0) {
        if (!firebaseAuth?.currentUser || !this.currentStreamId) return;
        
        const user = firebaseAuth.currentUser;
        
        if (this.bannedUsers.has(user.uid)) {
            window.tiktikApp?.showToast('You are banned from this chat', 'error');
            return;
        }
        
        if (this.timedOutUsers.has(user.uid)) {
            const timeoutEnd = this.timedOutUsers.get(user.uid);
            if (Date.now() < timeoutEnd) {
                const remaining = Math.ceil((timeoutEnd - Date.now()) / 1000);
                window.tiktikApp?.showToast(`You are timed out for ${remaining} seconds`, 'warning');
                return;
            } else {
                this.timedOutUsers.delete(user.uid);
            }
        }
        
        const input = document.getElementById('liveChatInput');
        const message = input.value.trim();
        
        if (!message || message.length > 200) return;
        
        const now = Date.now();
        const cooldown = this.slowModeEnabled ? this.slowModeDuration : 2000;
        
        if (now - this.lastMessageTime < cooldown && !isSuperChat) {
            const remaining = Math.ceil((cooldown - (now - this.lastMessageTime)) / 1000);
            window.tiktikApp?.showToast(`Please wait ${remaining} seconds before sending another message`, 'warning');
            return;
        }
        
        try {
            const messageData = {
                userId: user.uid,
                userName: user.displayName || 'User',
                userAvatar: user.photoURL || '',
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                isSuperChat: isSuperChat,
                superChatAmount: amount
            };
            
            if (isSuperChat && amount > 0) {
                messageData.highlightColor = this.getSuperChatColor(amount);
            }
            
            await firestore.collection('liveChats')
                .doc(this.currentStreamId)
                .collection('messages')
                .add(messageData);
            
            input.value = '';
            this.lastMessageTime = now;
            this.streamAnalytics.messagesCount++;
            
        } catch (error) {
            console.error('Error sending message:', error);
            window.tiktikApp?.showToast('Failed to send message', 'error');
        }
    }

    getSuperChatColor(amount) {
        if (amount >= 100) return '#ff0000';
        if (amount >= 50) return '#ff6b00';
        if (amount >= 20) return '#ffaa00';
        if (amount >= 10) return '#00e5ff';
        if (amount >= 5) return '#1de9b6';
        return '#4CAF50';
    }

    async banUser(userId, userName) {
        if (!this.isModerator || !this.currentStreamId) return;
        
        if (!confirm(`Ban ${userName} from this chat?`)) return;
        
        try {
            this.bannedUsers.add(userId);
            
            await firestore
                .collection('liveStreams')
                .doc(this.currentStreamId)
                .collection('settings')
                .doc('chatSettings')
                .set({
                    bannedUsers: Array.from(this.bannedUsers)
                }, { merge: true });
            
            window.tiktikApp?.showToast(`${userName} has been banned`, 'success');
        } catch (error) {
            console.error('Error banning user:', error);
            window.tiktikApp?.showToast('Failed to ban user', 'error');
        }
    }

    async timeoutUser(userId, userName, duration = 60000) {
        if (!this.isModerator || !this.currentStreamId) return;
        
        const timeoutEnd = Date.now() + duration;
        this.timedOutUsers.set(userId, timeoutEnd);
        
        window.tiktikApp?.showToast(`${userName} timed out for ${duration / 1000} seconds`, 'info');
        
        setTimeout(() => {
            this.timedOutUsers.delete(userId);
        }, duration);
    }

    async toggleSlowMode() {
        if (!this.isModerator || !this.currentStreamId) return;
        
        this.slowModeEnabled = !this.slowModeEnabled;
        
        try {
            await firestore
                .collection('liveStreams')
                .doc(this.currentStreamId)
                .collection('settings')
                .doc('chatSettings')
                .set({
                    slowModeEnabled: this.slowModeEnabled,
                    slowModeDuration: this.slowModeDuration
                }, { merge: true });
            
            const message = this.slowModeEnabled 
                ? `Slow mode enabled (${this.slowModeDuration / 1000}s)` 
                : 'Slow mode disabled';
            window.tiktikApp?.showToast(message, 'info');
        } catch (error) {
            console.error('Error toggling slow mode:', error);
        }
    }

    setSlowModeDuration(seconds) {
        this.slowModeDuration = seconds * 1000;
    }

    changeQuality(quality) {
        const videoPlayer = document.getElementById('liveVideoPlayer');
        const currentTime = videoPlayer.currentTime;
        this.currentQuality = quality;
        
        videoPlayer.currentTime = currentTime;
        window.tiktikApp?.showToast(`Quality changed to ${quality}`, 'success');
    }

    startAnalyticsTracking() {
        this.streamAnalytics.joinTime = Date.now();
        
        this.analyticsInterval = setInterval(() => {
            this.streamAnalytics.watchTime += 1;
        }, 1000);
    }

    async saveAnalytics() {
        if (!this.currentStreamId || !firestore) return;
        
        clearInterval(this.analyticsInterval);
        
        try {
            await firestore
                .collection('streamAnalytics')
                .doc(this.currentStreamId)
                .collection('sessions')
                .add({
                    userId: firebaseAuth?.currentUser?.uid,
                    watchTime: this.streamAnalytics.watchTime,
                    messagesCount: this.streamAnalytics.messagesCount,
                    joinTime: this.streamAnalytics.joinTime,
                    leaveTime: Date.now(),
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            await firestore.collection('videos').doc(this.currentStreamId).update({
                totalWatchTime: firebase.firestore.FieldValue.increment(this.streamAnalytics.watchTime),
                peakViewers: firebase.firestore.FieldValue.increment(0)
            });
        } catch (error) {
            console.error('Error saving analytics:', error);
        }
    }

    insertEmoji(emoji) {
        const input = document.getElementById('liveChatInput');
        const currentValue = input.value;
        input.value = currentValue + emoji;
        input.focus();
    }

    async openSuperChatModal() {
        if (!firebaseAuth?.currentUser) {
            window.tiktikApp?.showToast('Please login to send Super Chat', 'error');
            return;
        }
        
        const amount = prompt('Enter Super Chat amount ($):');
        if (!amount || isNaN(amount) || amount < 1) return;
        
        const message = prompt('Enter your message:');
        if (!message) return;
        
        document.getElementById('liveChatInput').value = message;
        await this.sendMessage(true, parseFloat(amount));
    }

    async endStream() {
        if (!this.currentStreamId || !firebaseAuth?.currentUser) return;
        
        if (!confirm('Are you sure you want to end this live stream?')) return;
        
        try {
            await firestore.collection('videos').doc(this.currentStreamId).update({
                isLive: false,
                wasLive: true,
                endTime: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            window.tiktikApp?.showToast('Stream ended successfully', 'success');
            this.closeLivePlayer();
            
            if (window.tiktikApp) {
                await window.tiktikApp.loadUserVideos();
                await window.tiktikApp.loadAllVideosFromFirestore();
            }
            
        } catch (error) {
            console.error('Error ending stream:', error);
            window.tiktikApp?.showToast('Failed to end stream', 'error');
        }
    }

    async deleteStream() {
        if (!this.currentStreamId || !firebaseAuth?.currentUser) return;
        
        if (!confirm('Are you sure you want to delete this stream? This cannot be undone.')) return;
        
        try {
            await firestore.collection('videos').doc(this.currentStreamId).delete();
            
            const chatRef = firestore.collection('liveChats').doc(this.currentStreamId);
            const messagesSnapshot = await chatRef.collection('messages').get();
            
            const batch = firestore.batch();
            messagesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            await chatRef.delete();
            
            window.tiktikApp?.showToast('Stream deleted successfully', 'success');
            this.closeLivePlayer();
            
            if (window.tiktikApp) {
                await window.tiktikApp.loadUserVideos();
                await window.tiktikApp.loadAllVideosFromFirestore();
            }
            
        } catch (error) {
            console.error('Error deleting stream:', error);
            window.tiktikApp?.showToast('Failed to delete stream', 'error');
        }
    }

    setupEventListeners() {
        const closeLivePlayerBtn = document.getElementById('closeLivePlayerBtn');
        const sendMessageBtn = document.getElementById('sendMessageBtn');
        const liveChatInput = document.getElementById('liveChatInput');
        const endStreamBtn = document.getElementById('endStreamBtn');
        const deleteStreamBtn = document.getElementById('deleteStreamBtn');
        const emojiPickerBtn = document.getElementById('emojiPickerBtn');
        const emojiPicker = document.getElementById('emojiPicker');
        const superChatBtn = document.getElementById('superChatBtn');
        const slowModeBtn = document.getElementById('slowModeBtn');
        const qualityBtn = document.getElementById('qualityBtn');
        const qualityDropdown = document.getElementById('qualityDropdown');
        
        if (closeLivePlayerBtn) {
            closeLivePlayerBtn.onclick = () => this.closeLivePlayer();
        }
        
        if (sendMessageBtn) {
            sendMessageBtn.onclick = () => this.sendMessage();
        }
        
        if (liveChatInput) {
            liveChatInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            };
        }
        
        if (endStreamBtn) {
            endStreamBtn.onclick = () => this.endStream();
        }
        
        if (deleteStreamBtn) {
            deleteStreamBtn.onclick = () => this.deleteStream();
        }
        
        if (emojiPickerBtn && emojiPicker) {
            emojiPickerBtn.onclick = () => {
                emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
            };
            
            const emojiButtons = emojiPicker.querySelectorAll('.emoji-btn');
            emojiButtons.forEach(btn => {
                btn.onclick = () => {
                    this.insertEmoji(btn.textContent);
                    emojiPicker.style.display = 'none';
                };
            });
        }
        
        if (superChatBtn) {
            superChatBtn.onclick = () => this.openSuperChatModal();
        }
        
        if (slowModeBtn && this.isModerator) {
            slowModeBtn.style.display = 'block';
            slowModeBtn.onclick = () => {
                this.toggleSlowMode();
                slowModeBtn.classList.toggle('active');
            };
        }
        
        if (qualityBtn && qualityDropdown) {
            qualityBtn.onclick = () => {
                qualityDropdown.classList.toggle('active');
            };
            
            const qualityOptions = qualityDropdown.querySelectorAll('.quality-option');
            qualityOptions.forEach(option => {
                option.onclick = () => {
                    const quality = option.getAttribute('data-quality');
                    this.changeQuality(quality);
                    
                    qualityOptions.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    
                    const span = qualityBtn.querySelector('span');
                    if (span) span.textContent = quality;
                    
                    qualityDropdown.classList.remove('active');
                };
            });
        }
        
        document.addEventListener('click', (e) => {
            if (emojiPicker && !emojiPickerBtn?.contains(e.target) && !emojiPicker.contains(e.target)) {
                emojiPicker.style.display = 'none';
            }
            if (qualityDropdown && !qualityBtn?.contains(e.target) && !qualityDropdown.contains(e.target)) {
                qualityDropdown.classList.remove('active');
            }
        });
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return date.toLocaleTimeString();
    }
}

// Initialize live chat manager
const liveChatManager = new LiveChatManager();

// Add wallet manager to global scope
if (typeof window !== 'undefined') {
  window.walletManager = walletManager;
  window.uploadVideoToR2 = uploadVideoToR2;
  window.liveChatManager = liveChatManager;
}

