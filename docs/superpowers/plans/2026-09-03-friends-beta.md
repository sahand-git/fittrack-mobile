# Friends beta implementation plan

Goal: deliver a free, installable beta in English, Sorani Kurdish and Arabic with honest account backup status, ready for feedback before monetization.

Architecture: explicit rendering-time localization with stable stored IDs and English source keys; private Firebase account backup behind opt-in; native Android/iPhone Capacitor builds.

Spec: outputs/FitTrack-public-release-proposal.md, narrowed by the owner's decision to postpone payments and publishing.

Constraints: keep all existing features free, no paid cloud upgrade, no live subscriptions, no public store submission. Preserve existing fitness data and API-key privacy. Use current Firebase project fittrack-mobile-3db2a. Account sync must not claim success unless Firebase acknowledges a write.

- [ ] Localization: create src/locales/{ar,ckb}.json, src/utils/locale.ts and language picker; translate rendered UI, labels, errors, bundled food/exercise content. Keep external product names and user text unchanged unless a known catalog label. Handle RTL, input isolation, localized searching and AI response language. Verify switch/reload and narrow layouts.
- [ ] Account backup: implement authenticated opt-in Firestore backup with conflict checks and explicit restore on another device; security rules scope documents to verified UID. Test cross-account denial, offline failure, successful restore and conflict handling. Clearly label backup rather than implying continuous real-time sync.
- [ ] Beta handoff: document uncompleted production requirements, feedback prompts and known limitations; compile/test, publish a free test APK, register its signing fingerprint. Preserve JSON export and warn about existing debug signing update incompatibility.

Verification: existing node tests + targeted locale and cloud conflict tests, TypeScript, production bundle, browser QA at 320/390px in all languages, Android CI compile and APK checksum/fingerprint inspection. No claim of physical-phone verification without user feedback.
