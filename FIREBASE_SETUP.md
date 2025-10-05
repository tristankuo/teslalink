# TeslaLink Firebase Project Setup Guide

## 🔥 Firebase Project Setup for QR Code Functionality

### Step 1: Create/Configure Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Create or select project**: `teslalink`
3. **Enable services**:
   - ✅ Realtime Database
   - ✅ Authentication (optional, for future features)

### Step 2: Configure Realtime Database

1. **Go to**: Realtime Database section
2. **Click**: "Create Database"
3. **Choose**: Start in test mode (we'll configure rules below)
4. **Select**: Database location (choose closest to your users)

### Step 3: Database Rules for QR Code Sessions

Navigate to **Database > Rules** and replace with:

```json
{
  "rules": {
    "qr_sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['status']) && newData.child('status').isString()",
        "status": {
          ".validate": "newData.val().matches(/^(pending|completed)$/)"
        },
        "name": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
        },
        "url": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 2000"
        },
        "timestamp": {
          ".validate": "newData.isNumber()"
        }
      }
    },
    ".read": false,
    ".write": false
  }
}
```

**What these rules do:**
- ✅ Allow **anonymous read/write** for `qr_sessions` path only
- ✅ **Validate data structure** for QR sessions
- ✅ **Restrict access** to only QR sessions (secure)
- ✅ **Validate field types and lengths** to prevent abuse

### Step 4: Get Firebase Configuration

1. **Go to**: Project Settings (gear icon)
2. **Scroll to**: "Your apps" section
3. **Add app**: Web app (if not exists)
4. **Copy configuration** values:

```bash
# Update your repository secrets with these values:
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=teslalink.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=teslalink
REACT_APP_FIREBASE_STORAGE_BUCKET=teslalink.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=https://teslalink-default-rtdb.firebaseio.com
```

### Step 5: Update Repository Secrets

1. **Go to**: https://github.com/tristankuo/teslalink/settings/secrets/actions
2. **Update these secrets**:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN` 
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`
   - `REACT_APP_FIREBASE_DATABASE_URL`

### Step 6: Test the Setup

After updating secrets, trigger a production deployment:
1. **Go to**: https://github.com/tristankuo/teslalink/actions/workflows/production-deploy.yml
2. **Run workflow** with `DEPLOY` confirmation
3. **Test QR functionality** at: https://myteslalink.github.io

---

## 🔧 Troubleshooting

### QR Code Not Working
- ✅ Check Firebase Console > Database > Data for `qr_sessions` entries
- ✅ Verify database rules allow anonymous access
- ✅ Check browser console for Firebase errors

### Database Permission Denied
- ✅ Ensure database rules match the template above
- ✅ Publish rules in Firebase Console
- ✅ Wait 1-2 minutes for rules to propagate

### Invalid Configuration
- ✅ Verify all environment variables are set correctly
- ✅ Ensure `REACT_APP_FIREBASE_DATABASE_URL` uses correct project name
- ✅ Check Firebase project is active and billing enabled (if required)

---

## 📱 How QR Code Feature Works

1. **User clicks** "Add App via QR"
2. **QR code generated** with session ID
3. **Mobile device scans** QR code
4. **Opens form** to enter app name/URL
5. **Data saved** to Firebase Realtime Database
6. **Desktop app** receives data instantly via real-time listener
7. **App added** to user's favorites

The Firebase Realtime Database enables instant, real-time sync between devices! 🚀