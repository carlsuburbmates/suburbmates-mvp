# Production Operations Guide

This guide ensures the production environment (App Hosting) for `studio` is operational, monitored, and recoverable.

## Environment & Hosting
- App Name: `studio`
- Region: `us-central1`
- Primary Domain: `studio--studio-4393409652-4c3c4.us-central1.hosted.app`
- Source Repo: `https://github.com/carlsuburbmates/suburbmates-mvp`

Important: The client-side Firebase initialization relies on App Hosting injecting Firebase options. Do not modify `initializeFirebase()` in `src/firebase/index.ts` to pass explicit options in production.

## Authorized Domains (Firebase Auth)
Verify under Firebase Console → Authentication → Settings → Authorized domains:
- `6000-firebase-studio-1760967939066.cluster-c36dgv2kibakqwbbbsgmia3fny.cloudworkstations.dev`
- `9000-firebase-studio-1760967939066.cluster-c36dgv2kibakqwbbbsgmia3fny.cloudworkstations.dev`
- `localhost`
- `studio--studio-4393409652-4c3c4.us-central1.hosted.app`

Ensure sign-in methods enabled: Email/Password, Google, Facebook, Anonymous.

## Health Monitoring
- Endpoint: `GET /api/health` (added)
  - Checks Firebase Admin connectivity to Firestore/Auth (+ Storage if configured)
  - Returns JSON `status: ok|degraded|error` with per-check latency.
- Create Uptime Check (Cloud Monitoring):
  - Target: `https://studio--studio-4393409652-4c3c4.us-central1.hosted.app/api/health`
  - Success when HTTP 200 and body contains `"status":"ok"`.
  - Alerting policy: notify on `status != ok` for 5 minutes.

## Logging & Error Reporting
- All API routes should log structured JSON via `src/lib/monitoring.ts`.
- Logs flow into Cloud Logging; create logs-based metrics if needed (e.g., `health.result`).
- Enable Error Reporting to capture uncaught exceptions.

## Deployment Pipeline (GitHub → App Hosting)
1. Link GitHub repo in Firebase App Hosting.
2. Select branch (e.g., `main`) for production releases.
3. Ensure build succeeds with Next.js and environment injection.
4. Protect branch with PR checks; consider enabling type checking in CI.
5. On merge, App Hosting builds and deploys automatically.

## Rollback Procedures
- From Firebase App Hosting → Releases:
  - Promote the last known good release to production.
  - Alternatively, pin the previous release if auto-deploy is enabled.
- If a faulty deploy is live:
  - Disable auto-deploy temporarily.
  - Roll back to previous release, then address failing commit.
  - Re-enable auto-deploy when fixed.

## Performance Benchmarking
- Use Lighthouse on the primary domain for page-level metrics.
- Measure API latencies via `/api/health` and key endpoints.
- Track Core Web Vitals via GA4 or Web-Vitals library.

## Security Rule Review (Pre-Prod)
- Tighten permissive DEV MODE rules in `firestore.rules` before production.
- Storage rules currently deny all operations (`allow read, write: if false;`). Confirm intended.

## Operational Checks (Pre-Go-Live)
- `/_health`: 200 OK, status `ok`.
- Auth flows: sign-in (email, Google, Facebook, anonymous) succeed from authorized domains.
- Critical endpoints (Stripe): secrets configured; Admin SDK credentials present.
- Logging visible in Cloud Logging; alerts configured.