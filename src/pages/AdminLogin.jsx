import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { API_BASE_URL } from '../config/api';
import { persistAdminSession } from '../utils/adminSession';

const formatPhoneNumber = (phone) => phone.replace(/\D/g, '');

const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const AdminLogin = () => {
  const [isDark, setIsDark] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showPhonePanel, setShowPhonePanel] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const t = isDark
    ? {
        page: 'bg-[#0a0c0b]',
        left: 'bg-[#1a3020]',
        leftPattern: 'opacity-[0.07]',
        leftHeading: 'text-white',
        leftMuted: 'text-white/75',
        card: 'bg-white/10 border-white/10 text-white',
        right: 'bg-[#0d1117]',
        rightHeading: 'text-white',
        rightMuted: 'text-gray-400',
        fieldLabel: 'text-gray-400',
        input: 'bg-[#161b22] border-gray-600 text-white placeholder:text-gray-500',
        divider: 'border-gray-600',
        dividerText: 'bg-[#0d1117] text-gray-500',
        oauthBorder: 'border-gray-600 hover:bg-white/5 text-white',
        accent: 'text-[#4a7c59] hover:text-[#5c926c]',
        primaryBtn: 'bg-[#344e41] hover:bg-[#3d5c4d] text-white',
        themeBtn: 'text-gray-400 hover:text-white hover:bg-white/10',
      }
    : {
        page: 'bg-[#f4f6f4]',
        left: 'bg-[#1a3020]',
        leftPattern: 'opacity-[0.07]',
        leftHeading: 'text-white',
        leftMuted: 'text-white/75',
        card: 'bg-white/10 border-white/10 text-white',
        right: 'bg-white',
        rightHeading: 'text-[#1a3020]',
        rightMuted: 'text-gray-600',
        fieldLabel: 'text-gray-600',
        input: 'bg-[#f8faf9] border-gray-200 text-[#1a3020] placeholder:text-gray-400',
        divider: 'border-gray-200',
        dividerText: 'bg-white text-gray-500',
        oauthBorder: 'border-gray-300 hover:bg-gray-50 text-[#1a3020]',
        accent: 'text-[#2d6a4f] hover:text-[#1b4332]',
        primaryBtn: 'bg-[#344e41] hover:bg-[#2d4336] text-white',
        themeBtn: 'text-gray-500 hover:text-[#1a3020] hover:bg-gray-100',
      };

  const finishLogin = useCallback(
    (userProfile, phoneFallback, jwtToken) => {
      persistAdminSession(userProfile, phoneFallback, jwtToken);
      navigate('/admin/homepage');
    },
    [navigate]
  );

  const syncBackendFirebaseSession = async (user, googleAccessToken) => {
    const idToken = await user.getIdToken();
    const { data } = await axios.post(
      `${API_BASE_URL}/api/auth/firebase`,
      {
        idToken,
        ...(googleAccessToken ? { accessToken: googleAccessToken } : {}),
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const session = data?.data;
    const userProfile = session?.userProfile;
    const token = session?.token;
    if (!userProfile?.userId) {
      throw new Error(data?.message || 'Could not sign in with Firebase.');
    }
    finishLogin(userProfile, userProfile.phoneNumber || '', token);
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const cred = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = cred?.accessToken;
      await syncBackendFirebaseSession(result.user, accessToken);
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled.');
      } else {
        setError(err.response?.data?.message || err.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      if (!email.trim() || !password) {
        setError('Please enter email and password.');
        setLoading(false);
        return;
      }
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncBackendFirebaseSession(user, null);
    } catch (err) {
      console.error('Email sign-in error:', err);
      let msg = 'Sign in failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found for this email.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(err.response?.data?.message || msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address first, then tap Forgot password.');
      return;
    }
    try {
      setError('');
      await sendPasswordResetEmail(auth, email.trim());
      setError('');
      alert('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(err.message || 'Could not send reset email.');
    }
  };

  const handleSendOtp = async () => {
    try {
      setError('');
      setLoading(true);

      const cleanedPhone = formatPhoneNumber(phoneNumber);

      if (cleanedPhone.length < 10) {
        setError('Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/otp/send`,
        { phoneNumber: cleanedPhone },
        { headers: { 'Content-Type': 'application/json' } }
      );

      setShowOtpInput(true);
    } catch (err) {
      console.error('OTP Error:', err);
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (err.response?.data?.message) errorMessage = err.response.data.message;
      else if (err.message) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setError('');
      setLoading(true);

      const cleanedPhone = formatPhoneNumber(phoneNumber);
      const otpNumber = parseInt(otp, 10);

      if (isNaN(otpNumber) || otp.length !== 4) {
        setError('Please enter a valid 4-digit OTP');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/otp/verify`,
        { phoneNumber: cleanedPhone, otp: otpNumber },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const otpPayload = response.data?.data;
      const userProfile = otpPayload?.userProfile;
      const token = otpPayload?.token;

      if (!userProfile) {
        throw new Error('User profile not found in response');
      }

      finishLogin(userProfile, cleanedPhone, token);
    } catch (err) {
      console.error('Verify error:', err);
      let errorMessage = 'Invalid OTP. Please try again.';
      if (err.response?.data?.message) errorMessage = err.response.data.message;
      else if (err.message) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setShowOtpInput(false);
    setOtp('');
    setError('');
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans antialiased ${t.page}`}>
      {/* Left — brand */}
      <div
        className={`relative w-full md:w-1/2 min-h-[40vh] md:min-h-screen flex flex-col px-8 sm:px-12 py-10 md:py-14 overflow-hidden ${t.left}`}
      >
        <div
          className={`pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_100%] ${t.leftPattern}`}
        />
        <div className="relative z-10 flex flex-col h-full max-w-lg">
          <img
            src="/logo.png"
            alt="Moments"
            className="h-8 w-auto object-left object-contain md:h-9 brightness-0 invert"
          />

          <div className="mt-10 md:mt-16 flex-1">
            <h1 className={`text-2xl sm:text-3xl font-bold leading-tight ${t.leftHeading}`}>
              Professional Media Management Platform
            </h1>
            <p className={`mt-4 text-sm sm:text-base max-w-md leading-relaxed ${t.leftMuted}`}>
              Streamline your studio workflow with powerful collaboration tools, secure storage, and seamless client
              delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 md:mt-auto md:mb-10">
            {['500GB Storage', '10+ Team Members', 'Unlimited Projects'].map((label) => (
              <div
                key={label}
                className={`rounded-xl px-4 py-3 text-center text-sm font-medium backdrop-blur-sm border ${t.card}`}
              >
                {label}
              </div>
            ))}
          </div>

          <p className={`relative z-10 text-xs sm:text-sm mt-6 md:mt-0 ${t.leftMuted}`}>
            Trusted by professional studios worldwide · Enterprise-grade security
          </p>
        </div>
      </div>

      {/* Right — auth */}
      <div className={`w-full md:w-1/2 min-h-screen flex flex-col ${t.right}`}>
        <div className="flex justify-end px-6 pt-6">
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            className={`p-2.5 rounded-full transition-colors ${t.themeBtn}`}
            title={isDark ? 'Light theme' : 'Dark theme'}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-12 pt-2">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className={`text-2xl font-bold ${t.rightHeading}`}>Welcome back</h2>
              <p className={`mt-2 text-sm ${t.rightMuted}`}>Sign in to studio.moments.live</p>
            </div>

            {error && (
              <div
                className={`mb-6 px-4 py-3 rounded-lg text-sm border ${
                  isDark
                    ? 'bg-red-950/40 border-red-800 text-red-200'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${t.oauthBorder}`}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPhonePanel((p) => !p);
                  setError('');
                }}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${t.oauthBorder}`}
              >
                <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Continue with Phone Number
              </button>

              {showPhonePanel && (
                <div
                  className={`rounded-xl border p-4 space-y-4 ${
                    isDark ? 'border-gray-700 bg-[#161b22]' : 'border-gray-200 bg-[#f8faf9]'
                  }`}
                >
                  {!showOtpInput ? (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Phone number</label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhoneNumber(value);
                          }}
                          className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#344e41]/40 ${t.input}`}
                          placeholder="10-digit mobile number"
                          disabled={loading}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading || phoneNumber.length < 10}
                        className={`w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 ${t.primaryBtn}`}
                      >
                        {loading ? 'Sending…' : 'Send OTP'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Enter 4-digit OTP</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={otp}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                            setOtp(value);
                          }}
                          className={`w-full rounded-lg border px-3 py-2.5 text-center text-2xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-[#344e41]/40 ${t.input}`}
                          placeholder="••••"
                          maxLength={4}
                          disabled={loading}
                          autoFocus
                        />
                        <p className={`text-xs mt-2 text-center ${t.rightMuted}`}>OTP sent to {phoneNumber}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.length !== 4}
                        className={`w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 ${t.primaryBtn}`}
                      >
                        {loading ? 'Verifying…' : 'Verify & sign in'}
                      </button>
                      <button
                        type="button"
                        onClick={handleBackToPhone}
                        disabled={loading}
                        className={`w-full text-sm py-2 ${t.accent}`}
                      >
                        Change phone number
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="relative py-2">
                <div className={`absolute inset-0 flex items-center`}>
                  <div className={`w-full border-t ${t.divider}`} />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className={`px-3 ${t.dividerText}`}>Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#344e41]/40 ${t.input}`}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={`text-sm font-medium ${t.fieldLabel}`}>Password</label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className={`text-xs font-medium ${t.accent}`}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full rounded-lg border pl-3 pr-11 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#344e41]/40 ${t.input}`}
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md ${t.themeBtn}`}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 ${t.primaryBtn}`}
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <p className={`text-center text-sm pt-2 ${t.rightMuted}`}>
                Don&apos;t have an account?{' '}
                <Link to="/admin/signup" className={`font-medium ${t.accent}`}>
                  Create studio account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
