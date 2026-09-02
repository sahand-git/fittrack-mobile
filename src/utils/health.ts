import { Capacitor } from '@capacitor/core';
import { Health, type HealthPlugin } from '@capgo/capacitor-health';

type HealthReader = Pick<HealthPlugin, 'isAvailable' | 'requestAuthorization' | 'queryAggregated'>;

export async function readHealthSteps(
  date: string,
  platform = Capacitor.getPlatform(),
  health: HealthReader = Health,
): Promise<number | null> {
  if (platform !== 'ios' && platform !== 'android') {
    throw new Error('Health access requires the installed Android or iPhone app. It is not available in a browser or home-screen website.');
  }
  const available = await health.isAvailable();
  if (!available.available) {
    throw new Error(platform === 'android'
      ? 'Health Connect is unavailable. Install or update Health Connect, then try again.'
      : 'Apple Health is unavailable on this device.');
  }
  const authorization = await health.requestAuthorization({ read: ['steps'], write: [] });
  if (platform === 'android' && !authorization.readAuthorized.includes('steps')) {
    throw new Error('Step access was not granted. Allow step reading in Health Connect and try again.');
  }
  // HealthKit deliberately does not disclose whether read access was denied.
  // Empty results must not be reported as a successful connection or overwrite a saved total.
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const now = new Date();
  if (!Number.isFinite(start.getTime()) || start >= now) return null;
  const { samples } = await health.queryAggregated({
    dataType: 'steps', startDate: start.toISOString(),
    endDate: new Date(Math.min(end.getTime(), now.getTime())).toISOString(),
    bucket: 'day', aggregation: 'sum',
  });
  if (!samples.length) return null;
  if (samples.some(sample => !Number.isFinite(sample.value) || sample.value < 0)) {
    throw new Error('The health app returned an invalid step count. Your saved total has not changed.');
  }
  const total = Math.round(samples.reduce((sum, sample) => sum + sample.value, 0));
  return total > 0 ? total : null;
}
