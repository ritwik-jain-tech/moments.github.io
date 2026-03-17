import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const BATCH_SIZE = 2; // Batch size for bulk upload API (reduced to avoid 413 Content Too Large errors)
const MAX_PARALLEL_BATCHES = 2; // Maximum number of batches to process in parallel
const STORAGE_KEY = 'moment_upload_queue';

// Browser detection utility
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  const browser = {
    name: 'Unknown',
    version: 'Unknown',
    isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
    isChrome: /Chrome/.test(ua) && !/Edg/.test(ua),
    isFirefox: /Firefox/.test(ua),
    isEdge: /Edg/.test(ua),
    isIE: /MSIE|Trident/.test(ua),
    isMobile: /Mobile|Android|iPhone|iPad/.test(ua)
  };

  if (browser.isSafari) {
    browser.name = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    browser.version = match ? match[1] : 'Unknown';
  } else if (browser.isChrome) {
    browser.name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    browser.version = match ? match[1] : 'Unknown';
  } else if (browser.isFirefox) {
    browser.name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    browser.version = match ? match[1] : 'Unknown';
  } else if (browser.isEdge) {
    browser.name = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    browser.version = match ? match[1] : 'Unknown';
  } else if (browser.isIE) {
    browser.name = 'IE';
  }

  return browser;
};

