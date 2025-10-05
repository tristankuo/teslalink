# 🚀 TeslaLink CI/CD Workflows

This document describes the reorganized CI/CD workflows for efficient development and deployment.

## 📋 Workflow Overview

### 🎯 **Staging Environment** - GitHub Pages
- **URL**: https://tristankuo.github.io/teslalink
- **Purpose**: Development testing and staging
- **Trigger**: Every push to `master` branch
- **Workflow**: `staging-deploy.yml`

### 🚢 **Production Environment** - Firebase Hosting (Suspended)
- **URL**: https://teslacenter.web.app (when active)
- **Purpose**: Live production site
- **Trigger**: Manual deployment only
- **Workflow**: `production-deploy.yml`

### 📺 **Data Updates** - Live Channels
- **Purpose**: Update YouTube live channel data
- **Schedule**: Daily at 6 AM UTC
- **Workflow**: `data-update.yml`

---

## 🔄 Workflow Details

### 1. **Staging Deployment** (`staging-deploy.yml`)
```
Trigger: Push to master, Pull Requests
Purpose: Fast development builds for testing
Features:
  ✅ Fast builds (no data updates)
  ✅ Uses existing popular_live.json
  ✅ Firebase config for staging
  ✅ PR preview comments
  ✅ Automatic GitHub Pages deployment
```

### 2. **Data Updates** (`data-update.yml`)
```
Trigger: Daily schedule + Manual
Purpose: Update live streaming channel data
Features:
  ✅ YouTube API integration
  ✅ Geographic filtering
  ✅ Quota protection (9,000/10,000 limit)
  ✅ Fallback to existing data
  ✅ Automatic commit and push
```

### 3. **Production Deployment** (`production-deploy.yml`)
```
Trigger: Manual only (workflow_dispatch)
Purpose: Deploy to Firebase production
Features:
  ✅ Confirmation required for production
  ✅ Preview option available
  ✅ Production environment validation
  ✅ Latest data inclusion
Status: Ready for when Firebase is reactivated
```

---

## 🛠️ Development Workflow

### For Code Changes:
1. **Push to master** → Automatic staging deployment
2. **Review on GitHub Pages** → Test your changes
3. **When Firebase is active** → Manual production deployment

### For Data Updates:
1. **Automatic daily** → Data refreshes at 6 AM UTC
2. **Manual trigger** → Use "Update Live Channels Data" workflow
3. **Next staging deploy** → New data included automatically

---

## 🔧 Configuration

### Required Secrets:
```bash
# For Data Updates
YOUTUBE_API_KEY                    # YouTube Data API v3 key

# For Production (Firebase)
FIREBASE_SERVICE_ACCOUNT_TESLACENTER  # Firebase service account
REACT_APP_FIREBASE_API_KEY           # Firebase config
REACT_APP_FIREBASE_AUTH_DOMAIN       # Firebase config
REACT_APP_FIREBASE_PROJECT_ID        # Firebase config
REACT_APP_FIREBASE_STORAGE_BUCKET    # Firebase config
REACT_APP_FIREBASE_MESSAGING_SENDER_ID # Firebase config
REACT_APP_FIREBASE_APP_ID            # Firebase config
REACT_APP_FIREBASE_DATABASE_URL      # Firebase config
```

### Required Variables:
```bash
# Same Firebase config as above, but as repository variables
# Used for staging builds
```

---

## 📊 Benefits of New Structure

### ⚡ **Faster Development**
- Code changes deploy immediately to staging
- No waiting for data updates on every build
- Separate data refresh schedule

### 🛡️ **Reliable Data Updates**
- Quota protection prevents API failures
- Fallback preserves existing channels
- Geographic filtering improves content quality

### 🎯 **Clear Separation**
- Staging: GitHub Pages (always available)
- Production: Firebase (manual control)
- Data: Independent update cycle

### 📈 **Better Productivity**
- No blocked builds due to API issues
- Clear staging → production path
- Automated data maintenance

---

## 🚨 Troubleshooting

### If staging deployment fails:
1. Check Node.js version compatibility
2. Verify Firebase configuration variables
3. Review build logs for dependency issues

### If data update fails:
1. Check YouTube API key configuration
2. Review quota usage in workflow logs
3. Existing data will be preserved automatically

### When Firebase is reactivated:
1. Uncomment triggers in `firebase-hosting-*.yml`
2. Verify Firebase service account secrets
3. Test with preview deployment first

---

## 📝 Migration Notes

### Removed Workflows:
- `deploy-only.yml` → Replaced by `staging-deploy.yml`
- `update-and-deploy.yml` → Split into `data-update.yml` + `staging-deploy.yml`

### Disabled Workflows:
- `firebase-hosting-merge.yml` → Will reactivate when Firebase is restored
- `firebase-hosting-pull-request.yml` → Will reactivate when Firebase is restored

---

*This workflow structure optimizes for daily development productivity while maintaining production safety and data reliability.*