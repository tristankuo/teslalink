````markdown
# 🚗 TeslaLink - Tesla Browser Companion

**A beautiful, customizable web app dashboard designed specifically for Tesla touchscreens.**

TeslaLink transforms your Tesla's browser into a powerful hub for accessing your favorite websites and discovering trending content. With features like Live Channels, QR code scanning, and fullscreen mode, it's the perfect companion for Tesla owners.

<!-- Updated: 2025-10-06 -->

## ✨ Features

🎯 **Optimized for Tesla** - Large, touch-friendly interface designed for in-car use  
� **Live Channels** - Discover trending YouTube content updated daily  
📱 **QR Code Scanner** - Add apps instantly from your mobile device  
🖥️ **Fullscreen Mode** - Immersive viewing perfect for Tesla Theater  
🌍 **Regional Content** - Pre-loaded apps for different regions  
🎨 **Themes** - Automatic light/dark theme matching your Tesla  

## � Key Features

### 📋 **Customizable Dashboard**
- Add unlimited web apps to your personal collection
- Drag and drop to reorder apps
- Clean, grid-based layout optimized for touchscreens
- Edit or remove apps with simple long-press gestures

### 📺 **Live Channels**
- Discover trending YouTube channels and live streams
- Content updated daily with regional preferences
- Perfect for finding entertainment during charging stops
- Filter by region to find local content

### 📱 **QR Code Integration**
- Scan QR codes directly on your Tesla screen
- Add websites from your mobile device instantly
- No more typing long URLs in the car
- Seamless cross-device experience

### 🖥️ **Fullscreen Experience**
- One-tap fullscreen mode for immersive viewing
- Synchronized tabs for seamless transitions
- Perfect integration with Tesla Theater mode
- Address bar-free viewing for maximum screen space

### 🌍 **Global Content**
Pre-loaded with popular apps by region:
- **Global**: YouTube, Netflix, Disney+, Twitch, Apple TV+
- **US**: Hulu, Max, Peacock, ESPN+, Sling TV
- **EU**: BBC iPlayer, ITVX, Arte, Viaplay
- **Asia**: Region-specific streaming and entertainment apps

## 🛠️ Development

Built with modern web technologies:
- **React** + **TypeScript** for robust development
- **Bootstrap** for responsive design
- **Firebase** for real-time QR code functionality
- **YouTube API** for Live Channels feature
- **GitHub Pages** deployment ready

### Prerequisites
- Node.js 18+
- npm or yarn
- Optional: Firebase project for QR functionality
- Optional: YouTube Data API key for Live Channels

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/teslalink.git
cd teslalink

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Environment Variables

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Firebase (Required for QR Code functionality)
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# YouTube Data API (Optional - for Live Channels auto-updates)
YOUTUBE_API_KEY=your_youtube_api_key

# Google Analytics (Optional)
REACT_APP_GA_TRACKING_ID=your_ga_tracking_id
```

### GitHub Secrets (For Repository Owners)

For automated deployments and features, configure these secrets in your GitHub repository:

**Required Secrets:**
```bash
# Firebase Configuration (for GitHub Pages deployment)
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN  
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_FIREBASE_DATABASE_URL
```

**Optional Secrets:**
```bash
# YouTube Data API (enables automated Live Channels updates)
YOUTUBE_API_KEY

# Production Deployment (for multi-repository deployment)
PRODUCTION_DEPLOY_TOKEN     # Personal Access Token with repo permissions
PRODUCTION_REPO            # Target repository (e.g., username/production-repo)
PRODUCTION_URL             # Production URL (e.g., https://yourdomain.com)
```

**Setting up Production Deployment:**

1. **Create Production Repository**: Set up your production repository (e.g., `username/production-site`)
2. **Generate Personal Access Token**: 
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create token with `repo` permissions for your production repository
3. **Configure Repository Secrets**:
   - Go to your TeslaLink repository → Settings → Secrets and variables → Actions
   - Add `PRODUCTION_DEPLOY_TOKEN` with your personal access token
   - Add `PRODUCTION_REPO` with your production repository name (e.g., `username/production-site`)
   - Add `PRODUCTION_URL` with your production URL (e.g., `https://yourdomain.com`)
4. **Deploy**: Use the "🚢 Deploy to Production" workflow in GitHub Actions

> **Note**: Without `YOUTUBE_API_KEY`, Live Channels will display static content. The app remains fully functional for all other features.

### Deployment

TeslaLink works out-of-the-box on any static hosting platform with **zero configuration required**:

- **GitHub Pages**: Fork and enable Pages - automatic deployment via GitHub Actions  
- **Vercel**: Import repository - zero-config deployment  
- **Netlify**: Connect repository - automatic build detection  
- **Firebase Hosting**: Standard static site deployment

The app automatically detects the deployment environment and configures URLs appropriately:
- **GitHub Pages**: `username.github.io/repository-name` 
- **Custom Domain**: `your-domain.com`
- **Local Development**: `localhost:3000`

No manual configuration of hostnames or paths required! 🎉

## 🔧 Configuration

**TeslaLink works out-of-the-box with zero configuration required!** 🎉

The app automatically detects its deployment environment and configures all URLs appropriately:
- **GitHub Pages**: `username.github.io/repository-name`
- **Custom Domain**: `your-domain.com` 
- **Local Development**: `localhost:3000`

### Optional Enhancements

**Firebase (QR Code Functionality)**
```bash
# Add to .env for QR code scanning features
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

**YouTube API (Live Channels Auto-Updates)**  
Add `YOUTUBE_API_KEY` to GitHub repository secrets for daily content updates.

### Customization

## � Usage Tips

- **Bookmark** the site in your Tesla browser for quick access
- **Use fullscreen mode** for the best Tesla Theater experience
- **Try QR scanning** to quickly add your favorite sites
- **Explore Live Channels** to discover new content while charging

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
- Use TypeScript for new features
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the Tesla community
- Inspired by the need for better in-car web experiences
- Special thanks to all contributors and beta testers

---

**Made with ❤️ for Tesla owners worldwide**
````