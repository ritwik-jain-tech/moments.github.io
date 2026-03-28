import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { API_BASE_URL } from '../config/api';
import { persistAdminSession } from '../utils/adminSession';

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

const AdminSignup = () => {
  const [isDark, setIsDark] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        oauthBorder: 'border-gray-300 hover:bg-gray-50 text-[#1a3020]',
        accent: 'text-[#2d6a4f] hover:text-[#1b4332]',
        primaryBtn: 'bg-[#344e41] hover:bg-[#2d4336] text-white',
        themeBtn: 'text-gray-500 hover:text-[#1a3020] hover:bg-gray-100',
      };

  const finishSignup = useCallback(
    (userProfile, phoneFallback, jwtToken) => {
      persistAdminSession(userProfile, phoneFallback, jwtToken);
      navigate('/admin/homepage');
    },
    [navigate]
  );

  const syncBackendSession = async (user, googleAccessToken) => {
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
      throw new Error(data?.message || 'Could not create your studio profile.');
    }
    finishSignup(userProfile, userProfile.phoneNumber || '', token);
  };

  const handleGoogleSignup = async () => {
    try {
      setError('');
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const cred = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = cred?.accessToken;
      await syncBackendSession(result.user, accessToken);
    } catch (err) {
      console.error('Google sign-up error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-up was cancelled.');
      } else {
        setError(err.response?.data?.message || err.message || 'Google sign-up failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      if (!email.trim() || !password || password.length < 6) {
        setError('Enter a valid email and a password of at least 6 characters.');
        setLoading(false);
        return;
      }
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
        await cred.user.reload();
      }
      await syncBackendSession(cred.user, null);
    } catch (err) {
      console.error('Email sign-up error:', err);
      let msg = 'Could not create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(err.response?.data?.message || msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans antialiased ${t.page}`}>
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
            <h1 className={`text-2xl sm:text-3xl font-bold leading-tight ${t.leftHeading}`}>Create your studio account</h1>
            <p className={`mt-4 text-sm sm:text-base max-w-md leading-relaxed ${t.leftMuted}`}>
              Use Google or email. We sync your profile to Moments and store your email; when you allow it, we also save
              your phone number from Google.
            </p>
          </div>
        </div>
      </div>

      <div className={`w-full md:w-1/2 min-h-screen flex flex-col ${t.right}`}>
        <div className="flex justify-end px-6 pt-6">
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            className={`p-2.5 rounded-full transition-colors ${t.themeBtn}`}
            aria-label="Toggle theme"
          >
            {isDark ? '☀' : '☾'}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-12 pt-2">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className={`text-2xl font-bold ${t.rightHeading}`}>Sign up</h2>
              <p className={`mt-2 text-sm ${t.rightMuted}`}>Join studio.moments.live</p>
            </div>

            {error && (
              <div
                className={`mb-6 px-4 py-3 rounded-lg text-sm border ${
                  isDark ? 'bg-red-950/40 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${t.oauthBorder}`}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${t.divider}`} />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className={`px-3 ${isDark ? 'bg-[#0d1117] text-gray-500' : 'bg-white text-gray-500'}`}>
                    Or sign up with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Display name (optional)</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#344e41]/40 ${t.input}`}
                    placeholder="Your name"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Email</label>
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
                  <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full rounded-lg border pl-3 pr-11 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#344e41]/40 ${t.input}`}
                      placeholder="At least 6 characters"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-xs ${t.themeBtn}`}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 ${t.primaryBtn}`}
                >
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className={`text-center text-sm pt-2 ${t.rightMuted}`}>
                Already have an account?{' '}
                <Link to="/admin/login" className={`font-medium ${t.accent}`}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
