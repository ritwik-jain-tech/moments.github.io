import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light'); // 'light' | 'dark'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === '1');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    // Get user profile and userId from storage
    const profile = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile');
    const userId = localStorage.getItem('userId');
    
    console.log('UserId:', userId); // Debug log
    console.log('Raw Profile:', profile); // Debug log

    // Check if we have userId and profile
    if (!userId) {
      setError('No user ID found. Please login again.');
      setLoading(false);
      navigate('/admin/login');
      return;
    }

    // Safely parse the profile if it exists
    let parsedProfile = null;
    if (profile) {
      try {
        parsedProfile = JSON.parse(profile);
        console.log('Parsed Profile:', parsedProfile); // Debug log
        setUserProfile(parsedProfile);
      } catch (err) {
        console.error('Error parsing user profile:', err);
      }
    }

    // Fetch events - use stored eventDetails or fetch from API
    const fetchEvents = async () => {
      try {
        // First, check if eventDetails are already in the stored userProfile
        if (parsedProfile && parsedProfile.eventDetails && Array.isArray(parsedProfile.eventDetails)) {
          console.log('Using stored eventDetails from userProfile');
          setEvents(parsedProfile.eventDetails);
          setLoading(false);
          return;
        }

        // If not in storage, fetch from API
        if (!parsedProfile) {
          throw new Error('User profile not found');
        }
        
        // Try to get phone number from user profile, fallback to stored entered phone number
        let phoneNumber = parsedProfile?.phoneNumber;
        let last10Digits = null;

        // If phone number not in profile, use the one entered during login
        if (!phoneNumber) {
          const storedPhoneNumber = localStorage.getItem('enteredPhoneNumber');
          const storedLast10 = localStorage.getItem('enteredPhoneNumberLast10');
          
          if (storedLast10) {
            last10Digits = storedLast10;
            console.log('Using stored entered phone number (last 10 digits):', last10Digits);
          } else if (storedPhoneNumber) {
            const cleanedPhone = storedPhoneNumber.replace(/\D/g, '');
            last10Digits = cleanedPhone.slice(-10);
            console.log('Extracted last 10 digits from stored entered phone number:', last10Digits);
          }
        } else {
          // Extract last 10 digits from phone number in profile
          const cleanedPhone = phoneNumber.replace(/\D/g, ''); // Remove all non-digit characters
          last10Digits = cleanedPhone.slice(-10); // Get last 10 digits
        }

        if (!last10Digits || last10Digits.length !== 10) {
          throw new Error('Phone number not found. Please login again.');
        }

        console.log('Fetching user profile and events with phone number:', last10Digits);
        
        const response = await axios.get(
          `${API_BASE_URL}/api/userProfile/phone?phoneNumber=${last10Digits}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('User profile and events response:', response.data); // Debug log
        
        // Update stored userProfile with fresh data
        const userProfileData = response.data;
        if (userProfileData) {
          localStorage.setItem('userProfile', JSON.stringify(userProfileData));
          sessionStorage.setItem('userProfile', JSON.stringify(userProfileData));
          setUserProfile(userProfileData);
        }
        
        // Extract eventDetails from response.data.eventDetails
        const eventsData = userProfileData?.eventDetails || response.data?.data?.eventDetails || [];
        console.log('Events data:', eventsData); // Debug log
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch (err) {
        console.error('Error fetching events:', err.response || err);
        if (err.response?.status === 401) {
          // If unauthorized, redirect to login
          navigate('/admin/login');
        } else {
          setError(err.message || 'Failed to fetch events. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [navigate]);

  const handleEventClick = (eventId) => {
    navigate(`/admin/events/${eventId}`);
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('userId');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('name');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('enteredPhoneNumber');
    localStorage.removeItem('enteredPhoneNumberLast10');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('phoneNumber');
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('userProfile');
    sessionStorage.removeItem('isAdminLoggedIn');
    
    // Redirect to login
    navigate('/admin/login');
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file:', file); // Debug log
      setSelectedImage(file);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', 'IMAGE');

    try {
      const userId = localStorage.getItem('userId');
      const phoneNumber = localStorage.getItem('phoneNumber');
      
      const response = await axios.post(
        `${API_BASE_URL}/api/files/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(userId && { 'X-User-Id': userId }),
            ...(phoneNumber && { 'X-Phone-Number': phoneNumber }),
          }
        }
      );
      
      // Debug log
      console.log('Upload response:', response.data);
      
      // Get the publicUrl from the response
      const publicUrl = response.data?.data?.publicUrl;
      
      if (!publicUrl) {
        console.error('Upload response structure:', response.data);
        throw new Error('Invalid response structure from upload API');
      }
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error.response || error);
      throw new Error('Failed to upload image: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName || !selectedImage) {
      setError('Please provide both event name and image');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // First upload the image
      let imageUrl;
      try {
        imageUrl = await uploadImage(selectedImage);
        console.log('Uploaded Image URL:', imageUrl);
        
        if (!imageUrl) {
          throw new Error('No image URL received from upload');
        }
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        throw new Error('Failed to upload image: ' + uploadError.message);
      }

      // Get creator ID from userProfile - try multiple possible field names
      let creatorId = userProfile?.userId || userProfile?.id || userProfile?.user_id;
      
      // If still not found, try to fetch fresh profile data from API
      if (!creatorId && userProfile) {
        console.warn('Creator ID not found in cached profile. Available fields:', Object.keys(userProfile));
        console.log('Full user profile:', JSON.stringify(userProfile, null, 2));
        
        // Try to get phone number to fetch fresh profile
        let phoneNumber = userProfile?.phoneNumber;
        if (!phoneNumber) {
          const storedLast10 = localStorage.getItem('enteredPhoneNumberLast10');
          const storedPhone = localStorage.getItem('enteredPhoneNumber');
          
          if (storedLast10) {
            phoneNumber = storedLast10;
          } else if (storedPhone) {
            const cleanedPhone = storedPhone.replace(/\D/g, '');
            phoneNumber = cleanedPhone.slice(-10);
          }
        } else {
          const cleanedPhone = phoneNumber.replace(/\D/g, '');
          phoneNumber = cleanedPhone.slice(-10);
        }
        
        if (phoneNumber && phoneNumber.length === 10) {
          try {
            console.log('Fetching fresh user profile to get creator ID...');
            const response = await axios.get(
              `${API_BASE_URL}/api/userProfile/phone?phoneNumber=${phoneNumber}`,
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            
            const freshProfile = response.data;
            console.log('Fresh profile data:', freshProfile);
            
            // Try to get creator ID from fresh profile
            creatorId = freshProfile?.userId || freshProfile?.id || freshProfile?.user_id;
            
            // Update cached profile
            if (freshProfile) {
              localStorage.setItem('userProfile', JSON.stringify(freshProfile));
              sessionStorage.setItem('userProfile', JSON.stringify(freshProfile));
              setUserProfile(freshProfile);
            }
          } catch (fetchError) {
            console.error('Error fetching fresh profile:', fetchError);
          }
        }
      }
      
      if (!creatorId) {
        const availableFields = userProfile ? Object.keys(userProfile).join(', ') : 'none';
        const errorMsg = `Creator ID not found in user profile. Available fields: ${availableFields}. Please check the console for full profile data.`;
        console.error('Profile structure:', JSON.stringify(userProfile, null, 2));
        throw new Error(errorMsg);
      }

      // Then create the event with the publicUrl
      const userId = localStorage.getItem('userId');
      const phoneNumber = localStorage.getItem('phoneNumber');
      
      const eventData = {
        creatorId: creatorId,
        eventThumbnail: imageUrl, // This will now be the publicUrl from the upload response
        eventName: newEventName
      };

      console.log('Creating event with data:', eventData);

      const response = await axios.post(
        `${API_BASE_URL}/api/event`,
        eventData,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(userId && { 'X-User-Id': userId }),
            ...(phoneNumber && { 'X-Phone-Number': phoneNumber }),
          }
        }
      );

      console.log('Event creation response:', response.data);

      // Add the new event to the list
      setEvents(prevEvents => [...prevEvents, response.data]);
      
      // Reset form and close modal
      setNewEventName('');
      setSelectedImage(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.message || 'Failed to create event. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderCreateEventModal = () => (
    <div className={`fixed inset-0 ${isDark ? 'bg-black/60' : 'bg-black/40'} flex items-center justify-center z-50`}>
      <div
        className={`rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl ${
          isDark ? 'bg-[#101827] border border-white/10' : 'bg-white border border-black/10'
        }`}
      >
        <h2 className={`text-2xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>New Project</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Project name</label>
            <input
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 ${
                isDark
                  ? 'bg-[#0B1220] border border-white/10 text-white placeholder:text-white/40'
                  : 'bg-white border border-black/10 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="e.g., Ritwik Weds Shivani"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Project cover</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer hover:border-emerald-500/40 transition-colors ${
                isDark ? 'border-white/15 bg-[#0B1220]' : 'border-black/10 bg-slate-50'
              }`}
            >
              {selectedImage ? (
                <div className="relative">
                  <img 
                    src={URL.createObjectURL(selectedImage)} 
                    alt="Selected" 
                    className="max-h-44 mx-auto rounded-xl"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                    }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className={isDark ? 'text-white/60' : 'text-slate-500'}>
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Click to upload an image</p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => {
                setError('');
                setShowCreateModal(false);
              }}
              className={`flex-1 py-3 px-4 rounded-xl transition-colors border ${
                isDark
                  ? 'bg-white/5 text-white hover:bg-white/10 border-white/10'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-black/10'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateEvent}
              disabled={uploading || !newEventName || !selectedImage}
              className={`flex-1 bg-emerald-600 text-white py-3 px-4 rounded-xl hover:bg-emerald-500 transition-colors ${
                (uploading || !newEventName || !selectedImage) ? 'opacity-50 cursor-not-allowed' : ''
              } border border-emerald-400/20`}
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  Creating…
                </div>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const totalUploadsThisMonth = events.reduce((sum, ev) => sum + (Number(ev?.totalMoments) || 0), 0);
  const teamMembers = events.reduce((sum, ev) => sum + (Number(ev?.memberCount) || 0), 0);
  const activeProjects = events.length;

  const appBg = isDark ? 'bg-[#0B1220]' : 'bg-white';
  const appText = isDark ? 'text-white' : 'text-slate-900';
  const dividerBorder = isDark ? 'border-white/10' : 'border-black/10';

  const sidebarBg = isDark ? 'bg-[#08101D]' : 'bg-white';
  const sidebarItemBase = `w-full flex items-center rounded-xl text-sm font-medium transition-colors ${
    sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-2'
  }`;
  const sidebarItemActive = `${sidebarItemBase} ${isDark ? 'bg-emerald-600/20 text-white border border-emerald-500/20' : 'bg-emerald-600/10 text-slate-900 border border-emerald-600/20'}`;
  const sidebarItemIdle = `${sidebarItemBase} ${isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`;

  const surface = isDark ? 'bg-white/5' : 'bg-white';
  const surfaceBorder = isDark ? 'border-white/10' : 'border-black/10';
  const surfaceSubtle = isDark ? 'text-white/55' : 'text-slate-500';
  const surfaceMuted = isDark ? 'text-white/60' : 'text-slate-600';

  return (
    <div className={`min-h-screen ${appBg} ${appText} font-sans`}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`hidden md:flex md:flex-col border-r ${dividerBorder} ${sidebarBg} ${
            sidebarCollapsed ? 'md:w-20' : 'md:w-72'
          } transition-[width] duration-200`}
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'px-3 py-4 justify-center' : 'px-6 py-6'} gap-3`}>
            <img src="/logo.png" alt="Moments" className="h-9 w-9" />
            {!sidebarCollapsed && (
              <div className="leading-tight">
                <div className="text-lg font-semibold tracking-wide">MOMENTS</div>
                <div className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Studio dashboard</div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className={`ml-auto w-9 h-9 rounded-xl border ${surfaceBorder} ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-slate-50'} transition-colors flex items-center justify-center`}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className={`w-5 h-5 ${isDark ? 'text-white/80' : 'text-slate-700'} transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <nav className={`${sidebarCollapsed ? 'px-3' : 'px-4'} space-y-1`}>
            <button className={sidebarItemActive} onClick={() => navigate('/admin/events')} title="Homepage">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2 7-7 7 7 2 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
              </svg>
              {!sidebarCollapsed && 'Homepage'}
            </button>
            <button className={sidebarItemIdle} onClick={() => navigate('/admin/events')} title="Projects">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h6l2 2h10v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              {!sidebarCollapsed && 'Projects'}
            </button>
            <button className={sidebarItemIdle} onClick={() => navigate('/admin/events')} title="Uploads">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
              </svg>
              {!sidebarCollapsed && 'Uploads'}
            </button>
            <button className={sidebarItemIdle} onClick={() => navigate('/admin/events')} title="Storage">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              {!sidebarCollapsed && 'Storage'}
            </button>
            <button className={sidebarItemIdle} onClick={() => navigate('/admin/events')} title="Notifications">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
              </svg>
              {!sidebarCollapsed && 'Notifications'}
            </button>
            <button className={sidebarItemIdle} onClick={() => navigate('/admin/events')} title="Team Management">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!sidebarCollapsed && 'Team Management'}
            </button>
          </nav>

          <div className={`mt-auto ${sidebarCollapsed ? 'px-3' : 'px-4'} py-6 space-y-2`}>
            <button
              className={sidebarItemIdle}
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.05m9.9 9.9l1.414 1.414" />
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
              {!sidebarCollapsed && (isDark ? 'Light Mode' : 'Dark Mode')}
            </button>
            <button className={sidebarItemIdle} onClick={() => { /* UI-only for now */ }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15l3.5-3.5M7 12a5 5 0 0110 0v1a3 3 0 01-3 3H10a3 3 0 01-3-3v-1z" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3a7 7 0 00-7 7v2a7 7 0 0014 0v-2a7 7 0 00-7-7z" />
              </svg>
              {!sidebarCollapsed && 'Account Settings'}
            </button>
            <button
              className={`${sidebarItemIdle} ${isDark ? 'text-red-200 hover:text-red-100' : 'text-red-600 hover:text-red-700'}`}
              onClick={handleLogout}
              title="Log Out"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 16l4-4-4-4m4 4H3m12 7a2 2 0 002-2V7a2 2 0 00-2-2h-3" />
              </svg>
              {!sidebarCollapsed && 'Log Out'}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {/* Top bar */}
          <div className={`sticky top-0 z-40 backdrop-blur border-b ${dividerBorder} ${isDark ? 'bg-[#0B1220]/80' : 'bg-white/80'}`}>
            <div className="px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold">
                  Welcome back, {userProfile?.name || 'Admin'}!
                </div>
                <div className={`text-sm ${surfaceSubtle}`}>Here&apos;s what&apos;s happening with your studio today.</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className={`relative w-10 h-10 rounded-xl border transition-colors flex items-center justify-center ${
                    isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-black/10 hover:bg-slate-50'
                  }`}
                  aria-label="Notifications"
                >
                  <svg className={`w-5 h-5 ${isDark ? 'text-white/80' : 'text-slate-700'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[11px] font-semibold flex items-center justify-center">
                    2
                  </span>
                </button>
                <button
                  onClick={() => {
                    setError('');
                    setShowCreateModal(true);
                  }}
                  className="px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold flex items-center gap-2 border border-emerald-400/20"
                >
                  <span className="inline-flex w-6 h-6 rounded-lg bg-black/20 items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                    </svg>
                  </span>
                  New Project
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left/content column */}
                <div className="xl:col-span-9 space-y-6">
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`rounded-2xl ${surface} border ${surfaceBorder} p-5 shadow-sm`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`text-sm ${surfaceMuted}`}>Active Projects</div>
                          <div className="mt-2 text-4xl font-semibold">{activeProjects}</div>
                          <button
                            className={`mt-3 text-sm inline-flex items-center gap-1 ${isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                            onClick={() => {
                              const el = document.getElementById('projects-section');
                              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                          >
                            View all
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-600/15 border border-emerald-500/20' : 'bg-emerald-600/10 border border-emerald-600/20'}`}>
                          <svg className={`w-5 h-5 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h6l2 2h10v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-2xl ${surface} border ${surfaceBorder} p-5 shadow-sm`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`text-sm ${surfaceMuted}`}>Total Uploads</div>
                          <div className="mt-2 text-4xl font-semibold">{totalUploadsThisMonth.toLocaleString()}</div>
                          <div className={`mt-2 text-sm ${surfaceSubtle}`}>This month</div>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-600/15 border border-violet-500/20' : 'bg-violet-600/10 border border-violet-600/20'}`}>
                          <svg className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-700'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-2xl ${surface} border ${surfaceBorder} p-5 shadow-sm`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`text-sm ${surfaceMuted}`}>Team Members</div>
                          <div className="mt-2 text-4xl font-semibold">{teamMembers.toLocaleString()}</div>
                          <button
                            className={`mt-3 text-sm inline-flex items-center gap-1 ${isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                            onClick={() => {}}
                          >
                            Manage
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-600/15 border border-emerald-500/20' : 'bg-emerald-600/10 border border-emerald-600/20'}`}>
                          <svg className={`w-5 h-5 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Projects */}
                  <div id="projects-section" className={`rounded-2xl ${surface} border ${surfaceBorder} p-5 shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-semibold">Active Projects</div>
                      <button
                        className={`text-sm inline-flex items-center gap-1 ${isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        onClick={() => {}}
                      >
                        View All
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {events.length === 0 ? (
                      <div className="text-white/60 py-10 text-center">No projects yet.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map((event) => (
                          <button
                            key={event.eventId}
                            onClick={() => handleEventClick(event.eventId)}
                            className={`text-left rounded-2xl overflow-hidden border transition-colors ${
                              isDark
                                ? 'bg-[#0B1220] border-white/10 hover:border-emerald-500/30'
                                : 'bg-white border-black/10 hover:border-emerald-600/30'
                            }`}
                          >
                            <div className={`h-44 ${isDark ? 'bg-black/20' : 'bg-slate-100'}`}>
                              {event.eventThumbnail ? (
                                <img
                                  src={event.eventThumbnail}
                                  alt={event.eventName || 'Project'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/40">
                                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <div className="font-semibold truncate">{event.eventName || 'Untitled project'}</div>
                              <div className={`mt-1 text-xs ${isDark ? 'text-white/45' : 'text-slate-500'}`}>Project ID: {event.eventId}</div>
                              <div className={`mt-3 flex items-center justify-between text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                                <div className="inline-flex items-center gap-1">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {Number(event.totalMoments) || 0} guest uploads
                                </div>
                                <div className="inline-flex items-center gap-1">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {Number(event.memberCount) || 0} members
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent uploads strip */}
                  <div className={`rounded-2xl ${surface} border ${surfaceBorder} p-5 shadow-sm`}>
                    <div className="text-lg font-semibold">Recent Uploads</div>
                    <div className={`text-sm ${surfaceSubtle}`}>Last 12 uploaded media items</div>
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                      {events
                        .filter((e) => !!e?.eventThumbnail)
                        .slice(0, 12)
                        .map((e) => (
                          <button
                            key={`recent-${e.eventId}`}
                            onClick={() => handleEventClick(e.eventId)}
                            className={`shrink-0 w-24 h-16 rounded-xl overflow-hidden border transition-colors ${
                              isDark
                                ? 'bg-black/20 border-white/10 hover:border-emerald-500/30'
                                : 'bg-slate-100 border-black/10 hover:border-emerald-600/30'
                            }`}
                            title={e.eventName}
                          >
                            <img src={e.eventThumbnail} alt={e.eventName || 'Upload'} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      {events.filter((e) => !!e?.eventThumbnail).length === 0 && (
                        <div className="text-white/50 py-6">No uploads yet.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="xl:col-span-3 space-y-6">
                  {/* Upcoming projects */}
                  <div className={`rounded-2xl ${surface} border ${surfaceBorder} p-5 shadow-sm`}>
                    <div className="text-lg font-semibold">Upcoming Projects</div>
                    <div className="mt-4 space-y-3">
                      {events.slice(0, 3).map((ev, idx) => (
                        <button
                          key={`upcoming-${ev.eventId}`}
                          onClick={() => handleEventClick(ev.eventId)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                            isDark
                              ? 'border-white/10 hover:border-emerald-500/30 bg-[#0B1220]'
                              : 'border-black/10 hover:border-emerald-600/30 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold truncate">{ev.eventName || 'Untitled project'}</div>
                            <div className={`text-xs ${isDark ? 'text-white/45' : 'text-slate-500'}`}>{3 + idx * 5} days</div>
                          </div>
                          <div className={`mt-1 text-xs ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
                            {new Date(Date.now() + (3 + idx * 5) * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </button>
                      ))}
                      {events.length === 0 && <div className="text-white/50">No projects found.</div>}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className={`rounded-2xl ${surface} border ${surfaceBorder} p-5 shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">Notifications</div>
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white font-semibold">2</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className={`rounded-xl border px-4 py-3 ${isDark ? 'bg-[#0B1220] border-white/10' : 'bg-white border-black/10'}`}>
                        <div className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-800'}`}>45 new photos uploaded by guests</div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>5 min ago</div>
                      </div>
                      <div className={`rounded-xl border px-4 py-3 ${isDark ? 'bg-[#0B1220] border-white/10' : 'bg-white border-black/10'}`}>
                        <div className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-800'}`}>Storage usage at 78%</div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>1 hour ago</div>
                      </div>
                      <div className={`rounded-xl border px-4 py-3 ${isDark ? 'bg-[#0B1220] border-white/10' : 'bg-white border-black/10'}`}>
                        <div className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-800'}`}>Team member added to a project</div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>2 hours ago</div>
                      </div>
                      <div className={`text-xs pt-1 ${isDark ? 'text-white/35' : 'text-slate-500'}`}>
                        Next billing on {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Storage */}
                  <div className={`rounded-2xl ${surface} border ${surfaceBorder} p-5 shadow-sm`}>
                    <div className="text-lg font-semibold">Storage Usage</div>
                    <div className={`mt-4 rounded-xl border px-4 py-4 ${isDark ? 'bg-[#0B1220] border-white/10' : 'bg-white border-black/10'}`}>
                      <div className={`flex items-center justify-between text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                        <div>Used</div>
                        <div className={`${isDark ? 'text-white/80' : 'text-slate-900'} font-semibold`}>12.9GB / 50GB</div>
                      </div>
                      <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                        <div className="h-full w-[26%] bg-emerald-500 rounded-full"></div>
                      </div>
                      <button className="mt-4 w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold border border-emerald-400/20">
                        Manage Storage
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {showCreateModal && renderCreateEventModal()}
    </div>
  );
};

export default AdminEvents; 