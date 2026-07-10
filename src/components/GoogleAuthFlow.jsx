import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { LEADS_ENDPOINT } from '../config/leads';

/**
 * Staged Google sign-in overlay. Rendered by AdminLogin after
 * `POST /api/auth/google/start` returns NEEDS_PHONE (the Google email isn't a
 * known account yet). Walks the user through:
 *
 *   phone → OTP → (link to an existing phone account & log in) OR
 *                 (no account → "activate free trial" lead form, capture only)
 *
 * The Firebase `user` is kept so a fresh ID token can be minted for the
 * `/link-phone` call; the email/uid linked server-side are read from that token,
 * never from this client.
 */

const formatPhoneNumber = (phone) => phone.replace(/\D/g, '');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
const isPhone = (v) => {
  const d = String(v).replace(/\D/g, '');
  return d.length >= 8 && d.length <= 15;
};
const contactKind = (v) => (isEmail(v) ? 'Email' : isPhone(v) ? 'Phone' : '');
const getDevice = () =>
  /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ? 'Phone' : 'Web';

const GoogleAuthFlow = ({ user, googleEmail, googleName, t, isDark, onLoggedIn, onClose }) => {
  const [stage, setStage] = useState('phone'); // phone | otp | signup | leadDone
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Lead form (final "activate free trial" step — capture only).
  const [lead, setLead] = useState({ name: googleName || '', studio: '', link: '', message: '' });

  const sendOtp = async () => {
    const cleaned = formatPhoneNumber(phoneNumber);
    if (cleaned.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/api/otp/send`,
        { phoneNumber: cleaned },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setStage('otp');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndLink = async () => {
    const cleaned = formatPhoneNumber(phoneNumber);
    if (otp.length !== 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      // Mint a fresh ID token — the one from the initial popup may have expired.
      const idToken = await user.getIdToken();
      const { data } = await axios.post(
        `${API_BASE_URL}/api/auth/google/link-phone`,
        { idToken, phoneNumber: cleaned, otpCode: otp },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const result = data?.data;
      if (result?.status === 'LOGGED_IN' && result.userProfile?.userId) {
        onLoggedIn(result.userProfile, cleaned, result.token);
        return;
      }
      if (result?.status === 'NEEDS_SIGNUP') {
        setStage('signup');
        return;
      }
      setError(result?.message || 'Could not verify OTP. Please try again.');
    } catch (err) {
      if (err.response?.status === 401) {
        setError(err.response?.data?.message || 'Invalid or expired OTP.');
      } else {
        setError(err.response?.data?.message || err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitLead = async () => {
    if (!lead.name.trim()) {
      setError('Please tell us your name.');
      return;
    }
    setError('');
    setLoading(true);
    const payload = {
      name: lead.name.trim(),
      contact: googleEmail || formatPhoneNumber(phoneNumber),
      email: googleEmail || '',
      phone: formatPhoneNumber(phoneNumber),
      studio: lead.studio.trim(),
      link: lead.link.trim(),
      message: lead.message.trim(),
      contactType: contactKind(googleEmail || phoneNumber),
      device: getDevice(),
      submittedAt: new Date().toISOString(),
      source: 'studio.moments.live/google-auth',
    };
    try {
      if (LEADS_ENDPOINT) {
        await fetch(LEADS_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
      } else {
        console.info('[free-trial lead]', payload);
      }
      setStage('leadDone');
    } catch (err) {
      // no-cors responses are opaque; treat a thrown error as sent so we don't block the visitor.
      console.error('Lead submit failed:', err);
      setStage('leadDone');
    } finally {
      setLoading(false);
    }
  };

  const card = isDark ? 'bg-[#0E1511] border-gray-700' : 'bg-white border-gray-200';
  const errorBox = isDark
    ? 'bg-red-950/40 border-red-800 text-red-200'
    : 'bg-red-50 border-red-200 text-red-800';

  const field = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#344e41]/40 ${t.input}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${card}`}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Moments" className="h-6 w-auto object-contain" />
            <span className={`text-sm font-semibold ${t.rightHeading}`}>Continue with Google</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-md ${t.themeBtn}`}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6">
          {googleEmail && stage !== 'leadDone' && (
            <p className={`text-xs mb-4 ${t.rightMuted}`}>
              Signed in as <span className="font-medium">{googleEmail}</span>
            </p>
          )}

          {error && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${errorBox}`}>{error}</div>
          )}

          {stage === 'phone' && (
            <>
              <h3 className={`text-lg font-bold mb-1 ${t.rightHeading}`}>Verify your phone number</h3>
              <p className={`text-sm mb-5 ${t.rightMuted}`}>
                We couldn&apos;t find an account for this Google email. Enter your mobile number and we&apos;ll send an OTP.
              </p>
              <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Phone number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setError('');
                }}
                className={field}
                placeholder="10-digit mobile number"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading || phoneNumber.length < 10}
                className={`mt-4 w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 ${t.primaryBtn}`}
              >
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </>
          )}

          {stage === 'otp' && (
            <>
              <h3 className={`text-lg font-bold mb-1 ${t.rightHeading}`}>Enter the OTP</h3>
              <p className={`text-sm mb-5 ${t.rightMuted}`}>Sent to {phoneNumber}</p>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
                  setError('');
                }}
                className={`w-full rounded-lg border px-3 py-2.5 text-center text-2xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-[#344e41]/40 ${t.input}`}
                placeholder="••••"
                maxLength={4}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={verifyOtpAndLink}
                disabled={loading || otp.length !== 4}
                className={`mt-4 w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 ${t.primaryBtn}`}
              >
                {loading ? 'Verifying…' : 'Verify & continue'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStage('phone');
                  setOtp('');
                  setError('');
                }}
                disabled={loading}
                className={`mt-2 w-full text-sm py-2 ${t.accent}`}
              >
                Change phone number
              </button>
            </>
          )}

          {stage === 'signup' && (
            <>
              <h3 className={`text-lg font-bold mb-1 ${t.rightHeading}`}>Activate your free trial</h3>
              <p className={`text-sm mb-5 ${t.rightMuted}`}>
                You&apos;re new here — tell us a little about your studio and we&apos;ll set you up. No credit card, no commitment.
              </p>
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Your name</label>
                  <input
                    type="text"
                    value={lead.name}
                    onChange={(e) => setLead((s) => ({ ...s, name: e.target.value }))}
                    className={field}
                    placeholder="e.g. Ritwik"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Studio / brand name</label>
                  <input
                    type="text"
                    value={lead.studio}
                    onChange={(e) => setLead((s) => ({ ...s, studio: e.target.value }))}
                    className={field}
                    placeholder="Your studio name (optional)"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Website or Instagram</label>
                  <input
                    type="text"
                    value={lead.link}
                    onChange={(e) => setLead((s) => ({ ...s, link: e.target.value }))}
                    className={field}
                    placeholder="@yourstudio or yoursite.com"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${t.fieldLabel}`}>Anything we should know?</label>
                  <textarea
                    rows={2}
                    value={lead.message}
                    onChange={(e) => setLead((s) => ({ ...s, message: e.target.value }))}
                    className={`${field} resize-none`}
                    placeholder="What would make Moments perfect for you? (optional)"
                    disabled={loading}
                  />
                </div>
              </div>
              <p className={`text-xs mt-3 ${t.rightMuted}`}>
                We&apos;ll reach out at {googleEmail || phoneNumber}.
              </p>
              <button
                type="button"
                onClick={submitLead}
                disabled={loading}
                className={`mt-4 w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 ${t.primaryBtn}`}
              >
                {loading ? 'Sending…' : 'Claim free trial'}
              </button>
            </>
          )}

          {stage === 'leadDone' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#344e41]/15 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#344e41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${t.rightHeading}`}>We&apos;ll reach out to you soon!</h3>
              <p className={`text-sm ${t.rightMuted}`}>
                Thanks{lead.name ? `, ${lead.name.split(' ')[0]}` : ''} — your details are in. We can&apos;t wait to help you create something beautiful.
              </p>
              <button
                type="button"
                onClick={onClose}
                className={`mt-6 w-full py-3 rounded-lg text-sm font-semibold ${t.primaryBtn}`}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthFlow;
