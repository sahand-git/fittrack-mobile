# FitTrack: first-visit setup and mobile health access

This source update fixes onboarding and replaces the preset-step “Sync” buttons with a native health reader. It includes Android and iOS projects. It does **not** include a signed APK or an installable iPhone build.

## What is ready

- First launch collects name, age, body measurements, activity level, and goal. Email is optional. Setup runs locally and no longer claims that entering an email authorizes Google or a health app.
- Older saved profiles are asked to confirm their details once. Existing meals, workouts, and step logs are retained. Previously inserted demo step totals cannot be reliably distinguished from manually entered totals; correct these using Set Total or a real health read.
- Android uses Health Connect. Samsung Health must first be configured to write steps to Health Connect. Other apps can supply data if they support Health Connect sharing.
- iPhone uses Apple Health (HealthKit). Allow step reading in the native permission screen. Apple does not reveal denied read permission; an empty result is described as no readable data rather than a successful connection.
- Reads are user-triggered, use the selected local calendar day, and replace the day's total instead of adding it again. There is no background sync. Empty/invalid results leave the saved total unchanged.
- The browser/PWA cannot access these native health stores. It explains the restriction and keeps manual step entry available. Denied or unavailable motion access no longer starts a step simulation.
- The service worker fetches online navigation from the network so installed web apps can receive fixes. Local profile and log storage is retained.

## Install dependencies and verify

Use Node.js 22.18+ or 24 and npm:

```sh
npm ci
npm run lint
npm test
npm run build
npx cap sync
```

`package-lock.json` pins the dependencies. Capacitor 8.5.1 and `@capgo/capacitor-health` 8.10.5 are included. No Capgo account or cloud-update service is used.

## Gemini and backups in the bundled app

Version 1.2 uses direct Google Gemini API calls with each user's optional session-only API key and explicit consent. Google OAuth is not configured. JSON backup uses native Filesystem and Share plugins. Barcode lookups use Open Food Facts directly. No backend is required for these paths. The old email-only cloud backup endpoint is disabled until real authentication and storage exist.

## Android

1. Install Android Studio, SDK 36, and JDK 21 (use a compatible Android Studio bundled JDK).
2. Run `npm run mobile:sync`, then `npm run mobile:android`.
3. Android's minimum SDK is 28. Only READ_STEPS is retained from the health library's broad manifest permissions. The library provides the Health Connect availability query and permission-rationale activities.
4. Build and run on an Android phone. On versions needing the separate Health Connect app, install/update it.
5. For Samsung Health, enable step sharing with Health Connect in Samsung Health settings. Open FitTrack → Steps → Health Apps → Connect & read Health Connect steps, then grant read permission.

## iPhone

1. Use a Mac with the Xcode version required by Capacitor 8 and an Apple signing team.
2. Run `npm ci`, `npm run mobile:sync`, then `npm run mobile:ios`.
3. Select your signing team in Xcode. Confirm the HealthKit capability and entitlement. The project already includes `App.entitlements` and the step-read purpose string in `Info.plist`.
4. Run on an iPhone with real Health data. In FitTrack → Steps → Health Apps, tap Connect & read Apple Health steps and allow access.

The starter application identifier is `com.sahand.fitness`. Confirm it is the identifier you want before signing or publishing.

## Checks completed and remaining

Completed here: TypeScript check, frontend production build, six health-reader logic tests, native plugin sync for both platforms, and browser checks for first launch, validation, one-time legacy-profile review, saved-profile reload, retained logs, manual step entry, and denied motion access.

The health-reader tests simulate SDK responses; they are not physical-device integration tests. Android compilation, Xcode compilation, signing, real permission prompts, native step totals, and app-store review have not been verified here. This Windows workspace has no Android SDK or Xcode.

Before distributing, test both phones with known daily totals, denied/revoked permission, zero/no readable steps, repeated reads, and midnight/timezone boundaries. Review the included health-data explanation (`public/privacypolicy.html`) against your deployed server's actual data handling. The existing email-backup feature is separate from Google OAuth or health authorization.

## References

- [Capacitor environment requirements](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Health plugin](https://github.com/Cap-go/capacitor-health)
- [Android Health Connect setup](https://developer.android.com/health-and-fitness/health-connect/get-started)
- [Samsung Health sharing through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect)
- [Apple Health authorization](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)
