# FitTrack Mobile

Meal, workout, weight and step tracking with first-launch profile setup. Android uses Health Connect; iPhone uses Apple Health. Reading health data requires a native build and permission.

## Android test download

Get FitTrack.apk from [Releases](https://github.com/sahand-git/fittrack-mobile/releases). Android 9+ is required. Keep an older installation if it contains data you need: older exports are broken and changing debug signing keys can prevent an in-place update. Do not uninstall without a confirmed backup. Stable release signing still needs configuration.

## Version 1.2

Phone layouts wrap at narrow widths and dialogs use dynamic viewport height. Each food-picker opening resets to All. The library includes 49 additional foods from USDA SR28 (revised May 2016), with NDB source identifiers and nutrient values per 100g edible portion. Prepared dishes vary by recipe.

New barcode lookups contact Open Food Facts directly. Found products save on the device and become searchable by name, brand or barcode. Saved barcodes work offline. A scan does not log a meal until confirmed.

Backup & Gemini contains JSON export/import. Native export writes a UTF-8 file to the app cache and opens the share sheet. Save it to a destination you control and verify it there. Opening or canceling the sheet does not prove it is saved. The web version downloads a JSON file; View / copy backup text is a fallback.

## Gemini

Smart Text, Calculate Macros and AI Coach use direct Gemini API requests. Each user may supply their own [Google AI Studio API key](https://aistudio.google.com/apikey), accept the data-sharing notice, and enable it for the session. The key is held only in memory, never bundled, persisted, or exported. The user's API quota and billing apply. Disconnect clears it. This is optional API-key setup, not Google OAuth; typing a Gmail address or owning a Gemini chat subscription does not authorize API access. Google sign-in and authenticated cloud storage remain unconfigured; the insecure email-only prototype sync is disabled.

AI estimates need portion review. Gemini requests were verified with mock responses; a live personal key and device checks remain necessary.

## iPhone

The iOS project is included. TestFlight needs Apple Developer signing and an App Store Connect upload. An unsigned compilation check does not produce an installable iPhone app.

## Development

Use Node.js 24: npm ci, npm run lint, npm test, npm run dev. Build web assets with npx vite build and run npx cap sync to refresh native projects. Never commit private keys or signing files. See MOBILE-SETUP.md for native health setup.
