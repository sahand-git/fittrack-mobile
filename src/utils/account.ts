export function accountStorageKeys(uid?: string) {
  // Preserve existing offline records. Verified accounts get their own namespace.
  const suffix = uid ? ':account:' + encodeURIComponent(uid) : '';
  return {
    profile: 'nutrifit_user_profile_v2' + suffix,
    logs: 'nutrifit_daily_logs_v2' + suffix,
    foods: 'nutrifit_custom_foods_v2' + suffix,
    weights: 'nutrifit_weights_v2' + suffix,
    recovery: 'nutrifit_user_profile_v2' + suffix + '_before_restore',
    supplementRoutine: 'nutrifit_supplement_routine_v1' + suffix,
    notificationPreferences: 'fittrack_notification_preferences_v2' + suffix,
    notificationsEnabled: 'fittrack_notifications_enabled' + suffix,
    notificationTimestamps: 'fittrack_last_notified_timestamps' + suffix,
    aiConsent: 'nutrifit_ai_consent_v1' + suffix,
  };
}

export function clearAccountStorage(storage: Pick<Storage, 'removeItem'>, uid?: string): void {
  let failed = false;
  for (const key of Object.values(accountStorageKeys(uid))) {
    for (const target of [key, key + '_corrupt_recovery']) {
      try { storage.removeItem(target); } catch { failed = true; }
    }
  }
  if (failed) throw new Error('Some device data could not be removed. Please retry before leaving this device.');
}

export const canConfirmAccountDeletion = (value: string) => value === 'DELETE';

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
    'auth/operation-not-allowed': 'This sign-in method has not been enabled by the app owner yet.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled. You can try again.',
    'auth/cancelled-popup-request': 'Another Google sign-in window is already open.',
    'auth/popup-blocked': 'Allow the Google sign-in popup, then try again.',
    'auth/unauthorized-domain': 'This app address needs to be registered by the owner for Google sign-in.',
    'auth/account-exists-with-different-credential': 'This email uses another sign-in method. Sign in using that method first.',
    'auth/missing-google-token': 'Google did not complete sign-in. Please choose your account again.',
    'auth/invalid-api-key': 'Login setup needs to be completed by the app owner.',
    'auth/user-disabled': 'This account is disabled. Contact the app owner.',
    'auth/requires-recent-login': 'Please sign in again before changing your account.',
    'auth/developer-error': 'Google Sign-In configuration error. Please check Google Play Services.',
    '10': 'Google Sign-In error. Please verify your Google Play Services.',
    '12500': 'Google Sign-In was interrupted. Please select your Google account again.',
  };
  return messages[code || ''] || (error instanceof Error && error.message ? error.message : 'Could not complete this account request. Please try again.');
}


export function migrateGuestRoutine(store: Pick<Storage,'getItem'|'setItem'|'removeItem'>, uid?: string): void {
 if(uid)return;
 const legacy='fittrack_fixed_vitamin_routine';
 const raw=store.getItem(legacy);
 if(raw===null)return;
 const key=accountStorageKeys().supplementRoutine;
 if(store.getItem(key)===null)store.setItem(key,raw);
 // Preserve a second legacy record if the guest already has a newer routine.
 if(store.getItem(key)===raw)store.removeItem(legacy);
}

export function createReminderAccountScope(cancel:()=>Promise<void>) {
 let uid:string|undefined;let generation=0;let ready=false;
 let queue=Promise.resolve();
 return {
  get uid(){return uid;},get generation(){return generation;},get ready(){return ready;},
  configure(next?:string):Promise<void> {
   ready=false;uid=next;const revision=++generation;
   const operation=queue.catch(()=>{}).then(cancel).then(()=>{if(revision===generation)ready=true;});
   queue=operation;return operation;
  }
 };
}
