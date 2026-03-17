import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { useMetaTags } from '../hooks/useMetaTags';
import MomentUploader from '../components/MomentUploader';
import { API_BASE_URL } from '../config/api';
import heic2any from 'heic2any';

// Component to handle HEIC image conversion
const HeicImage = ({ src, alt, className, style, onError }) => {
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
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2a4d32]"></div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        style={style}
        onError={onError}
      />
    </div>
  );
};

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeView, setActiveView] = useState('moments'); // 'moments', 'guests'
  const [guests, setGuests] = useState([]);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [showQRModal, setShowQRModal] = useState(false);
  const [copiedMomentId, setCopiedMomentId] = useState(null);
  const [rotatingMomentId, setRotatingMomentId] = useState(null);

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
    
    // If event has a date, append it
    if (eventData.date) {
      const date = new Date(eventData.date);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
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

  const fetchMoments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_BASE_URL}/api/moments/feed`,
        {
          eventId,
          cursor: {
            limit: 500
          },
          filter: {
            source: "web"
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Debug log
      console.log('Moments response:', response.data);
      
      // Handle the response data properly - access moments from data.moments
      const momentsData = response.data.data?.moments || [];
      setMoments(Array.isArray(momentsData) ? momentsData : []);
    } catch (err) {
      setError('Failed to fetch moments');
      console.error('Error fetching moments:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const getTabCount = (status) => {
    if (status === 'all') return moments.length;
    // Convert status to uppercase for comparison
    return moments.filter(m => m.status?.toUpperCase() === status.toUpperCase()).length;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
        `https://momentsfacetagging-673332237675.asia-south2.run.app/api/v1/face-embeddings/moment/${momentId}/rotate`,
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
              <span>{eventData?.date ? new Date(eventData.date).toLocaleDateString() : 'N/A'}</span>
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
              className="mt-4 md:mt-6 w-full md:w-auto flex items-center justify-center space-x-2 bg-[#2a4d32] hover:bg-[#1e3b27] text-white px-4 py-2 md:py-3 rounded-lg transition-colors font-medium"
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
                  ? 'bg-[#2a4d32] text-white'
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
                  ? 'bg-[#2a4d32] text-white'
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
                  ? 'bg-[#2a4d32] text-white'
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
              : 'bg-[#2a4d32] hover:bg-[#1e3b27] text-white'
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
              className="w-full bg-[#2a4d32] hover:bg-[#1e3b27] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
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
            : 'bg-[#2a4d32] hover:bg-[#1e3b27] text-white'
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
          className="w-full bg-[#2a4d32] hover:bg-[#1e3b27] text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download QR Code</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3efe6] to-[#f3efe6] text-[#2a4d32] font-sans relative overflow-hidden">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f3efe6] bg-opacity-90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-center items-center">
          <div className="flex items-center justify-center">
            <img src="/logo.png" alt="Moments" className="h-[33.6px] w-[281px]" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Back Navigation */}
          <button
            onClick={() => navigate('/admin/events')}
            className="mb-6 flex items-center text-[#2a4d32] hover:text-[#1e3b27] font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>

          {/* Event Details Header */}
          {renderEventDetailsHeader()}

          {/* Tabs Navigation - Mobile Friendly */}
          <div className="flex space-x-2 md:space-x-4 mb-6 md:mb-8 border-b border-gray-300 overflow-x-auto">
            {[
              { key: 'moments', label: 'Moments', count: moments.length },
              { key: 'guests', label: 'Guests', count: guests.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                className={`px-3 md:px-4 py-2 text-sm md:text-base font-medium whitespace-nowrap transition-colors ${
                  activeView === tab.key
                    ? 'text-[#2a4d32] border-b-2 border-[#2a4d32]'
                    : 'text-gray-400 hover:text-[#2a4d32]'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          
          {activeView === 'moments' && (
            <>
              {/* Upload Moments Component */}
              <MomentUploader 
                eventId={eventId} 
                onUploadComplete={async (count) => {
                  console.log(`Successfully uploaded ${count} moments`);
                  // Refresh moments list after upload
                  await fetchMoments();
                }}
              />

              {/* Existing Moments Tabs - Mobile Friendly */}
              <div className="flex space-x-2 md:space-x-4 mb-6 md:mb-8 border-b border-gray-300 overflow-x-auto">
                {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                      activeTab === tab
                        ? 'text-[#2a4d32] border-b-2 border-[#2a4d32]'
                        : 'text-gray-400 hover:text-[#2a4d32]'
                    }`}
                  >
                    {tab} ({getTabCount(tab)})
                  </button>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-[#2a4d32]/20 border border-[#2a4d32] text-[#2a4d32] px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2a4d32]"></div>
                </div>
              ) : (
                /* Moments Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMoments.map((moment) => (
                    <div
                      key={moment.id}
                      className="bg-white bg-opacity-90 rounded-xl shadow-2xl overflow-hidden border border-[#d4d4d8]"
                    >
                      {/* Moment Image - Updated to show full image */}
                      <div className="relative group">
                        <HeicImage
                          src={moment.media?.feedUrl || moment.media?.url || moment.feedUrl || moment.url}
                          alt="Moment"
                          className="w-full h-auto"
                          style={{ maxHeight: 'none' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            // Try fallback to url if feedUrl fails
                            const fallbackUrl = moment.media?.url || moment.url;
                            if (fallbackUrl && e.target.src !== fallbackUrl) {
                              e.target.src = fallbackUrl;
                            } else {
                              e.target.src = '/default-event.jpg';
                            }
                          }}
                        />
                        {/* Rotate Button */}
                        <button
                          onClick={() => rotateMoment(moment)}
                          disabled={rotatingMomentId === (moment.id || moment.momentId)}
                          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                          title="Rotate Image"
                        >
                          {rotatingMomentId === (moment.id || moment.momentId) ? (
                            <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Moment Details */}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#2a4d32] mb-2">
                              {moment.creatorDetails?.userName || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-400 mb-2">
                              {formatDate(moment.uploadTime)}
                            </p>
                            {/* Tagged Users and Moment ID */}
                            <div className="flex items-start justify-between gap-4 mt-2">
                              {/* Tagged Users */}
                              {(() => {
                                const taggedNames = getTaggedUserNames(moment);
                                if (taggedNames.length > 0) {
                                  return (
                                    <div className="flex-1">
                                      <p className="text-xs text-gray-500 mb-1">Tagged:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {taggedNames.map((name, index) => (
                                          <span
                                            key={index}
                                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                          >
                                            {name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              {/* Moment ID */}
                              {(moment.id || moment.momentId) && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="text-xs text-gray-500 font-mono">
                                    ID: {moment.id || moment.momentId}
                                  </span>
                                  <button
                                    onClick={() => copyMomentId(moment.id || moment.momentId)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title={copiedMomentId === (moment.id || moment.momentId) ? 'Copied!' : 'Copy ID'}
                                  >
                                    {copiedMomentId === (moment.id || moment.momentId) ? (
                                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            moment.status?.toUpperCase() === 'APPROVED' ? 'bg-green-900/50 text-green-300' :
                            moment.status?.toUpperCase() === 'REJECTED' ? 'bg-[#2a4d32]/20 text-red-300' :
                            'bg-yellow-900/50 text-yellow-300'
                          }`}>
                            {moment.status}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-4">
                          {moment.status?.toUpperCase() === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(moment, 'APPROVED')}
                                className="flex-1 bg-[#2a4d32] hover:bg-[#1e3b27] text-white py-2 px-4 rounded-md transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(moment, 'REJECTED')}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {moment.status?.toUpperCase() === 'APPROVED' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(moment, 'PENDING')}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black py-2 px-4 rounded-md transition-colors"
                              >
                                Re-Review
                              </button>
                              <button
                                onClick={() => handleStatusChange(moment, 'REJECTED')}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {moment.status?.toUpperCase() === 'REJECTED' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(moment, 'APPROVED')}
                                className="flex-1 bg-[#2a4d32] hover:bg-[#1e3b27] text-white py-2 px-4 rounded-md transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(moment, 'PENDING')}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black py-2 px-4 rounded-md transition-colors"
                              >
                                Re-Review
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeView === 'guests' && renderGuests()}
          
          {/* QR Code Modal */}
          {showQRModal && renderQRModal()}
        </div>
      </div>
    </div>
  );
};

export default EventDetails; 