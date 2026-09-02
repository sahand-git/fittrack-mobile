FitTrack 1.2 Android test build

- Responsive phone header, flexible columns, and dialogs sized to the visible screen.
- Food picker starts on All with a cleared search each time it opens.
- 49 additional everyday foods including beef, lamb, fish, beans and bread, sourced from USDA SR28 with per-100g reference values.
- Native JSON export creates a real file and opens the phone share sheet. Choose a save destination and check the file exists. Backup text can also be viewed and copied.
- Smart Text, Calculate Macros and Coach use direct Gemini API requests after optional setup with your own Google AI Studio API key and explicit consent. Keys remain only in memory for the session. Gmail entry alone does not authorize Gemini. Google OAuth and cloud sync are not configured.

Keep your old app installed if it contains data you need. Older builds have an export bug, and this newly debug-signed APK may not install over them. Do not uninstall an old build unless its data has actually been backed up or you accept losing it. This release cannot repair the export button inside an already installed old APK; USB-assisted recovery may be needed first.

Android 9+ required. Health Connect availability varies by device. This is a test APK, not a Google Play release. Native file sharing and health access still need confirmation on physical phones. Browser checks cover 320, 360 and 390 pixel widths; AI requests were tested with mocked responses, not a live personal API key. iPhone installation still requires a signed TestFlight build.
