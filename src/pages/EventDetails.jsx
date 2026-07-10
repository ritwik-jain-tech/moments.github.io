import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { useMetaTags } from '../hooks/useMetaTags';
import AdminSidebar from '../components/AdminSidebar';
import { API_BASE_URL, FACE_TAGGING_BASE_URL } from '../config/api';
import heic2any from 'heic2any';

// Component to handle HEIC image conversion
const HeicImage = ({ src, alt, className, style, onError, aspectRatio }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!src) return;

      // Check if URL is HEIC format
      const isHeic = src.toLowerCase().endsWith('.heic') || 
                     src.toLowerCase().endsWith('.heif') || 
                     src.toLowerCase().includes('image/heic');

      if (isHeic) {
        setIsLoading(true);
        try {
          // Fetch the HEIC file as a blob
          const response = await fetch(src);
          if (!response.ok) {
            throw new Error('Failed to fetch HEIC image');
          }
          
          const blob = await response.blob();
          
          // Convert HEIC to JPEG using heic2any
          const convertedBlob = await heic2any({
            blob: blob,
            toType: 'image/jpeg',
            quality: 0.92
          });
          
          // heic2any returns an array, get the first item
          const jpegBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          
          // Create object URL from converted blob
          const objectUrl = URL.createObjectURL(jpegBlob);
          setImageSrc(objectUrl);
        } catch (error) {
          console.error('Error converting HEIC image:', error);
          // Fallback to original URL if conversion fails
          setImageSrc(src);
        } finally {
          setIsLoading(false);
        }
      } else {
        setImageSrc(src);
      }
    };

    loadImage();

    // Cleanup object URL on unmount
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  return (
    <div className="relative w-full" style={aspectRatio ? { aspectRatio } : undefined}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2a4d32]"></div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={aspectRatio ? 'absolute inset-0 w-full h-full object-cover' : className}
        style={style}
        onError={onError}
      />
    </div>
  );
};

