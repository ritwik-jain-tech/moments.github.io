import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Crop from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { API_BASE_URL } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import { getCroppedImg } from '../utils/imageCrop';
import {
  fetchEventsForUserWithFallback,
  mergeEventsWithProfileDetails,
  syncProfileEventDetails,
} from '../utils/fetchUserEvents';

const BYTES_PER_GB = 1024 ** 3;

function storageBytesToGb(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round((n / BYTES_PER_GB) * 100) / 100;
}

function formatStorageGb(gb) {
  if (gb <= 0) return '0';
  if (gb < 0.01) return '<0.01';
  return gb.toFixed(2);
}

const AdminEvents = ({ initialSection = 'dashboard' }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light'); // 'light' | 'dark'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === '1');
  const [activeSection, setActiveSection] = useState(() => initialSection); // 'dashboard' | 'projects'
  const [projectsTab, setProjectsTab] = useState(() => 'All'); // 'All' | 'Active' | 'Delivered' | 'Archived'
  const [projectsSearch, setProjectsSearch] = useState('');
  const [projectsLayout, setProjectsLayout] = useState(() => 'grid'); // 'grid' | 'list'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [newEventName, setNewEventName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [projectType, setProjectType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [expectedGuestCount, setExpectedGuestCount] = useState('');
  const [teamMemberDropdownOpen, setTeamMemberDropdownOpen] = useState(false);
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState([]);
  const [guestAppEnabled, setGuestAppEnabled] = useState(true);
  const [guestAppThumbnail, setGuestAppThumbnail] = useState(null);
  /** Reuse uploaded event cover URL for guest app thumbnail (no second upload). */
  const [guestAppUseEventThumbnail, setGuestAppUseEventThumbnail] = useState(false);
  const [guestThumbCropOpen, setGuestThumbCropOpen] = useState(false);
  const [guestThumbCropSrc, setGuestThumbCropSrc] = useState('');
  const [guestCrop, setGuestCrop] = useState({ x: 0, y: 0 });
  const [guestZoom, setGuestZoom] = useState(1);
  const [guestCroppedAreaPixels, setGuestCroppedAreaPixels] = useState(null);
  const guestThumbCropUrlRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  /** From GET /api/moments/storage/overview — dashboard storage card */
  const [dashStorageOverview, setDashStorageOverview] = useState(null);
  const fileInputRef = useRef(null);
  const guestAppFileInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (location.state?.openProjects) {
      setActiveSection('projects');
      setProjectsTab('All');
      setProjectsLayout('grid');
      setProjectsSearch('');
      // clear transient state so refresh/back doesn't repeatedly force it
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    const profile = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile');
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

    if (!userId) {
      setError('No user ID found. Please login again.');
      setLoading(false);
      navigate('/admin/login');
      return;
    }

    let parsedProfile = null;
    if (profile) {
      try {
        parsedProfile = JSON.parse(profile);
        setUserProfile(parsedProfile);
      } catch (err) {
        console.error('Error parsing user profile:', err);
      }
    }

    const load = async () => {
      try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const fromApi = await fetchEventsForUserWithFallback(userId, { token });
        const merged = mergeEventsWithProfileDetails(fromApi, parsedProfile?.eventDetails);
        setEvents(merged);
        syncProfileEventDetails(merged);
        setUserProfile((prev) => ({
          ...(prev || parsedProfile || {}),
          eventDetails: merged,
        }));
        setError('');
      } catch (err) {
        console.error('Error fetching events:', err.response || err);
        if (err.response?.status === 401) {
          navigate('/admin/login');
        } else {
          setError(err.message || 'Failed to fetch events. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  useEffect(() => {
    if (activeSection !== 'dashboard') {
      setDashStorageOverview(null);
      return;
    }
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (!userId || !token) {
      setDashStorageOverview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: body } = await axios.get(`${API_BASE_URL}/api/moments/storage/overview`, {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setDashStorageOverview(body?.data ?? body);
        }
      } catch {
        if (!cancelled) setDashStorageOverview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSection, events]);

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
    localStorage.removeItem('adminToken');
    localStorage.removeItem('emailId');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('phoneNumber');
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('userProfile');
    sessionStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('enteredPhoneNumber');
    sessionStorage.removeItem('enteredPhoneNumberLast10');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('emailId');

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

  const closeGuestThumbCrop = useCallback(() => {
    if (guestThumbCropUrlRef.current) {
      URL.revokeObjectURL(guestThumbCropUrlRef.current);
      guestThumbCropUrlRef.current = null;
    }
    setGuestThumbCropSrc('');
    setGuestThumbCropOpen(false);
    setGuestCrop({ x: 0, y: 0 });
    setGuestZoom(1);
    setGuestCroppedAreaPixels(null);
  }, []);

  const openGuestThumbCrop = useCallback(
    (file) => {
      if (!file) return;
      if (guestThumbCropUrlRef.current) {
        URL.revokeObjectURL(guestThumbCropUrlRef.current);
        guestThumbCropUrlRef.current = null;
      }
      const url = URL.createObjectURL(file);
      guestThumbCropUrlRef.current = url;
      setGuestThumbCropSrc(url);
      setGuestThumbCropOpen(true);
      setGuestCrop({ x: 0, y: 0 });
      setGuestZoom(1);
      setGuestCroppedAreaPixels(null);
    },
    []
  );

  const onGuestCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setGuestCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleGuestAppThumbnailSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setGuestAppUseEventThumbnail(false);
    openGuestThumbCrop(file);
    event.target.value = '';
  };

  const handleGuestThumbCropConfirm = async () => {
    if (!guestThumbCropSrc || !guestCroppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(guestThumbCropSrc, guestCroppedAreaPixels);
      const file = new File([blob], 'guest-thumbnail.jpg', { type: 'image/jpeg' });
      setGuestAppThumbnail(file);
      setGuestAppUseEventThumbnail(false);
      closeGuestThumbCrop();
    } catch (e) {
      console.error(e);
      setError('Could not crop image. Try another file.');
    }
  };

  const resetCreateForm = () => {
    setCreateStep(1);
    setNewEventName('');
    setSelectedImage(null);
    setProjectType('');
    setEventDate('');
    setEventStartTime('');
    setEventEndTime('');
    setLocationQuery('');
    setExpectedGuestCount('');
    setTeamMemberDropdownOpen(false);
    setSelectedTeamMemberIds([]);
    setGuestAppEnabled(true);
    setGuestAppThumbnail(null);
    setGuestAppUseEventThumbnail(false);
    closeGuestThumbCrop();
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
    if (!newEventName || !eventStartTime || !eventEndTime) {
      setError('Please fill project name, start time, and end time');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // First upload the image
      let imageUrl = '';
      try {
        if (selectedImage) {
          imageUrl = await uploadImage(selectedImage);
          console.log('Uploaded Image URL:', imageUrl);
          if (!imageUrl) throw new Error('No image URL received from upload');
        }
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        throw new Error('Failed to upload image: ' + uploadError.message);
      }

      let guestAppThumbnailUrl = '';
      try {
        if (guestAppEnabled) {
          if (guestAppUseEventThumbnail) {
            if (!imageUrl) {
              throw new Error('Add a cover photo in step 1 to reuse it as the guest app thumbnail, or upload a square thumbnail instead.');
            }
            guestAppThumbnailUrl = imageUrl;
          } else if (guestAppThumbnail) {
            guestAppThumbnailUrl = await uploadImage(guestAppThumbnail);
          }
        }
      } catch (uploadError) {
        console.error('Guest app thumbnail upload failed:', uploadError);
        throw new Error(uploadError.message || 'Failed to set guest app thumbnail.');
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
      
      const toEpoch = (value) => {
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d.getTime();
      };
      const startEpoch = toEpoch(eventStartTime);
      const endEpoch = toEpoch(eventEndTime);

      const eventData = {
        creatorId: creatorId,
        eventThumbnail: imageUrl, // optional
        eventName: newEventName,
        projectType: projectType || null,
        eventDate: eventDate || null,
        startTime: startEpoch,
        endTime: endEpoch,
        location: locationQuery || null,
        expectedGuests: expectedGuestCount ? Number(expectedGuestCount) : null,
        teamMemberIds: selectedTeamMemberIds,
        guestApp: {
          enabled: !!guestAppEnabled,
          thumbnailImage: guestAppThumbnailUrl || null,
        }
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

      const createdEvent = response.data?.data ?? response.data;
      if (createdEvent && typeof createdEvent === 'object') {
        setEvents((prevEvents) => {
          const next = [...prevEvents, createdEvent];
          syncProfileEventDetails(next);
          return next;
        });
      }
      
      // Reset form and close modal
      resetCreateForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.message || 'Failed to create event. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderCreateEventModal = () => {
    const cardBg = isDark ? 'bg-[#15201A] border-white/10' : 'bg-white border-black/10';
    const inputCls = isDark
      ? 'bg-[#0E1712] border-white/10 text-white placeholder:text-white/40'
      : 'bg-white border-black/10 text-slate-900 placeholder:text-slate-400';
    const memberLabel = teamMemberOptions
      .filter((m) => selectedTeamMemberIds.includes(m.id))
      .map((m) => m.name)
      .join(', ');
    const mapsUrl = locationQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}` : 'https://www.google.com/maps';

    return (
      <>
        {guestThumbCropOpen && (
          <div
            className={`fixed inset-0 z-[60] flex flex-col ${isDark ? 'bg-black/85' : 'bg-black/70'}`}
            role="dialog"
            aria-modal="true"
            aria-label="Crop guest thumbnail"
          >
            <div className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? 'border-white/10 bg-[#0E1712]' : 'border-black/10 bg-white'}`}>
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Crop square thumbnail (1:1)</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Drag to reposition · Pinch or scroll to zoom</p>
              </div>
              <button
                type="button"
                onClick={closeGuestThumbCrop}
                className={`w-9 h-9 rounded-lg border text-sm ${isDark ? 'border-white/15 text-white/80 hover:bg-white/10' : 'border-black/10 text-slate-600 hover:bg-slate-50'}`}
              >
                ✕
              </button>
            </div>
            <div className="relative flex-1 min-h-[min(360px,50vh)] w-full">
              {guestThumbCropSrc ? (
                <Crop
                  image={guestThumbCropSrc}
                  crop={guestCrop}
                  zoom={guestZoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={false}
                  onCropChange={setGuestCrop}
                  onZoomChange={setGuestZoom}
                  onCropComplete={onGuestCropComplete}
                />
              ) : null}
            </div>
            <div className={`px-4 py-3 flex items-center justify-between gap-3 border-t ${isDark ? 'border-white/10 bg-[#0E1712]' : 'border-black/10 bg-white'}`}>
              <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                <span className="whitespace-nowrap">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={guestZoom}
                  onChange={(e) => setGuestZoom(Number(e.target.value))}
                  className="w-40 accent-emerald-600"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeGuestThumbCrop}
                  className={`px-4 py-2 rounded-xl border text-sm ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-black/10 text-slate-800 hover:bg-slate-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGuestThumbCropConfirm}
                  disabled={!guestCroppedAreaPixels}
                  className={`px-4 py-2 rounded-xl text-sm text-white bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Apply square crop
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`fixed inset-0 ${isDark ? 'bg-black/60' : 'bg-black/40'} flex items-center justify-center z-50`}>
        <div className={`rounded-2xl max-w-[820px] w-full mx-4 shadow-2xl border ${cardBg}`}>
          <div className={`px-6 py-5 border-b ${isDark ? 'border-white/10' : 'border-black/10'} flex items-start justify-between`}>
            <div>
              <h2 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create New Project</h2>
              <p className={`${isDark ? 'text-white/55' : 'text-slate-500'} mt-1`}>Basic Information</p>
            </div>
            <button
              onClick={() => {
                setError('');
                resetCreateForm();
                setShowCreateModal(false);
              }}
              className={`w-10 h-10 rounded-xl border ${isDark ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-black/10 text-slate-600 hover:bg-slate-50'}`}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className={`px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'} flex items-center gap-4`}>
            {[1, 2, 3].map((s, idx) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-sm font-semibold ${
                    createStep === s
                      ? 'bg-emerald-700 text-white'
                      : isDark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-500'
                  }`}>{s}</span>
                  <span className={`${createStep === s ? 'text-emerald-700 font-semibold' : isDark ? 'text-white/60' : 'text-slate-500'}`}>
                    {s === 1 ? 'Basic Info' : s === 2 ? 'Details' : 'Guest App'}
                  </span>
                </div>
                {idx < 2 && <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="px-6 py-6 space-y-4">
            {createStep === 1 && (
              <>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Project Name *</label>
                  <input value={newEventName} onChange={(e) => setNewEventName(e.target.value)} className={`w-full rounded-xl px-4 py-3 border ${inputCls}`} placeholder="e.g., Ritwik Weds Shivani" />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Cover Photo (Optional)</label>
                  <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer ${
                    isDark ? 'border-white/15 bg-[#0E1712]' : 'border-black/10 bg-slate-50'
                  }`}>
                    {selectedImage ? <img src={URL.createObjectURL(selectedImage)} alt="Selected" className="max-h-36 mx-auto rounded-xl" /> : <p className={isDark ? 'text-white/60' : 'text-slate-500'}>Click to upload from computer</p>}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Start Time *</label>
                    <input type="datetime-local" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} className={`w-full rounded-xl px-4 py-3 border ${inputCls}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>End Time *</label>
                    <input type="datetime-local" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} className={`w-full rounded-xl px-4 py-3 border ${inputCls}`} />
                  </div>
                </div>
              </>
            )}

            {createStep === 2 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Project Type</label>
                    <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className={`w-full rounded-xl px-4 py-3 border ${inputCls}`}>
                      <option value="">Select project type</option>
                      <option>Wedding</option><option>Birthday</option><option>Corporate Event</option><option>Conference</option>
                      <option>Party</option><option>Sports Event</option><option>Concert</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Project Date</label>
                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={`w-full rounded-xl px-4 py-3 border ${inputCls}`} />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Location (Google Maps)</label>
                  <div className="flex gap-2">
                    <input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} className={`flex-1 rounded-xl px-4 py-3 border ${inputCls}`} placeholder="Search / paste address" />
                    <a href={mapsUrl} target="_blank" rel="noreferrer" className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/20">Map</a>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Expected Guests</label>
                    <input type="number" min="0" value={expectedGuestCount} onChange={(e) => setExpectedGuestCount(e.target.value)} className={`w-full rounded-xl px-4 py-3 border ${inputCls}`} placeholder="e.g., 200" />
                  </div>
                  <div className="relative">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Add Team Members</label>
                    <button onClick={() => setTeamMemberDropdownOpen((v) => !v)} className={`w-full rounded-xl px-4 py-3 border text-left ${inputCls}`}>
                      {memberLabel || 'Select team members'}
                    </button>
                    {teamMemberDropdownOpen && (
                      <div className={`absolute z-20 mt-2 w-full rounded-xl border p-2 max-h-44 overflow-auto ${isDark ? 'bg-[#0E1712] border-white/10' : 'bg-white border-black/10'}`}>
                        {teamMemberOptions.length === 0 ? (
                          <div className={`px-2 py-1 text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>No team members found</div>
                        ) : teamMemberOptions.map((m) => (
                          <label key={m.id} className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTeamMemberIds.includes(m.id)}
                              onChange={() =>
                                setSelectedTeamMemberIds((prev) => prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id])
                              }
                            />
                            <span>{m.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {createStep === 3 && (
              <>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={guestAppEnabled} onChange={(e) => setGuestAppEnabled(e.target.checked)} />
                  <span className={isDark ? 'text-white/80' : 'text-slate-700'}>Enable Guest App</span>
                </label>

                <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-white/10 bg-[#0E1712]' : 'border-black/10 bg-slate-50'}`}>
                  <label className={`flex items-start gap-3 ${selectedImage ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={guestAppUseEventThumbnail}
                      disabled={!selectedImage}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setGuestAppUseEventThumbnail(on);
                        if (on) {
                          setGuestAppThumbnail(null);
                          closeGuestThumbCrop();
                        }
                      }}
                    />
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Use event cover as guest app thumbnail</span>
                      <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                        Same image URL as the project cover (no second upload). Add a cover in step 1 first.
                      </p>
                    </div>
                  </label>

                  {!guestAppUseEventThumbnail && (
                    <>
                      <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
                        Or create a square (1:1) thumbnail
                      </p>
                      {selectedImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setGuestAppUseEventThumbnail(false);
                            openGuestThumbCrop(selectedImage);
                          }}
                          className={`w-full py-2.5 rounded-xl border text-sm font-medium ${
                            isDark
                              ? 'border-emerald-500/35 text-emerald-300 hover:bg-emerald-900/25'
                              : 'border-emerald-600/40 text-emerald-800 hover:bg-emerald-50'
                          }`}
                        >
                          Crop square from cover photo
                        </button>
                      )}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                          Guest Moments Thumbnail
                        </label>
                        <div
                          onClick={() => guestAppFileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer ${
                            isDark ? 'border-white/15 bg-[#15201A]' : 'border-black/10 bg-white'
                          }`}
                        >
                          {guestAppThumbnail ? (
                            <img
                              src={URL.createObjectURL(guestAppThumbnail)}
                              alt="Guest app thumb"
                              className="max-h-36 w-36 mx-auto rounded-xl object-cover aspect-square"
                            />
                          ) : (
                            <p className={isDark ? 'text-white/60' : 'text-slate-500'}>
                              Click to upload an image — you’ll crop to a 1:1 square next
                            </p>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={guestAppFileInputRef}
                          onChange={handleGuestAppThumbnailSelect}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </>
                  )}

                  {guestAppUseEventThumbnail && selectedImage && (
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <span className={`text-xs ${isDark ? 'text-emerald-400/90' : 'text-emerald-700'}`}>Preview — using event cover</span>
                      <img
                        src={URL.createObjectURL(selectedImage)}
                        alt="Event cover preview"
                        className="max-h-36 w-36 rounded-xl object-cover border border-emerald-500/40 aspect-square"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className={`px-6 py-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'} flex items-center justify-between`}>
            <button
              onClick={() => {
                if (createStep === 1) {
                  setError('');
                  resetCreateForm();
                  setShowCreateModal(false);
                } else {
                  setCreateStep((s) => Math.max(1, s - 1));
                }
              }}
              className={`px-6 py-2.5 rounded-xl border ${isDark ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-900 border-black/10 hover:bg-slate-200'}`}
            >
              {createStep === 1 ? 'Cancel' : 'Back'}
            </button>
            {createStep < 3 ? (
              <button
                onClick={() => setCreateStep((s) => Math.min(3, s + 1))}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/20"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateEvent}
                disabled={uploading || !newEventName || !eventStartTime || !eventEndTime}
                className={`px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/20 ${
                  (uploading || !newEventName || !eventStartTime || !eventEndTime) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? 'Creating…' : 'Create Project'}
              </button>
            )}
          </div>
        </div>
      </div>
      </>
    );
  };

  const totalUploadsThisMonth = events.reduce((sum, ev) => sum + (Number(ev?.totalMoments) || 0), 0);
  const teamMembers = events.reduce((sum, ev) => sum + (Number(ev?.memberCount) || 0), 0);
  const activeProjects = events.length;
  const teamMemberOptions = (userProfile?.teamMembers || userProfile?.members || userProfile?.memberDetails || [])
    .map((m, idx) => ({
      id: String(m?.userId || m?.id || m?.memberId || `member-${idx}`),
      name: m?.name || m?.userName || m?.fullName || `Member ${idx + 1}`,
    }));

  const getProjectStatus = (ev) => {
    const raw =
      ev?.status ??
      ev?.eventStatus ??
      ev?.projectStatus ??
      ev?.deliveryStatus ??
      ev?.state;
    if (!raw) return 'Active';
    const s = String(raw).toLowerCase();
    if (s.includes('deliver')) return 'Delivered';
    if (s.includes('archive')) return 'Archived';
    if (s.includes('active')) return 'Active';
    return 'Active';
  };

  const getProjectDate = (ev) => {
    const raw =
      ev?.eventDate ??
      ev?.date ??
      ev?.createdAt ??
      ev?.created_at ??
      ev?.createdOn ??
      ev?.timestamp;
    const d = raw ? new Date(raw) : null;
    if (d && !Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return '';
  };

  const getProjectDateValue = (ev) => {
    const raw =
      ev?.eventDate ??
      ev?.date ??
      ev?.createdAt ??
      ev?.created_at ??
      ev?.createdOn ??
      ev?.timestamp;
    const d = raw ? new Date(raw) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
  };

  const getDaysUntilProject = (ev) => {
    const eventDate = getProjectDateValue(ev);
    if (!eventDate) return null;
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startEvent = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const diff = Math.ceil((startEvent.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStorageNumbers = (ev) => {
    const used =
      ev?.storageUsedGB ??
      ev?.storageUsed ??
      ev?.usedStorageGB ??
      ev?.storage?.usedGB ??
      ev?.storage?.used ??
      ev?.usedStorage;
    const limit =
      ev?.storageLimitGB ??
      ev?.storageLimit ??
      ev?.totalStorageGB ??
      ev?.storage?.limitGB ??
      ev?.storage?.limit ??
      ev?.totalStorage;

    const usedNum = used === undefined || used === null || used === '' ? 0 : Number(used);
    const limitNum = limit === undefined || limit === null || limit === '' ? 10 : Number(limit);
    if (!Number.isFinite(usedNum) || usedNum < 0) return { usedGB: 0, limitGB: Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 10 };
    if (!Number.isFinite(limitNum) || limitNum <= 0) return { usedGB: usedNum, limitGB: 10 };
    return { usedGB: usedNum, limitGB: limitNum };
  };

  const projectSearchTerm = projectsSearch.trim().toLowerCase();
  const allProjects = events.map((ev) => ({
    ev,
    status: getProjectStatus(ev),
    dateLabel: getProjectDate(ev),
    storage: getStorageNumbers(ev),
    uploads: Number(ev?.totalMoments) || 0,
    team: Number(ev?.memberCount) || 0,
    name: ev?.eventName || 'Untitled project',
    id: ev?.eventId,
    thumbnail: ev?.eventThumbnail,
  }));

  const filteredProjects = allProjects.filter((p) => {
    if (!projectSearchTerm) return true;
    const haystack = `${p.name} ${p.id ?? ''}`.toLowerCase();
    return haystack.includes(projectSearchTerm);
  });

  const tabbedProjects = filteredProjects.filter((p) => {
    if (projectsTab === 'All') return true;
    return p.status === projectsTab;
  });

  const formatGB = (num) => {
    const n = Number(num);
    if (!Number.isFinite(n)) return '0';
    const rounded = Math.round(n * 10) / 10;
    return String(rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1));
  };

  const getProgressPct = (p) => {
    if (!p?.storage) return 0;
    const { usedGB, limitGB } = p.storage;
    if (!limitGB || limitGB <= 0) return 0;
    const pct = (usedGB / limitGB) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const statusPill = (status) => {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold';
    if (isDark) {
      if (status === 'Active') return `${base} bg-emerald-500/15 text-emerald-300 border border-emerald-400/20`;
      if (status === 'Delivered') return `${base} bg-cyan-500/15 text-cyan-300 border border-cyan-400/20`;
      if (status === 'Archived') return `${base} bg-white/5 text-white/50 border border-white/10`;
      return `${base} bg-white/5 text-white/60 border border-white/10`;
    }
    if (status === 'Active') return `${base} bg-emerald-600/10 text-emerald-700 border border-emerald-600/20`;
    if (status === 'Delivered') return `${base} bg-cyan-600/10 text-cyan-700 border border-cyan-600/20`;
    if (status === 'Archived') return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
    return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  };

  const renderProjectsView = () => {
    const tabs = [
      { key: 'All', label: 'All Projects' },
      { key: 'Active', label: 'Active' },
      { key: 'Delivered', label: 'Delivered' },
      { key: 'Archived', label: 'Archived' },
    ];

    const headerBg = isDark ? 'bg-[#0E1712]/60 border-white/10' : 'bg-white/70 border-black/10';
    const inputBg = isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-black/10 text-slate-900';
    const inputPh = isDark ? 'placeholder:text-white/40' : 'placeholder:text-slate-400';
    const inputBorder = isDark ? 'focus:border-emerald-500/40' : 'focus:border-emerald-600/40';
    const cardBorder = isDark ? 'border-white/10' : 'border-black/10';

    return (
      <div className="space-y-5">
        {/* Page header */}
        <div className={`rounded-2xl ${headerBg} border backdrop-blur`}>
          <div className="px-4 py-4 md:px-6 md:py-5 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-xl md:text-2xl font-semibold text-inherit">Projects / Events</div>
              <div className={`text-sm ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
                Central hub for all event management
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 h-11 rounded-xl border ${cardBorder} ${inputBg}`}>
                <svg className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                </svg>
                <input
                  value={projectsSearch}
                  onChange={(e) => setProjectsSearch(e.target.value)}
                  className={`w-[360px] bg-transparent outline-none text-sm ${inputPh} ${inputBorder}`}
                  placeholder="Search projects by name, event code, or client name..."
                />
              </div>

              <button
                onClick={() => {
                  resetCreateForm();
                  setShowCreateModal(true);
                }}
                className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold border border-emerald-400/20 text-white inline-flex items-center gap-2"
              >
                <span className="inline-flex w-5 h-5 rounded-md bg-black/20 items-center justify-center">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                  </svg>
                </span>
                Create New Project
              </button>
            </div>
          </div>

          {/* Tabs + layout controls */}
          <div className="px-4 pb-4 md:px-6 md:pb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setProjectsTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    projectsTab === t.key
                      ? isDark
                        ? 'bg-emerald-600/20 text-emerald-200 border-emerald-500/30'
                        : 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20'
                      : isDark
                        ? 'bg-white/0 text-white/60 border-white/10 hover:text-white'
                        : 'bg-white text-slate-600 border-black/10 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setProjectsLayout('grid')}
                className={`w-10 h-10 rounded-xl border transition-colors flex items-center justify-center ${
                  projectsLayout === 'grid'
                    ? isDark
                      ? 'bg-emerald-600/20 border-emerald-500/30'
                      : 'bg-emerald-600/10 border-emerald-600/20'
                    : isDark
                      ? 'bg-white/0 border-white/10 hover:bg-white/5'
                      : 'bg-white border-black/10 hover:bg-slate-50'
                }`}
                aria-label="Grid view"
              >
                <svg className={`w-5 h-5 ${isDark ? 'text-white/80' : 'text-slate-700'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
                </svg>
              </button>
              <button
                onClick={() => setProjectsLayout('list')}
                className={`w-10 h-10 rounded-xl border transition-colors flex items-center justify-center ${
                  projectsLayout === 'list'
                    ? isDark
                      ? 'bg-emerald-600/20 border-emerald-500/30'
                      : 'bg-emerald-600/10 border-emerald-600/20'
                    : isDark
                      ? 'bg-white/0 border-white/10 hover:bg-white/5'
                      : 'bg-white border-black/10 hover:bg-slate-50'
                }`}
                aria-label="List view"
              >
                <svg className={`w-5 h-5 ${isDark ? 'text-white/80' : 'text-slate-700'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search + create (mobile) */}
        <div className="lg:hidden flex items-center gap-3 px-2">
          <div className={`flex items-center gap-2 px-3 h-11 rounded-xl border ${cardBorder} ${inputBg} flex-1`}>
            <svg className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
            </svg>
            <input
              value={projectsSearch}
              onChange={(e) => setProjectsSearch(e.target.value)}
              className={`w-full bg-transparent outline-none text-sm ${inputPh} ${inputBorder}`}
              placeholder="Search..."
            />
          </div>
          <button
            onClick={() => {
              resetCreateForm();
              setShowCreateModal(true);
            }}
            className="h-11 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold border border-emerald-400/20 text-white"
          >
            + New
          </button>
        </div>

        {tabbedProjects.length === 0 ? (
          <div className={`rounded-2xl ${surface} border ${surfaceBorder} p-10 text-center ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
            No projects found.
          </div>
        ) : projectsLayout === 'list' ? (
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-[#0E1712]' : 'border-black/10 bg-white'}`}>
            <table className="w-full text-sm">
              <thead className={isDark ? 'bg-white/0' : 'bg-slate-50'}>
                <tr className={isDark ? 'text-white/60' : 'text-slate-500'}>
                  <th className="text-left font-semibold px-6 py-4">Project</th>
                  <th className="text-left font-semibold px-2 py-4">Date</th>
                  <th className="text-left font-semibold px-2 py-4">Status</th>
                  <th className="text-left font-semibold px-2 py-4">Storage</th>
                  <th className="text-left font-semibold px-2 py-4">Uploads</th>
                  <th className="text-left font-semibold px-2 py-4">Team</th>
                  <th className="text-right font-semibold px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tabbedProjects.map((p) => {
                  const pct = getProgressPct(p);
                  const used = formatGB(p.storage.usedGB);
                  const limit = formatGB(p.storage.limitGB);
                  return (
                    <tr key={p.id} className={`border-t ${isDark ? 'border-white/5' : 'border-slate-200'} hover:bg-white/5 transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl overflow-hidden border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-slate-50'}`}>
                            {p.thumbnail ? (
                              <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/40">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate max-w-[220px]">{p.name}</div>
                            <div className={`text-xs ${isDark ? 'text-white/45' : 'text-slate-500'}`}>{p.id ?? ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">{p.dateLabel || '-'}</td>
                      <td className="px-2 py-4 whitespace-nowrap">
                        <span className={statusPill(p.status)}>{p.status}</span>
                      </td>
                      <td className="px-2 py-4" style={{ minWidth: 180 }}>
                        <div className={`text-xs font-semibold ${isDark ? 'text-white/85' : 'text-slate-800'}`}>
                          {used}GB / {limit}GB
                        </div>
                        <div className={`mt-2 h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'} overflow-hidden`}>
                          <div className={`h-full rounded-full ${isDark ? 'bg-emerald-500' : 'bg-emerald-600'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">{p.uploads}</td>
                      <td className="px-2 py-4 whitespace-nowrap">{p.team}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEventClick(p.id)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                          aria-label="Project actions"
                          title="Open project"
                        >
                          <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5h.01M12 12h.01M12 19h.01" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tabbedProjects.map((p) => {
              const pct = getProgressPct(p);
              const used = formatGB(p.storage.usedGB);
              const limit = formatGB(p.storage.limitGB);
              return (
                <button
                  key={p.id}
                  onClick={() => handleEventClick(p.id)}
                  className={`group text-left rounded-2xl border overflow-hidden hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/20 transition-all duration-300 ${isDark ? 'border-white/10 bg-[#0E1712]' : 'border-black/10 bg-white'}`}
                >
                  <div className="aspect-square bg-black/20 overflow-hidden">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{p.name}</div>
                        <div className={`text-xs ${isDark ? 'text-white/45' : 'text-slate-500'} mt-1`}>
                          {p.dateLabel || '-'}
                        </div>
                      </div>
                      <span className={statusPill(p.status)}>{p.status}</span>
                    </div>

                    <div className="mt-3">
                      <div className={`text-xs font-semibold ${isDark ? 'text-white/70' : 'text-slate-700'}`}>Storage Used</div>
                      <div className={`text-xs ${isDark ? 'text-white/45' : 'text-slate-500'} mt-1`}>
                        {used}GB / {limit}GB
                      </div>
                      <div className={`mt-2 h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'} overflow-hidden`}>
                        <div className={`h-full rounded-full ${isDark ? 'bg-emerald-500' : 'bg-emerald-600'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="inline-flex items-center gap-1">
                        <svg className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                        </svg>
                        <span>{p.uploads}</span>
                      </div>
                      <div className="inline-flex items-center gap-1">
                        <svg className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{p.team}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const appBg = isDark ? 'bg-[#0E1712]' : 'bg-[#FDFCFA]';
  const appText = isDark ? 'text-white' : 'text-slate-900';
  const dividerBorder = isDark ? 'border-white/10' : 'border-black/10';

  const surface = isDark ? 'bg-white/5' : 'bg-white';
  const surfaceBorder = isDark ? 'border-white/10' : 'border-black/10';
  const surfaceSubtle = isDark ? 'text-white/55' : 'text-slate-500';
  const surfaceMuted = isDark ? 'text-white/60' : 'text-slate-600';
  const dashboardPanel = isDark ? `${surface} ${surfaceBorder}` : 'bg-white border-black/10';

  return (
    <div className={`min-h-screen ${appBg} ${appText} font-sans`}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <AdminSidebar
          isDark={isDark}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLogout={handleLogout}
          activeKey={activeSection === 'dashboard' ? 'home' : 'projects'}
          onNavigate={(key) => {
            if (key === 'home') {
              setActiveSection('dashboard');
              navigate('/admin/events');
            } else if (key === 'projects') {
              setActiveSection('projects');
              setProjectsTab('All');
              setProjectsLayout('grid');
              setProjectsSearch('');
              navigate('/admin/events');
            }
            else if (key === 'uploads') navigate('/admin/uploads');
            else if (key === 'storage') navigate('/admin/storage');
            else if (key === 'notifications') navigate('/admin/notifications');
            else if (key === 'team') navigate('/admin/team');
            else if (key === 'settings') navigate('/admin/settings');
          }}
        />

        {/* Main */}
        <main className="flex-1">
          {/* Top bar */}
          {activeSection !== 'projects' && (
            <div
              className={`sticky top-0 z-40 backdrop-blur border-b ${dividerBorder} ${isDark ? 'bg-[#0E1712]/80' : 'bg-white/80'}`}
            >
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
                    resetCreateForm();
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
          )}

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
            ) : activeSection === 'projects' ? (
              renderProjectsView()
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
                              setActiveSection('projects');
                              setProjectsTab('All');
                                setProjectsLayout('grid');
                              setProjectsSearch('');
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
                  <div id="projects-section" className={`rounded-2xl border p-5 shadow-sm ${dashboardPanel}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-semibold">Active Projects</div>
                      <button
                        className={`text-sm inline-flex items-center gap-1 ${isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                          onClick={() => {
                            setActiveSection('projects');
                            setProjectsTab('All');
                            setProjectsLayout('grid');
                            setProjectsSearch('');
                          }}
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
                            className={`group text-left rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/20 ${
                              isDark
                                ? 'bg-[#0E1712] border-white/10 hover:border-emerald-500/40'
                                : 'bg-white border-black/10 hover:border-emerald-600/40'
                            }`}
                          >
                            <div className="p-4">
                              <div className="mb-4">
                                <div className={`w-full aspect-square rounded-2xl overflow-hidden border ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-100 border-[#d4d4d8]'}`}>
                                  {event.eventThumbnail ? (
                                    <img
                                      src={event.eventThumbnail}
                                      alt={event.eventName || 'Project'}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
                              </div>
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
                  <div className={`rounded-2xl border p-5 shadow-sm ${dashboardPanel}`}>
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
                  <div className={`rounded-2xl border p-5 shadow-sm ${dashboardPanel}`}>
                    <div className="text-lg font-semibold">Upcoming Projects</div>
                    <div className="mt-4 space-y-3">
                      {events.slice(0, 3).map((ev) => (
                        <button
                          key={`upcoming-${ev.eventId}`}
                          onClick={() => handleEventClick(ev.eventId)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                            isDark
                              ? 'border-white/10 hover:border-emerald-500/30 bg-[#0E1712]'
                              : 'border-black/10 hover:border-emerald-600/30 bg-white'
                          }`}
                        >
                          {(() => {
                            const days = getDaysUntilProject(ev);
                            const dayLabel = days === null ? '--' : Math.abs(days);
                            const dayState = days === null ? '' : days < 0 ? 'ago' : days === 0 ? 'today' : 'days';
                            return (
                              <>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold truncate">{ev.eventName || 'Untitled project'}</div>
                            <div className={`text-xs ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
                              {dayLabel} {dayState}
                            </div>
                          </div>
                          <div className={`mt-1 text-xs ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
                            {getProjectDate(ev) || 'Date unavailable'}
                          </div>
                              </>
                            );
                          })()}
                        </button>
                      ))}
                      {events.length === 0 && <div className="text-white/50">No projects found.</div>}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className={`rounded-2xl border p-5 shadow-sm ${dashboardPanel}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">Notifications</div>
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white font-semibold">2</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className={`rounded-xl border px-4 py-3 ${isDark ? 'bg-[#0E1712] border-white/10' : 'bg-white border-black/10'}`}>
                        <div className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-800'}`}>45 new photos uploaded by guests</div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>5 min ago</div>
                      </div>
                      <div className={`rounded-xl border px-4 py-3 ${isDark ? 'bg-[#0E1712] border-white/10' : 'bg-white border-black/10'}`}>
                        <div className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-800'}`}>Storage usage at 78%</div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>1 hour ago</div>
                      </div>
                      <div className={`rounded-xl border px-4 py-3 ${isDark ? 'bg-[#0E1712] border-white/10' : 'bg-white border-black/10'}`}>
                        <div className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-800'}`}>Team member added to a project</div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>2 hours ago</div>
                      </div>
                      <div className={`text-xs pt-1 ${isDark ? 'text-white/35' : 'text-slate-500'}`}>
                        Next billing on {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Storage */}
                  <div className={`rounded-2xl border p-5 shadow-sm ${dashboardPanel}`}>
                    <div className="text-lg font-semibold">Storage Usage</div>
                    <div className={`mt-4 rounded-xl border px-4 py-4 ${isDark ? 'bg-[#0E1712] border-white/10' : 'bg-white border-black/10'}`}>
                      {(() => {
                        const o = dashStorageOverview;
                        const totalBytes =
                          o != null
                            ? (Number(o.totalOriginalSizeBytes) || 0) +
                              (Number(o.totalOptimisedSizeBytes) || 0) +
                              (Number(o.totalThumbnailSizeBytes) || 0)
                            : 0;
                        const usedGb = storageBytesToGb(totalBytes);
                        const limitGb = 50;
                        const pct =
                          totalBytes > 0 ? Math.min(100, Math.round((usedGb / limitGb) * 100)) : 0;
                        const usedLabel = `${formatStorageGb(usedGb)}GB / ${limitGb}GB`;
                        return (
                          <>
                            <div className={`flex items-center justify-between text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                              <div>Used</div>
                              <div className={`${isDark ? 'text-white/80' : 'text-slate-900'} font-semibold`}>
                                {o ? usedLabel : '—'}
                              </div>
                            </div>
                            <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${o ? pct : 0}%` }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate('/admin/storage')}
                              className="mt-4 w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold border border-emerald-400/20"
                            >
                              Manage Storage
                            </button>
                          </>
                        );
                      })()}
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