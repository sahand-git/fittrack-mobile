# FitTrack Mobile

Meal, workout, weight and step tracking with first-launch profile setup. Android uses Health Connect; iPhone uses Apple Health. Health reading requires a native build and the user's permission.

## Install on Android

Open [Releases](https://github.com/sahand-git/fittrack-mobile/releases), select the newest Android test build, and download **FitTrack.apk** on your phone. The automated build publishes an APK after successful checks and compilation.

These are debug-signed test builds for Android 9+. Native health behavior still needs testing on real phones. AI and email backup require a deployed backend; the bundled test APK contains local tracking and native integrations only.

## Barcode lookup and saved products

New barcodes are looked up directly over HTTPS using native HTTP on Android/iOS and browser fetch on the web. Found products automatically save on the device and become searchable by name, brand or barcode; the Saved filter narrows the list. Re-scanning a saved barcode works offline. A scan does not automatically log a meal. Products with incomplete nutrition need values entered from their package label. No private app server is needed for barcode lookup.

Before replacing an older debug-signed APK, export your local data using **Sync Gmail → Export JSON**. If an installation requires uninstalling the old build, restore the exported file using **Import Backup** afterward.

## Install on iPhone

The iOS project is included. An installable TestFlight release requires your Apple Developer signing configuration and an App Store Connect upload. A successful unsigned compilation check alone does not produce an installable iPhone app.

## Develop

Use Node.js 24. Run `npm ci`, `npm run lint`, and `npm test`. For the web app, set `GEMINI_API_KEY` in `.env` on your server and run `npm run dev`. Keep keys out of the frontend and repository.

Run `npm run mobile:sync` to refresh native projects, then `npm run mobile:android` or `npm run mobile:ios`. See [MOBILE-SETUP.md](MOBILE-SETUP.md) for health permissions, backend configuration, and remaining physical-device checks.
