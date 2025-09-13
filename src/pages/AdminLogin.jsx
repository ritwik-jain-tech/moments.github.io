import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      setError('');
      setLoading(true);
      
      // Log the request
      console.log('Sending OTP request for:', phoneNumber);
      
      const response = await axios.post(
        'https://momentsbackend-673332237675.us-central1.run.app/api/otp/send',
        { phoneNumber },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Log the response
      console.log('OTP Response:', response.data);
      
      if (response.data) {
        setShowOtpInput(true);
      }
    } catch (err) {
      // Log the error
      console.error('OTP Error:', err);
      
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setError('');
      setLoading(true);
      
      const response = await axios.post(
        'https://momentsbackend-673332237675.us-central1.run.app/api/otp/verify',
        {
          phoneNumber,
          otp: parseInt(otp),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Verify response:', response.data); // Debug log

      if (response.data.status === 'OK') {
        const token = response.data.token || response.data.data?.token;
        const userProfile = response.data.userProfile || response.data.data?.userProfile;
        
        console.log('Login response:', response.data); // Debug log
        console.log('User Profile:', userProfile); // Debug log

        if (token && userProfile) {
          localStorage.setItem('adminToken', token);
          sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
          sessionStorage.setItem('isAdminLoggedIn', 'true');
          navigate('/admin/events');
        } else {
          setError('Invalid response from server');
        }
      }
    } catch (err) {
      console.error('Verify error:', err.response || err); // Debug log
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Moments" className="h-8 w-8" />
            <span className="text-xl font-semibold">moments</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 