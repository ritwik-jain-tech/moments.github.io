// Headless upload engine shared by the global UploadProvider (background uploads) and the
// MomentUploader selection UI. Contains the size-aware batching, transient-retry classification,
// and the two request functions (single + bulk) that talk to the backend. Kept free of React so
// the provider can run uploads in the background regardless of which screen is mounted.

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// --- Bulk-upload tuning (robust for 1000+ images) --------------------------------------------
// Batches are packed by BYTES, not a fixed file count, so a request never exceeds the server's
// body limit (Cloud Run caps requests at ~32 MiB). A batch that still 413s is split adaptively.
export const REQUEST_BYTE_BUDGET = 12 * 1024 * 1024; // target max bytes per multipart request (12 MB)
export const MAX_FILES_PER_REQUEST = 5;              // also cap file count per request
export const UPLOAD_CONCURRENCY = 3;                 // parallel in-flight requests (worker pool)
export const MAX_TRANSIENT_RETRIES = 4;              // auto-retries for network/5xx/429/timeout, with backoff
export const RETRY_BASE_DELAY_MS = 800;              // exponential backoff base

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff with jitter for transient-failure retries.
export const backoffDelay = (attempt) =>
  RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 400);

// A request should be retried on network errors, timeouts, rate limiting, and 5xx.
export const isRetryableError = (err) => {
  const status = err?.status ?? err?.response?.status;
  if (status === 413) return false; // handled separately by adaptive splitting
  if (status) return status >= 500 || status === 429 || status === 408;
  return err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' ||
    err?.name === 'AbortError' || /network|failed to fetch|timeout/i.test(err?.message || '');
};

export const isTooLargeError = (err) => (err?.status ?? err?.response?.status) === 413;

export const isNonRetryableStatus = (status) =>
  status === 400 || status === 401 || status === 403 || status === 404 || status === 405 || status === 422;

// Greedily pack files into batches bounded by REQUEST_BYTE_BUDGET and MAX_FILES_PER_REQUEST.
// A single file at/over the budget is sent on its own (the single-file endpoint handles it).
export const buildSizeAwareBatches = (fileObjs) => {
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

// Decode natural dimensions from an image blob; falls back to a portrait default on failure
// (e.g. a CR3 whose embedded preview couldn't be extracted).
export const getImageDimensions = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 390, height: 844 });
    img.src = URL.createObjectURL(file);
  });

export const calculateAspectRatio = (width, height) => {
  if (!height || height === 0) return 0;
  return Math.round((width * 1000) / height);
};

// Auth headers from stored credentials (admin token, or user id / phone).
const authHeaders = () => {
  const headers = {};
  const adminToken = localStorage.getItem('adminToken');
  const userId = localStorage.getItem('userId');
  const phoneNumber = localStorage.getItem('phoneNumber');
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  } else {
    if (userId) headers['X-User-Id'] = userId;
    if (phoneNumber) headers['X-Phone-Number'] = phoneNumber;
  }
  return headers;
};

export const getUserInfo = () => {
  try {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    return {
      userId: localStorage.getItem('userId') || userProfile.userId,
      userName: localStorage.getItem('name') || userProfile.name || 'Unknown',
      phoneNumber: localStorage.getItem('phoneNumber') || userProfile.phoneNumber,
    };
  } catch {
    return {
      userId: localStorage.getItem('userId'),
      userName: localStorage.getItem('name') || 'Unknown',
      phoneNumber: localStorage.getItem('phoneNumber'),
    };
  }
};

// Build the moment payload for a selected file.
const buildMoment = async (fileObj, eventId) => {
  const userInfo = getUserInfo();
  const dimensions = await getImageDimensions(fileObj.previewBlob || fileObj.file);
  const creationTime = fileObj.file.lastModified || Date.now();
  return {
    creatorId: userInfo.userId,
    eventId: String(eventId),
    creationTime,
    media: { type: 'IMAGE', width: dimensions.width, height: dimensions.height },
    creatorDetails: { userId: userInfo.userId, userName: userInfo.userName },
    aspectRatio: calculateAspectRatio(dimensions.width, dimensions.height),
  };
};

