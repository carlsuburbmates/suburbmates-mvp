# Stability & Integration Checklist

Use this checklist to address the key issues found. I’ll mark items as we complete them.

## Critical

- [x] Implement shared Firebase Admin helper (`src/lib/firebase-admin.ts`) and ensure imports resolve in Stripe routes and `api/health`.

## Auth Flow (Admin UI)

- [x] Replace server action header override with a robust server-side auth verification (session cookie or API route).
- [x] Add admin-only guard (middleware/SSR) and remove brittle `global.fetch` monkey patch.

## Stripe Webhook Robustness

- [ ] Use Firestore logs for idempotency: check processed event before handling; mark as processed after success.
- [x] Ensure Node runtime for webhook verification; avoid Edge if Stripe SDK needs Node features.
- [ ] Guard email assumptions; handle `userRecord.email` nulls gracefully.

## Data Access Performance

- [ ] Replace vendor-wide scan with `collectionGroup('orders').where('paymentIntentId', '==', ...)` to find orders directly.
- [ ] Add/verify required Firestore indexes for collection group queries.

## Stripe Connect UI Integration

- [ ] Add “Set up payouts” button to call `/api/stripe/connect` with `Authorization` and `{ returnUrl, refreshUrl }`.
- [ ] Confirm webhook `account.updated` stores `stripeAccountId` and surface Stripe status in vendor UI. (accountId storage done; UI surface pending)

## Admin SDK Consolidation

- [x] Refactor `src/app/admin/actions.ts` to use shared `getAdminServices()` for consistency and reduced drift.

## Health Route Accuracy

- [ ] Remove hardcoded storage bucket fallback; treat storage as optional and report “not configured” clearly.
- [ ] Improve status derivation and env warnings for storage.

## Support Chat RAG Indexing

- [ ] Precompute/cache index or move to a vector store to avoid runtime FS/indexing cost.
- [ ] Limit `.tsx` extraction or replace with curated docs-only sources.

## Firestore Rules vs. Admin Writes

- [ ] Document that `logs/*` writes are server-only via Admin SDK; add rules for client reads if needed.

## Minor Improvements

- [ ] Remove unnecessary `await headers()` (use `headers()` directly).
- [ ] Wrap email sending in try/catch; don’t fail webhook if email fails.
- [ ] Validate `Origin` when building success/cancel URLs; provide fallback.

---

## Note: See `docs/firebase-guidelines/firebase-development-guidelines.md` for strict Firebase policies and `docs/firebase-guidelines/validation-checklists/*` for per-service validation.
