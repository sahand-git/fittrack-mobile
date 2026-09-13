# FitTrack v2 Account Setup

Project: fit-track-v2
Package: com.sahand.fittrackv2
Owner console: https://console.firebase.google.com/u/0/project/fit-track-v2/authentication/users

Firebase Authentication stores the app's registered accounts. Email/Password and Google providers are enabled. The owner can inspect, disable or delete accounts through the console. No admin credentials are placed in the phone app, and no separate database is needed for passwords. The project uses the Spark plan.

All registered client configurations are included: Web and Android package `com.sahand.fittrackv2`. Google account tokens from native sign-in are passed to Firebase for verification. The web version uses Firebase's popup/redirect flow.

## Android APK Signing & Google Sign-In Registration

For Google Sign-In to work on native Android APKs:
1. Open [Firebase Console Project Settings](https://console.firebase.google.com/u/0/project/fit-track-v2/settings/general/android:com.sahand.fittrackv2).
2. Under **Your apps** > **Android apps (`com.sahand.fittrackv2`)**:
   - Click **Add fingerprint**.
   - Paste the permanent **SHA-1** fingerprint of the project's committed `android/app/debug.keystore`:
     `9F:36:91:19:BE:7D:08:24:0F:B6:03:B6:E1:35:D6:A2:37:FC:72:BF`
   - Optionally add the **SHA-256** fingerprint:
     `11:BA:B8:91:AB:DE:FB:73:CF:6C:73:FA:D0:9D:CC:A2:18:92:7B:72:F3:6B:14:6F:02:4D:10:63:5E:90:49:07`
3. Download the updated `google-services.json` and replace `android/app/google-services.json`.
4. Run `npx cap sync android` to ensure native assets and Google client identifiers are refreshed.

## Cloud Backup Activation (Firestore)

Cloud backup enables verified accounts to safely persist and restore their personal nutrition and workout logs across devices:
1. In the Firebase Console, go to **Build** > **Firestore Database**.
2. If not yet created, click **Create database** (choose **Production mode** and your closest region).
3. In the **Rules** tab, deploy the project's rules from [`firestore.rules`](firestore.rules):
   - Only authenticated users with `email_verified == true` (which Google Sign-In satisfies automatically) can create, read, update, or delete their own backup document under `/fitnessBackups/{userId}`.
   - Payloads are validated to contain strictly formatted nutrition and fitness data up to 750 KB.
4. When signed in with Google or a verified email, tap **Backup & Account** in FitTrack to perform a manual cloud sync or automatic backup.

## Data and owner controls

Email/password users must verify their email before opening their account. Signing out retains local fitness records and clears the Gemini session key. Each verified user has a separate local namespace; guest records keep the original keys. These records are not cloud storage and are not uploaded to the owner. Google login requests basic identity information and does not read Gmail or grant Gemini API usage.

## Verification

26 unit tests and TypeScript checks passed. A live temporary Firebase account verified signup, unverified email state, wrong-password rejection and correct-password login; it was removed after the check. Native compilation results are recorded in GitHub Actions. Physical Google account selection, verification-email delivery and signed TestFlight distribution still need confirmation.
