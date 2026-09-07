# Reminders and nutrients implementation plan

**Goal:** Optional local reminders and traceable micronutrient tracking for the friends beta.
**Architecture:** Pure scheduling and nutrient calculations; Capacitor notification adapter; account-scoped React state; one responsive setup/tracking panel.
**Spec:** ../specs/2026-09-06-reminders-nutrients-design.md
**Constraints:** Cloud stays disabled. No automatic supplement dosing. EN/AR/CKB. Preserve older backups.

- [ ] Add tests in tests/reminders.test.ts and tests/micronutrients.test.ts for skipped logged meals, hydration intervals, daily supplement completion, bounded queues and serving scaling; run them before implementation.
- [ ] Implement src/utils/reminderCore.ts and src/utils/micronutrients.ts, extending src/types.ts with optional fields. Scheduler returns at most 60 dated events over three calendar days. Missing nutrients remain undefined.
- [ ] Add @capacitor/local-notifications and src/utils/notifications.ts. Serialize cancel/reschedule operations, gate permission on explicit user action, clear on account exit, refresh on resume.
- [ ] Extend FitnessContext.tsx and cloudBackupCore.ts with timestamps, supplement completion and validated settings; test backup round trips.
- [ ] Add src/components/WellnessPanel.tsx, entry from App.tsx and a setup prompt after profile onboarding. Include edit/save/skip, permission status, chosen times, food totals and supplement completion.
- [ ] Add USDA micronutrients by exact NDB ID and Open Food Facts conversions; support manual label entry. Translate every new label in ar.json and ckb.json.
- [ ] Run node --test tests/*.test.ts; node node_modules/typescript/bin/tsc --noEmit; node node_modules/vite/bin/vite.js build --configLoader runner. Inspect 320px EN/AR/CKB. Publish verified source and build beta APK through existing Android CI.
