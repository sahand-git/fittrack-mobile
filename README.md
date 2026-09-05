# FitTrack Mobile

Meal, workout, weight and step tracking with first-launch profile setup. Android uses Health Connect; iPhone uses Apple Health. Reading health data requires a native build and permission.

## Android test download

Get FitTrack.apk from [Releases](https://github.com/sahand-git/fittrack-mobile/releases). Android 9+ is required. Keep an older installation if it contains data you need: older exports are broken and changing debug signing keys can prevent an in-place update. Do not uninstall without a confirmed backup. Stable release signing still needs configuration.

## Version 1.5 friends beta

English, Arabic, and Kurdish Sorani are available from the language selector. Arabic and Sorani use right-to-left layouts, translated food and workout search, and AI replies in the selected language.

Verified accounts can manually save a private backup to Firebase Cloud Firestore and restore it on another device. Each account can access only its own backup. Passwords and Gemini API keys are never included. Users can permanently delete their login, cloud backup, and account-specific local records inside Backup & Account.

Closing Meals, Workouts, or AI Coach returns to the Dashboard. Food categories wrap into readable rows and related categories are grouped. The food picker includes offline Twemoji illustrations and uses available package photos, with credits linked from the list.

The first-launch screen includes sign-in, account creation, email verification, password reset and an offline option. Email/Password and Google sign-in are enabled in the owner's Firebase project. Continue with Google uses native account selection on phones; see [FIREBASE-SETUP.md](FIREBASE-SETUP.md). Verified users get separate local records. Signing out preserves those records and clears the Gemini key. Google and email/password accounts use Firebase Authentication.

Gemini setup lists compatible models returned by Google and verifies generation before enabling AI. Temporary server errors receive two bounded retries. Model-access, quota, authentication and service errors show their HTTP code and sanitized Google details instead of a generic temporary-unavailable message. A live API key is still needed to establish the cause of any particular user's service failure.

Phone layouts wrap at narrow widths and dialogs use dynamic viewport height. Each food-picker opening resets to All. The library includes 49 additional foods from USDA SR28 (revised May 2016), with NDB source identifiers and nutrient values per 100g edible portion. Prepared dishes vary by recipe.

New barcode lookups contact Open Food Facts directly. Found products save on the device and become searchable by name, brand or barcode. Saved barcodes work offline. A scan does not log a meal until confirmed.

Backup & Gemini contains JSON export/import. Native export writes a UTF-8 file to the app cache and opens the share sheet. Save it to a destination you control and verify it there. Opening or canceling the sheet does not prove it is saved. The web version downloads a JSON file; View / copy backup text is a fallback.

## Gemini

Smart Text, Calculate Macros and AI Coach use direct Gemini API requests. Each user may supply their own [Google AI Studio API key](https://aistudio.google.com/apikey), accept the data-sharing notice, and enable it for the session. The key is held only in memory, never bundled, persisted, or exported. The user's API quota and billing apply. Disconnect clears it. This is optional API-key setup, not Google OAuth; typing a Gmail address or owning a Gemini chat subscription does not authorize API access. Google login identifies the user; it does not authorize Gemini API usage. Cloud backup is manual and is separate from Gemini.

AI estimates need portion review. Twenty-six unit tests passed. Live Firebase sign-up, wrong-password rejection and correct-password sign-in passed using a temporary account that was then removed. Browser checks cover account isolation and verification gating with mocked responses. Native Google account selection, email delivery, and physical-device health/sharing checks still need confirmation.

## iPhone

The iOS project is included. TestFlight needs Apple Developer signing and an App Store Connect upload. An unsigned compilation check does not produce an installable iPhone app.

## Development

Use Node.js 24: npm ci, npm run lint, npm test, npm run dev. Build web assets with npx vite build and run npx cap sync to refresh native projects. Never commit private keys or signing files. See MOBILE-SETUP.md for native health setup.
