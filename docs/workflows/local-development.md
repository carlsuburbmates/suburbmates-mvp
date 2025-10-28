# Local Development Workflow

A consolidated reference for bringing up the full Suburbmates stack, validating AI flows, and getting deployment‑ready.

## 1. Prerequisites

- **Node & npm**: use the repo’s `.nvmrc` or Node 20+.
- **Firebase CLI**: `npm install -g firebase-tools`.
- **Stripe CLI** (for webhook forwarding): `brew install stripe` or download from stripe.com.
- **Google Cloud SDK**: install `gcloud` and authenticate with your owner account.
- **Playwright** is already managed by Copilot; no manual setup required.

## 2. Environment Variables

1. Copy `.env.local.example` to `.env.local` if you have not already.
2. Populate the required keys:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `ABR_GUID`
   - `GOOGLE_API_KEY` (Vertex/Genkit)
   - `GOOGLE_APPLICATION_CREDENTIALS` (JSON file path)
3. Verify everything with `npm run env:check`.

## 3. Secret Manager (production parity)

Run the helper script after authenticating `gcloud` with an owner account:

```bash
cd suburbmates-mvp
export GOOGLE_CLOUD_PROJECT=studio-4393409652-4c3c4
set -a && source .env.local && set +a
./scripts/create-secrets.sh
```

Created secrets:
- `stripe-secret-key`
- `stripe-webhook-secret`
- `resend-api-key`
- `abr-guid`
- `google-api-key`

Check with `gcloud secrets list` and update `apphosting.yaml` if names differ.

## 4. One-command Dev Startup

```bash
# Start Firebase emulators + Next.js (port 3000)
npm run dev:start

# Start emulators + Next.js + Genkit developer UI (port 4002)
npm run dev:full
```

Both scripts kill child processes if any step fails. Stop everything with `Ctrl + C`.

## 5. Testing & Verification

- **Static checks**: `npm run dev:test` (env check → ESLint → TypeScript). Fix lint issues or adjust rules if the script fails.
- **Stripe checkout**: run `npm run stripe:listen` (or `stripe listen --forward-to http://localhost:3000/api/stripe/webhook`) in another terminal, then complete a test purchase.
- **AI agents**: once the dev server is live, follow the manual QA checklist:
  1. Vendor onboarding with a real ABN to confirm VOQ + ABR lookup.
  2. Force a Stripe dispute and verify `disputeSummary` in `/admin`.
  3. Submit blocked content in forum replies to test moderation.
  4. Use AI search or support chat to ensure Vertex responses.

Copilot-owned Playwright audits run separately; merge AI-specific cases there if needed.

## 6. Emulator Accounts

Seeded test users (when using the included fixtures):
- **Admin**: `dev+admin@example.com` / `test1234`
- **Vendor**: `devVendor001@example.com` / `test1234`
- **Buyer**: `devBuyer001@example.com` / `test1234`

Grant or revoke admin claims via `node scripts/set-admin-claim.js <uid> grant|revoke` (pointed at emulator or production).

## 7. Deployment Checklist

1. `npm run dev:test` (or equivalent CI) must pass.
2. Deploy Firestore rules & indexes: `firebase deploy --only firestore:rules,firestore:indexes`.
3. Confirm secrets exist (`stripe-secret-key`, `stripe-webhook-secret`, `resend-api-key`, `abr-guid`, `google-api-key`).
4. Update `apphosting.yaml` with public env values and secret references.
5. Deploy App Hosting: `firebase deploy --only apphosting`.
6. Re-run the admin dashboard smoke tests in the live environment.

Keep this workflow alongside the vendor/playwright docs so everything is accessible in one place.