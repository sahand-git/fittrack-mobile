# Activate FitTrack account login

The app includes Firebase email/password authentication, verification, password reset, persistent sign-in, sign-out, and separate local records for each verified account. Production authentication is disabled until a real Firebase project's web configuration is supplied. The offline option preserves the existing guest data.

1. Open https://console.firebase.google.com/ using the app owner's Google account. Select or create the FitTrack project.
2. Open Authentication, then enable the Email/Password sign-in provider. Set the password policy to at least 8 characters. Review the verification and password-reset email templates and their sender name.
3. Register a Web app in Project settings. The Capacitor app uses the Firebase JavaScript SDK, so copy its web configuration.
4. Put the project's `apiKey`, `authDomain`, `projectId`, and `appId` in `src/config/firebase.json`. These are Firebase client configuration values; do not supply a service-account file, private key, Gmail password, or Gemini key.
5. Run `npm ci`, `npm run lint`, `npm test`, and rebuild the APK. Verify sign-up, email delivery, verification, password reset, sign-in restoration, and sign-out on a real phone.

Account sign-in does not upload fitness records. Guest records keep their original storage keys, and each Firebase user ID has a separate local namespace. Signing out retains records. To move guest records into an account, export the guest JSON, sign in, and deliberately import that backup. These local namespaces are not encrypted cloud storage.

Google OAuth is not included: this flow signs in with email and password. Adding Google or Apple sign-in requires provider registration and native redirect configuration. Gemini access remains a separate, optional consent and connection test.

Reference: https://firebase.google.com/docs/auth/web/password-auth
