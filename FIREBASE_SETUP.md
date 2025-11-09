# Firebase Setup Guide

## Step 1: Create/Configure Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Phone Authentication**:
   - Go to **Authentication** > **Sign-in method**
   - Click on **Phone** provider
   - Enable it and save

## Step 2: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click on **Web** icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Admin Panel")
5. Copy the Firebase configuration object

You'll get something like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

## Step 3: Configure in Your Project

You have **TWO options** to add the configuration:

### Option A: Use Environment Variables (Recommended)

1. Create a `.env` file in the root directory:
   ```
   /Users/apple/Documents/moments/website/moments.github.io/.env
   ```

2. Add the following variables:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
   ```

3. Replace the values with your actual Firebase config values

### Option B: Edit Config File Directly

1. Open: `/src/firebase/config.js`
2. Replace the placeholder values with your actual Firebase config

## Step 4: Add Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings**
2. Scroll to **Authorized domains**
3. Add your domains:
   - `localhost` (for development - already included)
   - `admin.moments.live` (your production domain)

## Step 5: Test the Configuration

1. Start your development server: `npm run dev`
2. Go to the login page: `http://localhost:5173/admin/login`
3. Enter a phone number
4. You should receive an OTP via SMS
5. Verify the OTP to complete authentication

## File Locations

- **Firebase Config**: `/src/firebase/config.js`
- **Login Component**: `/src/pages/AdminLogin.jsx`
- **Environment Variables**: `.env` (create this file in root directory)

## Quick Configuration Summary

**Where to add config:**
1. **Option 1**: Create `.env` file in project root with Firebase credentials
2. **Option 2**: Edit `/src/firebase/config.js` directly

**What values you need:**
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

**Where to get them:**
Firebase Console > Project Settings > Your apps > Web app config

