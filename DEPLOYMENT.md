# 🚀 Deployment Configuration

This document describes how to configure TeslaLink for your own deployment.

## 📋 Configuration Steps

### 1. Update Domain References

Replace the placeholder domains in the following files with your actual domains:

#### **Package.json**
```json
"homepage": "https://your-username.github.io/teslalink"
```

#### **Environment Configuration** (`src/utils/environment.ts`)
```typescript
const ENVIRONMENTS = {
  staging: {
    hostname: 'your-username.github.io',
    basePath: '/teslalink',
    fullUrl: 'https://your-username.github.io/teslalink'
  },
  production: {
    hostname: 'your-production-domain.com', 
    basePath: '/',
    fullUrl: 'https://your-production-domain.com'
  }
};
```

#### **Build Scripts** (`scripts/generate-environment-files.js`)
Update the environment detection logic with your domains.

#### **404.html** (`public/404.html`)
```javascript
var pathSegmentsToKeep = window.location.hostname === 'your-username.github.io' ? 1 : 0;
```

#### **Static Navigation** (`public/js/main.js`)
```javascript
if (hostname === 'your-username.github.io') {
    return '/teslalink/';
}
```

### 2. Update GitHub Workflows

#### **Production Deployment** (`.github/workflows/production-deploy.yml`)
```yaml
npm pkg set homepage="https://your-production-domain.com"
external_repository: your-username/your-production-repo
```

### 3. Optional Features Configuration

#### **Firebase (for QR Code functionality)**
Create `.env` file:
```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

#### **YouTube Data API (for Live Channels)**
Add to repository secrets:
```bash
YOUTUBE_API_KEY=your_youtube_api_key
```

#### **Google Analytics (optional)**
```bash
REACT_APP_GA_TRACKING_ID=your_ga_tracking_id
```

## 🎯 Deployment Options

### GitHub Pages (Recommended)
1. Fork this repository
2. Update configurations with your domains
3. Enable GitHub Pages in repository settings
4. Configure workflows with your deployment targets

### Vercel
1. Import repository to Vercel
2. Add environment variables
3. Deploy automatically

### Netlify
1. Connect repository to Netlify
2. Configure build settings
3. Add environment variables

### Firebase Hosting
1. Install Firebase CLI
2. Initialize Firebase project
3. Configure `firebase.json`
4. Deploy with `firebase deploy`

## 🔧 Customization

### Default Apps
Modify `public/default-apps.json` to change pre-loaded apps for each region.

### Live Channels
Update search queries and regions in `scripts/update_popular_live.js`.

### Themes
Customize CSS variables in component files for theme customization.

## 🚀 Quick Start

1. **Clone & Configure**:
   ```bash
   git clone https://github.com/your-username/teslalink.git
   cd teslalink
   # Update all domain references (see above)
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Test Locally**:
   ```bash
   npm start
   ```

4. **Deploy**:
   ```bash
   npm run build
   # Deploy to your chosen platform
   ```

## 📝 Notes

- The app is designed to work without backend services
- Firebase and YouTube API are optional features
- All user data is stored locally in browser storage
- Environment detection ensures URLs work across different deployments