import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;
if (serverUrl && new URL(serverUrl).protocol !== 'https:') {
  throw new Error('CAPACITOR_SERVER_URL must use HTTPS.');
}

const config: CapacitorConfig = {
  appId: 'com.sahand.fitness',
  appName: 'FitTrack',
  webDir: 'dist',
  // Set this to your deployed app URL when building a connected mobile version.
  // Without it the bundled app supports local tracking and native health reads;
  // AI, barcode lookup, and server-backed sync still require the deployed server.
  ...(serverUrl ? { server: { url: serverUrl, cleartext: false } } : {}),
};

export default config;
