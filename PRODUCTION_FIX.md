# 🚨 URGENT: Fix OTP Not Working in Production

## Problem
OTP is not being sent when using the production site at `admin.moments.live`.

## Root Cause
The production domain `admin.moments.live` is likely **NOT added to Firebase's Authorized Domains**.

## Solution (Do This Now!)

### Step 1: Add Authorized Domain in Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `moments-38b77`
3. **Navigate**: Authentication > **Settings** (click the gear icon ⚙️ at the top right)
4. **Scroll down** to **"Authorized domains"** section
5. **Click "Add domain"** button
6. **Enter**: `admin.moments.live`
7. **Click "Add"**

### Step 2: Verify Phone Authentication is Enabled

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Find **Phone** provider
3. Click on it
4. Ensure it's **Enabled**
5. Click **Save**

### Step 3: Check SMS Quota (For Real SMS)

If you want real SMS (not test OTP):

1. Go to **Project Settings** > **Usage and billing**
2. Check your SMS quota
3. **Free tier**: 10 SMS per day
4. **For production**: Enable billing for higher quotas

### Step 4: Test Phone Numbers (Recommended for Testing)

For testing without using real SMS:

1. Go to **Authentication** > **Sign-in method** > **Phone**
2. Scroll to **"Phone numbers for testing"**
3. Add your phone number: `+91XXXXXXXXXX`
4. Add a test OTP (e.g., `123456`)
5. Click **Add**

When using a test number, Firebase will accept your test OTP instead of sending real SMS.

## Quick Links

- **Firebase Console**: https://console.firebase.google.com/project/moments-38b77
- **Authentication Settings**: https://console.firebase.google.com/project/moments-38b77/authentication/settings
- **Phone Provider Settings**: https://console.firebase.google.com/project/moments-38b77/authentication/providers
- **Usage & Billing**: https://console.firebase.google.com/project/moments-38b77/settings/usage

## After Adding Domain

1. Wait 1-2 minutes for changes to propagate
2. Clear browser cache or use incognito mode
3. Try sending OTP again on `admin.moments.live`

## Verification Checklist

- [ ] `admin.moments.live` is in Firebase authorized domains
- [ ] Phone authentication is enabled
- [ ] Test phone numbers added (optional, for testing)
- [ ] Billing enabled (if using real SMS in production)
- [ ] Domain changes have propagated (wait 1-2 min)

## Still Not Working?

Check browser console (F12) for error codes:
- `auth/unauthorized-domain` = Domain not added
- `auth/quota-exceeded` = SMS quota exceeded
- `auth/operation-not-allowed` = Phone auth not enabled
- `auth/captcha-check-failed` = reCAPTCHA issue

