# FitTrack account setup

Project: fittrack-mobile-3db2a
Owner: sahandabas2@gmail.com
Owner console: https://console.firebase.google.com/u/1/project/fittrack-mobile-3db2a/authentication/users

Firebase Authentication stores the app's registered accounts. Email/Password and Google providers are enabled. The owner can inspect, disable or delete accounts through the console. No admin credentials are placed in the phone app, and no separate database is needed for passwords. The project uses the Spark plan.

All three registered client configurations are included: Web, Android package com.sahand.fitness, and iPhone bundle com.sahand.fitness. The iPhone plist is included in Xcode resources with its reversed-client-ID callback scheme. Google account tokens from native sign-in are passed to Firebase for verification. The web version uses Firebase's popup flow.

## Android signing and later releases

Register the SHA-1 fingerprint of the APK actually distributed under Project settings > Android > Add fingerprint. Each current debug build generates a different signing key. A new build therefore needs its fingerprint registered and may not update over the old one. Stable owner-controlled signing remains needed before routine releases or Google Play publication. Never commit a keystore or publish it in build artifacts.

## Data and owner controls

Email/password users must verify their email before opening their account. Signing out retains local fitness records and clears the Gemini session key. Each verified user has a separate local namespace; guest records keep the original keys. These records are not cloud storage and are not uploaded to the owner. Google login requests basic identity information and does not read Gmail or grant Gemini API usage.

## Verification

26 unit tests and TypeScript checks passed. A live temporary Firebase account verified signup, unverified email state, wrong-password rejection and correct-password login; it was removed after the check. Native compilation results are recorded in GitHub Actions. Physical Google account selection, verification-email delivery and signed TestFlight distribution still need confirmation.
