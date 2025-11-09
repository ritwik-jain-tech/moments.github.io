# Firebase Phone Authentication OTP Troubleshooting

## Issue: OTP Sent Successfully But Not Received

If you see "OTP sent successfully" in the console but don't receive an SMS, this is usually due to **Firebase Phone Authentication being in Test Mode**.

## Solution: Whitelist Test Phone Numbers

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **moments-38b77**
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Phone** provider

### Step 2: Add Test Phone Numbers
1. Scroll down to **Phone numbers for testing** section
2. Click **Add phone number**
3. Add your phone number in E.164 format:
   - Example: `+919876543210`
   - Format: `+91` (country code) + `10-digit number`
4. Enter a test OTP (6 digits) - Firebase will use this instead of sending SMS
5. Click **Add**

### Step 3: Test with Whitelisted Number
- When you use a whitelisted phone number, Firebase will:
  - Skip sending real SMS
  - Accept the test OTP you configured
  - This is instant and doesn't cost SMS credits

## For Production Use (Real SMS)

### Enable Production Mode:
1. In Firebase Console > Authentication > Sign-in method > Phone
2. Under **Phone numbers for testing**, you can leave it empty or remove test numbers
3. **Important**: For production, you need:
   - Billing enabled on your Firebase project
   - Sufficient SMS quota (Free tier: 10 SMS per day, paid: more quotas)

### Check Quotas:
1. Go to Firebase Console > Project Settings > Usage and billing
2. Check your SMS quota usage
3. Free tier: 10 SMS per day for phone authentication
4. After that, you need to enable billing

## Common Issues

### 1. Quota Exceeded
**Error**: `auth/quota-exceeded`
**Solution**: 
- Wait 24 hours (free tier resets daily)
- Enable billing for higher quotas
- Check Firebase Console > Usage

### 2. Invalid Phone Number
**Error**: `auth/invalid-phone-number`
**Solution**: 
- Use E.164 format: `+91XXXXXXXXXX`
- Ensure 10 digits after country code for India
- Example: `+919876543210`

### 3. Too Many Requests
**Error**: `auth/too-many-requests`
**Solution**: 
- Wait a few minutes before trying again
- Firebase has rate limits per phone number

### 4. reCAPTCHA Issues
**Error**: `auth/captcha-check-failed`
**Solution**: 
- Refresh the page
- Clear browser cache
- Check if reCAPTCHA container exists

## Testing Workflow

### Development (Recommended):
1. **Whitelist your test phone numbers** in Firebase Console
2. Use test OTP configured in Firebase (instant, no SMS sent)
3. This is free and instant

### Production:
1. Remove test phone numbers (or leave empty)
2. Ensure billing is enabled
3. Real SMS will be sent (subject to quotas)
4. Each SMS counts against your quota

## 🚨 CRITICAL: Production Domain Configuration

### Step 1: Add Authorized Domain for Production

**This is REQUIRED for OTP to work in production!**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **moments-38b77**
3. Navigate to **Authentication** > **Settings** (gear icon at top)
4. Scroll down to **Authorized domains** section
5. Click **Add domain**
6. Add: `admin.moments.live`
7. Click **Add**
8. Also ensure these are present:
   - `localhost` (for development)
   - `moments.live` (if needed)
   - `moments.github.io` (if needed)

**Without this, OTP will NOT work in production!**

## Quick Checklist

- [ ] **CRITICAL**: Authorized domains added (localhost + admin.moments.live)
- [ ] Phone authentication enabled in Firebase Console
- [ ] Phone numbers whitelisted for testing (development)
- [ ] Firebase config values are correct in `/src/firebase/config.js`
- [ ] Phone number format: `+91XXXXXXXXXX` (for India)
- [ ] Check Firebase Console > Usage for quota status
- [ ] Billing enabled (if using production SMS, not test numbers)

## Debugging Steps

1. **Check Console Logs**: Look for detailed error codes
2. **Verify Phone Format**: Should be `+91XXXXXXXXXX`
3. **Check Firebase Console**: Authentication > Phone numbers
4. **Verify Quota**: Project Settings > Usage and billing
5. **Test with Whitelisted Number**: Add your number and use test OTP

## Firebase Console Links

- **Project**: https://console.firebase.google.com/project/moments-38b77
- **Authentication**: https://console.firebase.google.com/project/moments-38b77/authentication
- **Phone Settings**: https://console.firebase.google.com/project/moments-38b77/authentication/providers
- **Usage & Quotas**: https://console.firebase.google.com/project/moments-38b77/settings/usage

