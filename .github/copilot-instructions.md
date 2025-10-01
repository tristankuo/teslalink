# TeslaLink AI Coding Agent Instructions

This document provides guidance for AI coding agents to effectively contribute to the TeslaLink project.

## Project Overview

TeslaLink is a React-based web application designed specifically for Tesla's in-car browser. It provides a customizable dashboard of web apps and streaming services optimized for Tesla's touchscreen interface. The project has been rebranded from TeslaCenter to avoid trademark issues and is now hosted on GitHub Pages.

## Key Technologies

- **Frontend:** React 19+ with TypeScript, React Bootstrap
- **Backend:** Firebase Realtime Database for cross-tab sync and QR sessions
- **Build Tool:** Create React App (`react-scripts`)
- **Deployment:** GitHub Pages (switched from Firebase Hosting)
- **Analytics:** Google Analytics 4

## Architecture

### Multi-Project Structure
This workspace contains three related Tesla apps:
- **teslalink** (main): Full-featured app with Firebase backend
- **teslahub**: Simplified GitHub Pages version 
- **tesladrop**: File transfer utility for Tesla browser

### Core Features & Patterns

**Cross-Tab Synchronization:**
```typescript
// Uses BroadcastChannel for real-time sync across browser tabs
const bcRef = useRef<BroadcastChannel | null>(null);
bcRef.current = new BroadcastChannel('teslalink_sync');
```

**State Management Pattern:**
- Primary state in `App.tsx` using React hooks
- localStorage persistence with `teslalink_` prefixed keys
- Version-based conflict resolution for cross-tab sync
- Metadata tracking (`AppsMeta`) for update timestamps

**Tesla-Specific Optimizations:**
- Large touch targets and long-press interactions
- Fullscreen mode for Tesla Theater integration
- Regional app defaults loaded from `public/default-apps.json`
- QR code integration for mobile-to-car app sharing

## Critical Development Workflows

### Local Development
```bash
npm install
npm start      # Starts dev server with auto image manifest generation
```

### Production Deployment
```bash
npm run deploy  # Builds and deploys to GitHub Pages
```

### Key Build Hooks
- `prestart`/`prebuild`: Auto-generates `src/image-manifest.js` from `public/images/`
- Custom build script for GitHub Pages with proper asset paths

## Project-Specific Conventions

### State Persistence
```typescript
// All localStorage keys use 'teslalink_' prefix
localStorage.getItem('teslalink_apps')
localStorage.getItem('teslalink_user_region') 
localStorage.getItem('teslalink_theme')
localStorage.getItem('teslalink_apps_meta')
```

### Component Patterns
- **AppItem.tsx**: Handles drag-and-drop, long-press, and Tesla-optimized interactions
- **AddAppQR.tsx**: Firebase-based QR code session management for mobile integration
- Touch-first event handling with both mouse and touch event support

### Firebase Integration
- **QR Sessions**: Temporary sessions in `/qr_sessions/{sessionId}` with 5-minute expiration
- **Fullscreen Sessions**: Cross-tab state sharing via `/fullscreen_sessions/{sessionId}`
- Real-time listeners with proper cleanup in useEffect hooks

## Data Flow Architecture

1. **App Loading**: Checks localStorage → falls back to region-specific defaults from JSON
2. **Cross-Tab Sync**: BroadcastChannel + localStorage events for real-time updates
3. **QR Code Flow**: Mobile device → Firebase session → Tesla picks up via real-time listener
4. **Theme Management**: localStorage + CSS custom properties for dark/light themes

## Important Files & Directories

- `src/App.tsx`: Main application logic and state management
- `public/default-apps.json`: Regional app collections 
- `scripts/generate-image-manifest.js`: Auto-generates background image list
- `src/utils/firebase.ts`: Firebase configuration and database setup
- `src/utils/location.ts`: Regional detection logic
- `src/utils/analytics.ts`: Google Analytics integration

## Tesla-Specific Considerations

- **Safety First**: All interactions designed for parked vehicle use
- **Performance**: Optimized bundle size and loading for in-car browser constraints
- **Accessibility**: Large touch targets, high contrast, minimal interactions
- **Regional Content**: Default apps vary by detected user region (US, EU, TW, CN, JP, etc.)

## Recent Changes & Compliance

- **Rebranding**: Migrated from TeslaCenter to TeslaLink for trademark compliance
- **Hosting Migration**: Switched from Firebase to GitHub Pages for cost efficiency
- **Asset Cleanup**: Replaced Tesla-branded icons with custom TeslaLink branding
- **Ad Removal**: Eliminated all advertising content to resolve security warnings

## Development Best Practices

- Use `teslalink_` prefix for all localStorage keys
- Include all dependencies in useEffect dependency arrays
- Test touch interactions on actual devices when possible  
- Maintain backwards compatibility for existing user data
- Follow Tesla's minimalist design aesthetic
