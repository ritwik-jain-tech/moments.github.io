/**
 * Persist studio admin session after OTP, Firebase email, or Google sign-in.
 * @param {object} userProfile — backend UserProfile (must include userId)
 * @param {string} [phoneFallback]
 * @param {string} [jwtToken] — backend JWT (Authorization: Bearer) when issued
 */
export function persistAdminSession(userProfile, phoneFallback, jwtToken) {
  if (!userProfile?.userId) return;

  const userId = userProfile.userId;
  const phoneNumberFromResponse = userProfile.phoneNumber || phoneFallback || '';
  const name = userProfile.name || '';

  localStorage.setItem('userId', userId);
  localStorage.setItem('phoneNumber', phoneNumberFromResponse);
  localStorage.setItem('name', name);
  localStorage.setItem('userProfile', JSON.stringify(userProfile));
  localStorage.setItem('isAdminLoggedIn', 'true');

  sessionStorage.setItem('userId', userId);
  sessionStorage.setItem('phoneNumber', phoneNumberFromResponse);
  sessionStorage.setItem('name', name);
  sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
  sessionStorage.setItem('isAdminLoggedIn', 'true');

  if (userProfile.emailId) {
    localStorage.setItem('emailId', userProfile.emailId);
    sessionStorage.setItem('emailId', userProfile.emailId);
  } else {
    localStorage.removeItem('emailId');
    sessionStorage.removeItem('emailId');
  }

  if (jwtToken) {
    localStorage.setItem('adminToken', jwtToken);
    sessionStorage.setItem('adminToken', jwtToken);
  }

  if (phoneNumberFromResponse) {
    localStorage.setItem('enteredPhoneNumber', phoneNumberFromResponse);
    const last10 = phoneNumberFromResponse.replace(/\D/g, '').slice(-10);
    localStorage.setItem('enteredPhoneNumberLast10', last10);
  }
}

export function clearAdminSessionStorage() {
  const keys = [
    'userId',
    'phoneNumber',
    'name',
    'userProfile',
    'isAdminLoggedIn',
    'enteredPhoneNumber',
    'enteredPhoneNumberLast10',
    'adminToken',
    'emailId',
  ];
  keys.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}
