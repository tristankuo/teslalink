# 🚀 TeslaLink CI/CD Workflows

This document describes the CI/CD workflows for development and deployment.

## 📋 Workflow Overv- ✅ `staging-deploy.yml` → GitHub Pages staging deployment
- ✅ `data-update.yml` → Daily Live Channels data updates  
- ✅ `production-deploy.yml` → Manual production deployment

### 🎯 **Staging Environment** - GitHub Pages
- **Purpose**: Development testing and staging
- **Trigger**: Every push to `master` branch
- **Workflow**: `staging-deploy.yml`

### 🚢 **Production Environment** - External Deployment
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

## � Benefits of Streamlined Structure

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
1. Use the "Deploy to Production (Firebase)" workflow
2. Verify Firebase service account secrets
3. Test with preview deployment first

---

## 📝 Workflow Evolution

### Removed Workflows:
- `firebase-hosting-merge.yml` → Replaced with GitHub Pages deployment
- `firebase-hosting-pull-request.yml` → Simplified to staging-only deployment
- `update-and-deploy.yml` → Split into separate workflows for better control
- `deploy-only.yml` → Consolidated into environment-specific workflows

### Current Active Workflows:
- ✅ `staging-deploy.yml` → GitHub Pages deployment (tristankuo.github.io/teslalink)
- ✅ `data-update.yml` → Independent data refresh
- ✅ `production-deploy.yml` → Production deployment (myteslalink.github.io)

---

*This streamlined workflow structure optimizes for daily development productivity while maintaining production safety and data reliability.*