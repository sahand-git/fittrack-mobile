import { doc, getDocFromServer, getFirestore, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firebaseApp, firebaseAuth } from '../context/AuthContext';
import { nextRevision, serializeBackup, validateCloudDocument, type CloudSnapshot } from './cloudBackupCore';

function requireAccount(accountId?: string) {
 const user=firebaseAuth?.currentUser;
 if(!firebaseApp || !accountId || !user || user.uid!==accountId || !user.emailVerified) throw new Error('Sign in with a verified account to use cloud backup.');
 if(typeof navigator!=='undefined' && navigator.onLine===false) throw new Error('You are offline. Connect to the internet and try again.');
 return {user,reference:doc(getFirestore(firebaseApp),'fitnessBackups',accountId)};
}
export async function readCloudBackup(accountId?: string): Promise<CloudSnapshot|null> {
 const {reference}=requireAccount(accountId);
 const result=await getDocFromServer(reference);
 requireAccount(accountId);
 return result.exists()?validateCloudDocument(result.data()):null;
}
export async function writeCloudBackup(accountId: string|undefined, value: unknown, expectedRevision: number|null): Promise<CloudSnapshot> {
 const {reference}=requireAccount(accountId);
 const payload=serializeBackup(value);
 const revision=await runTransaction(reference.firestore,async transaction=>{
  requireAccount(accountId);
  const previous=await transaction.get(reference);
  const actual=previous.exists()?validateCloudDocument(previous.data()).revision:null;
  const revision=nextRevision(expectedRevision,actual);
  requireAccount(accountId);
  transaction.set(reference,{schemaVersion:1,revision,payload,updatedAt:serverTimestamp()});
  return revision;
 });
 // runTransaction resolves only after the server acknowledges the commit.
 return {revision,payload,updatedAt:new Date().toISOString()};
}
export function cloudBackupError(error: unknown): string {
 const code=(error as {code?:string})?.code?.replace('firestore/','');
 if(code==='permission-denied')return 'Cloud access was denied. Verify your email and ask the app owner to check cloud setup.';
 if(code==='unavailable' || code==='deadline-exceeded')return 'Cloud service could not be reached. Check your connection and try again.';
 if(code==='resource-exhausted')return 'Cloud backup is temporarily at its free service limit. Export a JSON file and try again later.';
 if(code==='failed-precondition' || code==='not-found')return 'Cloud backup setup is not ready. You can still export a JSON file.';
 if(code==='unauthenticated')return 'Your session expired. Sign in again to use cloud backup.';
 return error instanceof Error?error.message:'Cloud backup could not finish. Your local data is unchanged.';
}
