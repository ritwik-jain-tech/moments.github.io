import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier
} from 'firebase/auth';
import { auth } from '../firebase/config';

const AdminLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const navigate = useNavigate();
  const recaptchaVerifierRef = useRef(null);
  const confirmationResultRef = useRef(null);

  // Helper function to properly reset reCAPTCHA
  const resetRecaptcha = async () => {
    const container = document.getElementById('recaptcha-container');
    if (!container) {
      console.error('reCAPTCHA container not found');
      return false;
    }

    // Clear existing reCAPTCHA instance
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      } catch (clearErr) {
        // Ignore clear errors - instance might already be cleared
        console.log('Clear error (ignored):', clearErr);
      }
    }

    // Clear the container's innerHTML to remove any rendered elements
    container.innerHTML = '';

    // Wait a bit for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Create new reCAPTCHA verifier (invisible)
      // Note: The Enterprise config warning is normal - Firebase will use reCAPTCHA v2 if Enterprise isn't configured
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          setRecaptchaLoaded(true);
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          setRecaptchaLoaded(false);
          console.log('reCAPTCHA expired');
        }
      });

      // Render reCAPTCHA
      await recaptchaVerifierRef.current.render();
      setRecaptchaLoaded(true);
      console.log('reCAPTCHA initialized successfully');
      return true;
    } catch (err) {
      console.error('Error initializing reCAPTCHA:', err);
      
      // Handle "already rendered" error
      if (err.message && err.message.includes('already been rendered')) {
        console.log('reCAPTCHA already rendered, clearing container and retrying...');
        container.innerHTML = '';
        await new Promise(resolve => setTimeout(resolve, 200));
        // Retry once
        try {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => setRecaptchaLoaded(true),
            'expired-callback': () => setRecaptchaLoaded(false)
          });
          await recaptchaVerifierRef.current.render();
          setRecaptchaLoaded(true);
          return true;
        } catch (retryErr) {
          console.error('Retry failed:', retryErr);
          return false;
        }
      }
      
      // The Enterprise config error is just a warning - reCAPTCHA v2 will work fine
      if (err.message && err.message.includes('Enterprise')) {
        console.log('Using reCAPTCHA v2 fallback (this is normal)');
        setRecaptchaLoaded(true);
        return true;
      }
      
      return false;
    }
  };

  // Initialize reCAPTCHA on component mount
  useEffect(() => {
    let isMounted = true;

    const initializeRecaptcha = async () => {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted) return;

      const success = await resetRecaptcha();
      if (!success && isMounted) {
        setError('Failed to initialize reCAPTCHA. Please refresh the page.');
      }
    };

    initializeRecaptcha();

    return () => {
      isMounted = false;
      // Cleanup on unmount
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      // Clear container
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  // Format phone number to E.164 format
  const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If phone doesn't start with +, add country code (defaulting to +91 for India)
    // You may want to add a country code selector
    if (!phone.startsWith('+')) {
      cleaned = '+91' + cleaned;
    }
    
    return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
  };

  const handleSendOtp = async () => {
    try {
      setError('');
      setLoading(true);
      
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA not initialized. Please refresh the page.');
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('📱 Sending OTP to:', formattedPhone);
      console.log('🔍 Original phone number:', phoneNumber);
      
      // Send OTP using Firebase
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      );
      
      confirmationResultRef.current = confirmationResult;
      setShowOtpInput(true);
      
      console.log('✅ OTP sent successfully!');
      console.log('📝 Confirmation result:', confirmationResult);
      console.log('⚠️  IMPORTANT: If OTP not received, check Firebase Console:');
      console.log('   1. Authentication > Phone numbers - Add test phone numbers');
      console.log('   2. Project Settings > Usage - Check SMS quota');
      console.log('   3. Phone authentication must be enabled in Firebase Console');
      console.log('   4. For production: Enable billing or check quotas');
      
    } catch (err) {
      console.error('❌ OTP Error Details:', {
        code: err.code,
        message: err.message,
        fullError: err
      });
      
      let errorMessage = err.message || 'Failed to send OTP. Please try again.';
      
      // Handle specific Firebase errors
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-phone-number':
            errorMessage = 'Invalid phone number format. Use +91 followed by 10 digits (e.g., +919876543210)';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please wait a few minutes and try again.';
            break;
          case 'auth/quota-exceeded':
            errorMessage = 'SMS quota exceeded. Check Firebase Console for quota limits or enable billing.';
            break;
          case 'auth/captcha-check-failed':
            errorMessage = 'reCAPTCHA verification failed. Please refresh and try again.';
            break;
          case 'auth/missing-phone-number':
            errorMessage = 'Phone number is required.';
            break;
          case 'auth/unauthorized-domain':
            errorMessage = 'Domain not authorized. Please add admin.moments.live to Firebase authorized domains.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Phone authentication is not enabled. Please enable it in Firebase Console.';
            break;
          default:
            errorMessage = `${err.message || 'Failed to send OTP'}. Code: ${err.code || 'Unknown'}. If persistent, check Firebase Console > Authentication > Settings > Authorized domains and ensure admin.moments.live is added.`;
        }
      } else if (err.message?.includes('domain') || err.message?.includes('authorized')) {
        errorMessage = 'Domain authorization error. Please add admin.moments.live to Firebase Console > Authentication > Settings > Authorized domains.';
      }
      
      setError(errorMessage);
      
      // Reset reCAPTCHA if error occurs (especially for captcha-check-failed)
      if (err.code === 'auth/captcha-check-failed' || err.message?.includes('reCAPTCHA') || err.message?.includes('already been rendered')) {
        console.log('Resetting reCAPTCHA after error...');
        await resetRecaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setError('');
      setLoading(true);
      
      if (!confirmationResultRef.current) {
        throw new Error('No OTP session found. Please request a new OTP.');
      }

      console.log('Verifying OTP:', otp);

      // Verify OTP using Firebase
      const result = await confirmationResultRef.current.confirm(otp);
      
      console.log('OTP verified successfully:', result);
      
      // Get Firebase ID token
      const idToken = await result.user.getIdToken();
      console.log('Firebase ID Token:', idToken);
      
      // Get phone number from Firebase user, fallback to entered phone number
      const user = result.user;
      let phoneNumberToUse = user.phoneNumber;
      
      // Get the formatted phone number that was used for sending OTP
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // If Firebase doesn't have phone number, use the one entered by user
      if (!phoneNumberToUse) {
        phoneNumberToUse = formattedPhone;
        console.log('Phone number not found in Firebase user, using entered phone number:', phoneNumberToUse);
      }

      // Ensure we have a phone number
      if (!phoneNumberToUse) {
        throw new Error('Phone number not found');
      }

      // Extract last 10 digits from phone number (remove country code)
      const cleanedPhone = phoneNumberToUse.replace(/\D/g, ''); // Remove all non-digit characters
      const last10Digits = cleanedPhone.slice(-10); // Get last 10 digits

      if (last10Digits.length !== 10) {
        throw new Error('Invalid phone number format');
      }

      // Store the entered phone number for future use
      localStorage.setItem('enteredPhoneNumber', formattedPhone);
      localStorage.setItem('enteredPhoneNumberLast10', last10Digits);

      console.log('Fetching user profile with phone number:', last10Digits);
      
      // Call API to get user profile and event details
      const profileResponse = await axios.get(
        `https://momentsbackend-673332237675.us-central1.run.app/api/userProfile/phone?phoneNumber=${last10Digits}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('User profile response:', profileResponse.data);

      // Extract userProfile data from response
      const userProfileData = profileResponse.data;
      
      if (!userProfileData) {
        throw new Error('No user profile data received from API');
      }

      // Store authentication data
      localStorage.setItem('adminToken', idToken);
      localStorage.setItem('firebaseUser', JSON.stringify({
        uid: user.uid,
        phoneNumber: phoneNumber
      }));
      localStorage.setItem('userProfile', JSON.stringify(userProfileData));
      localStorage.setItem('isAdminLoggedIn', 'true');
      
      // Also store in sessionStorage for immediate access
      sessionStorage.setItem('userProfile', JSON.stringify(userProfileData));
      sessionStorage.setItem('isAdminLoggedIn', 'true');
      
      navigate('/admin/events');
    } catch (err) {
      console.error('Verify error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3efe6] to-[#f3efe6] text-[#2a4d32] font-sans relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-[#2a4d32] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-[#2a4d32] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#2a4d32] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f3efe6] bg-opacity-90 backdrop-blur-sm border-b border-[#d4d4d8]">
        <div className="container mx-auto px-4 py-4 flex justify-center items-center">
          <div className="flex items-center justify-center">
            <img src="/logo.png" alt="Moments" className="h-[33.6px] w-[281px]" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-12 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white bg-opacity-90 rounded-xl shadow-2xl p-8 border border-[#d4d4d8] backdrop-blur-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#2a4d32] to-[#2a4d32] bg-clip-text text-transparent">
                Admin Login
              </h2>
              <p className="text-gray-400 mt-2">Welcome back! Please login to continue.</p>
            </div>

            {error && (
              <div className="bg-[#2a4d32]/20 border border-[#2a4d32] text-[#2a4d32] px-4 py-3 rounded-lg mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 block w-full rounded-lg bg-white border border-[#d4d4d8] text-[#2a4d32] shadow-sm focus:border-[#2a4d32] focus:ring-[#2a4d32] transition-colors duration-200"
                    placeholder="Enter phone number"
                    disabled={loading}
                  />
                </div>
              </div>

              {!showOtpInput ? (
                <button
                  onClick={handleSendOtp}
                  disabled={loading || !phoneNumber}
                  className={`w-full bg-gradient-to-r from-[#2a4d32] to-[#2a4d32] text-white py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2a4d32] focus:ring-offset-2 focus:ring-offset-[#18181b] transition-all duration-200 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      OTP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                          setOtp(value);
                        }}
                        className="pl-10 block w-full rounded-lg bg-white border border-[#d4d4d8] text-[#2a4d32] shadow-sm focus:border-[#2a4d32] focus:ring-[#2a4d32] transition-colors duration-200"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                    className={`w-full bg-gradient-to-r from-[#2a4d32] to-[#2a4d32] text-white py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2a4d32] focus:ring-offset-2 focus:ring-offset-[#18181b] transition-all duration-200 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>
                </>
              )}
            </div>
            {/* reCAPTCHA container (hidden) */}
            <div id="recaptcha-container" className="hidden"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 