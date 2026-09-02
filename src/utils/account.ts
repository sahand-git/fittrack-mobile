export function accountStorageKeys(uid?: string) {
  // Preserve existing offline records. Verified accounts get their own namespace.
  const suffix = uid ? ':account:' + encodeURIComponent(uid) : '';
  return {
    profile: 'nutrifit_user_profile_v2' + suffix,
    logs: 'nutrifit_daily_logs_v2' + suffix,
    foods: 'nutrifit_custom_foods_v2' + suffix,
    weights: 'nutrifit_weights_v2' + suffix,
  };
}

export function authErrorMessage(error: unknown) {
  const code = (error as {code?: string})?.code;
  const messages: Record<string,string> = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/wrong-password': 'The email or password is incorrect.',
    'auth/user-not-found': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/email-already-in-use': 'This email already has an account. Sign in or reset your password.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait before trying again.',
    'auth/network-request-failed': 'Could not reach sign-in. Check your connection and try again.',
    'auth/operation-not-allowed': 'Email/password login has not been enabled by the app owner yet.',
    'auth/invalid-api-key': 'Login setup needs to be completed by the app owner.',
    'auth/user-disabled': 'This account is disabled. Contact the app owner.',
    'auth/requires-recent-login': 'Please sign in again before changing your account.',
  };
  return messages[code || ''] || 'Could not complete this account request. Please try again.';
}