// Project delivery journey. Defaults to "select".
const JOURNEY_STAGES = [
  { key: 'collect', label: 'Collect', desc: 'Gathering photos' },
  { key: 'select', label: 'Select', desc: 'Culling & choosing' },
  { key: 'deliver', label: 'Deliver', desc: 'Delivering to client' },
];

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeView, setActiveView] = useState('media'); // 'media', 'delivery', 'guestApp'
  const [journeyStage, setJourneyStage] = useState('select'); // 'collect' | 'select' | 'deliver'
  const [guests, setGuests] = useState([]);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showQRModal, setShowQRModal] = useState(false);
  const [copiedMomentId, setCopiedMomentId] = useState(null);
  const [rotatingMomentId, setRotatingMomentId] = useState(null);

  // Delivery & Gallery (UI states only; backend integration can be wired later)
  const [galleryEnabled, setGalleryEnabled] = useState(false);
  const [galleryTheme, setGalleryTheme] = useState('light'); // 'light' | 'dark' | 'system'
  const [galleryLayout, setGalleryLayout] = useState('grid'); // 'grid' | 'masonry' | 'slideshow'
  const [downloadsEnabled, setDownloadsEnabled] = useState(false);
  const [downloadsQuality, setDownloadsQuality] = useState('hires'); // 'hires' | 'original'

  // Guest App configuration (UI states only)
  const [guestAppEnabled, setGuestAppEnabled] = useState(true);
  const [eventSettingsLoading, setEventSettingsLoading] = useState(false);
  const [eventSettingsMessage, setEventSettingsMessage] = useState('');
  const [eventCode, setEventCode] = useState('ABC123');
  const [accessStart, setAccessStart] = useState('');
  const [accessEnd, setAccessEnd] = useState('');
  const [configMessage, setConfigMessage] = useState('');

  // Delivery/Gallery additional UI states (for screenshot-matching)
  const [expiryDate, setExpiryDate] = useState('');
  const [autoArchiveOnExpiry, setAutoArchiveOnExpiry] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [faceRecognitionEnabled, setFaceRecognitionEnabled] = useState(false);
  const [faceRetention, setFaceRetention] = useState('During event only');
  const [matchConfidence, setMatchConfidence] = useState(0.6); // 0..1
  const [moderationEnabled, setModerationEnabled] = useState(false);
  const [approvalMethod, setApprovalMethod] = useState('Manual Review'); // Manual Review | Auto-approve

  // Media toolbar UI states
  const [mediaSearch, setMediaSearch] = useState('');
  const [activeTag, setActiveTag] = useState('Details');
  const [mediaView, setMediaView] = useState('grid'); // grid | list (UI only)
  const [selectedFolder, setSelectedFolder] = useState('all-images');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved === '1' ? false : true;
  });
  const [isFoldersMinimized, setIsFoldersMinimized] = useState(() => localStorage.getItem('eventFoldersMinimized') === '1');
  const [sortBy, setSortBy] = useState('capture-time');
  const [orientationFilter, setOrientationFilter] = useState('all'); // all | portrait | landscape
  const [creatorRoleFilter, setCreatorRoleFilter] = useState('all'); // all | guest | photographer | groom | bride
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewScale, setPreviewScale] = useState(1);
  const [favoriteMomentIds, setFavoriteMomentIds] = useState(() => new Set());
  const pinchDistanceRef = useRef(0);

  // Feed pagination: load one keyset page at a time and append on scroll instead of
  // blocking on the entire event. Prevents the "everything loads from the top" glitch.
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMoments, setHasMoreMoments] = useState(true);
  const momentsAnchorRef = useRef(null);
  const momentsFetchingRef = useRef(false);
  const loadMoreSentinelRef = useRef(null);

  // Shared admin theme across pages
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light'); // dark | light
  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isSidebarExpanded ? '0' : '1');
  }, [isSidebarExpanded]);

  useEffect(() => {
    localStorage.setItem('eventFoldersMinimized', isFoldersMinimized ? '1' : '0');
  }, [isFoldersMinimized]);

  // Bulk upload states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Add guest states
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [addGuestMode, setAddGuestMode] = useState('manual'); // 'manual', 'csv', or 'contacts'
  const [csvFile, setCsvFile] = useState(null);
  const [manualGuests, setManualGuests] = useState([{ name: '', phoneNumber: '' }]);
  const [isAddingGuests, setIsAddingGuests] = useState(false);
  const [addGuestMessage, setAddGuestMessage] = useState('');
  const [isContactPickerAvailable, setIsContactPickerAvailable] = useState(false);

  // Get event data from navigation state or fetch it
  const [eventData, setEventData] = useState(location.state?.eventData);

  // Resolve the project's journey stage: saved choice (per event) → event field → default "select".
  useEffect(() => {
    if (!eventId) return;
    const saved = localStorage.getItem(`eventJourney:${eventId}`);
    const fromEvent = eventData?.stage || eventData?.journeyStage;
    const next = (saved || fromEvent || 'select').toLowerCase();
    setJourneyStage(JOURNEY_STAGES.some((s) => s.key === next) ? next : 'select');
  }, [eventId, eventData]);

  const changeJourneyStage = (key) => {
    setJourneyStage(key);
    if (eventId) localStorage.setItem(`eventJourney:${eventId}`, key);
  };

  useEffect(() => {
    if (!eventData) return;

    const getBool = (v) => {
      if (v === true || v === 1) return true;
      if (v === false || v === 0 || v === null || v === undefined) return false;
      const s = String(v).toLowerCase();
      return s === 'true' || s === 'enabled' || s === 'active' || s === 'yes' || s === 'on';
    };

    setGalleryEnabled(
      getBool(eventData?.galleryEnabled ?? eventData?.galleryStatus ?? eventData?.gallery_enabled)
    );
    setGuestAppEnabled(
      getBool(eventData?.guestAppEnabled ?? eventData?.guestAppStatus ?? eventData?.guest_app_enabled)
    );
    setEventCode(
      eventData?.eventCode ?? eventData?.code ?? eventData?.inviteCode ?? eventData?.accessCode ?? 'ABC123'
    );

    const start =
      eventData?.accessStartDate ??
      eventData?.accessFrom ??
      eventData?.startDate ??
      eventData?.access_start_date;
    const end =
      eventData?.accessEndDate ??
      eventData?.accessTo ??
      eventData?.endDate ??
      eventData?.access_end_date;

    if (start) setAccessStart(new Date(start).toISOString().slice(0, 10));
    if (end) setAccessEnd(new Date(end).toISOString().slice(0, 10));
  }, [eventData]);

  // Close the moment preview when the browser / hardware Back button fires (the history entry
  // pushed on open is consumed here), so Back returns to the grid instead of leaving the screen.
  useEffect(() => {
    if (!previewOpen) return undefined;
    const onPop = () => { setPreviewOpen(false); setPreviewScale(1); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [previewOpen]);

  // Fetch event details for meta tags
  useEffect(() => {
    const fetchEventDetails = async () => {
      // If we already have eventData from navigation state, use it
      if (location.state?.eventData) {
        setEventData(location.state.eventData);
        return;
      }

      try {
        const token = localStorage.getItem('adminToken');
        // Try to fetch event details - adjust endpoint as needed
        const response = await axios.get(
          `${API_BASE_URL}/api/event/${eventId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const fetchedEventData = response.data?.data || response.data;
        if (fetchedEventData) {
          setEventData(fetchedEventData);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        // If API call fails, try to get from userProfile events
        try {
          const profile = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile');
          if (profile) {
            const parsedProfile = JSON.parse(profile);
            const events = parsedProfile?.eventDetails || [];
            const foundEvent = events.find(e => e.eventId === eventId);
            if (foundEvent) {
              setEventData(foundEvent);
            }
          }
        } catch (parseErr) {
          console.error('Error parsing user profile:', parseErr);
        }
      }
    };

    fetchEventDetails();
  }, [eventId, location.state]);

  useEffect(() => {
    fetchGuests();
    fetchMoments();
  }, [eventId]);


  // Check if Contact Picker API is available
  useEffect(() => {
    const checkContactPicker = () => {
      // Check for Contact Picker API support
      // The API is available in Chrome/Edge on Android and some Chromium-based browsers
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const hasContactsAPI = 'contacts' in navigator && 'ContactsManager' in window;
      
      if (hasContactsAPI && isMobile) {
        setIsContactPickerAvailable(true);
      } else if (hasContactsAPI) {
        // API exists but might not work on desktop
        setIsContactPickerAvailable(false);
      } else if (isMobile) {
        // Mobile device but API not detected - still show option, will fail gracefully
        setIsContactPickerAvailable(true);
      } else {
        setIsContactPickerAvailable(false);
      }
    };

    checkContactPicker();
  }, []);

  // Format event title for meta tags (e.g., "Ritwik & Shivani — Wedding | Dec 6, 2025")
  const formatEventTitle = () => {
    if (!eventData?.eventName) return 'Moments';
    
    const eventName = eventData.eventName;
    let formattedTitle = eventName;
    
    let dateForTitle = null;
    if (eventData.eventDate) {
      dateForTitle = new Date(`${eventData.eventDate}T12:00:00`);
    } else if (eventData.date) {
      dateForTitle = new Date(eventData.date);
    } else if (eventData.startTime != null) {
      const ms = Number(eventData.startTime);
      if (!Number.isNaN(ms)) dateForTitle = new Date(ms);
    }
    if (dateForTitle && !Number.isNaN(dateForTitle.getTime())) {
      const formattedDate = dateForTitle.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      formattedTitle = `${eventName} | ${formattedDate}`;
    }
    
    return formattedTitle;
  };

  // Get event URL - format: https://admin.moments.live/event/123456
  const getEventUrl = () => {
    // Use admin.moments.live domain for the event URL
    return `https://admin.moments.live/event/${eventId}`;
  };

  // Use meta tags hook
  useMetaTags({
    title: eventData ? formatEventTitle() : 'Moments',
    description: eventData 
      ? `Join the ${eventData.eventName || 'event'} photo stream — upload and view real-time photos from our guests.`
      : 'Capture moments through the eyes of your loved ones.',
    url: getEventUrl(),
    image: eventData?.eventThumbnail || eventData?.coverImage || `${window.location.origin}/default-event.jpg`,
    imageWidth: '1200',
    imageHeight: '630'
  });

  const fetchGuests = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const userId = localStorage.getItem('userId');
      
      // Build URL with userId as query parameter
      let url = `${API_BASE_URL}/api/event/users/${eventId}`;
      if (userId) {
        url += `?userId=${userId}`;
      }
      
      const response = await axios.get(
        url,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Detailed debug logs
      console.log('Raw API Response:', response);
      console.log('Response Data Type:', typeof response.data);
      console.log('Response Data:', response.data);
      
      // Check if response.data is an object with a data property
      const guestsData = response.data?.data || response.data;
      console.log('Extracted Guests Data:', guestsData);
      
      // Ensure we're setting an array
      const finalGuestsData = Array.isArray(guestsData) ? guestsData : [];
      console.log('Final Guests Data to be set:', finalGuestsData);
      
      setGuests(finalGuestsData);
    } catch (err) {
      console.error('Error fetching guests:', err);
      setGuests([]);
    }
  };

  const MOMENTS_PAGE_SIZE = 30;

  // Load a single keyset page. `reset` starts over (first load, refresh after upload/status
  // change); otherwise the next page is appended for infinite scroll. A ref guard keeps the
  // scroll sentinel from firing overlapping requests.
  const loadMomentsPage = async ({ reset = false } = {}) => {
    if (momentsFetchingRef.current) return;
    momentsFetchingRef.current = true;
    try {
      if (reset) {
        setLoading(true);
        momentsAnchorRef.current = null;
        setHasMoreMoments(true);
      } else {
        setLoadingMore(true);
      }

      const token = localStorage.getItem('adminToken');
      const anchorMomentId = reset ? null : momentsAnchorRef.current;
      const response = await axios.post(
        `${API_BASE_URL}/api/moments/feed`,
        {
          eventId,
          cursor: { limit: MOMENTS_PAGE_SIZE, anchorMomentId },
          filter: { source: 'web' },
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data?.data || {};
      const pageMoments = Array.isArray(data.moments) ? data.moments : [];
      const cursor = data.cursor || {};
      const prevAnchor = anchorMomentId;
      const nextAnchor = cursor.anchorMomentId || null;
      momentsAnchorRef.current = nextAnchor;

      const noMore =
        cursor.lastPage ||
        pageMoments.length < MOMENTS_PAGE_SIZE ||
        !nextAnchor ||
        nextAnchor === prevAnchor;
      setHasMoreMoments(!noMore);

      setMoments((prev) => {
        if (reset) return pageMoments;
        const seen = new Set(prev.map((m) => String(m.id || m.momentId)));
        const fresh = pageMoments.filter((m) => !seen.has(String(m.id || m.momentId)));
        return [...prev, ...fresh];
      });
    } catch (err) {
      setError('Failed to fetch moments');
      console.error('Error fetching moments:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      momentsFetchingRef.current = false;
    }
  };

  // Full refresh (used on mount and after mutations) — resets to the first page.
  const fetchMoments = () => loadMomentsPage({ reset: true });

  // Infinite scroll: load the next page as the sentinel nears the viewport. Re-observes when
  // the list grows or when there are more pages to fetch.
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMoreMoments) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMomentsPage();
      },
      { rootMargin: '600px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMoreMoments, moments.length]);

  const handleStatusChange = async (moment, newStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // Debug log to check the moment object
      console.log('Updating status for moment:', moment);
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/moments/status`,
        {
          momentId: moment.momentId, // Use the correct momentId from the moment object
          status: newStatus
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Status update response:', response.data);

      if (response.data) {
        // Refresh the moments list
        await fetchMoments();
      }
    } catch (err) {
      console.error('Error updating status:', err.response || err);
      setError('Failed to update moment status');
    } finally {
      setLoading(false);
    }
  };

  const filteredMoments = moments.filter(moment => {
    if (activeTab === 'all') return true;
    // Convert status to uppercase for comparison
    return moment.status?.toUpperCase() === activeTab.toUpperCase();
  });

  const isVideoMoment = (moment) => {
    const type = String(moment?.media?.type || '').toUpperCase();
    const url = (moment?.media?.feedUrl || moment?.media?.url || moment?.feedUrl || moment?.url || '').toLowerCase();
    return type.includes('VIDEO') || /\.(mp4|mov|webm|mkv)$/.test(url);
  };

  const isPhotographerMoment = (moment) => {
    const creatorName = String(moment?.creatorDetails?.userName || '').toLowerCase();
    const creatorId = String(moment?.creatorDetails?.userId || moment?.creatorId || '');
    const adminId = String(localStorage.getItem('userId') || '');

    // Heuristic: uploaded from admin panel (same logged-in user) OR explicitly marked photographer.
    return creatorName.includes('photographer') || (!!adminId && creatorId && creatorId === adminId);
  };

  const isCandidMoment = (moment) => {
    const url = (moment?.media?.feedUrl || moment?.media?.url || moment?.feedUrl || moment?.url || '').toLowerCase();
    const creatorName = String(moment?.creatorDetails?.userName || '').toLowerCase();
    return creatorName.includes('candid') || url.includes('candid');
  };

  const getTabCount = (status) => {
    if (status === 'all') return moments.filter((m) => !isVideoMoment(m)).length;
    // Convert status to uppercase for comparison
    return moments.filter((m) => !isVideoMoment(m) && m.status?.toUpperCase() === status.toUpperCase()).length;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleLogout = () => {
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
    navigate('/admin/login');
  };

  // Helper function to get tagged user names from taggedUserIds
  const getTaggedUserNames = (moment) => {
    const taggedUserIds = moment.taggedUserIds || [];
    if (taggedUserIds.length === 0) return [];
    
    return taggedUserIds.map(userId => {
      const guest = guests.find(g => g.userId === userId || String(g.userId) === String(userId));
      return guest?.name || `User ${userId}`;
    });
  };

  const getCreatorRole = (moment) => {
    const directRole = String(moment?.creatorDetails?.role || moment?.creatorRole || '').toLowerCase();
    if (directRole) {
      if (directRole.includes('photographer')) return 'photographer';
      if (directRole.includes('groom')) return 'groom';
      if (directRole.includes('bride')) return 'bride';
      if (directRole.includes('guest')) return 'guest';
    }
    const creatorId = String(moment?.creatorDetails?.userId || moment?.creatorId || '');
    const guest = guests.find((g) => String(g?.userId) === creatorId);
    const guestRole = String(guest?.roleName || guest?.role || '').toLowerCase();
    if (guestRole.includes('photographer')) return 'photographer';
    if (guestRole.includes('groom')) return 'groom';
    if (guestRole.includes('bride')) return 'bride';
    if (guestRole.includes('guest')) return 'guest';
    return isPhotographerMoment(moment) ? 'photographer' : 'guest';
  };

  const formatPlainTime = (raw) => {
    if (raw === undefined || raw === null || raw === '') return 'N/A';
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      const ms = n < 1e12 ? n * 1000 : n;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    }
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    return String(raw);
  };

  const roleIcon = (role, className = 'w-4 h-4') => {
    if (role === 'bride') {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3l2 3 3 .5-2.2 2.1.5 3.1L12 10l-3.3 1.7.5-3.1L7 6.5l3-.5L12 3zM7 21h10M9 21v-4a3 3 0 116 0v4" />
        </svg>
      );
    }
    if (role === 'groom') {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 4h8l-1 4H9L8 4zM9 10h6v11H9V10zM5 21h14" />
        </svg>
      );
    }
    if (role === 'photographer') {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 7h4l2-2h4l2 2h4v11H4V7z" />
          <circle cx="12" cy="13" r="3.5" strokeWidth="2" />
        </svg>
      );
    }
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
      </svg>
    );
  };


  // Copy moment ID to clipboard
  const copyMomentId = async (momentId) => {
    if (!momentId) return;
    
    try {
      await navigator.clipboard.writeText(momentId);
      setCopiedMomentId(momentId);
      // Reset after 2 seconds
      setTimeout(() => setCopiedMomentId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = momentId;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedMomentId(momentId);
        setTimeout(() => setCopiedMomentId(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Rotate moment image
  const rotateMoment = async (moment) => {
    const momentId = moment.id || moment.momentId;
    if (!momentId) {
      console.error('No moment ID found');
      return;
    }

    setRotatingMomentId(momentId);
    
    try {
      const response = await axios.post(
        `${FACE_TAGGING_BASE_URL}/api/v1/face-embeddings/moment/${momentId}/rotate`,
        {},
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Rotate response:', response.data);
      
      // Refresh moments to show updated image
      await fetchMoments();
      
      // Show success message (optional)
      setError('');
    } catch (err) {
      console.error('Error rotating moment:', err);
      setError(`Failed to rotate image: ${err.response?.data?.message || err.message}`);
    } finally {
      setRotatingMomentId(null);
    }
  };

  const renderEventDetailsHeader = () => (
    <div className="bg-white bg-opacity-90 rounded-xl shadow-2xl overflow-hidden border border-[#d4d4d8] mb-8">
      {/* Event Image */}
      <div className="relative h-48 md:h-64">
        <img
          src={eventData?.eventThumbnail || '/default-event.jpg'}
          alt={eventData?.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-event.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{eventData?.name || eventData?.eventName}</h2>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-white/90 text-sm md:text-base">
            <div className="flex items-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatEventDisplayDate()}</span>
            </div>
            {eventData?.location && (
              <div className="flex items-center">
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{eventData.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-[#2a4d32] mb-3 md:mb-4">Event Information</h3>
            <div className="space-y-3 md:space-y-4">
              {eventData?.projectType && (
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Project type</p>
                  <p className="text-[#2a4d32] mt-1 text-sm md:text-base">{eventData.projectType}</p>
                </div>
              )}
              {eventData?.expectedGuests != null && eventData.expectedGuests !== '' && (
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Expected guests</p>
                  <p className="text-[#2a4d32] mt-1 text-sm md:text-base">{eventData.expectedGuests}</p>
                </div>
              )}
              {eventData?.description && (
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Description</p>
                  <p className="text-[#2a4d32] mt-1 text-sm md:text-base">{eventData.description}</p>
                </div>
              )}
              {eventData?.organizer && (
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Organizer</p>
                  <p className="text-[#2a4d32] mt-1 text-sm md:text-base">{eventData.organizer}</p>
                </div>
              )}
              {eventData?.status && (
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Status</p>
                  <p className="text-[#2a4d32] mt-1 text-sm md:text-base">{eventData.status}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-[#2a4d32] mb-3 md:mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                  <p className="text-gray-400 text-xs md:text-sm">Total Guests</p>
                  <p className="text-xl md:text-2xl font-bold text-[#2a4d32] mt-1">{guests.length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                  <p className="text-gray-400 text-xs md:text-sm">Total Moments</p>
                  <p className="text-xl md:text-2xl font-bold text-[#2a4d32] mt-1">{moments.length}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowQRModal(true)}
              className="mt-4 md:mt-6 w-full md:w-auto flex items-center justify-center space-x-2 bg-brand hover:bg-brand-2 text-on-brand px-4 py-2 md:py-3 rounded-lg transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-4m6 6v4m-6-4h6m-6 4h6m-6-4h6M4 8h6M4 12h6m-6 4h6" />
              </svg>
              <span>Generate QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper function to generate color tints for different groups
  const getGroupColor = (index) => {
    const colorSchemes = [
      { bg: 'bg-blue-50', border: 'border-blue-200', headerBorder: 'border-blue-300' },
      { bg: 'bg-purple-50', border: 'border-purple-200', headerBorder: 'border-purple-300' },
      { bg: 'bg-pink-50', border: 'border-pink-200', headerBorder: 'border-pink-300' },
      { bg: 'bg-green-50', border: 'border-green-200', headerBorder: 'border-green-300' },
      { bg: 'bg-yellow-50', border: 'border-yellow-200', headerBorder: 'border-yellow-300' },
      { bg: 'bg-indigo-50', border: 'border-indigo-200', headerBorder: 'border-indigo-300' },
      { bg: 'bg-orange-50', border: 'border-orange-200', headerBorder: 'border-orange-300' },
      { bg: 'bg-cyan-50', border: 'border-cyan-200', headerBorder: 'border-cyan-300' },
    ];
    return colorSchemes[index % colorSchemes.length];
  };

  // Helper function to format phone number with country code
  const formatPhoneNumber = (guest) => {
    if (!guest) return 'N/A';
    
    // If country code is separate, combine it with phone number
    if (guest.countryCode && guest.phoneNumber) {
      // Remove leading + if present in countryCode
      const countryCode = guest.countryCode.replace(/^\+/, '');
      return `+${countryCode} ${guest.phoneNumber}`;
    }
    
    // If phone number already includes country code, return as is
    if (guest.phoneNumber) {
      return guest.phoneNumber;
    }
    
    return 'N/A';
  };

  // Group guests by eventRoleNames
  const groupGuestsByRole = () => {
    if (!guests || guests.length === 0) return {};

    const grouped = {};
    guests.forEach((guest) => {
      // Handle both array and string eventRoleNames
      const roles = Array.isArray(guest.eventRoleNames) 
        ? guest.eventRoleNames 
        : (guest.eventRoleNames ? [guest.eventRoleNames] : ['Ungrouped']);
      
      roles.forEach((role) => {
        const roleKey = role || 'Ungrouped';
        if (!grouped[roleKey]) {
          grouped[roleKey] = [];
        }
        grouped[roleKey].push(guest);
      });
    });

    return grouped;
  };

  // Parse CSV file - simple CSV parser that handles quoted values
  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          
          // Simple CSV parser that handles quoted fields
          const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              const nextChar = line[i + 1];
              
              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  current += '"';
                  i++; // Skip next quote
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          };

          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          if (lines.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          // Parse header (first line)
          const header = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''));
          const nameIndex = header.findIndex(h => h === 'name');
          const phoneIndex = header.findIndex(h => h === 'phonenumber' || h === 'phone' || h === 'phone number');

          if (nameIndex === -1 || phoneIndex === -1) {
            reject(new Error('CSV must contain "name" and "phoneNumber" (or "phone") columns'));
            return;
          }

          // Parse data rows
          const guests = [];
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
            const name = values[nameIndex];
            const phoneNumber = values[phoneIndex];

            if (name && phoneNumber) {
              // Extract last 10 digits from phone number
              const last10Digits = phoneNumber.replace(/\D/g, '').slice(-10);
              if (last10Digits.length === 10) {
                guests.push({ name, phoneNumber: last10Digits });
              }
            }
          }

          if (guests.length === 0) {
            reject(new Error('No valid guest entries found in CSV. Ensure phone numbers have at least 10 digits.'));
            return;
          }

          resolve(guests);
        } catch (error) {
          reject(new Error(`Error parsing CSV: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Error reading CSV file'));
      reader.readAsText(file);
    });
  };


  // Create event roles in bulk
  const createEventRoles = async (eventRolesData) => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/event/roles/bulk`,
        {
          eventRoles: eventRolesData
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating event roles:', error);
      throw error;
    }
  };

  // Handle CSV file selection
  const handleCSVFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setAddGuestMessage('Please select a CSV file');
      return;
    }

    setCsvFile(file);
    try {
      const parsedGuests = await parseCSV(file);
      setManualGuests(parsedGuests);
      setAddGuestMessage(`Parsed ${parsedGuests.length} guests from CSV`);
    } catch (error) {
      setAddGuestMessage(`Error: ${error.message}`);
      setCsvFile(null);
    }
  };

  // Handle contact selection using Contact Picker API
  const handleSelectContacts = async () => {
    if (!isContactPickerAvailable) {
      setAddGuestMessage('Contact Picker API is not available on this device. Please use manual entry or CSV upload.');
      return;
    }

    try {
      setAddGuestMessage('Opening contact picker...');
      
      // Check if Contact Picker API is supported
      if (!('contacts' in navigator && 'ContactsManager' in window)) {
        throw new Error('Contact Picker API is not supported');
      }

      // Request contacts with name and tel properties
      const contacts = await navigator.contacts.select(
        ['name', 'tel'],
        { multiple: true }
      );

      if (!contacts || contacts.length === 0) {
        setAddGuestMessage('No contacts selected');
        return;
      }

      // Parse contacts and extract name and phone number
      const parsedGuests = [];
      for (const contact of contacts) {
        // Handle name - can be array or string
        let name = null;
        if (contact.name) {
          if (Array.isArray(contact.name) && contact.name.length > 0) {
            name = contact.name[0];
          } else if (typeof contact.name === 'string') {
            name = contact.name;
          } else if (contact.name.length && typeof contact.name[0] === 'string') {
            name = contact.name[0];
          }
        }
        
        // Handle phone number - can be array or string
        let phoneNumber = null;
        if (contact.tel) {
          let tel = null;
          if (Array.isArray(contact.tel) && contact.tel.length > 0) {
            tel = contact.tel[0];
          } else if (typeof contact.tel === 'string') {
            tel = contact.tel;
          }
          
          if (tel) {
            // Extract last 10 digits from phone number
            phoneNumber = tel.replace(/\D/g, '').slice(-10);
          }
        }

        // Only add if we have both name and valid phone number (10 digits)
        if (name && phoneNumber && phoneNumber.length === 10) {
          parsedGuests.push({
            name: String(name).trim(),
            phoneNumber: phoneNumber
          });
        }
      }

      if (parsedGuests.length === 0) {
        setAddGuestMessage('No valid contacts found. Please ensure contacts have phone numbers with at least 10 digits.');
        return;
      }

      // Append to existing guests if in contacts mode, otherwise replace
      const existingValidGuests = manualGuests.filter(g => g.name && g.phoneNumber);
      
      if (addGuestMode === 'contacts' && existingValidGuests.length > 0) {
        // Append new contacts, avoiding duplicates by phone number
        const existingPhoneNumbers = new Set(
          existingValidGuests.map(g => g.phoneNumber)
        );
        const newGuests = parsedGuests.filter(g => !existingPhoneNumbers.has(g.phoneNumber));
        const updatedGuests = [...existingValidGuests, ...newGuests];
        setManualGuests(updatedGuests);
        setAddGuestMode('contacts');
        setAddGuestMessage(
          newGuests.length > 0 
            ? `Added ${newGuests.length} more contact(s). Total: ${updatedGuests.length}`
            : `${parsedGuests.length} contact(s) already in list`
        );
      } else {
        setManualGuests(parsedGuests);
        setAddGuestMode('contacts');
        setAddGuestMessage(`Selected ${parsedGuests.length} contact(s) from your device`);
      }
    } catch (error) {
      console.error('Error selecting contacts:', error);
      setAddGuestMessage(`Error selecting contacts: ${error.message}. Please use manual entry or CSV upload.`);
    }
  };

  // Handle manual guest entry changes
  const handleManualGuestChange = (index, field, value) => {
    const updated = [...manualGuests];
    updated[index] = { ...updated[index], [field]: value };
    setManualGuests(updated);
  };

  // Add new manual guest row
  const addManualGuestRow = () => {
    setManualGuests([...manualGuests, { name: '', phoneNumber: '' }]);
  };

  // Remove manual guest row
  const removeManualGuestRow = (index) => {
    if (manualGuests.length > 1) {
      setManualGuests(manualGuests.filter((_, i) => i !== index));
    }
  };

  // Submit guests
  const handleSubmitGuests = async () => {
    if (!roleName.trim()) {
      setAddGuestMessage('Please enter a role name');
      return;
    }

    // Prepare guests data
    const guestsToAdd = manualGuests.filter(
      guest => guest.name.trim() && guest.phoneNumber.trim()
    );

    if (guestsToAdd.length === 0) {
      setAddGuestMessage('Please add at least one guest');
      return;
    }

    // Validate phone numbers (should be 10 digits)
    const invalidGuests = guestsToAdd.filter(
      guest => !/^\d{10}$/.test(guest.phoneNumber.replace(/\D/g, '').slice(-10))
    );

    if (invalidGuests.length > 0) {
      setAddGuestMessage('All phone numbers must be 10 digits');
      return;
    }

    setIsAddingGuests(true);
    setAddGuestMessage('Creating user profiles...');

    try {
      const token = localStorage.getItem('adminToken');
      
      // Step 1: Create user profiles - bulk API call
      // Since it's bulk, try array format first
      const userProfilePayload = guestsToAdd.map(guest => ({
        name: guest.name.trim(),
        phoneNumber: guest.phoneNumber.replace(/\D/g, '').slice(-10),
        eventIds: [eventId]
      }));

      let userIds = [];
      
      // Try bulk call first (array)
      try {
        const createResponse = await axios.post(
          `${API_BASE_URL}/api/userProfile/create`,
          userProfilePayload, // Send as array for bulk
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Extract userIds from response - handle various response formats
        const responseData = createResponse.data?.data || createResponse.data;
        
        if (Array.isArray(responseData)) {
          // Array of user profiles or user IDs
          userIds = responseData.map(item => {
            if (typeof item === 'string' || typeof item === 'number') {
              return String(item);
            }
            return String(item.userId || item.userProfile?.userId || item.id || item);
          });
        } else if (responseData?.userId) {
          // Single user profile
          userIds = [String(responseData.userId)];
        } else if (responseData?.userProfiles && Array.isArray(responseData.userProfiles)) {
          // Wrapped array
          userIds = responseData.userProfiles.map(item => String(item.userId || item.id || item));
        } else if (Array.isArray(createResponse.data)) {
          // Direct array in response.data
          userIds = createResponse.data.map(item => String(item.userId || item.id || item));
        } else {
          // Try to extract userId from single response
          const userId = createResponse.data?.userId || responseData?.userId;
          if (userId) {
            userIds = [String(userId)];
          }
        }
      } catch (bulkError) {
        // If bulk array format fails, the API might expect individual objects but in one call
        // Try wrapping in a different format, or fall back to individual parallel calls
        console.log('Bulk array call format failed, trying alternative approaches:', bulkError);
        
        // Try wrapped format
        try {
          const wrappedResponse = await axios.post(
            `${API_BASE_URL}/api/userProfile/create`,
            { userProfiles: userProfilePayload },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const wrappedData = wrappedResponse.data?.data || wrappedResponse.data;
          if (Array.isArray(wrappedData)) {
            userIds = wrappedData.map(item => String(item.userId || item.id || item));
          }
        } catch (wrappedError) {
          // Final fallback: individual parallel calls (still efficient)
          console.log('Wrapped format also failed, using parallel individual calls:', wrappedError);
          const createPromises = userProfilePayload.map(profile => 
            axios.post(
              `${API_BASE_URL}/api/userProfile/create`,
              profile,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            )
          );
          
          const createResponses = await Promise.all(createPromises);
          userIds = createResponses.map(res => {
            const data = res.data?.data || res.data;
            return String(data?.userId || data?.userProfile?.userId || data);
          }).filter(id => id && id !== 'undefined');
        }
      }

      // Filter out undefined/null userIds
      userIds = userIds.filter(id => id != null);

      if (userIds.length !== guestsToAdd.length) {
        throw new Error(`Expected ${guestsToAdd.length} user IDs, got ${userIds.length}`);
      }

      setAddGuestMessage('Creating event roles...');

      // Step 2: Create event roles - bulk API call
      const eventRolesData = userIds.map((userId) => ({
        userId: String(userId),
        eventId: String(eventId),
        roleName: roleName.trim()
      }));

      await createEventRoles(eventRolesData);

      setAddGuestMessage(`Successfully added ${guestsToAdd.length} guest(s)!`);
      
      // Reset form
      setRoleName('');
      setManualGuests([{ name: '', phoneNumber: '' }]);
      setCsvFile(null);
      setAddGuestMode('manual');

      // Refresh guests list
      setTimeout(() => {
        fetchGuests();
        setShowAddGuest(false);
      }, 1500);

    } catch (error) {
      console.error('Error adding guests:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add guests';
      setAddGuestMessage(`Error: ${errorMsg}`);
    } finally {
      setIsAddingGuests(false);
    }
  };

  const renderAddGuest = () => {
    return (
      <div className="bg-white bg-opacity-90 rounded-xl shadow-2xl p-6 border border-[#d4d4d8] mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#2a4d32]">Add Guests</h3>
          <button
            onClick={() => {
              setShowAddGuest(false);
              setRoleName('');
              setManualGuests([{ name: '', phoneNumber: '' }]);
              setCsvFile(null);
              setAddGuestMode('manual');
              setAddGuestMessage('');
            }}
            className="text-gray-400 hover:text-[#2a4d32]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Role Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#2a4d32] mb-2">
            Role Name *
          </label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="friends/guest/photographer"
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#2a4d32] focus:outline-none focus:border-[#2a4d32]"
            disabled={isAddingGuests}
          />
        </div>

        {/* Mode Selection */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setAddGuestMode('manual');
                setCsvFile(null);
                setManualGuests([{ name: '', phoneNumber: '' }]);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                addGuestMode === 'manual'
                  ? 'bg-brand text-on-brand'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={isAddingGuests}
            >
              Enter Details
            </button>
            <button
              onClick={() => {
                setAddGuestMode('csv');
                setManualGuests([{ name: '', phoneNumber: '' }]);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                addGuestMode === 'csv'
                  ? 'bg-brand text-on-brand'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={isAddingGuests}
            >
              Upload CSV
            </button>
            <button
              onClick={handleSelectContacts}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                addGuestMode === 'contacts'
                  ? 'bg-brand text-on-brand'
                  : isContactPickerAvailable
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={isAddingGuests || !isContactPickerAvailable}
              title={!isContactPickerAvailable ? 'Contact Picker not available on this device' : 'Select contacts from your device'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Share from Contacts</span>
            </button>
          </div>
          {!isContactPickerAvailable && (
            <p className="mt-2 text-xs text-gray-500">
              Contact Picker is only available on mobile/tablet devices with supported browsers (Chrome/Edge on Android)
            </p>
          )}
        </div>

        {/* CSV Upload Mode */}
        {addGuestMode === 'csv' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#2a4d32] mb-2">
              CSV File (must contain "name" and "phoneNumber" columns)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVFileSelect}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#2a4d32] focus:outline-none focus:border-[#2a4d32]"
              disabled={isAddingGuests}
            />
            {csvFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {csvFile.name} ({manualGuests.length} guests parsed)
              </p>
            )}
          </div>
        )}

        {/* Contacts Mode - Show selected contacts */}
        {addGuestMode === 'contacts' && manualGuests.filter(g => g.name && g.phoneNumber).length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-[#2a4d32]">
                Selected Contacts ({manualGuests.filter(g => g.name && g.phoneNumber).length})
              </label>
              <button
                onClick={handleSelectContacts}
                className="text-sm text-[#2a4d32] hover:text-[#1e3b27] font-medium flex items-center space-x-1"
                disabled={isAddingGuests}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add More</span>
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
              {manualGuests.filter(g => g.name && g.phoneNumber).map((guest, index) => (
                <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                  <div>
                    <p className="font-medium text-[#2a4d32]">{guest.name}</p>
                    <p className="text-sm text-gray-600">{guest.phoneNumber}</p>
                  </div>
                  <button
                    onClick={() => {
                      const updated = manualGuests.filter((_, i) => i !== index);
                      if (updated.length === 0) {
                        setManualGuests([{ name: '', phoneNumber: '' }]);
                        setAddGuestMode('manual');
                      } else {
                        setManualGuests(updated);
                      }
                    }}
                    className="text-red-500 hover:text-red-700"
                    disabled={isAddingGuests}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Entry Mode */}
        {addGuestMode === 'manual' && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-[#2a4d32]">
                Guest Details
              </label>
              <button
                onClick={addManualGuestRow}
                className="text-sm text-[#2a4d32] hover:text-[#1e3b27] font-medium"
                disabled={isAddingGuests}
              >
                + Add Another
              </button>
            </div>
            <div className="space-y-4">
              {manualGuests.map((guest, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={guest.name}
                      onChange={(e) => handleManualGuestChange(index, 'name', e.target.value)}
                      placeholder="Name"
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#2a4d32] focus:outline-none focus:border-[#2a4d32]"
                      disabled={isAddingGuests}
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={guest.phoneNumber}
                      onChange={(e) => {
                        // Allow only digits, keep last 10
                        const digits = e.target.value.replace(/\D/g, '').slice(-10);
                        handleManualGuestChange(index, 'phoneNumber', digits);
                      }}
                      placeholder="Phone (last 10 digits)"
                      maxLength={10}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#2a4d32] focus:outline-none focus:border-[#2a4d32]"
                      disabled={isAddingGuests}
                    />
                  </div>
                  <div className="col-span-2">
                    {manualGuests.length > 1 && (
                      <button
                        onClick={() => removeManualGuestRow(index)}
                        className="w-full px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        disabled={isAddingGuests}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview of guests to be added */}
        {manualGuests.filter(g => g.name && g.phoneNumber).length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-[#2a4d32] mb-2">
              Ready to add: {manualGuests.filter(g => g.name && g.phoneNumber).length} guest(s)
            </p>
          </div>
        )}

        {/* Message */}
        {addGuestMessage && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${
            addGuestMessage.includes('Error') || addGuestMessage.includes('Failed')
              ? 'bg-red-50 text-red-600 border border-red-200'
              : addGuestMessage.includes('Successfully')
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-blue-50 text-blue-600 border border-blue-200'
          }`}>
            {addGuestMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmitGuests}
          disabled={isAddingGuests || !roleName.trim() || manualGuests.filter(g => g.name && g.phoneNumber).length === 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isAddingGuests || !roleName.trim() || manualGuests.filter(g => g.name && g.phoneNumber).length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-brand hover:bg-brand-2 text-on-brand'
          }`}
        >
          {isAddingGuests ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span>Adding Guests...</span>
            </div>
          ) : (
            `Add ${manualGuests.filter(g => g.name && g.phoneNumber).length} Guest(s)`
          )}
        </button>
      </div>
    );
  };

  const renderGuests = () => {
    // Debug log
    console.log('Rendering guests:', guests);
    
    const groupedGuests = groupGuestsByRole();
    const roleNames = Object.keys(groupedGuests);

    return (
      <div className="space-y-8">
        {/* Add Guest Section */}
        {showAddGuest && renderAddGuest()}

        {/* Add Guest Button - Horizontal like Upload Moments */}
        {!showAddGuest && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddGuest(true)}
              className="w-full bg-brand hover:bg-brand-2 text-on-brand px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Guests</span>
            </button>
          </div>
        )}

        {/* Guests List */}
        {roleNames.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">
            No guests found
          </div>
        ) : (
          roleNames.map((roleName, roleIndex) => {
            const guestsInRole = groupedGuests[roleName];
            const colorScheme = getGroupColor(roleIndex);
            
            return (
              <div key={roleName} className={`rounded-xl shadow-lg border-2 ${colorScheme.bg} ${colorScheme.border}`}>
                {/* Section Header */}
                <div className={`px-6 py-4 border-b-2 ${colorScheme.headerBorder}`}>
                  <h3 className="text-xl font-semibold text-[#2a4d32]">
                    {roleName}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({guestsInRole.length})
                    </span>
                  </h3>
                </div>
                
                {/* Guests Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {guestsInRole.map((guest) => (
                      <div 
                        key={guest.userId || guest.phoneNumber} 
                        className="bg-white bg-opacity-90 rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
                      >
                        <h4 className="text-lg font-semibold text-[#2a4d32] mb-2">
                          {guest.name || 'No Name'}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">Phone: </span>
                          {formatPhoneNumber(guest)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length === 0) {
      setUploadMessage('Please select only image files.');
      return;
    }

    setUploadedFiles(prev => [...prev, ...imageFiles]);
    setUploadMessage(`Added ${imageFiles.length} image(s) to upload queue.`);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', 'IMAGE');

    const token = localStorage.getItem('adminToken');
    
    console.log('Uploading file:', file.name, 'with token:', token ? 'Token exists' : 'No token found');
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/files/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          }
        }
      );

      console.log('Upload response for', file.name, ':', response.data);
      return response.data.data.publicUrl;
    } catch (error) {
      console.error('Upload error for file:', file.name, error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      throw new Error(`Failed to upload ${file.name}: ${errorMessage}`);
    }
  };

  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = () => {
        // Fallback to iPhone portrait dimensions if image loading fails
        resolve({
          width: 390,
          height: 844
        });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const createBatchMoments = async (momentsData) => {
    const token = localStorage.getItem('adminToken');
    
    // Debug log to see what data is being sent
    console.log('Sending batch moments data:', JSON.stringify(momentsData, null, 2));
    console.log('Using token:', token ? 'Token exists' : 'No token found');
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/moments/batch`,
        momentsData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Batch creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Batch creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // More specific error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create moments';
      throw new Error(`Batch creation failed: ${errorMessage}`);
    }
  };

  const handleBulkUpload = async () => {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      setUploadMessage('Authentication token not found. Please log in again.');
      return;
    }

    if (!selectedGuest) {
      setUploadMessage('Please select a guest first.');
      return;
    }

    // Verify the selected guest exists in the guests list
    const selectedGuestData = guests.find(g => g.phoneNumber === selectedGuest);
    if (!selectedGuestData) {
      setUploadMessage('Selected guest not found in the guest list.');
      return;
    }

    if (uploadedFiles.length === 0) {
      setUploadMessage('Please select files to upload.');
      return;
    }

    setIsUploading(true);
    setUploadMessage('Starting upload process...');

    try {
      // Upload all files and collect public URLs with dimensions
      const uploadPromises = uploadedFiles.map(async (file) => {
        const publicUrl = await uploadFile(file);
        const dimensions = await getImageDimensions(file);
        return {
          file,
          publicUrl,
          dimensions,
          creationTime: file?.lastModified
            ? file.lastModified
            : Date.now()
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      setUploadMessage('Creating moments...');

      // Prepare moments data for batch creation
      const momentsData = uploadResults.map(result => ({
        eventId: String(eventId), // Ensure eventId is a string
        creationTime: result.creationTime,
        creatorDetails: {
          userId: selectedGuestData.userId, // Use guest ID
          userName: selectedGuestData.name || 'Unknown'
        },
        creatorId: selectedGuestData.userId, // Use guest ID
        media: {
          url: result.publicUrl,
          type: "IMAGE",
          height: result.dimensions.height,
          width: result.dimensions.width
        }
      }));

      // Create moments in batch
      await createBatchMoments(momentsData);

      // Clear upload state
      setUploadedFiles([]);
      setSelectedGuest('');
      setUploadProgress({});
      setUploadMessage('Upload completed successfully!');

      // Refresh moments list
      await fetchMoments();

    } catch (error) {
      console.error('Bulk upload error:', error);
      setUploadMessage(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const renderBulkUploadCard = () => (
    <div className="bg-white bg-opacity-90 rounded-xl shadow-2xl p-6 border border-[#d4d4d8] mb-8">
      <h3 className="text-xl font-semibold text-[#2a4d32] mb-4">Bulk Upload Images</h3>
      
      {/* Guest Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Guest
        </label>
        <select
          value={selectedGuest}
          onChange={(e) => setSelectedGuest(e.target.value)}
          className="w-full bg-white border border-gray-600 rounded-lg px-3 py-2 text-[#2a4d32] focus:outline-none focus:border-[#2a4d32]"
          disabled={isUploading}
        >
          <option value="">Choose a guest...</option>
          {guests.map((guest) => (
            <option key={guest.phoneNumber} value={guest.phoneNumber}>
              {guest.name || 'Unknown'} ({guest.phoneNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Drag & Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-[#2a4d32] bg-[#2a4d32]/10' 
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-gray-300">
              <span className="font-medium">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
          </div>
        </label>
      </div>

      {/* Selected Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Files ({uploadedFiles.length})</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded px-3 py-2">
                <span className="text-sm text-gray-300 truncate">{file.name}</span>
                <div className="flex items-center space-x-2">
                  {uploadProgress[file.name] !== undefined && (
                    <span className="text-xs text-gray-400">
                      {uploadProgress[file.name]}%
                    </span>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                    disabled={isUploading}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Message */}
      {uploadMessage && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          uploadMessage.includes('failed') || uploadMessage.includes('error')
            ? 'bg-[#2a4d32]/20 text-[#2a4d32] border border-[#2a4d32]'
            : uploadMessage.includes('success')
            ? 'bg-green-900/50 text-green-200 border border-green-500'
            : 'bg-blue-900/50 text-blue-200 border border-blue-500'
        }`}>
          {uploadMessage}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleBulkUpload}
        disabled={isUploading || uploadedFiles.length === 0 || !selectedGuest}
        className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isUploading || uploadedFiles.length === 0 || !selectedGuest
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-brand hover:bg-brand-2 text-on-brand'
        }`}
      >
        {isUploading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            <span>Uploading...</span>
          </div>
        ) : (
          `Upload ${uploadedFiles.length} Image${uploadedFiles.length !== 1 ? 's' : ''}`
        )}
      </button>
    </div>
  );

  const renderQRModal = () => (
    <div className="fixed inset-0 bg-[#f3efe6] bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 relative">
        <button
          onClick={() => setShowQRModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#2a4d32]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 className="text-xl font-semibold text-[#2a4d32] mb-4">Event QR Code</h3>
        
        <div className="bg-white p-4 rounded-lg flex items-center justify-center mb-4">
          <div className="QRCode">
            <style>
              {`
                .QRCode img {
                  filter: brightness(0);
                }
              `}
            </style>
            <QRCodeSVG
              value={`https://admin.moments.live/event/${eventId}`}
              size={200}
              level="H"
              includeMargin={true}
              
            />
          </div>
        </div>
        
        <p className="text-sm text-gray-400 text-center mb-4">
          Scan this QR code to access the event page
        </p>
        
        <button
          onClick={() => {
            const canvas = document.createElement("canvas");
            const svg = document.querySelector(".QRCode svg");
            const svgData = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              canvas.getContext("2d").drawImage(img, 0, 0);
              const pngFile = canvas.toDataURL("image/png");
              const downloadLink = document.createElement("a");
              downloadLink.download = `event-${eventId}-qr.png`;
              downloadLink.href = pngFile;
              downloadLink.click();
            };
            img.src = "data:image/svg+xml;base64," + btoa(svgData);
          }}
          className="w-full bg-brand hover:bg-brand-2 text-on-brand py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download QR Code</span>
        </button>
      </div>
    </div>
  );

  const renderDeliveryAndGallery = () => {
    const card = isDark ? 'rounded-2xl border border-white/10 bg-[#1A241E] p-6' : 'rounded-2xl border border-black/10 bg-white p-6';
    const inner = isDark ? 'rounded-xl border border-white/10 bg-white/5 p-4' : 'rounded-xl border border-black/10 bg-slate-50 p-4';
    const heading = isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900';
    const textPrimary = isDark ? 'text-sm font-semibold text-white/80' : 'text-sm font-semibold text-slate-800';
    const textSecondary = isDark ? 'text-xs text-white/50 mt-1' : 'text-xs text-slate-500 mt-1';
    const input =
      isDark
        ? 'w-full bg-[#1A241E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-0'
        : 'w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-0';

    return (
    <div className="space-y-6">
      {/* Gallery Status */}
      <div className={card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className={heading}>Gallery Status</h3>
            </div>
            <div className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
              {galleryEnabled ? 'Gallery is enabled for this event.' : 'Gallery is not enabled yet.'}
            </div>
          </div>
          <button
            onClick={() => setGalleryEnabled((v) => !v)}
            className={`px-5 py-2 rounded-xl font-semibold border transition-colors ${
              galleryEnabled
                ? 'bg-red-600/20 border-red-500/30 text-red-200 hover:bg-red-600/30'
                : `bg-[#2a4d32]/20 border-[#2a4d32]/30 hover:bg-brand-2/30 ${isDark ? 'text-[#8fd2a5]' : 'text-[#1a3020]'}`
            }`}
          >
            {galleryEnabled ? 'Disable Gallery' : 'Enable Gallery'}
          </button>
        </div>
      </div>

      {/* Gallery Customization */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
          </svg>
          <h3 className={heading}>Gallery Customization</h3>
        </div>

        <div className="space-y-6">
          <div>
            <div className={`text-sm font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-slate-700'}`}>Theme</div>
            <div className="flex flex-wrap gap-3">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => setGalleryTheme(t)}
                  className={`px-4 py-2 rounded-xl border font-semibold transition-colors ${
                    galleryTheme === t
                      ? isDark
                        ? `bg-[#2a4d32]/20 border-[#2a4d32]/30 ${isDark ? 'text-[#8fd2a5]' : 'text-[#1a3020]'}`
                        : 'bg-[#2a4d32]/10 border-[#2a4d32]/20 text-[#2a4d32]'
                      : isDark
                        ? 'bg-white/0 border-white/10 text-white/60 hover:bg-white/5'
                        : 'bg-white border-black/10 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className={`text-sm font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-slate-700'}`}>Layout</div>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'grid', label: 'Grid' },
                { key: 'masonry', label: 'Masonry' },
                { key: 'slideshow', label: 'Slideshow' },
              ].map((l) => (
                <button
                  key={l.key}
                  onClick={() => setGalleryLayout(l.key)}
                  className={`px-4 py-2 rounded-xl border font-semibold transition-colors ${
                    galleryLayout === l.key
                      ? isDark
                        ? `bg-[#2a4d32]/20 border-[#2a4d32]/30 ${isDark ? 'text-[#8fd2a5]' : 'text-[#1a3020]'}`
                        : 'bg-[#2a4d32]/10 border-[#2a4d32]/20 text-[#2a4d32]'
                      : isDark
                        ? 'bg-white/0 border-white/10 text-white/60 hover:bg-white/5'
                        : 'bg-white border-black/10 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Download Permissions */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15V3" />
          </svg>
          <h3 className={heading}>Download Permissions</h3>
        </div>

        <div className="space-y-4">
          <div className={inner}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={textPrimary}>Enable Downloads</div>
                <div className={textSecondary}>Allow clients to download photos</div>
              </div>
              <button
                onClick={() => setDownloadsEnabled((v) => !v)}
                className={`w-12 h-7 rounded-full border transition-colors ${
                  downloadsEnabled
                    ? 'bg-brand border-[#2a4d32]/30'
                    : isDark
                      ? 'bg-white/10 border-white/10'
                      : 'bg-slate-200 border-slate-300'
                }`}
                aria-label="Toggle downloads"
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${
                    downloadsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className={inner}>
            <div className={`${textPrimary} mb-2`}>Quality</div>
            <select
              value={downloadsQuality}
              onChange={(e) => setDownloadsQuality(e.target.value)}
              className={input}
            >
              <option value="hires">Hi-res (Original quality)</option>
              <option value="original">Original</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expiry Controls */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className={heading}>Expiry Controls</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className={`${textPrimary} mb-2`}>Expiry Date</div>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={input}
            />
          </div>

          <div className={`${inner} flex items-center justify-between gap-4`}>
            <div>
              <div className={textPrimary}>Auto-archive on expiry</div>
              <div className={textSecondary}>Moves to cold storage automatically</div>
            </div>
            <button
              onClick={() => setAutoArchiveOnExpiry((v) => !v)}
              className={`w-12 h-7 rounded-full border transition-colors ${
                autoArchiveOnExpiry
                  ? 'bg-brand border-[#2a4d32]/30'
                  : isDark
                    ? 'bg-white/10 border-white/10'
                    : 'bg-slate-200 border-slate-300'
              }`}
              aria-label="Toggle auto-archive"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${
                  autoArchiveOnExpiry ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Sharing Options */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 6l-4-4-4 4" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2v14" />
          </svg>
          <h3 className={heading}>Sharing Options</h3>
        </div>

        <div className="space-y-4">
          <div className={`${inner} flex items-center justify-between gap-4`}>
            <div>
              <div className={textPrimary}>Password Protection</div>
              <div className={textSecondary}>Require password to access gallery</div>
            </div>
            <button
              onClick={() => setPasswordProtected((v) => !v)}
              className={`w-12 h-7 rounded-full border transition-colors ${
                passwordProtected
                  ? 'bg-brand border-[#2a4d32]/30'
                  : isDark
                    ? 'bg-white/10 border-white/10'
                    : 'bg-slate-200 border-slate-300'
              }`}
              aria-label="Toggle password protection"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${
                  passwordProtected ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setConfigMessage('Generate QR Code (UI only)')}
              className={`px-4 py-3 rounded-xl border font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                isDark
                  ? 'border-white/10 hover:bg-white/5 text-white/80'
                  : 'border-black/10 hover:bg-slate-50 text-slate-700 bg-white'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h10M7 16h10" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 4h10" />
              </svg>
              Generate QR Code
            </button>
            <button
              onClick={() => setConfigMessage('Share Link (UI only)')}
              className="px-4 py-3 rounded-xl bg-brand hover:bg-brand-2 text-on-brand font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 6l-4-4-4 4" />
              </svg>
              Share Link
            </button>
          </div>

          {configMessage && (
            <div className={`text-sm font-semibold px-4 py-3 rounded-xl border ${
              isDark
                ? 'text-[#8fd2a5] bg-[#2a4d32]/10 border-[#2a4d32]/20'
                : 'text-[#2a4d32] bg-[#2a4d32]/10 border-[#2a4d32]/30'
            }`}>
              {configMessage}
            </div>
          )}
        </div>
      </div>

      {/* Face Recognition Settings */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2l1.5 5L19 9l-5.5 2L12 16l-1.5-5L5 9l5.5-2L12 2z" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 18h14" />
          </svg>
          <h3 className={heading}>Face Recognition Settings</h3>
        </div>

        <div className="space-y-5">
          <div className={`${inner} flex items-center justify-between gap-4`}>
            <div>
              <div className={textPrimary}>Enable Face Recognition</div>
              <div className={textSecondary}>AI-powered photo matching for guests</div>
            </div>
            <button
              onClick={() => setFaceRecognitionEnabled((v) => !v)}
              className={`w-12 h-7 rounded-full border transition-colors ${
                faceRecognitionEnabled
                  ? 'bg-brand border-[#2a4d32]/30'
                  : isDark
                    ? 'bg-white/10 border-white/10'
                    : 'bg-slate-200 border-slate-300'
              }`}
              aria-label="Toggle face recognition"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${
                  faceRecognitionEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className={inner}>
            <div className={`${textPrimary} mb-2`}>Face Data Retention</div>
            <select
              value={faceRetention}
              onChange={(e) => setFaceRetention(e.target.value)}
              className={input}
            >
              <option>During event only</option>
              <option>Retain for 30 days</option>
              <option>Retain for 1 year</option>
            </select>
          </div>

          <div className={inner}>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className={textPrimary}>Match Confidence Threshold</div>
              <div className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                {matchConfidence < 0.4 ? 'Low' : matchConfidence < 0.75 ? 'Medium' : 'High'}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={matchConfidence}
              onChange={(e) => setMatchConfidence(Number(e.target.value))}
              className="w-full accent-[#2a4d32]"
            />
          </div>
        </div>
      </div>

      {/* Moderation Settings */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
          </svg>
          <h3 className={heading}>Moderation Settings</h3>
        </div>

        <div className="space-y-5">
          <div className={`${inner} flex items-center justify-between gap-4`}>
            <div>
              <div className={textPrimary}>Enable Moderation</div>
              <div className={textSecondary}>Review guest uploads before they appear</div>
            </div>
            <button
              onClick={() => setModerationEnabled((v) => !v)}
              className={`w-12 h-7 rounded-full border transition-colors ${
                moderationEnabled
                  ? 'bg-brand border-[#2a4d32]/30'
                  : isDark
                    ? 'bg-white/10 border-white/10'
                    : 'bg-slate-200 border-slate-300'
              }`}
              aria-label="Toggle moderation"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${
                  moderationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className={inner}>
            <div className={`${textPrimary} mb-3`}>Approval Method</div>
            <div className="flex flex-wrap gap-3">
              {['Manual Review', 'Auto-approve'].map((m) => (
                <button
                  key={m}
                  onClick={() => setApprovalMethod(m)}
                  className={`px-4 py-2 rounded-xl border font-semibold transition-colors ${
                    approvalMethod === m
                      ? isDark
                        ? `bg-[#2a4d32]/20 border-[#2a4d32]/30 ${isDark ? 'text-[#8fd2a5]' : 'text-[#1a3020]'}`
                        : 'bg-[#2a4d32]/10 border-[#2a4d32]/20 text-[#2a4d32]'
                      : isDark
                        ? 'bg-white/0 border-white/10 text-white/60 hover:bg-white/5'
                        : 'bg-white border-black/10 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderGuestAppConfig = () => {
    const card = isDark ? 'rounded-2xl border border-white/10 bg-[#1A241E] p-6' : 'rounded-2xl border border-black/10 bg-white p-6';
    const heading = isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900';
    const textMuted = isDark ? 'text-white/60' : 'text-slate-600';
    const fieldBox = isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-slate-50';
    const dateInput = isDark ? 'w-full bg-transparent outline-none text-sm text-white' : 'w-full bg-transparent outline-none text-sm text-slate-900';

    return (
    <div className="space-y-6">
      {/* Guest App Status */}
      <div className={card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M5 4h14l-1 16H6L5 4z" />
              </svg>
              <h3 className={heading}>Guest App Status</h3>
            </div>
            <div className={`mt-2 text-sm ${textMuted}`}>
              {guestAppEnabled ? 'Guest app is active for this event' : 'Guest app is disabled for this event'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGuestAppEnabled((v) => !v)}
            className={`px-5 py-2 rounded-xl font-semibold border transition-colors ${
              guestAppEnabled
                ? 'bg-red-600/20 border-red-500/30 text-red-200 hover:bg-red-600/30'
                : `bg-[#2a4d32]/20 border-[#2a4d32]/30 hover:bg-brand-2/30 ${isDark ? 'text-[#8fd2a5]' : 'text-[#1a3020]'}`
            }`}
          >
            {guestAppEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
        {eventSettingsMessage && (
          <div
            className={`mt-4 text-sm font-medium px-4 py-3 rounded-xl border ${
              eventSettingsMessage.includes('saved')
                ? isDark
                  ? 'text-[#8fd2a5] bg-[#2a4d32]/10 border-[#2a4d32]/20'
                  : 'text-[#1a3020] bg-[#2a4d32]/10 border-[#2a4d32]/30'
                : isDark
                  ? 'text-red-200 bg-red-600/10 border-red-500/20'
                  : 'text-red-800 bg-red-50 border-red-200'
            }`}
          >
            {eventSettingsMessage}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveGuestAppSettings}
            disabled={eventSettingsLoading}
            className={`px-5 py-2 rounded-xl font-semibold text-white transition-colors ${
              eventSettingsLoading ? 'opacity-50 cursor-not-allowed bg-brand' : 'bg-brand hover:bg-brand-2'
            }`}
          >
            {eventSettingsLoading ? 'Saving…' : 'Save guest app settings'}
          </button>
          <button
            type="button"
            onClick={deleteEventOnServer}
            disabled={eventSettingsLoading}
            className={`px-5 py-2 rounded-xl font-semibold border transition-colors ${
              isDark
                ? 'border-red-500/40 text-red-200 hover:bg-red-600/20'
                : 'border-red-300 text-red-700 hover:bg-red-50'
            } ${eventSettingsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Delete event
          </button>
        </div>
      </div>

      {/* Event Access */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4z" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h8M8 16h8" />
          </svg>
          <h3 className={heading}>Event Access</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col items-center">
            <div className="w-56 h-56 rounded-2xl bg-white flex items-center justify-center border border-black/5">
              <QRCodeSVG
                value={`https://admin.moments.live/event/${eventId}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className={`mt-3 text-sm ${textMuted}`}>Scan to join event</div>
            <div className={`mt-2 text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              Download PNG · Download PDF
            </div>
          </div>

          <div className="space-y-4">
            {configMessage && (
              <div className={`text-sm font-semibold px-4 py-3 rounded-xl border ${
                isDark
                  ? 'text-[#8fd2a5] bg-[#2a4d32]/10 border-[#2a4d32]/20'
                  : 'text-[#2a4d32] bg-[#2a4d32]/10 border-[#2a4d32]/30'
              }`}>
                {configMessage}
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Event Code</div>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{eventCode}</div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(eventCode);
                    setConfigMessage('Event code copied!');
                    setTimeout(() => setConfigMessage(''), 1500);
                  } catch {
                    setConfigMessage('Copy failed in this browser');
                    setTimeout(() => setConfigMessage(''), 1500);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-2 text-on-brand font-semibold transition-colors"
              >
                Copy
              </button>
            </div>

            <div>
              <div className={`text-xs font-semibold mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Access Period</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>From</label>
                  <div className={`flex items-center gap-2 rounded-xl border ${fieldBox} px-3 py-2`}>
                    <svg className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 11h8" />
                    </svg>
                    <input
                      type="date"
                      value={accessStart}
                      onChange={(e) => setAccessStart(e.target.value)}
                      className={dateInput}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>To</label>
                  <div className={`flex items-center gap-2 rounded-xl border ${fieldBox} px-3 py-2`}>
                    <svg className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 11h8" />
                    </svg>
                    <input
                      type="date"
                      value={accessEnd}
                      onChange={(e) => setAccessEnd(e.target.value)}
                      className={dateInput}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setConfigMessage('Regenerate Event Code (UI only)')}
              className={`w-full px-4 py-3 rounded-xl font-semibold border transition-colors ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  : 'bg-white hover:bg-slate-50 border-black/10 text-slate-800'
              }`}
            >
              Regenerate Event Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderSidebar = () => {
    const sidebarBg = isDark ? 'bg-[#101611]' : 'bg-white';
    const sidebarBorder = isDark ? 'border-white/10' : 'border-[#d4d4d8]';
    const textMuted = isDark ? 'text-white/55' : 'text-slate-500';
    const imageMoments = moments.filter((m) => !isVideoMoment(m));
    const photographerMoments = imageMoments.filter((m) => isPhotographerMoment(m));
    const candidMoments = photographerMoments.filter((m) => isCandidMoment(m));
    const traditionalMoments = photographerMoments.filter((m) => !isCandidMoment(m));
    const videoMoments = moments.filter((m) => isVideoMoment(m));

    const folderItems = [
      { id: 'all-images', label: 'All Images', count: imageMoments.length, level: 0, isSection: false },
      { id: 'images', label: 'Images', count: imageMoments.length, level: 0, isSection: true },
      { id: 'guest-images', label: 'Guest', count: 0, level: 1, isSection: false },
      { id: 'photographer-images', label: 'Photographer', count: photographerMoments.length, level: 1, isSection: false },
      { id: 'photographer-candid', label: 'Candid', count: candidMoments.length, level: 2, isSection: false },
      { id: 'photographer-traditional', label: 'Traditional', count: traditionalMoments.length, level: 2, isSection: false },
      { id: 'videos', label: 'Videos', count: videoMoments.length, level: 0, isSection: false },
    ];

    return (
      <div className="sticky top-0 h-screen flex">
        <AdminSidebar
          isDark={isDark}
          collapsed={!isSidebarExpanded}
          onToggleCollapsed={() => setIsSidebarExpanded((v) => !v)}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLogout={handleLogout}
          activeKey="projects"
          onNavigate={(key) => {
            if (key === 'home') navigate('/admin/homepage');
            else if (key === 'projects') navigate('/admin/events', { state: { openProjects: true } });
            else if (key === 'uploads') navigate('/admin/uploads');
            else if (key === 'storage') navigate('/admin/storage');
            else if (key === 'notifications') navigate('/admin/notifications');
            else if (key === 'team') navigate('/admin/team');
            else if (key === 'settings') navigate('/admin/settings');
          }}
        />

        {/* Folder panel (visible on desktop/tablet) */}
        <aside className={`hidden md:flex h-screen flex-col ${sidebarBg} border-r ${sidebarBorder} transition-all duration-300 overflow-hidden ${isFoldersMinimized ? 'w-0 opacity-0 border-r-0' : 'w-[300px] opacity-100'}`}>
          <div className={`px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-black/10'}`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Folders</div>
              <button
                onClick={() => setIsFoldersMinimized(true)}
                className={`w-9 h-9 rounded-xl border ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-black/10 bg-slate-50 hover:bg-slate-100'} flex items-center justify-center`}
                aria-label="Minimize folders"
                title="Minimize folders"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 px-2 py-3">
            <nav className="space-y-1">
              {folderItems.map((f) => {
                if (f.isSection) {
                  return (
                    <div key={f.id} className={`px-4 pt-2 pb-1 text-[11px] uppercase tracking-[0.16em] ${textMuted}`}>
                      {f.label}
                    </div>
                  );
                }
                const active = selectedFolder === f.id;
                const indentClass = f.level === 2 ? 'pl-12' : f.level === 1 ? 'pl-9' : 'pl-4';
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFolder(f.id)}
                    className={`w-full flex items-center justify-between pr-4 py-2 rounded-xl border transition-colors ${indentClass} ${
                      active
                        ? isDark
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-[#2a4d32]/10 border-[#2a4d32]/20 text-[#1a3020]'
                        : isDark
                          ? 'border-transparent text-white/70 hover:bg-white/5 hover:border-white/10'
                          : 'border-transparent text-slate-700 hover:bg-slate-50 hover:border-black/10'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-black/10'}`}>
                        <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        </svg>
                      </span>
                      <span className="truncate text-sm">{f.label}</span>
                    </span>
                    <span className={`text-xs ${textMuted}`}>{f.count.toLocaleString()}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="px-4 pb-5">
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/uploads', { state: { selectedProjectId: eventId } })}
                className={`w-full px-4 py-3 rounded-xl font-semibold border transition-colors ${
                  isDark
                    ? 'bg-brand hover:bg-brand-2 border-[#2a4d32]/20 text-on-brand'
                    : 'bg-brand hover:bg-brand-2 border-[#2a4d32]/20 text-on-brand'
                }`}
              >
                Upload to this project
              </button>
            </div>
          </div>
        </aside>
        {isFoldersMinimized && (
          <button
            onClick={() => setIsFoldersMinimized(false)}
            className={`hidden md:flex h-screen w-8 border-r ${sidebarBorder} ${sidebarBg} items-center justify-center transition-colors ${isDark ? 'hover:bg-white/5 text-white/70' : 'hover:bg-slate-50 text-slate-600'}`}
            title="Expand folders"
            aria-label="Expand folders"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  const renderMediaTab = () => {
    const searched = filteredMoments.filter((m) => {
      if (!mediaSearch.trim()) return true;
      const name = m.creatorDetails?.userName || '';
      const id = m.id || m.momentId || '';
      return `${name} ${id}`.toLowerCase().includes(mediaSearch.trim().toLowerCase());
    });

    const filtered = searched.filter((m) => {
      if (selectedFolder === 'all-images' || selectedFolder === 'images') return !isVideoMoment(m);
      if (selectedFolder === 'videos') return isVideoMoment(m);
      if (selectedFolder === 'guest-images') return false;
      if (selectedFolder === 'photographer-images') return !isVideoMoment(m) && isPhotographerMoment(m);
      if (selectedFolder === 'photographer-candid') return !isVideoMoment(m) && isPhotographerMoment(m) && isCandidMoment(m);
      if (selectedFolder === 'photographer-traditional') return !isVideoMoment(m) && isPhotographerMoment(m) && !isCandidMoment(m);
      return true;
    });
    const withOrientation = filtered.filter((m) => {
      if (orientationFilter === 'all') return true;
      const w = Number(m?.media?.width || m?.media?.imageWidth || m?.width || 0);
      const h = Number(m?.media?.height || m?.media?.imageHeight || m?.height || 0);
      if (!w || !h) return true;
      if (orientationFilter === 'portrait') return h > w;
      if (orientationFilter === 'landscape') return w >= h;
      return true;
    });
    const withCreatorRole = withOrientation.filter((m) => {
      if (creatorRoleFilter === 'all') return true;
      return getCreatorRole(m) === creatorRoleFilter;
    });
    const sorted = [...withCreatorRole].sort((a, b) => {
      const getCreationEpoch = (m) => Number(m?.creationTime ?? m?.media?.creationTime ?? m?.createdAt ?? 0) || 0;
      const getUploadEpoch = (m) => Number(m?.uploadTime ?? m?.uploadedAt ?? m?.media?.uploadTime ?? 0) || 0;
      if (sortBy === 'creation-asc') return getCreationEpoch(a) - getCreationEpoch(b);
      if (sortBy === 'creation-desc') return getCreationEpoch(b) - getCreationEpoch(a);
      if (sortBy === 'upload-asc') return getUploadEpoch(a) - getUploadEpoch(b);
      return getUploadEpoch(b) - getUploadEpoch(a); // upload-desc
    });

    const openPreview = (idx) => {
      setPreviewIndex(idx);
      setPreviewScale(1);
      setPreviewOpen(true);
      // Push a history entry so the browser / hardware Back button closes the preview
      // (via the popstate listener) instead of navigating away from the event screen.
      try { window.history.pushState({ momentPreview: true }, ''); } catch { /* ignore */ }
    };

    const closePreview = () => {
      setPreviewScale(1);
      // If our pushed entry is on top, go back so history stays balanced (popstate closes it);
      // otherwise close directly.
      if (window.history.state?.momentPreview) window.history.back();
      else setPreviewOpen(false);
    };

    const movePreview = (direction) => {
      if (sorted.length === 0) return;
      const next = (previewIndex + direction + sorted.length) % sorted.length;
      setPreviewIndex(next);
      setPreviewScale(1);
    };

    const clampScale = (value) => Math.min(4, Math.max(1, value));
    const handleWheelZoom = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setPreviewScale((s) => clampScale(s + delta));
    };
    const handleClickZoom = () => {
      setPreviewScale((s) => (s >= 3.5 ? 1 : clampScale(s + 0.5)));
    };
    const getPinchDistance = (touches) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        pinchDistanceRef.current = getPinchDistance(e.touches);
      }
    };
    const handleTouchMove = (e) => {
      if (e.touches.length !== 2) return;
      const nextDistance = getPinchDistance(e.touches);
      if (!pinchDistanceRef.current) {
        pinchDistanceRef.current = nextDistance;
        return;
      }
      const diff = nextDistance - pinchDistanceRef.current;
      if (Math.abs(diff) > 2) {
        setPreviewScale((s) => clampScale(s + diff / 250));
        pinchDistanceRef.current = nextDistance;
      }
    };
    const handleTouchEnd = () => {
      pinchDistanceRef.current = 0;
    };

    const toggleFavorite = (moment) => {
      const key = String(moment?.id || moment?.momentId || '');
      if (!key) return;
      setFavoriteMomentIds((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    };

    const pillForStatus = (statusRaw) => {
      const s = String(statusRaw || '').toUpperCase();
      if (s === 'APPROVED') {
        return {
          label: 'Approved',
          className: isDark
            ? 'bg-[#2a4d32]/20 text-[#8fd2a5] border border-[#2a4d32]/30'
            : 'bg-[#2a4d32]/10 text-[#2a4d32] border border-[#2a4d32]/20',
          icon: (
            <svg className="w-3.5 h-3.5 text-[#8fd2a5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
            </svg>
          ),
        };
      }
      if (s === 'REJECTED') {
        return {
          label: 'Rejected',
          className: isDark
            ? 'bg-red-600/20 text-red-200 border border-red-500/30'
            : 'bg-red-600/10 text-red-700 border border-red-600/20',
          icon: (
            <svg className="w-3.5 h-3.5 text-red-200" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          ),
        };
      }
      if (s === 'PENDING') {
        return {
          label: 'Pending',
          className: isDark
            ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
            : 'bg-amber-500/10 text-amber-700 border border-amber-600/20',
          icon: (
            <svg className="w-3.5 h-3.5 text-amber-200" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      }
      return {
        label: s || 'Pending',
        className: isDark
          ? 'bg-white/5 text-white/60 border border-white/10'
          : 'bg-slate-100 text-slate-600 border border-slate-200',
        icon: null,
      };
    };

    const rawDate = eventData?.date || eventData?.eventDate || eventData?.createdAt;
    const eventDateLabel = rawDate ? new Date(rawDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

    return (
      <div className="space-y-5">
        {/* Toolbar header */}
        <div className={`rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'} p-4`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`text-sm font-medium inline-flex items-center gap-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                  <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4h7l2 2h7v14H4V4z" />
                  </svg>
                  <span>{eventData?.eventName || eventData?.name || 'Project'}</span>
                </div>
                {eventDateLabel && <div className={`text-xs ${isDark ? 'text-white/45' : 'text-slate-500'}`}>{eventDateLabel}</div>}
              </div>
              <div className={`mt-1 text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                {moments.length.toLocaleString()} Photos · {guests.length.toLocaleString()} Contributors
              </div>
            </div>

            <div className="lg:w-[420px]">
              <div className={`flex items-center gap-2 ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-black/10'} border px-3 py-2 rounded-xl`}>
                <svg className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  className={`w-full bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder:text-white/40' : 'text-slate-900 placeholder:text-slate-400'}`}
                  placeholder="Search photos..."
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'All', count: getTabCount('all') },
                { key: 'pending', label: 'Pending', count: getTabCount('pending') },
                { key: 'approved', label: 'Approved', count: getTabCount('approved') },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    activeTab === t.key
                      ? isDark
                        ? 'bg-[#2a4d32]/20 text-[#8fd2a5] border-[#2a4d32]/30'
                        : 'bg-[#2a4d32]/10 text-[#2a4d32] border-[#2a4d32]/20'
                      : isDark
                        ? 'bg-white/0 text-white/60 border-white/10 hover:bg-white/5'
                        : 'bg-white text-slate-700 border-black/10 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`h-10 px-3 rounded-xl border text-sm outline-none ${
                  isDark
                    ? 'bg-white/0 border-white/10 text-white/80'
                    : 'bg-white border-black/10 text-slate-700'
                }`}
              >
                <option value="creation-asc">Creation time (asc)</option>
                <option value="creation-desc">Creation time (desc)</option>
                <option value="upload-asc">Upload time (asc)</option>
                <option value="upload-desc">Upload time (desc)</option>
              </select>
              <button
                onClick={() => setMediaView('grid')}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                  mediaView === 'grid'
                    ? isDark
                      ? 'bg-[#2a4d32]/20 border-[#2a4d32]/30'
                      : 'bg-[#2a4d32]/10 border-[#2a4d32]/20'
                    : isDark
                      ? 'border-white/10 bg-white/0 hover:bg-white/5'
                      : 'border-black/10 bg-white hover:bg-slate-50'
                }`}
                aria-label="Grid view"
              >
                <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
                </svg>
              </button>
              <button
                onClick={() => setMediaView('list')}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                  mediaView === 'list'
                    ? isDark
                      ? 'bg-[#2a4d32]/20 border-[#2a4d32]/30'
                      : 'bg-[#2a4d32]/10 border-[#2a4d32]/20'
                    : isDark
                      ? 'border-white/10 bg-white/0 hover:bg-white/5'
                      : 'border-black/10 bg-white hover:bg-slate-50'
                }`}
                aria-label="List view"
              >
                <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                {[
                  { key: 'all', label: 'All', icon: null },
                  { key: 'guest', label: 'Guest', icon: roleIcon('guest') },
                  { key: 'photographer', label: 'Photographer', icon: roleIcon('photographer') },
                  { key: 'groom', label: 'Groom', icon: roleIcon('groom') },
                  { key: 'bride', label: 'Bride', icon: roleIcon('bride') },
                ].map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setCreatorRoleFilter(r.key)}
                    className={`h-10 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 ${
                      creatorRoleFilter === r.key
                        ? isDark
                          ? 'bg-[#2a4d32]/20 text-[#8fd2a5] border-[#2a4d32]/30'
                          : 'bg-[#2a4d32]/10 text-[#2a4d32] border-[#2a4d32]/20'
                        : isDark
                          ? 'bg-white/0 border-white/10 text-white/70 hover:bg-white/5'
                          : 'bg-white border-black/10 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {r.icon}
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'portrait', label: 'Portrait' },
                { key: 'landscape', label: 'Landscape' },
              ].map((o) => (
                <button
                  key={o.key}
                  onClick={() => setOrientationFilter(o.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    orientationFilter === o.key
                      ? isDark
                        ? 'bg-[#2a4d32]/20 text-[#8fd2a5] border-[#2a4d32]/30'
                        : 'bg-[#2a4d32]/10 text-[#2a4d32] border-[#2a4d32]/20'
                      : isDark
                        ? 'bg-white/0 text-white/60 border-white/10 hover:bg-white/5'
                        : 'bg-white text-slate-700 border-black/10 hover:bg-slate-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className={`rounded-xl border px-4 py-3 ${isDark ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#2a4d32]/40 border-t-[#2a4d32]" />
          </div>
        ) : sorted.length === 0 ? (
          <div className={`rounded-2xl border p-8 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <div className={`mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <svg className={`w-8 h-8 ${isDark ? 'text-white/50' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <div className={`mt-4 text-base font-semibold ${isDark ? 'text-white/85' : 'text-slate-700'}`}>This folder is empty</div>
            <div className={`mt-1 text-sm ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
              Upload media or choose another folder to view moments.
            </div>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
            {sorted.map((moment, idx) => {
              const pill = pillForStatus(moment.status);
              const mDateRaw =
                moment?.creationTime ??
                moment?.media?.creationTime ??
                moment?.media?.capturedAt ??
                moment?.capturedAt ??
                moment?.captureTime ??
                moment?.uploadedAt ??
                moment?.createdAt;
              const mDateLabel = formatPlainTime(mDateRaw);
              const mName = moment?.media?.fileName || moment?.fileName || moment?.media?.name || moment?.name || `Moment ${moment?.id || moment?.momentId || ''}`;
              const mCreator = moment?.creatorDetails?.userName || 'Guest';
              const momentKey = String(moment?.id || moment?.momentId || '');
              const isFav = favoriteMomentIds.has(momentKey);
              const mW = Number(moment?.media?.width || moment?.media?.imageWidth || moment?.width || 0);
              const mH = Number(moment?.media?.height || moment?.media?.imageHeight || moment?.height || 0);
              const mAspect = mW > 0 && mH > 0 ? `${mW} / ${mH}` : undefined;
              return (
                <button
                  key={moment.id || moment.momentId}
                  onClick={() => openPreview(idx)}
                  className={`relative rounded-xl overflow-hidden border group ${
                    isDark ? 'border-white/10 bg-white/0' : 'border-black/10 bg-white'
                  } mb-4 w-full text-left break-inside-avoid hover:border-[#2a4d32]/30 transition-colors`}
                >
                  <div className="bg-black/10">
                    <HeicImage
                      src={moment.media?.feedUrl || moment.media?.url || moment.feedUrl || moment.url}
                      alt="Moment"
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: 'none' }}
                      aspectRatio={mAspect}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-event.jpg';
                      }}
                    />
                  </div>
                  <div className={`px-3 py-2 border-t ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-white'}`}>
                    <div className={`text-xs font-semibold truncate ${isDark ? 'text-white/80' : 'text-slate-800'}`}>{mName}</div>
                    <div className={`mt-1 text-[11px] ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
                      {mCreator} • {mDateLabel}
                    </div>
                  </div>
                  <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${pill.className}`}>
                    {pill.icon}
                    <span>{pill.label}</span>
                  </div>
                  {isFav && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-semibold">
                      Favorite
                    </div>
                  )}

                  {/* Hover actions: center approve/reject like reference */}
                </button>
              );
            })}
          </div>
        )}

        {/* Infinite-scroll sentinel + loading indicator for the next page */}
        {!loading && sorted.length > 0 && (
          <div ref={loadMoreSentinelRef} className="w-full flex items-center justify-center py-8">
            {loadingMore ? (
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2a4d32]/40 border-t-[#2a4d32]" />
            ) : !hasMoreMoments ? (
              <span className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                You’ve reached the end
              </span>
            ) : null}
          </div>
        )}

        {previewOpen && sorted[previewIndex] && (
          <div
            className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setPreviewScale(1)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); closePreview(); }}
              className="absolute top-5 left-5 h-10 px-3 inline-flex items-center gap-2 rounded-xl border border-white/20 text-white hover:bg-white/10"
              aria-label="Back"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); closePreview(); }}
              className="absolute top-5 right-5 w-10 h-10 rounded-xl border border-white/20 text-white hover:bg-white/10"
              aria-label="Close preview"
            >
              <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={() => movePreview(-1)}
              className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl border border-white/20 text-white hover:bg-white/10"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => movePreview(1)}
              className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl border border-white/20 text-white hover:bg-white/10"
              aria-label="Next image"
            >
              <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/40">
                <div
                  className={`w-full max-h-[78vh] overflow-auto touch-none ${previewScale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  onWheel={handleWheelZoom}
                  onClick={handleClickZoom}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <HeicImage
                    src={sorted[previewIndex].media?.feedUrl || sorted[previewIndex].media?.url || sorted[previewIndex].feedUrl || sorted[previewIndex].url}
                    alt="Preview"
                    className="w-full max-h-[78vh] object-contain origin-center transition-transform duration-150"
                    style={{ transform: `scale(${previewScale})` }}
                  />
                </div>
              </div>
              {(() => {
                const m = sorted[previewIndex];
                const fileName = m.media?.fileName || m.fileName || m.media?.name || m.name || `Moment ${m.id || m.momentId || ''}`;
                const role = getCreatorRole(m);
                const tags = getTaggedUserNames(m);
                const isFav = favoriteMomentIds.has(String(m.id || m.momentId || ''));
                const status = String(m.status || m.moderationStatus || '').toUpperCase();
                const cardCls = isDark ? 'bg-[#1F2A23] border-white/15 text-white' : 'bg-white border-black/10 text-slate-800';
                const labelCls = isDark ? 'text-white/45' : 'text-slate-400';
                const dividerCls = isDark ? 'border-white/10' : 'border-black/5';
                const statusPill = status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400'
                  : status === 'REJECTED' ? 'bg-red-500/15 text-red-400'
                  : isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-slate-600';
                const field = (label, value) => (
                  <div className="min-w-0">
                    <div className={`text-[10px] uppercase tracking-wide ${labelCls}`}>{label}</div>
                    <div className="text-xs md:text-sm font-medium truncate" title={typeof value === 'string' ? value : undefined}>{value}</div>
                  </div>
                );
                return (
                  <div className={`mt-3 rounded-2xl border p-4 md:p-5 ${cardCls}`}>
                    {/* header: name + role, status + index */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate" title={fileName}>{fileName}</div>
                        <div className="mt-1 inline-flex items-center gap-2 text-xs opacity-80">
                          {roleIcon(role)}<span className="capitalize">{role}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {status && <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusPill}`}>{status}</span>}
                        <span className="text-xs opacity-60">{previewIndex + 1} / {sorted.length}</span>
                      </div>
                    </div>

                    {/* metadata grid */}
                    <div className={`mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-4 ${dividerCls}`}>
                      {field('Created', formatPlainTime(m.creationTime ?? m.media?.creationTime))}
                      {field('Uploaded', formatPlainTime(m.uploadTime ?? m.uploadedAt ?? m.media?.uploadTime))}
                      {field('Uploaded by', m?.creatorDetails?.userName || 'Unknown')}
                      {field('Tagged', tags.length ? tags.join(', ') : 'None')}
                    </div>

                    {/* actions */}
                    <div className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-4 ${dividerCls}`}>
                      <button
                        onClick={() => handleStatusChange(m, 'APPROVED')}
                        className="px-4 h-9 rounded-lg bg-brand hover:bg-brand-2 text-on-brand text-xs font-semibold border border-[#2a4d32]/40"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusChange(m, 'REJECTED')}
                        className="px-4 h-9 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold border border-red-400/40"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => toggleFavorite(m)}
                        className={`px-4 h-9 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 ${
                          isFav
                            ? 'bg-amber-500 border-amber-300/40 text-white'
                            : isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/10 text-slate-700'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L11.48 17l-5.2 2.73.99-5.79L3.06 9.62l5.82-.85z" />
                        </svg>
                        {isFav ? 'Favorited' : 'Favorite'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const rootBg = isDark ? 'bg-[#141C17]' : 'bg-white';
  const rootText = isDark ? 'text-white' : 'text-slate-900';

  return (
    <div className={`min-h-screen ${rootBg} ${rootText} font-sans ${isDark ? 'admin-theme-dark' : 'admin-theme-light'}`}>
      <div className="flex min-h-screen">
        {renderSidebar()}
        <main className="flex-1 overflow-x-hidden transition-all duration-300">
          <div className={`sticky top-0 z-30 px-6 py-3.5 border-b backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#141C17]/80' : 'border-black/10 bg-white/80'}`}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'} flex items-center gap-2`}>
                    <span className="truncate">Projects</span>
                    <span className={isDark ? 'text-white/30' : 'text-slate-400'}>›</span>
                    <span className={`font-semibold truncate ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                      {eventData?.eventName || eventData?.name || 'Project'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin/events')}
                  className={`hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      : 'bg-white border-black/10 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <svg className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>

              {/* 3 top tabs */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveView('media')}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                    activeView === 'media'
                      ? `bg-[#2a4d32]/20 border-[#2a4d32]/30 ${isDark ? 'text-[#8fd2a5]' : 'text-[#1a3020]'}`
                      : isDark
                        ? 'bg-white/0 border-white/10 text-white/60 hover:bg-white/5'
                        : 'bg-white border-black/10 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <svg className={`w-4 h-4 ${activeView === 'media' ? (isDark ? 'text-[#8fd2a5]' : 'text-[#2a4d32]') : isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4 4 4 4-8 4 8v4H4v-4z" />
                  </svg>
                  Media
                </button>

                <button
                  onClick={() => setActiveView('delivery')}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                    activeView === 'delivery'
                      ? `bg-[#2a4d32]/20 border-[#2a4d32]/30 ${isDark ? 'text-[#8fd2a5]' : 'text-[#1a3020]'}`
                      : isDark
                        ? 'bg-white/0 border-white/10 text-white/60 hover:bg-white/5'
                        : 'bg-white border-black/10 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <svg className={`w-4 h-4 ${activeView === 'delivery' ? (isDark ? 'text-[#8fd2a5]' : 'text-[#2a4d32]') : isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8" />
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 16l5 5 5-5" />
                  </svg>
                  Delivery &amp; Gallery
                </button>

                <button
                  onClick={() => setActiveView('guestApp')}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                    activeView === 'guestApp'
                      ? `bg-[#2a4d32]/20 border-[#2a4d32]/30 ${isDark ? 'text-[#8fd2a5]' : 'text-[#1a3020]'}`
                      : isDark
                        ? 'bg-white/0 border-white/10 text-white/60 hover:bg-white/5'
                        : 'bg-white border-black/10 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <svg className={`w-4 h-4 ${activeView === 'guestApp' ? (isDark ? 'text-[#8fd2a5]' : 'text-[#2a4d32]') : isDark ? 'text-white/70' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M11 16h2" />
                  </svg>
                  Guest App
                </button>
              </div>
            </div>
          </div>

          {/* Project journey: Collect → Select → Deliver */}
          <div className={`px-6 py-4 border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-slate-50'}`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
                Project journey
              </div>
              <div className={`text-xs ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
                Current stage: <span className={isDark ? 'text-[#8fd2a5] font-semibold' : 'text-[#2a4d32] font-semibold'}>
                  {JOURNEY_STAGES.find((s) => s.key === journeyStage)?.label || 'Select'}
                </span>
              </div>
            </div>
            <div className="flex items-center">
              {JOURNEY_STAGES.map((stage, idx) => {
                const activeIdx = JOURNEY_STAGES.findIndex((s) => s.key === journeyStage);
                const isActive = stage.key === journeyStage;
                const isDone = idx < activeIdx;
                const reached = idx <= activeIdx;
                return (
                  <React.Fragment key={stage.key}>
                    <button
                      onClick={() => changeJourneyStage(stage.key)}
                      className="flex items-center gap-3 group"
                      title={`Set stage to ${stage.label}`}
                    >
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors ${
                          reached
                            ? 'bg-brand text-on-brand border-[#2a4d32]/30'
                            : isDark
                              ? 'bg-white/5 text-white/50 border-white/10 group-hover:bg-white/10'
                              : 'bg-white text-slate-400 border-black/10 group-hover:bg-slate-50'
                        }`}
                      >
                        {isDone ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <div className="text-left hidden sm:block">
                        <div className={`text-sm font-semibold ${isActive ? (isDark ? 'text-white' : 'text-slate-900') : isDark ? 'text-white/60' : 'text-slate-500'}`}>
                          {stage.label}
                        </div>
                        <div className={`text-[11px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{stage.desc}</div>
                      </div>
                    </button>
                    {idx < JOURNEY_STAGES.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-3 rounded-full ${idx < activeIdx ? 'bg-brand' : isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="px-6 py-6">
            {activeView === 'media' && renderMediaTab()}
            {activeView === 'delivery' && renderDeliveryAndGallery()}
            {activeView === 'guestApp' && renderGuestAppConfig()}
          </div>
        </main>
      </div>

      {/* QR Code Modal */}
      {showQRModal && renderQRModal()}
    </div>
  );
};

export default EventDetails; 