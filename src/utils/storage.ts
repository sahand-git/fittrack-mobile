type Store = Pick<Storage, 'getItem' | 'setItem'>;
// Keys with unreadable data remain protected until a recovery copy can be saved.
const protectedKeys = new Set<string>();
export function readStoredJSON<T>(store: Store, key: string, fallback: T, validate: (value: unknown) => boolean): {value:T;error:string|null} {
 try {
  const raw=store.getItem(key);
  if(raw===null)return {value:fallback,error:null};
  const value=JSON.parse(raw);
  if(!validate(value))throw new Error('Invalid saved data');
  return {value,error:null};
 } catch {
  protectedKeys.add(key);
  return {value:fallback,error:'Some saved data could not be read. Original recovery copies are retained on this device. Do not clear browser storage.'};
 }
}
export function persistStoredJSON(store: Store, key: string, value: unknown): void {
 const json=JSON.stringify(value);
 if(protectedKeys.has(key)) {
  const original=store.getItem(key);
  // Never overwrite an existing recovery copy with a second damaged record.
  if(original!==null) {
   const existing=store.getItem(key+'_corrupt_recovery');
   if(existing!==null && existing!==original)throw new Error('An earlier recovery copy must be exported before replacing damaged data.');
   store.setItem(key+'_corrupt_recovery',original);
  }
 }
 store.setItem(key,json);
 protectedKeys.delete(key);
}


/** Retain a complete recovery archive before a multi-key restore; roll back on failure. */
export function persistRestore(store: Store & Pick<Storage,'removeItem'>, recoveryKey: string, previousBackup: string, writes: readonly (readonly [string, unknown])[]): void {
 const oldValues = writes.map(([key]) => [key, store.getItem(key)] as const);
 store.setItem(recoveryKey, previousBackup);
 try {
  for (const [key,value] of writes) persistStoredJSON(store,key,value);
 } catch (error) {
  for (const [key,value] of oldValues) {
   try { if(value===null)store.removeItem(key);else store.setItem(key,value); }
   catch { /* The full pre-restore archive remains available if rollback is blocked. */ }
  }
  throw error;
 }
}


export function collectCorruptRecovery(store: Pick<Storage,'getItem'>, keys: readonly string[]): Record<string,string> {
 const records: Record<string,string> = {};
 for (const key of keys) {
  const raw=store.getItem(key+'_corrupt_recovery');
  if(raw!==null) records[key]=raw;
 }
 return records;
}
