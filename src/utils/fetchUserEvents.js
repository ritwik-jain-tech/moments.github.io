import axios from 'axios';
import { API_BASE_URL } from '../config/api';

function parseEventListFromResponse(data) {
  const payload = data?.data !== undefined ? data.data : data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.events)) return payload.events;
  return [];
}

/**
 * GET /api/event/for-user?userId= — events where the user is in event.userIds (same rule as storage overview).
 */
export async function fetchEventsForUser(userId, options = {}) {
  const id = userId != null ? String(userId).trim() : '';
  if (!id) {
    throw new Error('userId is required');
  }
  const { token } = options;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const { data } = await axios.get(`${API_BASE_URL}/api/event/for-user`, {
    params: { userId: id },
    headers,
  });
  return parseEventListFromResponse(data);
}

/** Overlay cached profile rows (e.g. status, delivery) onto API events by event id. */
export function mergeEventsWithProfileDetails(fromApi, profileEventDetails) {
  const cachedById = new Map();
  for (const ev of profileEventDetails || []) {
    const eid = String(ev?.eventId ?? ev?.id ?? '').trim();
    if (eid) cachedById.set(eid, ev);
  }
  const apiArr = Array.isArray(fromApi) ? fromApi : [];
  return apiArr.map((ev) => {
    const eid = String(ev?.eventId ?? ev?.id ?? '').trim();
    const c = eid ? cachedById.get(eid) : null;
    if (!c) return ev;
    return { ...c, ...ev };
  });
}

export function syncProfileEventDetails(events) {
  try {
    const profileStr = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile');
    const profile = profileStr ? JSON.parse(profileStr) : {};
    profile.eventDetails = Array.isArray(events) ? events : [];
    const s = JSON.stringify(profile);
    localStorage.setItem('userProfile', s);
    sessionStorage.setItem('userProfile', s);
  } catch {
    /* ignore */
  }
}

function getLast10DigitsPhone(profile) {
  let phoneNumber = profile?.phoneNumber;
  if (!phoneNumber) {
    const storedPhoneNumber = localStorage.getItem('enteredPhoneNumber');
    const storedLast10 = localStorage.getItem('enteredPhoneNumberLast10');
    if (storedLast10) return storedLast10;
    if (storedPhoneNumber) return storedPhoneNumber.replace(/\D/g, '').slice(-10);
    return null;
  }
  return phoneNumber.replace(/\D/g, '').slice(-10);
}

/**
 * Primary: for-user API. Fallback: legacy phone profile (when primary fails, e.g. network).
 */
export async function fetchEventsForUserWithFallback(userId, options = {}) {
  try {
    return await fetchEventsForUser(userId, options);
  } catch (primaryErr) {
    const profileStr = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile');
    let parsedProfile = null;
    if (profileStr) {
      try {
        parsedProfile = JSON.parse(profileStr);
      } catch {
        parsedProfile = null;
      }
    }
    const last10 = getLast10DigitsPhone(parsedProfile);
    if (!last10 || last10.length !== 10) {
      throw primaryErr;
    }
    const { data } = await axios.get(`${API_BASE_URL}/api/userProfile/phone?phoneNumber=${last10}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const userProfileData = data?.data ?? data;
    const eventsData = userProfileData?.eventDetails || [];
    const list = Array.isArray(eventsData) ? eventsData : [];
    syncProfileEventDetails(list);
    return list;
  }
}
