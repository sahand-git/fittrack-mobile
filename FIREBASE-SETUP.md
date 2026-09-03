# FitTrack account setup status

Firebase project: fittrack-mobile-3db2a
Owner account: sahandabas2@gmail.com
Owner user console: https://console.firebase.google.com/u/1/project/fittrack-mobile-3db2a/authentication/users

Email/Password and Google providers are enabled. Firebase Authentication is the user-account database; no separate database is needed for passwords. Owner actions such as viewing, disabling and deleting users happen in the Firebase console. No owner credentials or client-side admin role are added to the app. Fitness records remain on the phone.

Google login code is prepared for native Android/iPhone and web. Native account selection returns an identity token that Firebase must verify before the app accepts the user. Email/password users must verify their email. Google sign-in does not provide access to Gmail messages or Gemini API usage.

Before publishing the next build:
1. Add the registered Android google-services.json file to android/app/.
2. Add the registered Apple GoogleService-Info.plist to ios/App/App/, include it in Xcode app resources, and register its REVERSED_CLIENT_ID URL scheme in Info.plist.
3. Register the actual distributed Android APK signing certificate SHA-1 in Firebase. Current test builds generate different debug keys; stable owner-controlled signing still needs setup. Never publish signing keys in source or build artifacts.
4. Set password policy to at least 8 characters and review verification/reset email templates and authorized domains.
5. Sync native plugins, build both platforms, and test real Google sign-in and email verification on phones. The native Firebase SDK requires its platform configuration at initialization; do not ship without it.

Prepared source passed 26 unit tests and TypeScript checks. Google routing tests use mock responses. Live Google sign-in, email delivery, and the next native build are not yet verified. The currently published APK remains version 1.3 without active login.

Signing out preserves separate account records and clears the Gemini key. Guest records retain their original keys. Export guest JSON before switching if you want to import that backup deliberately into an account. These local records are not encrypted cloud storage.
