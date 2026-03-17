import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useMetaTags } from '../hooks/useMetaTags';
import { API_BASE_URL } from '../config/api';

const PublicEvent = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop'); // 'ios', 'android', 'desktop'
  const eventNameRef = useRef(null);
  const [eventNameFontSize, setEventNameFontSize] = '36px';

  // Detect device type
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      // Check for iOS
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        setDeviceType('ios');
        return;
      }
      
      // Check for Android
      if (/android/i.test(userAgent)) {
        setDeviceType('android');
        return;
      }
      
      // Default to desktop
      setDeviceType('desktop');
    };

    detectDevice();
  }, []);

  // Auto-adjust event name font size to fit on one line
  useEffect(() => {
    const adjustFontSize = () => {
      if (!eventNameRef.current || !eventData?.eventName) return;
      
      // Wait for fonts to load and DOM to be ready
      requestAnimationFrame(() => {
        const element = eventNameRef.current;
        if (!element) return;
        
        const container = element.parentElement;
        if (!container) return;
        
        const containerWidth = container.offsetWidth - 48; // Account for padding (24px each side)
        
        // Start with a base font size based on screen size
        let fontSize = window.innerWidth < 768 ? 32 : 56; // Mobile: 32px, Desktop: 56px
        element.style.fontSize = `${fontSize}px`;
        
        // Check if text overflows and reduce font size until it fits
        while (element.scrollWidth > containerWidth && fontSize > 12) {
          fontSize -= 0.5; // Reduce by 0.5px for smoother adjustment
          element.style.fontSize = `${fontSize}px`;
        }
        
        setEventNameFontSize(`${fontSize}px`);
      });
    };

    if (eventData?.eventName) {
      // Small delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(adjustFontSize, 100);
      
      // Adjust on window resize with debounce
      let resizeTimeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(adjustFontSize, 150);
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(resizeTimeout);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [eventData?.eventName]);

  // Debug: Log that this component is rendering
  useEffect(() => {
    console.log('PublicEvent component rendered for eventId:', eventId);
  }, [eventId]);

  // Fetch event details - public endpoint, no authentication required
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError('');
        // Fetch event details from public API endpoint (no auth token)
        const response = await axios.get(
          `${API_BASE_URL}/api/event/${eventId}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        const fetchedEventData = response.data?.data || response.data;
        if (fetchedEventData) {
          setEventData(fetchedEventData);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        // If API call fails, show error message
        // This is a public page, so we don't check for authentication
        if (err.response?.status === 404) {
          setError('Event not found');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          // If endpoint requires auth, we still show the page but with limited info
          // You may want to create a public endpoint for events
          setError('Event information is not publicly available');
        } else {
          setError('Unable to load event details. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

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

  // Get event URL
  const getEventUrl = () => {
    return `https://admin.moments.live/event/${eventId}`;
  };

  // Copy event code to clipboard
  const copyEventCode = async () => {
    try {
      await navigator.clipboard.writeText(eventId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = eventId;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
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

  // App Store and Play Store links
  const appStoreLink = 'https://apps.apple.com/in/app/moments-for-a-lifetime/id6738057205';
  const playStoreLink = 'https://play.google.com/store/apps/details?id=com.moments.live&pcampaignid=web_share';

  // Format event name: split into 3 words, first and third use Inter, middle uses Petite Formal Script
  const formatEventName = (eventName) => {
    if (!eventName) return null;
    const words = eventName.trim().split(/\s+/);
    if (words.length !== 3) {
      // If not exactly 3 words, return as is with Inter font
      return <span style={{ fontFamily: 'Inter, sans-serif', color: '#294D32' }}>{eventName}</span>;
    }
    return (
      <span style={{ color: '#294D32' }}>
        <span style={{ fontFamily: 'Inter, sans-serif' }}>{words[0]} </span>
        <span style={{ fontFamily: '"Petit Formal Script", cursive' }}>{words[1]} </span>
        <span style={{ fontFamily: 'Inter, sans-serif' }}>{words[2]}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f3efe6] to-[#f3efe6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: '#294D32' }}></div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f3efe6] to-[#f3efe6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#294D32', fontFamily: 'Inter, sans-serif' }}>Event Not Found</h1>
          <p className="text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>{error || 'The event you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  // Get first and third words for the welcome message
  const getEventNameParts = (eventName) => {
    if (!eventName) return { first: '', third: '' };
    const words = eventName.trim().split(/\s+/);
    if (words.length >= 3) {
      return { first: words[0], third: words[2] };
    }
    return { first: words[0] || '', third: words[words.length - 1] || '' };
  };

  const nameParts = getEventNameParts(eventData?.eventName);

  const instructionSteps = [
    {
      id: 'download',
      title: 'How to Use',
      body: 'Start by installing the Moments app using the buttons below, then return to this page to continue.',
      image: null,
      alt: null
    },
    {
      id: 'enter-event',
      title: 'Enter the Event',
      body: 'Open the app, tap "Join Event", and either scan the QR code shown here or enter the event code below.',
      image: '/images/instructions/enter-event.png',
      alt: 'Join event flow'
    },
    {
      id: 'upload-moments',
      title: 'Click / Upload Moments',
      body: 'Use the “Camera” button to capture live photos or upload from your gallery. Everything appears instantly on the shared live stream.',
      alt: 'Upload moments screen'
    },
    {
      id: 'photos-of-me',
      title: 'Photos of Me',
      body: 'Want every shot you appear in? Select “Photos of Me”, Upload a selfie and instantly filter the gallery to just your best moments.',
      alt: 'Photos of me filter'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3efe6] to-[#f3efe6]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="bg-[#f3efe6] bg-opacity-90 backdrop-blur-sm border-b border-[#d4d4d8]">
        <div className="container mx-auto px-4 py-4 flex justify-center items-center">
          <img src="/logo.png" alt="Moments" className="h-[33.6px] w-[281px]" />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white bg-opacity-90 rounded-xl shadow-2xl overflow-hidden border border-[#d4d4d8]">
          {/* Event Thumbnail - 1:1 ratio */}
          <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
            <img
              src={eventData.eventThumbnail || eventData.coverImage || '/default-event.jpg'}
              alt={eventData.eventName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-event.jpg';
              }}
            />
          </div>

          {/* Event Name Below Image */}
          <div className="p-2 md:p-8 text-center">
            <h1 
              ref={eventNameRef}
              className="font-bold mb-6 w-full px-6 text-center break-words" 
              style={{ 
                color: '#294D32',
                fontSize: eventNameFontSize,
                lineHeight: '1.1',
                transition: 'font-size 0.2s ease'
              }}
            >
              {formatEventName(eventData.eventName)}
            </h1>

            {/* Welcome Message */}
            <p className="mb-3 text-center" style={{ color: '#294D32', fontFamily: 'Inter, sans-serif' }}>
              {nameParts.first && nameParts.third ? (
                <>
                  <span style={{ fontFamily: '"Petit Formal Script", cursive' }}> <br />
                  You’re a big part of our story, and we want to see the wedding through your eyes.
                  <br />
                  Please share your moments with us  — every smile, every dance, every candid counts.
                  <br />
Thank you for being here, it truly means a lot. ❤️</span>
                </>
              ) : (
                <span style={{ fontFamily: '"Petit Formal Script", cursive' }}>
                  {eventData.eventName} 
                  <br />
                  You’re a big part of our story, and we want to see the wedding through your eyes.
                  <br />
                  Please share your moments with us on moments.live — every smile, every dance, every candid counts.
                  <br />
Thank you for being here, it truly means a lot. ❤️
                </span>
              )}
            </p>

            <div className="mb-8 text-left">
              <h2 className="text-xs md:text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#294D32' }}>
                How to Use Moments
              </h2>
              <div className="space-y-4">
                {instructionSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg border border-[#d4d4d8] bg-[#fdfaf3]"
                  >
                    {step.image ? (
                      <img
                        src={step.image}
                        alt={step.alt || step.title}
                        className="w-32 sm:w-28 max-w-[140px] h-auto max-h-40 object-contain rounded-md border border-[#d4d4d8] bg-white mx-auto sm:mx-0"
                      />
                    ) : null}
                    <div>
                      <p className="text-[10px] md:text-xs uppercase tracking-wide text-[#67143A] mb-1">
                        Step {index + 1}
                      </p>
                      <p className="text-sm md:text-base font-semibold text-[#294D32] mb-1">{step.title}</p>
                      <p className="text-xs md:text-sm text-[#294D32] mb-3">{step.body}</p>
                      {step.id === 'download' && (
                        <div className="flex flex-col sm:flex-row gap-4">
                          {(deviceType === 'ios' || deviceType === 'desktop') && (
                            <a
                              href={appStoreLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                              </svg>
                              <div className="text-left">
                                <div className="text-xs">Download on the</div>
                                <div className="text-sm font-semibold">App Store</div>
                              </div>
                            </a>
                          )}
                          {(deviceType === 'android' || deviceType === 'desktop') && (
                            <a
                              href={playStoreLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                              </svg>
                              <div className="text-left">
                                <div className="text-xs">Get it on</div>
                                <div className="text-sm font-semibold">Google Play</div>
                              </div>
                            </a>
                          )}
                        </div>
                      )}
                      {step.id === 'enter-event' && (
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              readOnly
                              value={eventId}
                              className="flex-1 bg-white border border-[#d4d4d8] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#294D32]"
                              style={{ color: '#294D32', fontFamily: 'Inter, sans-serif' }}
                            />
                            <button
                              onClick={copyEventCode}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                copied
                                  ? 'bg-green-600 text-white'
                                  : 'bg-[#67143A] hover:bg-[#4f0f2d] text-white'
                              }`}
                            >
                              {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                          </div>
                          <p className="text-[11px] text-[#6b7280]">
                            Tip: Show the QR code on this page so guests can scan it directly.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicEvent;

