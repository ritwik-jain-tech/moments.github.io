/**
 * The "Sanchi & Manas" demo event that every new user is onboarded into
 * (see onboard-user skill — default eventIds: ["123456"]).
 *
 * It is view-only: users can browse it to see the product in action, but
 * uploads are disabled. When they try to upload here, they are pushed to
 * create a real project of their own instead.
 */
export const DUMMY_EVENT_ID = '123456';

/** True when the given event id is the shared view-only demo event. */
export const isDummyEvent = (eventId) =>
  eventId != null && String(eventId) === DUMMY_EVENT_ID;
