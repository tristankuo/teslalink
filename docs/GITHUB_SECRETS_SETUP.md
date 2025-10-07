# GitHub Secrets Setup Guide

This guide helps you configure GitHub repository secrets for automated deployments and features.

## 🔐 Required Secrets

### Firebase Configuration
These secrets are required for QR code functionality and deployment:

```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN  
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_FIREBASE_DATABASE_URL
```

**How to get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or select your project
3. Go to Project Settings → General → Your apps
4. Copy the config values from your web app

## 🚀 Production Deployment Secrets

### Required for Production Workflow
```
PRODUCTION_DEPLOY_TOKEN  # Personal Access Token
PRODUCTION_REPO         # Target repository name
PRODUCTION_URL          # Production domain
```

**Setup Instructions:**

#### 1. Create Production Repository
- Create a new repository for production (e.g., `username/production-site`)
- Or use an existing repository where you want to deploy

#### 2. Generate Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full repo access)
4. Copy the generated token

#### 3. Configure Repository Secrets
1. Go to your TeslaLink repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:

**PRODUCTION_DEPLOY_TOKEN:**
- Name: `PRODUCTION_DEPLOY_TOKEN`
- Value: Your personal access token from step 2

**PRODUCTION_REPO:**
- Name: `PRODUCTION_REPO`
- Value: Target repository (e.g., `username/production-site`)

**PRODUCTION_URL:**
- Name: `PRODUCTION_URL`
- Value: Your production URL (e.g., `https://yourdomain.com`)

## 📺 Optional Secrets

### YouTube Data API (for Live Channels)
```
YOUTUBE_API_KEY
```

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable YouTube Data API v3
4. Create credentials → API key
5. Copy the API key to your GitHub secret

**Note:** Without this secret, Live Channels will show static content but remain functional.

## 🔒 How to Add Secrets

1. **Navigate to Repository Settings:**
   ```
   GitHub Repository → Settings → Secrets and variables → Actions
   ```

2. **Add New Secret:**
   - Click "New repository secret"
   - Enter the secret name (exactly as shown above)
   - Paste the secret value
   - Click "Add secret"

3. **Verify Setup:**
   - All secrets should appear in the list
   - Secret values are hidden for security

## 🧪 Testing

### Staging Deployment
- Automatically triggered on push to `master`
- No secrets required (uses default GitHub Pages)
- Check GitHub Actions tab for build status

### Production Deployment
- Manually triggered via GitHub Actions
- Requires all production secrets configured
- Type "DEPLOY" to confirm production deployment

## 🔍 Troubleshooting

**Common Issues:**

1. **"Repository not found" error**
   - Check `PRODUCTION_REPO` format: `username/repository-name`
   - Verify personal access token has repo permissions
   - Ensure production repository exists

2. **"Authentication failed" error**
   - Regenerate personal access token
   - Update `PRODUCTION_DEPLOY_TOKEN` secret
   - Check token hasn't expired

3. **"Firebase not configured" warnings**
   - Add all Firebase secrets listed above
   - Verify secret names match exactly (case-sensitive)
   - Check Firebase project permissions

## ✅ Verification Checklist

Before running production deployment:

- [ ] All Firebase secrets added
- [ ] `PRODUCTION_DEPLOY_TOKEN` configured with valid token
- [ ] `PRODUCTION_REPO` set to correct repository
- [ ] `PRODUCTION_URL` matches your domain
- [ ] Production repository exists and is accessible
- [ ] Staging deployment working correctly

## 🤖 Dependency Management

This repository uses **Dependabot** for automated dependency updates:

- **Configuration**: `.github/dependabot.yml`
- **Update Schedule**: Weekly on Monday mornings (UTC)
- **Scope**: npm packages and GitHub Actions
- **Auto-assignment**: Updates are automatically assigned to repository owner
- **Grouping**: Minor and patch updates are grouped to reduce PR noise

### Dependabot Features:
- **Security Updates**: Automatic security vulnerability fixes
- **Version Updates**: Regular dependency version updates
- **Smart Grouping**: Related updates bundled together
- **Semantic Commits**: Uses `deps:` and `ci:` prefixes
- **Auto-labeling**: PRs tagged with `dependencies` and `automerge` labels

### Managing Dependabot PRs:
1. **Review**: Check the changelog and test results
2. **Test**: Automated tests run on all Dependabot PRs
3. **Merge**: Use "Squash and merge" for clean commit history
4. **Monitor**: Watch for any breaking changes after deployment

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Setup Guide](https://firebase.google.com/docs/web/setup)
- [YouTube Data API Setup](https://developers.google.com/youtube/v3/getting-started)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)