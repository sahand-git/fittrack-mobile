# Calorie Pewar

A calorie, meal, activity, and weight tracker with English, Arabic, and Kurdish Sorani interfaces, right-to-left layouts, and 39 regional food entries. Regional dish nutrition is approximate and varies with preparation.

## Release status

This branch is a work-in-progress release candidate, not a production release. The local production build succeeded and the last automated run passed 101 tests. Final security fixes, mobile checks, and live service verification remain. See docs/RELEASE-PLAN.md, docs/LOCALIZATION-REVIEW.md, and docs/SERVER-DEPLOYMENT.md.

## Development

Use Node.js 24. Run `npm ci`, then `npm run dev`. Run `npm run lint`, `npm test`, and `npm run build` to check the application. The compiled browser app is in `dist/client`; the server bundle is `dist/server.mjs`.

For production, set `NODE_ENV=production` in the hosting environment before running `npm start`. Configure HTTPS and the server settings described in `.env.example`. A static-only deployment does not provide the AI and account-deletion endpoints.

## AI and privacy

AI requests go through the application server. Keep GEMINI_API_KEY and Firebase Admin credentials on the server; never place them in a VITE variable or commit them. AI requires Firebase authentication, server-managed access, and user consent. Request quotas and limits are enforced by the backend. No live payment integration is included.

Local tracking works without AI. Cloud backups are manual. Review the bundled privacy notice and deployment instructions before launch. The checked-in Firebase client configuration identifies the client project and is not an Admin credential; configure project rules and restrictions before public use.

## Mobile

Native Android and iOS projects are included. Run `npm run mobile:sync` after building. Signing, physical-device checks, and store distribution still need verification. Existing automated Android releases on main are older FitTrack test builds.

Support: sahandabas2@gmail.com

Firebase client API-key values have been removed from this upload. Supply your Firebase web and native client configurations locally before testing login. Guest tracking remains available without web login configuration. Keep Admin credentials server-side.
