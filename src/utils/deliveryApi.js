import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Client delivery flow (review + album). Public, token-scoped endpoints require no auth;
 * the export endpoint is called by the photographer from the admin project page.
 */

const unwrap = (res) => (res?.data?.data !== undefined ? res.data.data : res?.data);

/** Photographer: export approved moments to the client review page. Returns { reviewToken, ... }. */
export async function exportToReview(eventId, userId) {
  const res = await axios.post(`${API_BASE_URL}/api/event/${eventId}/review/export`, { userId });
  return unwrap(res);
}

/** Public: event meta (name/date/thumbnail + flags) for a review token. */
export async function fetchReviewInfo(reviewToken) {
  const res = await axios.get(`${API_BASE_URL}/api/event/review/${reviewToken}`);
  return unwrap(res);
}

/** Public: approved moments for the review page (paginated). Returns MomentsResponse. */
export async function fetchReviewFeed(reviewToken, { offset = 0, limit = 60 } = {}) {
  const res = await axios.get(`${API_BASE_URL}/api/moments/review/${reviewToken}`, {
    params: { offset, limit },
  });
  return unwrap(res);
}

/** Public: set one moment's client selection (SELECTED | REJECTED | PENDING). */
export async function setClientSelection(reviewToken, momentId, selection) {
  const res = await axios.post(`${API_BASE_URL}/api/moments/client-selection`, {
    reviewToken,
    momentId,
    selection,
  });
  return unwrap(res);
}

/** Public: bulk-set client selection for many moments. */
export async function setClientSelectionBatch(reviewToken, momentIds, selection) {
  const res = await axios.post(`${API_BASE_URL}/api/moments/client-selection/batch`, {
    reviewToken,
    momentIds,
    selection,
  });
  return unwrap(res);
}

/** Public: client finalizes their album selection, unlocking the album page. */
export async function finalizeAlbum(reviewToken) {
  const res = await axios.post(`${API_BASE_URL}/api/event/review/${reviewToken}/finalize`);
  return unwrap(res);
}

/** Public: finalized, client-selected moments in chronological order. */
export async function fetchAlbumMoments(reviewToken) {
  const res = await axios.get(`${API_BASE_URL}/api/moments/album/${reviewToken}`);
  return unwrap(res);
}

/** Resolve a moment's best display image url across response shapes. */
export function momentImageUrl(moment) {
  return (
    moment?.media?.feedUrl ||
    moment?.media?.url ||
    moment?.feedUrl ||
    moment?.url ||
    ''
  );
}

/** Stable id across response shapes. */
export function momentKey(moment) {
  return moment?.momentId || moment?.id || momentImageUrl(moment);
}
