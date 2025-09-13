import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeView, setActiveView] = useState('details'); // 'details', 'moments', 'guests'
  const [guests, setGuests] = useState([]);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [showQRModal, setShowQRModal] = useState(false);

  // Bulk upload states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Get event data from navigation state
  const eventData = location.state?.eventData;

  useEffect(() => {
    fetchGuests();
    if (activeView === 'moments') {
      fetchMoments();
    }
  }, [eventId, activeView]);

  const fetchGuests = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `https://momentsbackend-673332237675.us-central1.run.app/api/event/users/${eventId}`,
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
        'https://momentsbackend-673332237675.us-central1.run.app/api/moments/feed',
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
        'https://momentsbackend-673332237675.us-central1.run.app/api/moments/status',
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

  const renderEventDetails = () => (
    <div className="bg-white bg-opacity-90 rounded-xl shadow-2xl overflow-hidden border border-[#d4d4d8]">
      {/* Event Image */}
      <div className="relative h-64">
        <img
          src={eventData?.coverImage || '/default-event.jpg'}
          alt={eventData?.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-event.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h2 className="text-3xl font-bold text-[#2a4d32] mb-2">{eventData?.name}</h2>
          <div className="flex items-center space-x-4 text-[#2a4d32]/80">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(eventData?.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{eventData?.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold text-[#2a4d32] mb-4">Event Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Description</p>
                <p className="text-[#2a4d32] mt-1">{eventData?.description}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Organizer</p>
                <p className="text-[#2a4d32] mt-1">{eventData?.organizer}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-[#2a4d32] mt-1">{eventData?.status}</p>
              </div>
              <div>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="mt-4 flex items-center space-x-2 bg-[#67143A] hover:bg-[#4f0f2d] text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-4m6 6v4m-6-4h6m-6 4h6m-6-4h6M4 8h6M4 12h6m-6 4h6" />
                  </svg>
                  <span>Generate QR Code</span>
                </button>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#2a4d32] mb-4">Event Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Guests</p>
                <p className="text-2xl font-bold text-[#2a4d32] mt-1">{guests.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Moments</p>
                <p className="text-2xl font-bold text-[#2a4d32] mt-1">{moments.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-gray-400 text-sm">Approved Moments</p>
                <p className="text-2xl font-bold text-[#2a4d32] mt-1">
                  {moments.filter(m => m.status?.toUpperCase() === 'APPROVED').length}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-gray-400 text-sm">Pending Moments</p>
                <p className="text-2xl font-bold text-[#2a4d32] mt-1">
                  {moments.filter(m => m.status?.toUpperCase() === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGuests = () => {
    // Debug log
    console.log('Rendering guests:', guests);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guests && guests.length > 0 ? (
          guests.map((guest) => (
            <div key={guest.phoneNumber} className="bg-white bg-opacity-90 rounded-xl shadow-2xl p-6 border border-[#d4d4d8]">
              <h3 className="text-lg font-semibold text-[#2a4d32]">{guest.name || 'No Name'}</h3>
              <p className="text-gray-400">Phone: {guest.phoneNumber}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-400">
            No guests found
          </div>
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
        'https://momentsbackend-673332237675.us-central1.run.app/api/files/upload',
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
        'https://momentsbackend-673332237675.us-central1.run.app/api/moments/batch',
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
            : 'bg-[#67143A] hover:bg-[#4f0f2d] text-white'
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
              value={`https://moments.live/event/${eventId}`}
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/logo.svg",
                height: 40,
                width: 40,
                excavate: true,
              }}
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
          className="w-full bg-[#67143A] hover:bg-[#4f0f2d] text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
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
          {/* Back Navigation */}
          <button
            onClick={() => navigate('/admin/events')}
            className="mb-6 flex items-center text-[#2a4d32] hover:text-[#2a4d32] font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>

          {/* Master View Navigation */}
          <div className="flex space-x-4 mb-8 border-b border-gray-700">
            {['details', 'moments', 'guests'].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  activeView === view
                    ? 'text-[#2a4d32] border-b-2 border-[#2a4d32]'
                    : 'text-gray-400 hover:text-[#2a4d32]'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Detail View Content */}
          {activeView === 'details' && renderEventDetails()}
          
          {activeView === 'moments' && (
            <>
              {/* Bulk Upload Card */}
              {renderBulkUploadCard()}

              {/* Existing Moments Tabs */}
              <div className="flex space-x-4 mb-8 border-b border-gray-700">
                {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium capitalize ${
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
                      <div className="relative">
                        <img
                          src={moment.media?.url}
                          alt="Moment"
                          className="w-full h-auto"
                          style={{ maxHeight: 'none' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/default-event.jpg';
                          }}
                        />
                      </div>

                      {/* Moment Details */}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-[#2a4d32]">
                              {moment.creatorDetails?.userName || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {formatDate(moment.uploadTime)}
                            </p>
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
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
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
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
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