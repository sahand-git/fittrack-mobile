import { ApiError } from './app.ts';
import type { Capability, Limits } from './app.ts';
export type RecordData = Record<string, unknown>;
export interface Transaction { get(path: string): Promise<RecordData | undefined>; set(path: string, value: RecordData): void }
export interface Store { get(path: string): Promise<RecordData | undefined>; transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> }
function entitled(account: RecordData | undefined, now: number) {
  if (account?.isPremium !== true) return false;
  const expiry = account.expiresAt;
  if (expiry === undefined) return true;
  const time = typeof expiry === 'number' ? expiry : typeof (expiry as { toMillis?: unknown })?.toMillis === 'function' ? (expiry as { toMillis(): number }).toMillis() : NaN;
  return Number.isFinite(time) && time > now;
}
function count(value: unknown) { if (value === undefined) return 0; if (!Number.isSafeInteger(value) || (value as number) < 0) throw new ApiError(503, 'service_unavailable'); return value as number; }
export function createQuotaService(store: Store, limits: Limits, clock = Date.now) {
  const paths = (uid: string, now: number) => {
    if (!uid || uid.includes('/')) throw new ApiError(401, 'unauthorized');
    const day = new Date(now).toISOString().slice(0, 10);
    return { account: `accounts/${uid}`, deleted: `accountDeletions/${uid}`, user: `accounts/${uid}/aiUsage/${day}`, global: `aiGlobalUsage/${day}` };
  };
  return {
    async status(uid: string): Promise<Capability> {
      const now = clock(); const p = paths(uid, now);
      const [a, u, g, d] = await Promise.all([store.get(p.account), store.get(p.user), store.get(p.global), store.get(p.deleted)]);
      const isPremium = entitled(a, now) && !d;
      return { enabled: isPremium && a?.aiEnabled === true, isPremium, remaining: Math.max(0, Math.min(limits.userDaily - count(u?.count), limits.globalDaily - count(g?.count))), limit: limits.userDaily };
    },
    async reserve(uid: string) {
      const now = clock(); const p = paths(uid, now); const minute = Math.floor(now / 60000);
      await store.transaction(async tx => {
        // Read entitlement and both budgets inside the same transaction, before any write.
        const [account, user, global, deleted] = await Promise.all([tx.get(p.account), tx.get(p.user), tx.get(p.global), tx.get(p.deleted)]);
        if (deleted || !entitled(account, now) || account?.aiEnabled !== true) throw new ApiError(403, 'ai_not_enabled');
        const userCount = count(user?.count), globalCount = count(global?.count);
        const userMinute = user?.minute === minute ? count(user.minuteCount) : 0;
        const globalMinute = global?.minute === minute ? count(global.minuteCount) : 0;
        if (userCount >= limits.userDaily || globalCount >= limits.globalDaily) throw new ApiError(429, 'quota_exceeded');
        if (userMinute >= limits.userMinute || globalMinute >= limits.globalMinute) throw new ApiError(429, 'rate_limited');
        const expiresAt = new Date(now + 7 * 86400000);
        tx.set(p.user, { count: userCount + 1, minute, minuteCount: userMinute + 1, expiresAt });
        tx.set(p.global, { count: globalCount + 1, minute, minuteCount: globalMinute + 1, expiresAt });
      });
    },
  };
}
