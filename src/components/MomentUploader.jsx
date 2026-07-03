import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useUpload } from '../context/UploadContext';

const STORAGE_KEY = 'moment_upload_queue';

// --- Bulk-upload tuning (robust for 1000+ images) ---------------------------------------------
// Batches are packed by BYTES, not a fixed file count, so a request never exceeds the server's
// body limit (Cloud Run caps requests at ~32 MiB). A batch that still 413s is split adaptively.
const REQUEST_BYTE_BUDGET = 12 * 1024 * 1024; // target max bytes per multipart request (12 MB)
const MAX_FILES_PER_REQUEST = 5;              // also cap file count per request
const UPLOAD_CONCURRENCY = 3;                 // parallel in-flight requests (worker pool)
const MAX_TRANSIENT_RETRIES = 4;              // auto-retries for network/5xx/429/timeout, with backoff
const RETRY_BASE_DELAY_MS = 800;              // exponential backoff base

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff with jitter for transient-failure retries.
const backoffDelay = (attempt) =>
  RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 400);

// A request should be retried on network errors, timeouts, rate limiting, and 5xx.
const isRetryableError = (err) => {
  const status = err?.status ?? err?.response?.status;
  if (status === 413) return false; // handled separately by adaptive splitting
  if (status) return status >= 500 || status === 429 || status === 408;
  // No HTTP status => network/timeout/abort.
  return err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' ||
    err?.name === 'AbortError' || /network|failed to fetch|timeout/i.test(err?.message || '');
};

const isTooLargeError = (err) => (err?.status ?? err?.response?.status) === 413;

const isNonRetryableStatus = (status) =>
  status === 400 || status === 401 || status === 403 || status === 404 || status === 405 || status === 422;

// Greedily pack files into batches bounded by REQUEST_BYTE_BUDGET and MAX_FILES_PER_REQUEST.
// A single file at/over the budget is sent on its own (the single-file endpoint handles it).
const buildSizeAwareBatches = (fileObjs) => {
  const batches = [];
  let current = [];
  let currentBytes = 0;
  const flush = () => {
    if (current.length) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }
  };
  for (const fo of fileObjs) {
    const size = fo.file?.size || 0;
    if (size >= REQUEST_BYTE_BUDGET) {
      flush();
      batches.push([fo]);
      continue;
    }
    if (current.length >= MAX_FILES_PER_REQUEST || currentBytes + size > REQUEST_BYTE_BUDGET) {
      flush();
    }
    current.push(fo);
    currentBytes += size;
  }
  flush();
  return batches;
};

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

// Canon CR3 (RAW) support. Browsers report an empty or non-image MIME for CR3, so detect by
// extension/known type instead of relying on file.type.
const isCr3File = (file) => {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  return name.endsWith('.cr3') || file.type === 'image/x-canon-cr3';
};

// Accept normal images plus CR3 in the picker/drop handler.
const isSupportedUpload = (file) => !!file && (file.type.startsWith('image/') || isCr3File(file));

// CR3 is not browser-renderable, but embeds standard JPEG previews (a small thumbnail and a larger
// full-size preview) near the start of the file. Scan the leading bytes for JPEG SOI..EOI segments
// and return the largest as a Blob so we can show an instant local preview without any server call.
const CR3_SCAN_LIMIT_BYTES = 16 * 1024 * 1024;
const CR3_MIN_PREVIEW_BYTES = 8 * 1024;

const extractCr3JpegPreview = async (file) => {
  try {
    const slice = file.slice(0, Math.min(file.size, CR3_SCAN_LIMIT_BYTES));
    const buf = new Uint8Array(await slice.arrayBuffer());
    const n = buf.length;
    let bestStart = -1;
    let bestEnd = -1;
    let i = 0;
    while (i < n - 3) {
      // JPEG SOI: FF D8 FF
      if (buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff) {
        let end = -1;
        for (let j = i + 2; j < n - 1; j++) {
          if (buf[j] === 0xff && buf[j + 1] === 0xd9) { // EOI
            end = j + 2;
            break;
          }
        }
        if (end > 0) {
          if (end - i > bestEnd - bestStart) {
            bestStart = i;
            bestEnd = end;
          }
          i = end;
          continue;
        }
      }
      i++;
    }
    if (bestStart < 0 || bestEnd - bestStart < CR3_MIN_PREVIEW_BYTES) {
      return null;
    }
    return new Blob([buf.subarray(bestStart, bestEnd)], { type: 'image/jpeg' });
  } catch (e) {
    console.warn('CR3 preview extraction failed:', e);
    return null;
  }
};

