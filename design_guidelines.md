# TikTik Video Platform - Design Guidelines

## Design Approach

**Reference-Based Approach**: YouTube-inspired video sharing platform
- Primary reference: YouTube's established UI patterns for video platforms
- Secondary influences: TikTok for shorts, modern streaming platforms for live features
- Focus: Familiar, content-focused experience prioritizing video discovery and playback

## Existing Implementation Recognition

Your platform already has a comprehensive YouTube-clone design with:
- Complete header with search, navigation, and profile menu
- Collapsible sidebar with categorized navigation
- Video grid layouts for home, trending, subscriptions
- Channel pages with tabs (Videos, Shorts, Live, Wallet, Playlists, About)
- Video player with full controls
- Comment system and social interactions

**These guidelines reinforce your existing structure while ensuring production-ready quality.**

## Core Design Elements

### Typography
- **Primary Font**: Segoe UI (system font stack)
- **Headings**: 600 weight for video titles, channel names
- **Body**: 400 weight for descriptions, metadata
- **Hierarchy**: Video titles (15px, bold) > Channel info (14px) > Metadata (12-13px, muted color)

### Layout System
**Tailwind Spacing Units**: Use p-2, p-4, m-4, gap-4, gap-6 for consistent rhythm
- Header: Fixed 60px height
- Sidebar: 250px expanded, 70px collapsed
- Content grid: Auto-fill columns (min 260px) with 16px gap
- Section padding: py-5 (mobile), py-8 (desktop)

### Component Library

#### Navigation Components
- **Header**: Sticky with logo, search bar (max-w-2xl), action buttons, profile dropdown
- **Sidebar**: Scrollable navigation with icon+label items, section dividers, active states
- **Profile Menu**: Dropdown with user info, account options, settings (300px width)

#### Video Components
- **Video Card**: Thumbnail (16:9 ratio, 160px height), duration badge, channel avatar, title (2-line clamp), metadata
- **Video Player**: Full-featured controls, quality selector, fullscreen, picture-in-picture
- **Upload Interface**: Drag-drop area, progress bars, form fields for title/description/category

#### Channel Components
- **Channel Header**: Banner image (1920x180), large avatar, subscriber count, video count, tabs
- **Channel Tabs**: Videos, Shorts, Live, Wallet, Playlists, About
- **Upload Prompt**: Icon, heading, description, primary action button for empty states

#### Live Streaming Components
- **Stream Setup**: Camera preview, mic/camera toggles, title/description inputs
- **Live Interface**: Recording indicator, viewer count, real-time chat, end stream button
- **Stream Card**: "LIVE" badge, current viewer count, red accent treatment

#### Admin Components
- **Approval Queue**: Grid of pending uploads with approve/reject actions
- **Content Moderation**: Thumbnail preview, metadata display, action buttons

### Color System
**Light Theme** (default):
- Background: White (#ffffff), Light Gray (#f9f9f9), Lighter Gray (#f1f1f1)
- Text: Black (#000000), Gray (#666666), Muted (#999999)
- Accent: YouTube Red (#ff0000), Hover (#cc0000)
- Borders: Light Gray (#e0e0e0)

**Dark Theme**:
- Background: Dark (#181818), Darker (#212121), Darkest (#303030)
- Text: White (#ffffff), Light Gray (#aaaaaa), Gray (#777777)
- Accent: Red (#ff0000) - maintains brand
- Borders: Dark Gray (#404040)

### Animations
**Minimal, purposeful only**:
- Card hover: Subtle lift (2px translate) + shadow increase
- Thumbnail hover: Slight scale (1.05) on image
- Button states: Background color transition (0.3s)
- Sidebar collapse: Width transition (0.3s)
- **No** loading spinners, scroll animations, or decorative effects

### Images

#### Hero/Featured Sections
- **Channel Banners**: 1920x180px, user-uploaded, landscape photography or branded graphics
- **Video Thumbnails**: 16:9 ratio, auto-generated or custom uploaded
- **Avatars**: Circular, 32-40px (small), 150px (channel page)

#### Content Images
- **Default Thumbnails**: Use placeholder images from video frames
- **Live Stream Previews**: Real-time camera feed thumbnails
- **Category Icons**: Font Awesome icons for navigation (no custom images needed)

## Accessibility
- Maintain consistent tab navigation throughout
- ARIA labels on icon-only buttons
- Keyboard shortcuts for video player
- Focus indicators on all interactive elements
- Color contrast ratios meet WCAG AA standards

## Production-Ready Checklist
✅ Responsive grid adapts to mobile/tablet/desktop
✅ Theme toggle persists user preference
✅ Video upload shows real-time progress
✅ Error states display clear messages
✅ Empty states guide users to action
✅ Loading states for async operations
✅ Form validation with helpful feedback
✅ Optimized for serverless deployment (Vercel)

**Design Priority**: The backend functionality (Firebase integration, live streaming, upload APIs) takes precedence. The existing frontend design is production-ready and should remain unchanged unless specific UX issues arise during testing.