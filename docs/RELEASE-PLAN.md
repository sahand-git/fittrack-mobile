# FitTrack release improvement plan

User authorization: improve the supplied app broadly, implement the previously proposed server-only Gemini architecture, correct regional foods and Kurdish Sorani throughout, and prepare a reviewable launch candidate. Do not claim a perfect score or deployed readiness without evidence.

## Design

Keep React/Capacitor and Firebase accounts. Use a same-origin Express API (an explicit HTTPS API origin for native builds), Firebase Admin ID-token verification, server-managed entitlements, Firestore atomic daily request budgets, bounded prompts/images/output, and a server secret for Gemini. Never keep Gemini credentials on clients. Local core tracking stays available to guests. AI requires signed-in account and explicit consent. Production defaults deny AI unless configured, with no testing premium activation. A public subscription checkout requires a billing provider and real products; do not fabricate purchases.

Preserve existing logs and backups. Use one nutrient-scaling function for all food logging, and one summation convention. Surface failed local saves. Isolate account settings and purge recovery data on deletion. Use short, readable bilingual UI, keyboard-accessible dialogs and clear estimate/permission/error states. Keep regional recipes as estimates with portions and bilingual search; never describe estimated recipes as laboratory verified.

## Work packages and verification

- [ ] A: Secure AI server in server/, server.ts, firestore.rules, deployment configuration; add dependency-injected HTTP tests covering authentication, paid entitlements, request limits, atomic budgets, errors and secret isolation. Validate Firebase tokens before chargeable work; reserve quota transactionally before Gemini calls. Default global/per-account request limits and maximum output are environment-configurable.
- [ ] B: Client AI migration in src/utils/gemini.ts, GeminiSetup, AuthContext and premium UI: no key forms or client Google AI calls; purge legacy keys, obtain fresh Firebase tokens, consent per account, server-provided capability state. Test unauthorized/disabled/limit/error responses and account changes.
- [ ] C: Data accuracy and privacy: test meal micronutrient preservation at fractional/multiple servings, historical weights, complete account data cleanup, safe local save failures, archive round trips and boundaries before fixing. Correct calorie budget double counting and historical targets where feasible without inventing old values.
- [ ] D: Regional foods and locale audit: inspect every Sorani entry, correct grammar/terminology, normalize script, check key parity and placeholders, add missing regional staples with transparent estimated nutrients and translated portions. Document scope, sources, and any native-speaker review still required.
- [ ] E: UI and release: remove inaccurate claims/testing controls, improve readability, keyboard focus and responsive layout, run browser flows at mobile and desktop sizes and Arabic/Sorani direction. Verify offline reload, logging, persistence, dialogs and export/restore.
- [ ] F: Run full tests, TypeScript, production build, dependency audit; review security and regressions independently, fix material findings, produce source ZIP and release notes with exact verification and remaining external setup.

## External launch gates

Production server/Firebase configuration and Gemini secret must be installed in hosting secrets, not chat. User must supply public support contact and hosting choice. Verify live Firebase rules/auth and AI quota, native device permissions, Android/iOS signing, privacy disclosure and nutrition/native Sorani expert review before public launch. No accounts, billing purchases, or deployment will be invented.
