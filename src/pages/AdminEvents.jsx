import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user profile and token from storage
    const profile = sessionStorage.getItem('userProfile');
    const token = localStorage.getItem('adminToken');
    
    console.log('Token:', token); // Debug log
    console.log('Raw Profile:', profile); // Debug log

    // Check if we have both token and profile
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      navigate('/admin/login');
      return;
    }

    // Safely parse the profile if it exists
    if (profile) {
      try {
        const parsedProfile = JSON.parse(profile);
        console.log('Parsed Profile:', parsedProfile); // Debug log
        setUserProfile(parsedProfile);
      } catch (err) {
        console.error('Error parsing user profile:', err);
      }
    }

    // Fetch events
    const fetchEvents = async () => {
      try {
        console.log('Fetching events with token:', token);
        const response = await axios.get(
          'https://momentsbackend-673332237675.us-central1.run.app/api/event',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Events response:', response.data); // Debug log
        
        // Handle the response data properly
        const eventsData = response.data.data || response.data || [];
        console.log('Events data:', eventsData); // Debug log
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch (err) {
        console.error('Error fetching events:', err.response || err);
        if (err.response?.status === 401) {
          // If unauthorized, redirect to login
          navigate('/admin/login');
        } else {
          setError('Failed to fetch events. Please try again.');
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
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        'https://momentsbackend-673332237675.us-central1.run.app/api/files/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
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

      // Get creator ID from userProfile
      const creatorId = userProfile?.userId;
      if (!creatorId) {
        throw new Error('Creator ID not found in user profile');
      }

      // Then create the event with the publicUrl
      const token = localStorage.getItem('adminToken');
      const eventData = {
        creatorId: creatorId,
        eventThumbnail: imageUrl, // This will now be the publicUrl from the upload response
        eventName: newEventName
      };

      console.log('Creating event with data:', eventData);

      const response = await axios.post(
        'https://momentsbackend-673332237675.us-central1.run.app/api/event',
        eventData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
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

  const renderCreateEventCard = () => (
    <div 
      onClick={() => setShowCreateModal(true)}
      className="bg-white bg-opacity-90 rounded-xl shadow-2xl overflow-hidden border border-[#d4d4d8] hover:border-[#2a4d32] transition-colors cursor-pointer flex items-center justify-center h-[300px]"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#2a4d32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-[#2a4d32] font-medium">Create New Event</p>
      </div>
    </div>
  );

  const renderCreateEventModal = () => (
    <div className="fixed inset-0 bg-[#f3efe6] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-[#2a4d32] mb-6">Create New Event</h2>
        
        {error && (
          <div className="bg-[#2a4d32]/20 border border-[#2a4d32] text-[#2a4d32] px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Name
            </label>
            <input
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#d4d4d8] text-[#2a4d32] px-4 py-2 focus:border-[#2a4d32] focus:ring-[#2a4d32]"
              placeholder="Enter event name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Thumbnail
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#d4d4d8] rounded-lg p-4 text-center cursor-pointer hover:border-[#2a4d32] transition-colors"
            >
              {selectedImage ? (
                <div className="relative">
                  <img 
                    src={URL.createObjectURL(selectedImage)} 
                    alt="Selected" 
                    className="max-h-40 mx-auto"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                    }}
                    className="absolute top-2 right-2 bg-[#2a4d32] text-white rounded-full p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Click to upload image</p>
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

          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 bg-gray-700 text-[#2a4d32] py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateEvent}
              disabled={uploading || !newEventName || !selectedImage}
              className={`flex-1 bg-[#2a4d32] text-white py-2 px-4 rounded-lg hover:opacity-90 transition-colors ${
                (uploading || !newEventName || !selectedImage) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3efe6] to-[#f3efe6] text-[#2a4d32] font-sans relative overflow-hidden">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f3efe6] bg-opacity-90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Moments" className="h-8 w-8" />
            <span className="text-xl font-semibold">moments</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Welcome! {userProfile?.name || 'Admin'}
            </h1>
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
          ) : events.length > 0 ? (
            /* Events Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderCreateEventCard()}
              {events.map((event) => (
                <div 
                  key={event.eventId}
                  onClick={() => handleEventClick(event.eventId)}
                  className="bg-white bg-opacity-90 rounded-xl shadow-2xl overflow-hidden border border-[#d4d4d8] hover:border-[#2a4d32] transition-colors cursor-pointer"
                >
                  {/* Event Thumbnail */}
                  <div className="relative h-48 bg-white">
                    {event.eventThumbnail ? (
                      <img
                        src={event.eventThumbnail}
                        alt={event.eventName || 'Event'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-event.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white">
                        <svg 
                          className="w-12 h-12 text-gray-600" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="p-6">
                    {/* Event Name */}
                    <h3 className="text-2xl font-bold mb-3 text-[#2a4d32]">
                      {event.eventName}
                    </h3>
                    
                    {/* Event ID */}
                    <p className="text-gray-400 text-sm mb-4">
                      Event ID: {event.eventId}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex justify-between text-sm text-gray-300">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{event.totalMoments || 0} Moments</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{event.memberCount || 0} Members</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No events found
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && renderCreateEventModal()}
    </div>
  );
};

export default AdminEvents; 