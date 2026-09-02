Download **FitTrack.apk** on your Android phone and open the downloaded file to install this test build.

## Barcode fix

Barcode lookup now contacts Open Food Facts directly from the installed app. Found products automatically save to your food library before you log a meal. Search by product name, brand or barcode, or use the Saved filter. Saved products work offline and repeated scans do not create duplicates. Nutrition values consistently use the displayed serving size.

## Updating from an earlier test build

First open **Sync Gmail → Export JSON** in your current app to save your data. This offline backup does not require signing into Gmail. If Android rejects an update because of the test signature, keep that backup, uninstall the old test app, install this APK and use **Sync Gmail → Import Backup** to restore it. Do not uninstall until you have saved the backup.

- Requires Android 9 or newer; Health Connect availability also depends on your device and installed health apps.
- Your phone may ask you to allow installation from the browser used to download the APK.
- First launch collects your profile. Health access is requested only when you tap the health connection button.
- This is a debug-signed test build, not a Google Play release. Physical-device health integration is still awaiting testing. Later builds may require reinstalling if their test signing key changes.
- Local tracking is included. AI and email backup require a separately deployed server and are not available in this bundled offline build.
- This APK is for Android only. iPhone distribution needs a signed TestFlight build.
