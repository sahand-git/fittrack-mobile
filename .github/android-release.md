FitTrack 1.3 Android test build

- Closing Meals, Workouts, and AI Coach returns to Dashboard.
- Readable food category rows, grouped everyday foods, and offline food illustrations. Available scanned product photos appear in the picker.
- Gemini setup loads compatible models from Google and tests a real generation request before showing connected. Temporary server errors retry; access, quota, and model errors show useful details.
- First-launch sign-in, account creation, verification, password reset, and offline access screens. Real account actions remain disabled until the owner completes Firebase activation. Guest mode remains available and preserves existing local records.

Firebase console activation is currently blocked by the owner's Google two-step verification requirement. The authentication implementation was checked with mocked Firebase responses, not a live project. Personal Gemini access also requires the user's key and successful connection test; no key is included in the app.

23 unit tests and phone browser checks at 320, 360, and 390 pixels passed. Physical-phone health, file sharing, and live authentication checks remain necessary.

Keep the old app installed if it contains data you need. Debug signing keys can differ between builds, preventing an in-place update. Do not uninstall without a verified backup. Android 9+ required. This is a test APK; iPhone installation requires a separately signed TestFlight build.