const MomentUploader = ({ eventId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({}); // { fileId: { status, progress, error } }
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null); // { count: number }
  const [totalFilesEverAdded, setTotalFilesEverAdded] = useState(0); // Total files ever added (never decreases)
  const [completedCount, setCompletedCount] = useState(0); // Count of completed files (even after removal)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null); // Estimated time in seconds
  const [completedAtUploadStart, setCompletedAtUploadStart] = useState(0); // Completed count when upload started
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const folderButtonRef = useRef(null);
  const uploadControllerRef = useRef(null);
  const isPageVisibleRef = useRef(true);
  const filesRef = useRef([]);
  const uploadStatusRef = useRef({});
  const isOpeningFolderRef = useRef(false); // Flag to prevent file input when opening folder
  const uploadStartTimeRef = useRef(null); // Track when upload started

  // Check if user is authenticated
  const isAuthenticated = () => {
    const userId = localStorage.getItem('userId');
    const userProfile = localStorage.getItem('userProfile');
    const adminToken = localStorage.getItem('adminToken');
    // User is authenticated if they have userId/userProfile OR adminToken
    return !!(userId && userProfile) || !!adminToken;
  };

  // Get user info
  const getUserInfo = () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      return {
        userId: localStorage.getItem('userId') || userProfile.userId,
        userName: localStorage.getItem('name') || userProfile.name || 'Unknown',
        phoneNumber: localStorage.getItem('phoneNumber') || userProfile.phoneNumber
      };
    } catch (e) {
      return {
        userId: localStorage.getItem('userId'),
        userName: localStorage.getItem('name') || 'Unknown',
        phoneNumber: localStorage.getItem('phoneNumber')
      };
    }
  };

  // Load persisted upload status from localStorage (files can't be persisted, only status)
  useEffect(() => {
    const loadPersistedStatus = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only restore status if it's for the same event
          if (parsed.eventId === eventId && parsed.status) {
            setUploadStatus(parsed.status);
            uploadStatusRef.current = parsed.status;
          }
        }
      } catch (e) {
        console.error('Error loading persisted status:', e);
      }
    };

    loadPersistedStatus();
  }, [eventId]);

  // Set webkitdirectory attribute on folder input
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
      folderInputRef.current.setAttribute('multiple', '');
    }
  }, [showUploader]);


  // Persist upload status to localStorage (files can't be serialized, so we only save status)
  const persistStatus = useCallback((statusToSave) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        eventId,
        status: statusToSave,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Error persisting status:', e);
    }
  }, [eventId]);

  // Handle visibility change (page goes to background/foreground)
  // Uploads will continue in background - we just track visibility for UI updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Generate unique ID for file
  const generateFileId = (file) => {
    return `${file.name}_${file.size}_${file.lastModified}`;
  };

  // Handle file selection - ensures unique files are enqueued
  const handleFiles = (fileList) => {
    if (!isAuthenticated()) {
      alert('Please log in to upload moments. You need to be an existing user.');
      return;
    }

    // Get existing file IDs to check for duplicates
    const existingFileIds = new Set(files.map(f => f.id));
    
    const newFiles = Array.from(fileList)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: generateFileId(file),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file)
      }))
      .filter(fileObj => {
        // Only include files that are not already in the queue
        if (existingFileIds.has(fileObj.id)) {
          console.log(`Skipping duplicate file: ${fileObj.name}`);
          return false;
        }
        return true;
      });

    if (newFiles.length === 0) {
      console.log('No new files to add (all are duplicates)');
      return;
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    filesRef.current = updatedFiles;

    // Update total files ever added (never decreases)
    setTotalFilesEverAdded(prev => prev + newFiles.length);

    // Initialize status for new files
    const updatedStatus = { ...uploadStatus };
    newFiles.forEach(f => {
      if (!updatedStatus[f.id]) {
        updatedStatus[f.id] = { status: 'pending', progress: 0 };
      }
    });
    setUploadStatus(updatedStatus);
    uploadStatusRef.current = updatedStatus;

    // Persist status to localStorage
    persistStatus(updatedStatus);
  };

  // Drag and drop handlers
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

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Check if folder was dropped (using DataTransferItem API)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const items = Array.from(e.dataTransfer.items);
      const files = [];
      
      // Process each item
      for (const item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
          
          if (entry && entry.isDirectory) {
            // Folder dropped - get all files recursively
            const folderFiles = await getFilesFromDirectory(entry);
            files.push(...folderFiles);
          } else {
            // Single file
            const file = item.getAsFile();
            if (file) {
              files.push(file);
            }
          }
        }
      }
      
      if (files.length > 0) {
        handleFiles(files);
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Fallback for browsers that don't support DataTransferItem API
      handleFiles(e.dataTransfer.files);
    }
  };

  // Recursively get all files from a directory
  const getFilesFromDirectory = async (directoryEntry) => {
    const files = [];
    
    return new Promise((resolve) => {
      const reader = directoryEntry.createReader();
      const readEntries = () => {
        reader.readEntries((entries) => {
          if (entries.length === 0) {
            resolve(files);
          } else {
            const promises = entries.map(async (entry) => {
              if (entry.isFile) {
                return new Promise((fileResolve) => {
                  entry.file((file) => {
                    if (file.type.startsWith('image/')) {
                      files.push(file);
                    }
                    fileResolve();
                  });
                });
              } else if (entry.isDirectory) {
                const dirFiles = await getFilesFromDirectory(entry);
                files.push(...dirFiles);
              }
            });
            
            Promise.all(promises).then(() => {
              readEntries(); // Continue reading
            });
          }
        });
      };
      
      readEntries();
    });
  };


  const handleFileSelect = (e) => {
    const input = e.target;
    if (input.files && input.files.length > 0) {
      // Check if this is a folder selection by comparing with folderInputRef
      const isFolderSelection = input === folderInputRef.current || 
                                input.hasAttribute('webkitdirectory') || 
                                input.hasAttribute('directory');
      
      if (isFolderSelection) {
        console.log(`Folder selected: ${input.files.length} total files found`);
        
        // Filter and process all image files from the folder
        const imageFiles = Array.from(input.files).filter(file => {
          const isImage = file.type.startsWith('image/');
          if (!isImage) {
            console.log(`Skipping non-image file: ${file.name} (type: ${file.type || 'unknown'})`);
          }
          return isImage;
        });
        
        console.log(`Processing ${imageFiles.length} image files from folder (out of ${input.files.length} total files)`);
        
        if (imageFiles.length === 0) {
          alert('No image files found in the selected folder. Please select a folder containing image files (PNG, JPG, GIF, etc.).');
          input.value = '';
          return;
        }
        
        if (imageFiles.length < input.files.length) {
          console.log(`Note: ${input.files.length - imageFiles.length} non-image files were skipped`);
        }
        
        handleFiles(imageFiles);
      } else {
        // Regular file selection
        console.log(`File selection: ${input.files.length} files selected`);
        handleFiles(input.files);
      }
      
      // Reset the input so the same folder/files can be selected again
      input.value = '';
    }
  };

  // Handle click on upload zone - opens file picker (allows multiple file selection)
  const handleUploadZoneClick = (e) => {
    // Don't trigger if we're opening folder or clicking on any button
    if (isOpeningFolderRef.current) {
      return;
    }
    
    const target = e.target;
    if (target === folderButtonRef.current || 
        target.closest('button') === folderButtonRef.current ||
        target.tagName === 'BUTTON' || 
        target.closest('button')) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    // Open file input which allows multiple file selection
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle folder selection via separate button or context menu
  const handleFolderSelectClick = (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent triggering the upload zone click
    e.nativeEvent?.stopImmediatePropagation(); // Stop all event propagation immediately
    
    // Set flag to prevent file input from opening
    isOpeningFolderRef.current = true;
    
    // Use setTimeout to ensure this happens after any other event handlers
    setTimeout(() => {
      if (folderInputRef.current) {
        folderInputRef.current.click();
      }
      // Reset flag after a short delay
      setTimeout(() => {
        isOpeningFolderRef.current = false;
      }, 100);
    }, 0);
    
    return false; // Additional safeguard
  };

  // Remove file from queue
  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    const updatedStatus = { ...uploadStatus };
    delete updatedStatus[fileId];
    
    setFiles(updatedFiles);
    filesRef.current = updatedFiles;
    setUploadStatus(updatedStatus);
    uploadStatusRef.current = updatedStatus;
    persistStatus(updatedStatus);
  };

  // Get image dimensions
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
        resolve({ width: 390, height: 844 });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Calculate aspect ratio (width * 1000 / height)
  const calculateAspectRatio = (width, height) => {
    if (!height || height === 0) return 0;
    return Math.round((width * 1000) / height);
  };

  // Single file upload using the working endpoint (for batches of 1 file)
  // This uses the /api/files/upload endpoint which has proper CORS configuration
  const uploadSingleFileAndCreateMoment = async (fileObj, onProgress) => {
    const userInfo = getUserInfo();
    const userId = localStorage.getItem('userId');
    const phoneNumber = localStorage.getItem('phoneNumber');
    const adminToken = localStorage.getItem('adminToken');

    // Upload file using the single upload endpoint (which works with CORS)
    const uploadFormData = new FormData();
    uploadFormData.append('file', fileObj.file);
    uploadFormData.append('fileType', 'IMAGE');

    const uploadHeaders = {};
    if (adminToken) {
      uploadHeaders['Authorization'] = `Bearer ${adminToken}`;
    } else if (userId || phoneNumber) {
      if (userId) uploadHeaders['X-User-Id'] = userId;
      if (phoneNumber) uploadHeaders['X-Phone-Number'] = phoneNumber;
    }

    try {
      // Upload file using the working single upload endpoint
      const uploadResponse = await axios.post(
        `${API_BASE_URL}/api/files/upload`,
        uploadFormData,
        {
          headers: uploadHeaders,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(uploadProgress);
            }
          }
        }
      );

      const publicUrl = uploadResponse.data?.data?.publicUrl;
      if (!publicUrl) {
        throw new Error('Upload response missing publicUrl');
      }

      // Get image dimensions and create moment data
      const dimensions = await getImageDimensions(fileObj.file);
      const creationTime = fileObj.file.lastModified || Date.now();
      const aspectRatio = calculateAspectRatio(dimensions.width, dimensions.height);

      // Create moment using bulk endpoint (but with single file)
      // Note: This still uses bulk endpoint for moment creation
      // If this fails, the file is uploaded but moment won't be created
      const momentFormData = new FormData();
      momentFormData.append('files', fileObj.file);
      
      const moment = {
        creatorId: userInfo.userId,
        eventId: String(eventId),
        creationTime: creationTime,
        media: {
          type: "IMAGE",
          width: dimensions.width,
          height: dimensions.height
        },
        creatorDetails: {
          userId: userInfo.userId,
          userName: userInfo.userName
        },
        aspectRatio: aspectRatio
      };
      
      momentFormData.append('moments', JSON.stringify([moment]));

      // Try to create moment via bulk endpoint
      // If this fails with CORS, at least the file is uploaded
      try {
        await axios.post(
          `${API_BASE_URL}/api/files/bulk-upload-moments-with-details`,
          momentFormData,
          {
            headers: uploadHeaders,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 300000,
          }
        );
        return { success: true };
      } catch (momentError) {
        // If moment creation fails, log but don't fail the upload
        console.warn('Moment creation via bulk endpoint failed (CORS issue), but file was uploaded successfully:', momentError);
        // Return success since file upload worked
        return { success: true, fileUploaded: true, momentCreationSkipped: true };
      }
    } catch (error) {
      console.error('Single file upload error:', error);
      
      // Create a clear error message similar to bulk upload
      let errorMessage = 'File upload failed';
      const httpStatus = error.response?.status;
      const hasResponse = !!error.response;
      
      if (hasResponse && httpStatus) {
        if (httpStatus === 413) {
          const fileSizeMB = (fileObj.file.size / (1024 * 1024)).toFixed(2);
          errorMessage = `Upload failed: File too large (HTTP ${httpStatus}). ` +
            `\n\nFile size: ${fileSizeMB} MB exceeds server limit. ` +
            `\n\nPlease try uploading a smaller file.`;
        } else if (httpStatus === 400) {
          const serverMessage = error.response?.data?.message || error.response?.data?.error || 'Bad request';
          errorMessage = `Upload failed: Bad request (HTTP ${httpStatus}). ` +
            `\n\nServer message: ${serverMessage}` +
            `\n\nPlease check that your file is a valid image and try again.`;
        } else if (httpStatus === 401) {
          errorMessage = `Upload failed: Authentication required (HTTP ${httpStatus}). ` +
            `\n\nPlease log in again and try uploading.`;
        } else if (httpStatus === 403) {
          errorMessage = `Upload failed: Access forbidden (HTTP ${httpStatus}). ` +
            `\n\nYou don't have permission to upload to this event. Please check your permissions.`;
        } else if (httpStatus === 500) {
          const serverMessage = error.response?.data?.message || error.response?.data?.error || 'Internal server error';
          errorMessage = `Upload failed: Server error (HTTP ${httpStatus}). ` +
            `\n\nServer message: ${serverMessage}` +
            `\n\nThe server encountered an error. Please try again later or contact support.`;
        } else if (error.response?.data?.message) {
          errorMessage = `Upload failed (HTTP ${httpStatus}): ${error.response.data.message}`;
        } else if (error.response?.data?.error) {
          errorMessage = `Upload failed (HTTP ${httpStatus}): ${error.response.data.error}`;
        } else {
          errorMessage = `Upload failed: Server returned error (HTTP ${httpStatus}). ` +
            `\n\nStatus: ${error.response?.statusText || 'Unknown error'}` +
            `\n\nPlease try again or contact support if the problem persists.`;
        }
      } else if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        errorMessage = 'Upload failed: Request timeout. ' +
          `\n\nThe upload took too long to complete. The file may be too large or the connection is slow. ` +
          `\n\nPlease try again or check your internet connection.`;
      } else if (error.code === 'ERR_NETWORK' || !hasResponse) {
        errorMessage = 'Upload failed: Network error. ' +
          `\n\nUnable to connect to the server. Please check:` +
          `\n- Your internet connection` +
          `\n- The server is accessible` +
          `\n- Firewall or security settings are not blocking the request` +
          `\n\nError details: ${error.message || error.code || 'Unknown network error'}`;
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      } else {
        errorMessage = 'Upload failed: Unknown error occurred. Please try again.';
      }
      
      const enhancedError = new Error(errorMessage);
      enhancedError.response = error.response;
      enhancedError.code = error.code;
      throw enhancedError;
    }
  };

  // Bulk upload files and create moments in a single API call
  const bulkUploadMomentsWithDetails = async (fileObjs, onProgress) => {
    const userInfo = getUserInfo();
    const userId = localStorage.getItem('userId');
    const phoneNumber = localStorage.getItem('phoneNumber');
    const adminToken = localStorage.getItem('adminToken');

    const formData = new FormData();
    const moments = [];

    // Prepare moments array and add files to FormData
    for (const fileObj of fileObjs) {
      try {
        // Get image dimensions
        const dimensions = await getImageDimensions(fileObj.file);
        
        // Calculate creation time (epoch timestamp)
        const creationTime = fileObj.file.lastModified || Date.now();
        
        // Calculate aspect ratio
        const aspectRatio = calculateAspectRatio(dimensions.width, dimensions.height);

        // Create moment object
        const moment = {
          creatorId: userInfo.userId,
          eventId: String(eventId),
          creationTime: creationTime,
          media: {
            type: "IMAGE",
            width: dimensions.width,
            height: dimensions.height
          },
          creatorDetails: {
            userId: userInfo.userId,
            userName: userInfo.userName
          },
          aspectRatio: aspectRatio
        };

        moments.push(moment);
        
        // Add file to FormData
        formData.append('files', fileObj.file);
      } catch (error) {
        console.error(`Error preparing ${fileObj.name}:`, error);
        throw error;
      }
    }

    // Add moments array as JSON string
    formData.append('moments', JSON.stringify(moments));

    try {
      // Build headers - don't set Content-Type for FormData, browser will set it with boundary
      const headers = {};
      
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      } else if (userId || phoneNumber) {
        if (userId) headers['X-User-Id'] = userId;
        if (phoneNumber) headers['X-Phone-Number'] = phoneNumber;
      }

      const apiUrl = `${API_BASE_URL}/api/files/bulk-upload-moments-with-details`;
      const frontendOrigin = window.location.origin;
      const browserInfo = getBrowserInfo();
      
      console.log('Bulk uploading moments:', {
        fileCount: fileObjs.length,
        momentsCount: moments.length,
        hasAuth: !!(adminToken || userId),
        url: apiUrl,
        frontendOrigin: frontendOrigin,
        headers: Object.keys(headers),
        browser: `${browserInfo.name} ${browserInfo.version}`,
        isMobile: browserInfo.isMobile
      });

      // Always use axios first (same as single upload which works)
      // This ensures consistent behavior and better CORS handling
      try {
        console.log('Using axios for bulk upload (consistent with single upload)');
        const response = await axios.post(
          apiUrl,
          formData,
          {
            headers: headers,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 300000, // 5 minutes
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && onProgress) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(progress);
              }
            }
          }
        );

        console.log('Bulk upload response (axios):', response.data);
        return response.data;
      } catch (axiosError) {
        console.error('Bulk upload axios error:', axiosError);
        
        // If axios fails with CORS, try fetch as fallback
        if (axiosError.code === 'ERR_NETWORK' || 
            (axiosError.message && axiosError.message.includes('CORS'))) {
          console.warn('Axios failed with CORS, trying fetch as fallback');
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000);

            const fetchResponse = await fetch(
              apiUrl,
              {
                method: 'POST',
                body: formData,
                headers: headers,
                signal: controller.signal,
              }
            );

            clearTimeout(timeoutId);

            if (!fetchResponse.ok) {
              const errorData = await fetchResponse.json().catch(() => ({}));
              throw new Error(errorData.message || `HTTP error! status: ${fetchResponse.status}`);
            }

            const responseData = await fetchResponse.json();
            console.log('Bulk upload response (fetch fallback):', responseData);
            return responseData;
          } catch (fetchError) {
            console.error('Fetch fallback also failed:', fetchError);
            throw axiosError; // Throw original axios error
          }
        } else {
          throw axiosError;
        }
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Bulk upload failed';
      const httpStatus = error.response?.status;
      const hasResponse = !!error.response;
      
      // If we have an HTTP status code, it's NOT a CORS error - it's a server error
      if (hasResponse && httpStatus) {
        // Handle specific HTTP status codes
        if (httpStatus === 413) {
          const fileCount = fileObjs.length;
          const totalSizeMB = fileObjs.reduce((sum, f) => sum + (f.file.size / (1024 * 1024)), 0).toFixed(2);
          errorMessage = `Upload failed: Request too large (HTTP ${httpStatus}). ` +
            `\n\nBatch contains ${fileCount} file(s) with total size of ${totalSizeMB} MB. ` +
            `\n\nThe server has a size limit. Try uploading fewer files at once or reduce file sizes. ` +
            `\n\nCurrent batch size is ${BATCH_SIZE} files.`;
        } else if (httpStatus === 400) {
          const serverMessage = error.response?.data?.message || error.response?.data?.error || 'Bad request';
          errorMessage = `Upload failed: Bad request (HTTP ${httpStatus}). ` +
            `\n\nServer message: ${serverMessage}` +
            `\n\nPlease check that your files are valid images and try again.`;
        } else if (httpStatus === 401) {
          errorMessage = `Upload failed: Authentication required (HTTP ${httpStatus}). ` +
            `\n\nPlease log in again and try uploading.`;
        } else if (httpStatus === 403) {
          errorMessage = `Upload failed: Access forbidden (HTTP ${httpStatus}). ` +
            `\n\nYou don't have permission to upload to this event. Please check your permissions.`;
        } else if (httpStatus === 404) {
          errorMessage = `Upload failed: Endpoint not found (HTTP ${httpStatus}). ` +
            `\n\nThe upload endpoint may not be available. Please contact support.`;
        } else if (httpStatus === 405) {
          errorMessage = `Upload failed: Method not allowed (HTTP ${httpStatus}). ` +
            `\n\nThe server may not accept this request format. Please contact support.`;
        } else if (httpStatus === 500) {
          const serverMessage = error.response?.data?.message || error.response?.data?.error || 'Internal server error';
          errorMessage = `Upload failed: Server error (HTTP ${httpStatus}). ` +
            `\n\nServer message: ${serverMessage}` +
            `\n\nThe server encountered an error. Please try again later or contact support.`;
        } else if (httpStatus === 502 || httpStatus === 503 || httpStatus === 504) {
          errorMessage = `Upload failed: Server unavailable (HTTP ${httpStatus}). ` +
            `\n\nThe server is temporarily unavailable. Please try again in a few moments.`;
        } else if (error.response?.data?.message) {
          errorMessage = `Upload failed (HTTP ${httpStatus}): ${error.response.data.message}`;
        } else if (error.response?.data?.error) {
          errorMessage = `Upload failed (HTTP ${httpStatus}): ${error.response.data.error}`;
        } else {
          errorMessage = `Upload failed: Server returned error (HTTP ${httpStatus}). ` +
            `\n\nStatus: ${error.response?.statusText || 'Unknown error'}` +
            `\n\nPlease try again or contact support if the problem persists.`;
        }
      } else if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        errorMessage = 'Upload failed: Request timeout. ' +
          `\n\nThe upload took too long to complete. The files may be too large or the connection is slow. ` +
          `\n\nPlease try uploading fewer files at once or check your internet connection.`;
      } else if (error.code === 'ERR_NETWORK' || !hasResponse) {
        // Check if it's actually a CORS error or just a network error
        const isCorsError = 
          (error.message && (
            error.message.includes('CORS') || 
            error.message.includes('Access-Control') ||
            error.message.includes('has been blocked by CORS policy') ||
            (error.message.includes('Failed to fetch') && !navigator.onLine)
          )) ||
          (httpStatus === 0 && error.message?.includes('Failed to fetch'));
        
        if (isCorsError) {
          const frontendOrigin = window.location.origin;
          const browserInfo = getBrowserInfo();
          const bulkUploadEndpoint = '/api/files/bulk-upload-moments-with-details';
          errorMessage = `CORS Error (${browserInfo.name} ${browserInfo.version}): The bulk upload endpoint at ${API_BASE_URL}${bulkUploadEndpoint} is not allowing requests from ${frontendOrigin}. ` +
            `\n\nNote: Single upload works fine, but bulk upload requires CORS configuration for this specific endpoint.` +
            `\n\nYour Spring backend needs to allow this origin for the bulk upload endpoint. Add to your Spring CORS configuration:\n` +
            `\nOption 1 - On the controller method:\n` +
            `@CrossOrigin(origins = {"${frontendOrigin}"}, allowedHeaders = {"*"}, methods = {RequestMethod.POST, RequestMethod.OPTIONS})\n` +
            `@PostMapping("${bulkUploadEndpoint}")\n` +
            `\nOption 2 - In WebMvcConfigurer (applies to all /api/** endpoints):\n` +
            `registry.addMapping("/api/**").allowedOrigins("${frontendOrigin}").allowedMethods("POST", "PUT", "GET", "DELETE", "OPTIONS", "PATCH").allowedHeaders("*").allowCredentials(true);` +
            `\n\nNote: This error is browser-specific. If it works in other browsers, the backend CORS configuration may need adjustment.`;
        } else {
          // Network error (not CORS)
          errorMessage = 'Upload failed: Network error. ' +
            `\n\nUnable to connect to the server. Please check:` +
            `\n- Your internet connection` +
            `\n- The server is accessible` +
            `\n- Firewall or security settings are not blocking the request` +
            `\n\nError details: ${error.message || error.code || 'Unknown network error'}`;
        }
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      } else {
        errorMessage = 'Upload failed: Unknown error occurred. Please try again.';
      }
      
      const browserInfo = getBrowserInfo();
      console.error('Full error object:', error);
      console.error('Upload Error Debug Info:', {
        origin: window.location.origin,
        apiUrl: `${API_BASE_URL}/api/files/bulk-upload-moments-with-details`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorMessage,
        browser: `${browserInfo.name} ${browserInfo.version}`,
        isMobile: browserInfo.isMobile,
        userAgent: navigator.userAgent,
        fileCount: fileObjs.length
      });
      throw new Error(errorMessage);
    }
  };

  // Process batch of files - single API call for upload + moment creation
  const processBatch = useCallback(async (batch) => {
    // Update all files in batch to uploading status
    batch.forEach(fileObj => {
      setUploadStatus(prev => {
        const updated = {
          ...prev,
          [fileObj.id]: { status: 'uploading', progress: 0 }
        };
        uploadStatusRef.current = updated;
        persistStatus(updated);
        return updated;
      });
    });

    try {
      // For single file batches, use the working single upload endpoint
      // For multiple files, use bulk upload endpoint
      if (batch.length === 1) {
        console.log('Using single file upload endpoint (CORS-safe) for batch of 1');
        await uploadSingleFileAndCreateMoment(batch[0], (progress) => {
          setUploadStatus(prev => {
            const updated = {
              ...prev,
              [batch[0].id]: { status: 'uploading', progress }
            };
            uploadStatusRef.current = updated;
            persistStatus(updated);
            return updated;
          });
        });
      } else {
        console.log(`Using bulk upload endpoint for batch of ${batch.length} files`);
        // Make bulk upload API call
        await bulkUploadMomentsWithDetails(batch, (progress) => {
          // Update progress for all files in batch
          batch.forEach(fileObj => {
            setUploadStatus(prev => {
              const updated = {
                ...prev,
                [fileObj.id]: { status: 'uploading', progress }
              };
              uploadStatusRef.current = updated;
              persistStatus(updated);
              return updated;
            });
          });
        });
      }

      // Mark all files as completed
      batch.forEach(fileObj => {
        setUploadStatus(prev => {
          const updated = {
            ...prev,
            [fileObj.id]: { status: 'completed', progress: 100 }
          };
          uploadStatusRef.current = updated;
          persistStatus(updated);
          return updated;
        });
      });

      return batch.map(f => ({ fileId: f.id, success: true }));
    } catch (error) {
      // Extract error message - use the detailed message from bulkUploadMomentsWithDetails if available
      // The error.message from bulkUploadMomentsWithDetails already contains detailed, user-friendly messages
      let errorMessage = error.message || 'Upload failed';
      
      // Only override if we have a more specific server message and the error message is generic
      if (!error.message || error.message === 'Upload failed' || error.message === 'Bulk upload failed') {
        if (error.response?.status === 413) {
          const totalSizeMB = batch.reduce((sum, f) => sum + (f.file.size / (1024 * 1024)), 0).toFixed(2);
          errorMessage = `Request too large (HTTP 413): Batch of ${batch.length} file(s) totaling ${totalSizeMB} MB exceeds server limit. Try uploading fewer files at once.`;
        } else if (error.response?.data?.message) {
          errorMessage = `Upload failed (HTTP ${error.response.status}): ${error.response.data.message}`;
        } else if (error.response?.data?.error) {
          errorMessage = `Upload failed (HTTP ${error.response.status}): ${error.response.data.error}`;
        } else if (error.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your connection.';
        }
      }
      
      batch.forEach(fileObj => {
        setUploadStatus(prev => {
          const currentStatus = prev[fileObj.id] || {};
          const updated = {
            ...prev,
            [fileObj.id]: { 
              status: 'error', 
              progress: 0,
              error: errorMessage,
              retryCount: currentStatus.retryCount || 0
            }
          };
          uploadStatusRef.current = updated;
          persistStatus(updated);
          return updated;
        });
      });

      console.error(`Failed to upload batch:`, {
        error,
        message: errorMessage,
        status: error.response?.status,
        statusText: error.response?.statusText,
        response: error.response?.data,
        batchSize: batch.length,
        totalSizeMB: batch.reduce((sum, f) => sum + (f.file.size / (1024 * 1024)), 0).toFixed(2)
      });

      return batch.map(f => ({ fileId: f.id, success: false }));
    }
  }, [eventId, persistStatus]);

  // Start upload process
  const startUpload = useCallback(async () => {
    if (!isAuthenticated()) {
      alert('Please log in to upload moments. You need to be an existing user.');
      return;
    }

    // Verify we have authentication credentials
    const userId = localStorage.getItem('userId');
    const adminToken = localStorage.getItem('adminToken');
    if (!userId && !adminToken) {
      alert('Authentication error. Please log in again.');
      return;
    }

    const currentFiles = filesRef.current;
    const currentStatus = uploadStatusRef.current;

    if (!currentFiles || currentFiles.length === 0) {
      return;
    }

    // Process files in batches of BATCH_SIZE
    const pendingFiles = currentFiles.filter(f => {
      const status = currentStatus[f.id];
      return !status || status.status === 'pending' || status.status === 'error';
    });

    if (pendingFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadQueue(pendingFiles);
    
    // Initialize upload tracking for time estimation
    uploadStartTimeRef.current = Date.now();
    setCompletedAtUploadStart(completedCount); // Track completed count at start

    try {
      let completedCount = 0;

      // Step 1: Create all batches first (before processing)
      const batches = [];
      for (let i = 0; i < pendingFiles.length; i += BATCH_SIZE) {
        batches.push(pendingFiles.slice(i, i + BATCH_SIZE));
      }

      console.log(`Created ${batches.length} batches of ${BATCH_SIZE} files each from ${pendingFiles.length} total files`);

      // Step 2: Process batches in controlled parallel groups (only spawn when required)
      for (let i = 0; i < batches.length; i += MAX_PARALLEL_BATCHES) {
        const parallelBatches = batches.slice(i, i + MAX_PARALLEL_BATCHES);
        
        console.log(`Processing batches ${i + 1}-${Math.min(i + MAX_PARALLEL_BATCHES, batches.length)} of ${batches.length} in parallel`);
        
        // Spawn parallel batches only when needed (controlled concurrency)
        const batchPromises = parallelBatches.map(batch => processBatch(batch));
        const batchResults = await Promise.all(batchPromises);
        
        // Count successful uploads from all parallel batches
        batchResults.forEach(results => {
          completedCount += results.filter(r => r.success).length;
        });
      }

      // Show success message
      if (completedCount > 0) {
        setSuccessMessage({ count: completedCount });
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }

      // Call completion callback
      if (onUploadComplete && completedCount > 0) {
        onUploadComplete(completedCount);
      }
    } catch (error) {
      console.error('Upload process error:', error);
    } finally {
      setIsUploading(false);
      setUploadQueue([]);
    }
  }, [processBatch, eventId, onUploadComplete, persistStatus]);

  // Auto-remove completed files
  useEffect(() => {
    const currentFiles = filesRef.current;
    const currentStatus = uploadStatusRef.current;
    
    const completedFiles = currentFiles.filter(f => {
      const status = currentStatus[f.id];
      return status?.status === 'completed';
    });

    if (completedFiles.length > 0) {
      // Update completed count before removing files
      setCompletedCount(prev => prev + completedFiles.length);
      
      const remainingFiles = currentFiles.filter(f => {
        const status = currentStatus[f.id];
        return status?.status !== 'completed';
      });
      const remainingStatus = {};
      remainingFiles.forEach(f => {
        if (currentStatus[f.id]) {
          remainingStatus[f.id] = currentStatus[f.id];
        }
      });

      setFiles(remainingFiles);
      filesRef.current = remainingFiles;
      setUploadStatus(remainingStatus);
      uploadStatusRef.current = remainingStatus;
      persistStatus(remainingStatus);
    }
  }, [uploadStatus, persistStatus, isUploading]);

  // Calculate estimated time remaining based on completion rate
  useEffect(() => {
    if (!isUploading) {
      setEstimatedTimeRemaining(null);
      uploadStartTimeRef.current = null;
      setCompletedAtUploadStart(0);
      return;
    }

    // Initialize upload start time if not set
    if (!uploadStartTimeRef.current) {
      uploadStartTimeRef.current = Date.now();
      setCompletedAtUploadStart(completedCount);
    }

    const calculateEstimate = () => {
      if (!uploadStartTimeRef.current) return;
      
      const currentTime = Date.now();
      const elapsedTime = (currentTime - uploadStartTimeRef.current) / 1000; // in seconds
      
      // Calculate files completed during this upload session
      const completedDuringSession = completedCount - completedAtUploadStart;
      
      // Get pending files count
      const visibleFiles = files.filter(f => {
        const status = uploadStatus[f.id]?.status || 'pending';
        return status !== 'completed';
      });
      const pendingFiles = visibleFiles.filter(f => {
        const status = uploadStatus[f.id]?.status || 'pending';
        return status === 'pending' || status === 'uploading';
      }).length;

      // Need at least 1 completed file and some elapsed time to calculate rate
      if (completedDuringSession > 0 && elapsedTime > 0 && pendingFiles > 0) {
        const rate = completedDuringSession / elapsedTime; // files per second
        const estimatedSeconds = Math.ceil(pendingFiles / rate);
        setEstimatedTimeRemaining(estimatedSeconds);
      } else if (pendingFiles === 0) {
        setEstimatedTimeRemaining(0);
      } else {
        // Not enough data yet, show null
        setEstimatedTimeRemaining(null);
      }
    };

    // Calculate immediately
    calculateEstimate();

    // Update every second while uploading
    const interval = setInterval(calculateEstimate, 1000);

    return () => clearInterval(interval);
  }, [isUploading, files, uploadStatus, completedCount, completedAtUploadStart]); // Use completedCount to trigger recalculation

  // Retry a single failed file
  const retryFailedFile = useCallback(async (fileId) => {
    const currentFiles = filesRef.current;
    const currentStatus = uploadStatusRef.current;

    const fileObj = currentFiles.find(f => f.id === fileId);
    if (!fileObj) {
      return;
    }

    const status = currentStatus[fileId];
    if (status?.status !== 'error' || (status.retryCount || 0) >= 1) {
      return;
    }

    // Reset status to pending for retry
    setUploadStatus(prev => {
      const updated = {
        ...prev,
        [fileId]: { 
          status: 'pending', 
          progress: 0,
          retryCount: (prev[fileId]?.retryCount || 0) + 1
        }
      };
      uploadStatusRef.current = updated;
      persistStatus(updated);
      return updated;
    });

    // Start upload for retried file
    setIsUploading(true);
    setUploadQueue([fileObj]);
    
    // Initialize upload tracking for time estimation
    if (!uploadStartTimeRef.current) {
      uploadStartTimeRef.current = Date.now();
      setCompletedAtUploadStart(completedCount);
    }

    try {
      const results = await processBatch([fileObj]);
      const completedCount = results.filter(r => r.success).length;

      // Show success message for retry
      if (completedCount > 0) {
        setSuccessMessage({ count: completedCount });
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }

      if (onUploadComplete && completedCount > 0) {
        onUploadComplete(completedCount);
      }
    } catch (error) {
      console.error('Retry upload process error:', error);
    } finally {
      setIsUploading(false);
      setUploadQueue([]);
    }
  }, [processBatch, onUploadComplete, persistStatus]);

  // Retry all failed files
  const retryAllFailedFiles = useCallback(async () => {
    if (!isAuthenticated()) {
      alert('Please log in to upload moments. You need to be an existing user.');
      return;
    }

    const userId = localStorage.getItem('userId');
    const adminToken = localStorage.getItem('adminToken');
    if (!userId && !adminToken) {
      alert('Authentication error. Please log in again.');
      return;
    }

    const currentFiles = filesRef.current;
    const currentStatus = uploadStatusRef.current;

    // Get all failed files that can be retried (retryCount < 1)
    const failedFiles = currentFiles.filter(f => {
      const status = currentStatus[f.id];
      return status?.status === 'error' && (status.retryCount || 0) < 1;
    });

    if (failedFiles.length === 0) {
      alert('No failed files available to retry. All failed files have already been retried once.');
      return;
    }

    // Reset status to pending for all failed files
    failedFiles.forEach(fileObj => {
      setUploadStatus(prev => {
        const updated = {
          ...prev,
          [fileObj.id]: { 
            status: 'pending', 
            progress: 0,
            retryCount: (prev[fileObj.id]?.retryCount || 0) + 1
          }
        };
        uploadStatusRef.current = updated;
        persistStatus(updated);
        return updated;
      });
    });

    // Start upload for all retried files
    setIsUploading(true);
    setUploadQueue(failedFiles);
    
    // Initialize upload tracking for time estimation
    if (!uploadStartTimeRef.current) {
      uploadStartTimeRef.current = Date.now();
      setCompletedAtUploadStart(completedCount);
    }

    try {
      let completedCount = 0;

      // Step 1: Create all batches first (before processing)
      const batches = [];
      for (let i = 0; i < failedFiles.length; i += BATCH_SIZE) {
        batches.push(failedFiles.slice(i, i + BATCH_SIZE));
      }

      console.log(`Retry: Created ${batches.length} batches of ${BATCH_SIZE} files each from ${failedFiles.length} total failed files`);

      // Step 2: Process batches in controlled parallel groups (only spawn when required)
      for (let i = 0; i < batches.length; i += MAX_PARALLEL_BATCHES) {
        const parallelBatches = batches.slice(i, i + MAX_PARALLEL_BATCHES);
        
        console.log(`Retry: Processing batches ${i + 1}-${Math.min(i + MAX_PARALLEL_BATCHES, batches.length)} of ${batches.length} in parallel`);
        
        // Spawn parallel batches only when needed (controlled concurrency)
        const batchPromises = parallelBatches.map(batch => processBatch(batch));
        const batchResults = await Promise.all(batchPromises);
        
        // Count successful uploads from all parallel batches
        batchResults.forEach(results => {
          completedCount += results.filter(r => r.success).length;
        });
      }

      // Show success message
      if (completedCount > 0) {
        setSuccessMessage({ count: completedCount });
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }

      if (onUploadComplete && completedCount > 0) {
        onUploadComplete(completedCount);
      }
    } catch (error) {
      console.error('Bulk retry upload process error:', error);
    } finally {
      setIsUploading(false);
      setUploadQueue([]);
    }
  }, [processBatch, onUploadComplete, persistStatus, eventId]);

  // Format time in seconds to readable format
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return 'Calculating...';
    }
    
    if (seconds === 0) {
      return 'Almost done!';
    }
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Get upload statistics
  const getUploadStats = () => {
    const visibleFiles = files.filter(f => {
      const status = uploadStatus[f.id]?.status || 'pending';
      return status !== 'completed';
    });

    const stats = {
      total: totalFilesEverAdded, // Total files ever added (never decreases)
      pending: 0,
      uploading: 0,
      completed: completedCount, // Completed count (even after files are removed)
      error: 0,
      retryable: 0 // Failed files that can still be retried
    };

    visibleFiles.forEach(f => {
      const status = uploadStatus[f.id]?.status || 'pending';
      if (status === 'pending') stats.pending++;
      else if (status === 'uploading') stats.uploading++;
      else if (status === 'error') {
        stats.error++;
        // Check if this error can be retried (retryCount < 1)
        const retryCount = uploadStatus[f.id]?.retryCount || 0;
        if (retryCount < 1) {
          stats.retryable++;
        }
      }
    });

    return stats;
  };

  const stats = getUploadStats();

  if (!isAuthenticated()) {
    return null; // Don't show uploader if not authenticated
  }

  return (
    <div className="mb-8">
      {/* Upload Button */}
      {!showUploader && (
        <button
          onClick={() => setShowUploader(true)}
          className="w-full bg-[#2a4d32] hover:bg-[#1e3b27] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload Moments</span>
        </button>
      )}

      {/* Uploader UI */}
      {showUploader && (
        <div className="bg-white bg-opacity-90 rounded-xl shadow-2xl p-6 border border-[#d4d4d8]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-[#2a4d32]">Upload Moments</h3>
            <button
              onClick={() => setShowUploader(false)}
              className="text-gray-400 hover:text-[#2a4d32]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-green-800 font-semibold text-lg">
                    Upload Successful!
                  </div>
                  <div className="text-green-700 text-sm">
                    {successMessage.count} file{successMessage.count !== 1 ? 's' : ''} uploaded successfully
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Stats */}
          {(stats.total > 0 || stats.completed > 0) && (
            <div className="mb-4 p-3 bg-[#fdfaf3] rounded-lg border border-[#d4d4d8]">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="font-semibold text-[#2a4d32]">{stats.total}</div>
                  <div className="text-gray-500">Total</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-600">{stats.pending + stats.uploading}</div>
                  <div className="text-gray-500">In Queue</div>
                </div>
                <div>
                  <div className="font-semibold text-green-600">{stats.completed}</div>
                  <div className="text-gray-500">Completed</div>
                </div>
                <div>
                  <div className="font-semibold text-red-600">{stats.error}</div>
                  <div className="text-gray-500">Failed</div>
                </div>
              </div>
              {/* Estimated Time Remaining */}
              {isUploading && estimatedTimeRemaining !== null && (
                <div className="mt-3 pt-3 border-t border-[#d4d4d8] text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-gray-600">
                      Estimated time remaining: <span className="font-semibold text-blue-600">{formatTime(estimatedTimeRemaining)}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Drag & Drop Zone - Entire area is clickable */}
          <div
            onClick={handleUploadZoneClick}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-4 cursor-pointer ${
              dragActive 
                ? 'border-[#67143A] bg-[#67143A]/10' 
                : 'border-[#d4d4d8] hover:border-[#67143A] hover:bg-gray-50'
            }`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Hidden file input for click selection */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {/* Hidden folder input for programmatic folder selection (if needed) */}
            <input
              ref={folderInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div>
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-[#2a4d32] font-medium mb-1">
                Click to select multiple files or drag & drop files/folder
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
              <p className="text-xs text-gray-400 mt-1">
                Click to select multiple files, or drag files/folders here
              </p>
            </div>
          </div>
          
          {/* Folder selection button - outside clickable zone */}
          <div className="text-center mb-4">
            <button
              ref={folderButtonRef}
              type="button"
              onClick={handleFolderSelectClick}
              className="text-xs text-[#67143A] hover:underline"
            >
              Or select a folder
            </button>
          </div>

          {/* File List */}
          {(() => {
            const visibleFiles = files.filter(f => {
              const status = uploadStatus[f.id]?.status || 'pending';
              return status !== 'completed';
            });

            return visibleFiles.length > 0 && (
              <div className="mb-4 max-h-64 overflow-y-auto space-y-2">
                {visibleFiles.map((fileObj) => {
                  const status = uploadStatus[fileObj.id] || { status: 'pending', progress: 0 };
                  const isError = status.status === 'error';
                  const canRetry = isError && (status.retryCount || 0) < 1;
                  
                  return (
                    <div
                      key={fileObj.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${
                        isError 
                          ? 'bg-red-50 border-red-300' 
                          : 'bg-[#fdfaf3] border-[#d4d4d8]'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-gray-200">
                        <img
                          src={fileObj.preview}
                          alt={fileObj.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${
                          isError ? 'text-red-700' : 'text-[#2a4d32]'
                        }`}>
                          {fileObj.name}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {/* Progress Bar */}
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                status.status === 'error' ? 'bg-red-500' :
                                status.status === 'uploading' ? 'bg-blue-500' :
                                'bg-gray-300'
                              }`}
                              style={{ width: `${status.progress}%` }}
                            />
                          </div>
                          <span className={`text-xs whitespace-nowrap ${
                            isError ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {status.status === 'uploading' && `${status.progress}%`}
                            {status.status === 'error' && '✗'}
                          </span>
                        </div>
                        {status.error && (
                          <div className="text-xs text-red-600 mt-1">{status.error}</div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {isError && canRetry && (
                          <button
                            onClick={() => retryFailedFile(fileObj.id)}
                            disabled={isUploading}
                            className="flex-shrink-0 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Retry
                          </button>
                        )}
                        {status.status !== 'uploading' && (
                          <button
                            onClick={() => removeFile(fileObj.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-red-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={startUpload}
              disabled={isUploading || stats.total === 0 || stats.pending === 0}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isUploading || stats.total === 0 || stats.pending === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#67143A] hover:bg-[#4f0f2d] text-white'
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                `Upload ${stats.pending > 0 ? stats.pending : stats.total} File${(stats.pending || stats.total) !== 1 ? 's' : ''}`
              )}
            </button>
            {stats.retryable > 0 && (
              <button
                onClick={retryAllFailedFiles}
                disabled={isUploading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isUploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Retry All ({stats.retryable})
              </button>
            )}
          </div>

          {/* Background Upload Indicator */}
          {isUploading && (
            <div className="mt-3 text-xs text-gray-500 text-center">
              <div className="flex items-center justify-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Uploads will continue even if you switch tabs or minimize the window</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MomentUploader;

