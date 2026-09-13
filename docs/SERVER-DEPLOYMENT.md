# FitTrack server deployment

The backend is implemented for local verification. No live Firebase or Gemini call, rules deployment, billing setup, or public deployment has been performed.

## Hosting and secrets

Use a Node 22+ server behind HTTPS. Install dependencies, run `npm run build`, then run `npm start` from the project root. The browser build must be in `dist/client`; only that directory is served publicly. The server bundle stays at `dist/server.cjs`. Development uses `npm run dev` with Vite middleware. Configure `PORT` for the host.

Set `FIREBASE_PROJECT_ID` to the same Firebase project used by the client. Grant the server identity the minimum Firestore read/write and Firebase Authentication user-management permissions needed. Prefer Application Default Credentials from the hosting service identity. For local development, `GOOGLE_APPLICATION_CREDENTIALS` may point to a service-account JSON outside the repository. Do not put credentials in client code, screenshots, chat, or source control.

AI stays disabled until both `AI_ENABLED=true` and the server-only `GEMINI_API_KEY` are present. `GEMINI_MODEL` defaults to `gemini-2.5-flash`; verify model availability in the intended account before enabling. Do not expose a Gemini key using a `VITE_` variable. See `.env.example` for all limits.

Set `ALLOWED_ORIGINS` to exact comma-separated origins for the deployed web app and native apps. Production has no default allowlist. The web origin must be included even for same-origin browser POST requests. Typical Capacitor origins are `capacitor://localhost`, `http://localhost`, and `https://localhost`; verify which ones your actual native builds use. Do not add wildcards or `null`. Native clients need the deployed HTTPS API origin in `VITE_API_ORIGIN`. Place ingress request/body/connection rate limits at the host as well: authenticated AI quotas do not prevent anonymous network traffic or Firebase verification costs.

## Firebase rules and entitlements

Deploy `firestore.rules` to the same Firebase project. Client writes to account entitlements, budgets and deletion markers are denied by default. Owner backup reads/writes remain supported, with schema/revision checks and deletion-marker protection.

Provision `accounts/{uid}` using trusted admin tooling or a verified billing webhook:

- `isPremium: true` and `aiEnabled: true` are both required for AI.
- Optional `expiresAt`: Firestore Timestamp or numeric Unix milliseconds. Expired or malformed expiry values deny premium access.
- Never accept payment status, UID, or entitlement fields from AI request bodies. There is no test premium switch or pretend checkout.

Enable Firestore TTL on `expiresAt` for collection groups `aiUsage`, `aiGlobalUsage`, and `accountDeletions`. Usage records expire after seven days. Deletion tombstones expire after 24 hours and contain only the UID in the document path and an expiry timestamp. TTL deletion is asynchronous; later deletion is safe. These retention rules should be included in the privacy disclosure.

## API contract

All AI and account routes require `Authorization: Bearer <Firebase ID token>`. Tokens are verified with Firebase Admin `verifyIdToken(token, true)`, including revocation/disabled-user checks. Cookies and client premium flags grant no authorization.

- `GET /api/ai/status` → `{enabled, isPremium, remaining, limit}`. Remaining is the lower of the per-account and global daily remaining budget. A provider outage may still prevent a call.
- `POST /api/ai/generate` accepts exactly `{prompt: string, json: boolean, image?: {data: string, mimeType: string}}` and returns `{text: string}`. Images use raw base64, without a data URL prefix; only JPEG, PNG and WebP are accepted.
- `DELETE /api/account` returns 204. The token's original `auth_time` must be within five minutes; refreshing a token alone is insufficient. Otherwise it returns 401 with `recent_login_required` before any deletion.

Errors use `{error: code}` and never provider messages, credentials, prompts, or nutrition data. Common codes: `unauthorized` (401), `ai_not_enabled` (403), `origin_not_allowed` (403), `invalid_request` (400), `quota_exceeded`/`rate_limited` (429), `ai_unavailable`/`service_unavailable` (503), and `generation_timeout` (504).

## Cost boundaries and deletion

Every generation reserves one account daily request and one global daily request together in a Firestore transaction. The same transaction reads the server entitlement and deletion marker, and enforces durable UTC minute buckets for account/global rate limits. Multiple instances share the budgets. Defaults: 20 requests/account/day, 500 globally/day, 4/account/minute and 30 globally/minute. A fixed minute bucket may permit bursts across the minute boundary. The global document is deliberately a contention point at this small launch scale; transaction failure denies work.

Reservations happen before Gemini. Failed or timed-out generations consume the reservation; there are no refunds or automatic SDK retries. Input characters, image bytes, output tokens, response characters, and generation duration are bounded. A client timeout cannot guarantee the provider stops billing for work already accepted. These are request budgets, not precise currency caps: additionally configure provider project quotas, billing alerts and a low launch budget appropriate to current model prices.

Account deletion first writes a tombstone, then recursively deletes `fitnessBackups/{uid}` and `accounts/{uid}` (including user usage), and deletes the Firebase Auth identity last. The tombstone blocks backup recreation with still-valid old tokens and new AI reservations. Failed data cleanup leaves Auth intact so the owner can retry after signing in again. An AI request reserved before deletion may finish. Global aggregate counters contain no UID or prompt and are retained until TTL expiry. Health/meal data and client recovery copies must also be cleared by the client after server deletion succeeds. Future server collections must be explicitly added to this cleanup.

## Verification and launch gates

Run `node --test tests/server*.test.ts`, `npm run lint`, and `npm run build`. HTTP tests inject identity, quota and provider boundaries; quota tests use serialized transactions to check concurrent global budgets and durable minute resets. They do not establish live Firebase IAM, deployed rules, real transaction contention, Gemini billing or mobile networking correctness.

Before public launch, verify the Firebase rules with the emulator and deployed project, real revoked tokens, cross-account access denial, account deletion/retry behavior, TTL configuration, real entitlement provisioning, native CORS origins, provider timeouts/quotas and the HTTPS host. Apply infrastructure abuse limits. Configure public support/privacy contacts. Never treat a successful local build as deployment evidence.

Official references: [Firebase token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [revoked sessions](https://firebase.google.com/docs/auth/admin/manage-sessions), [Gemini generation configuration](https://googleapis.github.io/js-genai/release_docs/interfaces/types.GenerateContentConfig.html).

