FitTrack 1.4 Android test build

- Active Firebase email/password sign-up, sign-in, verification, and password reset.
- Continue with Google using the phone account chooser and Firebase credential verification.
- Account records are managed in the owner's Firebase Authentication console. Fitness logs remain on the phone; sign-out preserves them.
- Separate records for each account; existing offline records remain available through the guest option.
- Includes the previous food images, readable categories, Dashboard close behavior, and Gemini connection test.

26 unit tests passed. Live email sign-up and sign-in were verified with a temporary account, including wrong-password rejection. Google sign-in configuration is included, but account selection on a physical phone and verification email delivery still need confirmation. Google login does not provide Gemini API access or read Gmail messages.

Do not uninstall an older build until you have verified its backup. Debug signing keys can differ between test builds. Android 9+ required. iPhone installation requires a separately signed TestFlight build.