// Neutral placeholder shown when a CR3 has no extractable embedded preview.
const CR3_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#e5e7eb"/><text x="48" y="52" font-family="sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">CR3</text></svg>'
  );

// Generic placeholder used for large batches where per-file previews are skipped for speed.
const IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#e5e7eb"/><path d="M24 66l16-20 12 14 8-9 12 15z" fill="#9ca3af"/><circle cx="34" cy="34" r="7" fill="#9ca3af"/></svg>'
  );

// Generating thumbnails (and especially decoding CR3 embedded JPEGs) per file is expensive. Above
// this batch/queue size we skip previews entirely so enqueuing a large folder stays fast.
const PREVIEW_FILE_LIMIT = 50;

const MomentUploader = ({
  eventId,
  eventName = '',
  onUploadComplete,
  triggerText = 'Upload Media',
  triggerClassName = '',
  uploaderTitle = 'Upload Moments',
}) => {
  const backgroundUpload = useUpload();
  const [files, setFiles] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({}); // { fileId: { status, progress, error } }
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null); // { count: number }
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [driveImporting, setDriveImporting] = useState(false);
  const [driveImportMessage, setDriveImportMessage] = useState(null);
  const [driveImportError, setDriveImportError] = useState(null);
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
  const handleFiles = async (fileList) => {
    if (!isAuthenticated()) {
      alert('Please log in to upload moments. You need to be an existing user.');
      return;
    }

    // Get existing file IDs to check for duplicates
    const existingFileIds = new Set(files.map(f => f.id));

    const candidates = Array.from(fileList)
      .filter(isSupportedUpload)
      .filter(file => {
        const id = generateFileId(file);
        if (existingFileIds.has(id)) {
          console.log(`Skipping duplicate file: ${file.name}`);
          return false;
        }
        return true;
      });

    // For large batches, skip per-file preview generation (thumbnail blob URLs and, above all, the
    // costly CR3 embedded-JPEG decode) so enqueuing stays fast. Placeholders are shown instead.
    const skipPreviews = files.length + candidates.length > PREVIEW_FILE_LIMIT;
    if (skipPreviews) {
      console.log(
        `Skipping previews for ${candidates.length} file(s): queue exceeds ${PREVIEW_FILE_LIMIT}`
      );
    }

    const newFiles = [];
    for (const file of candidates) {
      const cr3 = isCr3File(file);
      // For CR3, decode the embedded JPEG for the preview; for normal images, blob URL is enough.
      let previewBlob = null;
      let preview;
      if (skipPreviews) {
        preview = cr3 ? CR3_PLACEHOLDER : IMAGE_PLACEHOLDER;
      } else {
        if (cr3) {
          previewBlob = await extractCr3JpegPreview(file);
        }
        preview = cr3
          ? (previewBlob ? URL.createObjectURL(previewBlob) : CR3_PLACEHOLDER)
          : URL.createObjectURL(file);
      }
      newFiles.push({
        id: generateFileId(file),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        isCr3: cr3,
        previewBlob,
        preview,
      });
    }

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
                    if (isSupportedUpload(file)) {
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
        
        // Filter and process all image files from the folder (including CR3 RAW)
        const imageFiles = Array.from(input.files).filter(file => {
          const supported = isSupportedUpload(file);
          if (!supported) {
            console.log(`Skipping unsupported file: ${file.name} (type: ${file.type || 'unknown'})`);
          }
          return supported;
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
  const importFromGoogleDrive = useCallback(async () => {
    if (!isAuthenticated()) {
      alert('Please log in to import moments.');
      return;
    }
    const url = driveFolderUrl.trim();
    if (!url) {
      alert('Paste a Google Drive folder link (e.g. https://drive.google.com/drive/folders/…).');
      return;
    }
    const userInfo = getUserInfo();
    if (!userInfo.userId) {
      alert('Missing user id. Please log in again.');
      return;
    }
    const userId = localStorage.getItem('userId');
    const phoneNumber = localStorage.getItem('phoneNumber');
    const adminToken = localStorage.getItem('adminToken');
    const headers = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    } else {
      if (userId) headers['X-User-Id'] = userId;
      if (phoneNumber) headers['X-Phone-Number'] = phoneNumber;
    }
    setDriveImporting(true);
    setDriveImportMessage(null);
    setDriveImportError(null);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/files/import-google-drive-folder`,
        {
          folderUrl: url,
          eventId: String(eventId),
          creatorId: userInfo.userId,
          creatorUserName: userInfo.userName,
        },
        { headers, timeout: 30000 }
      );
      setDriveImportMessage(
        data?.message ||
        'Your Drive import has started. Photos will appear in Moments shortly - you can continue with other work.'
      );
      setDriveFolderUrl('');
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setDriveImportError('This appears to be a private Google Drive link. Please provide a public link (Anyone with the link can view).');
      } else {
        const msg =
          err.response?.data?.message ||
          err.message ||
          'Google Drive import failed.';
        setDriveImportError(msg);
      }
    } finally {
      setDriveImporting(false);
    }
  }, [driveFolderUrl, eventId, onUploadComplete]);

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

      // Get image dimensions and create moment data (CR3 isn't measurable directly; use its preview)
      const dimensions = await getImageDimensions(fileObj.previewBlob || fileObj.file);
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
        // Get image dimensions (CR3 isn't measurable directly; use its extracted preview)
        const dimensions = await getImageDimensions(fileObj.previewBlob || fileObj.file);

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
            `\n\nThe server has a size limit; the uploader will automatically split this batch and retry.`;
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
      // Preserve the HTTP status/response so the orchestrator can classify the failure
      // (413 -> split, 5xx/network -> retry, 4xx -> terminal).
      const enhanced = new Error(errorMessage);
      enhanced.status = error.response?.status;
      enhanced.response = error.response;
      enhanced.code = error.code;
      throw enhanced;
    }
  };

  // Process one batch: upload + create moments, with automatic transient-failure retries.
  // Returns an outcome the pool uses to decide next steps:
  //   { outcome: 'success', count }  - all files uploaded
  //   { outcome: 'tooLarge' }        - 413 on a multi-file batch; pool should split & requeue
  //   { outcome: 'error' }           - terminal failure (left for manual retry)
  const processBatch = useCallback(async (batch) => {
    // Merge a status patch onto every file in the batch (preserves fields like retryCount).
    const setBatchStatus = (patch) => {
      setUploadStatus(prev => {
        const updated = { ...prev };
        batch.forEach(fileObj => {
          updated[fileObj.id] = { ...(prev[fileObj.id] || {}), ...patch };
        });
        uploadStatusRef.current = updated;
        persistStatus(updated);
        return updated;
      });
    };

    const onProgress = (progress) => setBatchStatus({ status: 'uploading', progress });

    setBatchStatus({ status: 'uploading', progress: 0, error: undefined });

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        if (batch.length === 1) {
          await uploadSingleFileAndCreateMoment(batch[0], onProgress);
        } else {
          await bulkUploadMomentsWithDetails(batch, onProgress);
        }
        setBatchStatus({ status: 'completed', progress: 100, error: undefined });
        return { outcome: 'success', count: batch.length };
      } catch (error) {
        // 413: split multi-file batches; a lone file that's too large is terminal.
        if (isTooLargeError(error)) {
          if (batch.length > 1) {
            setBatchStatus({ status: 'pending', progress: 0 });
            return { outcome: 'tooLarge' };
          }
          const sizeMB = (batch[0].file.size / (1024 * 1024)).toFixed(1);
          setBatchStatus({
            status: 'error',
            progress: 0,
            error: `File is too large for the server (${sizeMB} MB). Please resize it or upload it on its own.`,
          });
          return { outcome: 'error' };
        }

        // Transient (network/timeout/429/5xx): back off and retry.
        if (isRetryableError(error) && attempt < MAX_TRANSIENT_RETRIES) {
          attempt += 1;
          const delay = backoffDelay(attempt);
          console.warn(
            `Batch of ${batch.length} failed (${error.status || error.code || 'network'}); ` +
            `retry ${attempt}/${MAX_TRANSIENT_RETRIES} in ${delay}ms`
          );
          setBatchStatus({ status: 'uploading', progress: 0, error: `Retrying (${attempt}/${MAX_TRANSIENT_RETRIES})…` });
          await sleep(delay);
          continue;
        }

        // Terminal failure (4xx, or transient retries exhausted).
        const errorMessage = error.message || 'Upload failed';
        setBatchStatus({ status: 'error', progress: 0, error: errorMessage });
        console.error('Failed to upload batch:', {
          message: errorMessage,
          status: error.status || error.response?.status,
          batchSize: batch.length,
          totalSizeMB: batch.reduce((sum, f) => sum + f.file.size / (1024 * 1024), 0).toFixed(2),
        });
        return { outcome: 'error' };
      }
    }
  }, [eventId, persistStatus]);

  // Bounded worker pool over size-aware batches. On a 413 the batch is split in half and requeued,
  // so the uploader converges to a request size the server accepts without user intervention.
  const runUploadPool = useCallback(async (fileObjs) => {
    const queue = buildSizeAwareBatches(fileObjs);
    let completed = 0;

    const worker = async () => {
      while (queue.length > 0) {
        const batch = queue.shift();
        if (!batch) break;
        const res = await processBatch(batch);
        if (res.outcome === 'success') {
          completed += res.count;
        } else if (res.outcome === 'tooLarge') {
          const mid = Math.ceil(batch.length / 2);
          // Requeue the smaller halves at the front so they retry promptly.
          queue.unshift(batch.slice(mid));
          queue.unshift(batch.slice(0, mid));
        }
        // 'error' -> leave for manual retry.
      }
    };

    const workerCount = Math.min(UPLOAD_CONCURRENCY, Math.max(1, queue.length));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return completed;
  }, [processBatch]);

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

    // Upload everything not already done: pending, previously errored, or interrupted mid-upload
    // (a stale "uploading" from a reload is safe to resend — the backend dedupes by file+event).
    const pendingFiles = currentFiles.filter(f => {
      const s = currentStatus[f.id]?.status;
      return !s || s === 'pending' || s === 'error' || s === 'uploading';
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
      console.log(`Uploading ${pendingFiles.length} file(s) via size-aware batches (budget ${(REQUEST_BYTE_BUDGET / (1024 * 1024)).toFixed(0)}MB, concurrency ${UPLOAD_CONCURRENCY})`);

      // Size-aware batching + bounded concurrency + adaptive 413 splitting + backoff retries.
      const completedCount = await runUploadPool(pendingFiles);

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
  }, [runUploadPool, eventId, onUploadComplete, persistStatus]);

  // Hand the selected files to the global background uploader, then auto-minimize. The upload
  // continues in the provider (floating widget + Uploads history) even as the user navigates away.
  const handleStart = useCallback(() => {
    if (!isAuthenticated()) {
      alert('Please log in to upload moments. You need to be an existing user.');
      return;
    }
    const pending = filesRef.current.filter((f) => {
      const s = uploadStatusRef.current[f.id]?.status;
      return !s || s === 'pending' || s === 'error';
    });
    if (pending.length === 0) return;

    const res = backgroundUpload.startUpload({
      eventId,
      eventName: eventName || uploaderTitle || 'Selected project',
      files: pending,
    });
    if (res && res.ok === false) {
      if (res.reason === 'busy') {
        alert('Another upload is still in progress. Please wait for it to finish or stop it before starting a new one for a different project.');
      }
      return; // keep the selection so the user can retry
    }

    // Clear the local selection (now owned by the background uploader) and minimize the panel.
    setFiles([]);
    filesRef.current = [];
    setUploadStatus({});
    uploadStatusRef.current = {};
    persistStatus({});
    setShowUploader(false);

    if (onUploadComplete) onUploadComplete(pending.length);
  }, [backgroundUpload, eventId, eventName, uploaderTitle, onUploadComplete, persistStatus]);

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
    // Allow manual retry of any errored file (transient retries already happened automatically).
    if (status?.status !== 'error') {
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
      const completedCount = await runUploadPool([fileObj]);

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
  }, [runUploadPool, onUploadComplete, persistStatus]);

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

    // Every errored file is retryable — automatic transient retries already ran, and re-sending is
    // safe because the backend is idempotent (same file -> same moment, never duplicated).
    const failedFiles = currentFiles.filter(f => currentStatus[f.id]?.status === 'error');

    if (failedFiles.length === 0) {
      alert('No failed files to retry.');
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
      const completedCount = await runUploadPool(failedFiles);

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
  }, [runUploadPool, onUploadComplete, persistStatus, eventId]);

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
        // Every errored file can be retried (idempotent backend makes re-sending safe).
        stats.retryable++;
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
          className={`w-full bg-[#2a4d32] hover:bg-[#1e3b27] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${triggerClassName}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>{triggerText}</span>
        </button>
      )}

      {/* Uploader UI */}
      {showUploader && (
        <div className="bg-white bg-opacity-90 rounded-xl shadow-2xl p-6 border border-[#d4d4d8]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-[#2a4d32]">{uploaderTitle}</h3>
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
              accept="image/*,.cr3,.CR3"
              onChange={handleFileSelect}
              className="hidden"
            />
            {/* Hidden folder input for programmatic folder selection (if needed) */}
            <input
              ref={folderInputRef}
              type="file"
              multiple
              accept="image/*,.cr3,.CR3"
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
              <p className="text-xs text-gray-500">PNG, JPG, GIF, CR3 (Canon RAW) up to 10MB each</p>
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

          <div className="border-t border-[#d4d4d8] pt-4 mb-4">
            <p className="text-sm font-medium text-[#2a4d32] mb-1">Import from Google Drive</p>
            <p className="text-xs text-gray-500 mb-3">
              Paste a Google Drive link and start import. If the link is private, we will ask for a public link.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={driveFolderUrl}
                onChange={(e) => setDriveFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/…"
                disabled={driveImporting || isUploading}
                className="flex-1 px-3 py-2 border border-[#d4d4d8] rounded-lg text-sm text-[#2a4d32] placeholder:text-gray-400 disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={importFromGoogleDrive}
                disabled={driveImporting || isUploading || !driveFolderUrl.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  driveImporting || isUploading || !driveFolderUrl.trim()
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#2a4d32] hover:bg-[#1e3b27] text-white'
                }`}
              >
                {driveImporting ? 'Starting…' : 'Start Drive Import'}
              </button>
            </div>
            {driveImportMessage && (
              <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                {driveImportMessage}
              </div>
            )}
            {driveImportError && (
              <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                {driveImportError}
              </div>
            )}
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
                          onError={(e) => {
                            if (e.currentTarget.src !== CR3_PLACEHOLDER) {
                              e.currentTarget.src = CR3_PLACEHOLDER;
                            }
                          }}
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
                        <button
                          onClick={() => removeFile(fileObj.id)}
                          className="flex-shrink-0 text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
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
              onClick={handleStart}
              disabled={stats.total === 0}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                stats.total === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#67143A] hover:bg-[#4f0f2d] text-white'
              }`}
            >
              {`Upload ${stats.total} File${stats.total !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* Background Upload Indicator */}
          <div className="mt-3 text-xs text-gray-500 text-center">
            <div className="flex items-center justify-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Uploads continue in the background — you can switch tabs or minimize the window.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MomentUploader;

