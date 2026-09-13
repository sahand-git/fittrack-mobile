export interface AccountDeletionServices {
  markDeleting(uid: string): Promise<void>;
  deleteTree(path: string): Promise<void>;
  deleteIdentity(uid: string): Promise<void>;
}
export async function deleteServerAccount(uid: string, services: AccountDeletionServices) {
  // Mark first: rules and transactional AI quotas block fresh writes while cleanup runs.
  await services.markDeleting(uid);
  await services.deleteTree(`fitnessBackups/${uid}`);
  await services.deleteTree(`accounts/${uid}`);
  // Auth last leaves a retry path after a partial data-cleanup failure.
  await services.deleteIdentity(uid);
}