// Attach HTTP status/response/code so the pool can classify (413 -> split, 5xx/network -> retry).
const enhanceError = (message, error) => {
  const e = new Error(message);
  e.status = error?.response?.status;
  e.response = error?.response;
  e.code = error?.code;
  return e;
};

const messageForStatus = (status, error, fallback) => {
  const server = error?.response?.data?.message || error?.response?.data?.error;
  if (status === 413) return 'Request too large for the server; it will be split and retried.';
  if (status === 400) return `Bad request (400): ${server || 'check the file is a valid image.'}`;
  if (status === 401) return 'Authentication required (401): please log in again.';
  if (status === 403) return "Access forbidden (403): you don't have permission to upload here.";
  if (status === 404) return 'Upload endpoint not found (404).';
  if (status >= 500) return `Server error (${status}): ${server || 'please try again.'}`;
  return fallback || `Upload failed (${status || 'network'}).`;
};

// Single-file path (batch of 1). Uploads the bytes DIRECTLY to Cloud Storage via a signed PUT URL,
// then creates the moment. Direct-to-GCS bypasses Cloud Run's ~32 MiB request cap, so large RAW/CR3
// originals (which used to 413 on /api/files/upload) now succeed.
export const uploadSingleFileAndCreateMoment = async (fileObj, { eventId }, onProgress) => {
  const headers = authHeaders();
  const file = fileObj.file;

  try {
    // 1. Ask the backend for a signed PUT URL for this object.
    const signResponse = await axios.post(
      `${API_BASE_URL}/api/files/signed-upload-url`,
      { eventId: String(eventId), files: [{ filename: file.name, contentType: file.type, fileType: 'IMAGE' }] },
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
    const target = signResponse.data?.data?.[0];
    if (!target?.uploadUrl || !target?.publicUrl) throw new Error('Signed upload response missing uploadUrl/publicUrl');

    // 2. PUT the bytes straight to GCS. No app auth header (the signature authorizes the request);
    //    send the Content-Type the backend intends the object to be stored as.
    await axios.put(target.uploadUrl, file, {
      headers: { 'Content-Type': target.contentType || file.type || 'application/octet-stream' },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 600000,
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });

    // 3. Create the moment from the now-uploaded object.
    const moment = await buildMoment(fileObj, eventId);
    moment.media.url = target.publicUrl;

    try {
      await axios.post(
        `${API_BASE_URL}/api/files/finalize-moments`,
        { moments: [moment] },
        { headers: { ...headers, 'Content-Type': 'application/json' }, timeout: 120000 }
      );
    } catch (momentError) {
      // File is uploaded; moment creation is idempotent and can be retried. Don't fail the upload.
      console.warn('Moment finalize failed after file upload (will be reconciled on retry):', momentError);
    }
    return { success: true };
  } catch (error) {
    const status = error.response?.status;
    const fallback = error.code === 'ECONNABORTED'
      ? 'Upload timed out.'
      : (!error.response ? `Network error: ${error.message || error.code || 'unknown'}` : undefined);
    throw enhanceError(messageForStatus(status, error, fallback), error);
  }
};

// Bulk path (batch of >1). Single multipart request creating all moments.
export const bulkUploadMomentsWithDetails = async (fileObjs, { eventId }, onProgress) => {
  const headers = authHeaders();
  const formData = new FormData();
  const moments = [];
  for (const fileObj of fileObjs) {
    moments.push(await buildMoment(fileObj, eventId));
    formData.append('files', fileObj.file);
  }
  formData.append('moments', JSON.stringify(moments));

  const apiUrl = `${API_BASE_URL}/api/files/bulk-upload-moments-with-details`;
  try {
    const response = await axios.post(apiUrl, formData, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000,
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const fallback = error.code === 'ECONNABORTED'
      ? 'Upload timed out.'
      : (!error.response ? `Network error: ${error.message || error.code || 'unknown'}` : undefined);
    throw enhanceError(messageForStatus(status, error, fallback), error);
  }
};
