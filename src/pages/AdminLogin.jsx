import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const AdminLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Format phone number (remove all non-digits)
  const formatPhoneNumber = (phone) => {
    return phone.replace(/\D/g, '');
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

      console.log('📱 Sending OTP to:', cleanedPhone);
      
      // Send OTP using backend API
      const response = await axios.post(
        `${API_BASE_URL}/api/otp/send`,
        {
          phoneNumber: cleanedPhone
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ OTP sent successfully!', response.data);
      setShowOtpInput(true);
      
    } catch (err) {
      console.error('❌ OTP Error:', err);
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
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

      console.log('🔐 Verifying OTP:', otpNumber, 'for phone:', cleanedPhone);

      // Verify OTP using backend API
      const response = await axios.post(
        `${API_BASE_URL}/api/otp/verify`,
        {
          phoneNumber: cleanedPhone,
          otp: otpNumber
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ OTP verified successfully!', response.data);

      // Extract userProfile from response
      const userProfile = response.data?.userProfile || response.data?.data?.userProfile;
      
      if (!userProfile) {
        throw new Error('User profile not found in response');
      }

      // Extract user information
      const userId = userProfile.userId;
      const phoneNumberFromResponse = userProfile.phoneNumber || cleanedPhone;
      const name = userProfile.name || '';

      // Save user information to localStorage
      localStorage.setItem('userId', userId);
      localStorage.setItem('phoneNumber', phoneNumberFromResponse);
      localStorage.setItem('name', name);
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      localStorage.setItem('isAdminLoggedIn', 'true');

      // Also store in sessionStorage
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('phoneNumber', phoneNumberFromResponse);
      sessionStorage.setItem('name', name);
      sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
      sessionStorage.setItem('isAdminLoggedIn', 'true');

      // Store entered phone number for backward compatibility
      localStorage.setItem('enteredPhoneNumber', phoneNumberFromResponse);
      const last10Digits = phoneNumberFromResponse.replace(/\D/g, '').slice(-10);
      localStorage.setItem('enteredPhoneNumberLast10', last10Digits);

      console.log('💾 Saved user info:', { userId, phoneNumber: phoneNumberFromResponse, name });
      
      navigate('/admin/events');
    } catch (err) {
      console.error('❌ Verify error:', err);
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
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
              <p className="text-gray-400 mt-2">
                {showOtpInput ? 'Enter the OTP sent to your phone' : 'Welcome back! Please login to continue.'}
              </p>
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
              {!showOtpInput ? (
                <>
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
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(value);
                        }}
                        className="pl-10 block w-full rounded-lg bg-white border border-[#d4d4d8] text-[#2a4d32] shadow-sm focus:border-[#2a4d32] focus:ring-[#2a4d32] transition-colors duration-200"
                        placeholder="Enter 10-digit phone number"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={loading || phoneNumber.length < 10}
                    className={`w-full bg-gradient-to-r from-[#2a4d32] to-[#2a4d32] text-white py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2a4d32] focus:ring-offset-2 focus:ring-offset-[#18181b] transition-all duration-200 ${
                      loading || phoneNumber.length < 10 ? 'opacity-50 cursor-not-allowed' : ''
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
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Enter 4-digit OTP
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
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                          setOtp(value);
                        }}
                        className="pl-10 block w-full rounded-lg bg-white border border-[#d4d4d8] text-[#2a4d32] shadow-sm focus:border-[#2a4d32] focus:ring-[#2a4d32] transition-colors duration-200 text-center text-2xl tracking-widest"
                        placeholder="0000"
                        maxLength={4}
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                      OTP sent to {phoneNumber}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length !== 4}
                      className={`w-full bg-gradient-to-r from-[#2a4d32] to-[#2a4d32] text-white py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2a4d32] focus:ring-offset-2 focus:ring-offset-[#18181b] transition-all duration-200 ${
                        loading || otp.length !== 4 ? 'opacity-50 cursor-not-allowed' : ''
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

                    <button
                      onClick={handleBackToPhone}
                      disabled={loading}
                      className="w-full text-[#2a4d32] py-2 px-4 rounded-lg hover:bg-[#2a4d32]/10 focus:outline-none focus:ring-2 focus:ring-[#2a4d32] transition-all duration-200"
                    >
                      Change Phone Number
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
