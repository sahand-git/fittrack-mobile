import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;
if (serverUrl && new URL(serverUrl).protocol !== 'https:') {
  throw new Error('CAPACITOR_SERVER_URL must use HTTPS.');
}

const config: CapacitorConfig = {
  appId: 'com.sahand.fittrackv2',
  appName: 'Calorie Pewar',
  webDir: 'dist/client',
  plugins: { FirebaseAuthentication: { skipNativeAuth: true, providers: ['google.com'] } },
  experimental: { ios: { spm: {
    swiftToolsVersion: '6.1',
    packageOptions: { '@capacitor-firebase/authentication': { symlink: true } },
    packageTraits: { '@capacitor-firebase/authentication': ['Google'] },
  } } },
  // Set this to your deployed app URL when building a connected mobile version.
  // The bundled app uses Firebase accounts and VITE_API_ORIGIN for authenticated AI.
  ...(serverUrl ? { server: { url: serverUrl, cleartext: false } } : {}),
};

export default config;
