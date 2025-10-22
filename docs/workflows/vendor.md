
# Workflow: Vendor Lifecycle — Accounts, Profiles, Payments, and Responsibilities

> Canonical source: /docs/SSOT.md
> Classification: Operational + Technical Specification
> Status: *Phase 2 → 3 bridge draft (Design in progress, ready for build)*
> *Last validated 2025-10-21*

---

## 1. Purpose

Define how verified local businesses (vendors) interact with the Suburbmates platform: from onboarding and account creation through listing, transactions, payouts, and ongoing compliance.

---

## 2. Roles & Accounts

| Role                        | Description                                        | Auth Method                       | Primary Responsibilities                                   |
| --------------------------- | -------------------------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| **Resident / Customer**     | Local user browsing or purchasing.                 | Email magic link via Auth.js      | Browse, purchase, post reviews or flags.                   |
| **Vendor / Business Owner** | Verified ABN holder offering products or services. | Email magic link (vendor role)    | Maintain business profile, manage listings, fulfil orders. |
| **Administrator**           | Platform operator (you).                           | Auth.js with admin role           | Oversee moderation, disputes, and system metrics.          |
| **Moderator**               | Optional support role.                             | Same as admin, limited privileges | Handle content/report triage per SLA.                      |

---

## 3. Vendor Workflow Summary

### A. Account Creation & Verification

1. **Access Point**

   * From `/join-vendor` or “Become a Vendor” CTA.

2. **Authentication**

   * Email-based magic link (Auth.js) → user created in `users` table with `role='vendor_pending'`.

3. **ABN Verification**

   * Vendor enters ABN, business name, and address.
   * Server verifies via ABR Lookup API or cached dataset.
   * Verified data stored in `businesses` with `verified=false` initially.

4. **Consent & Legal Agreements**

   * Vendors must explicitly agree to:

     * Privacy Policy
     * Terms of Service
     * Stripe Connect Agreement (KYC + payout)
   * Each consent logged in `consent_logs` table.

5. **Stripe Connect Registration**

   * Redirect vendor to `stripe.com/connect/oauth/authorize?...`
   * On return, save `stripe_account_id` to `businesses` table.
   * Stripe now manages all KYC, payouts, and financial compliance.

6. **Admin or Auto-Approval**

   * Admin reviews ABN match and consent records.
   * Once approved, vendor role changes to `vendor_active`.

---

### B. Vendor Profile & Dashboard

Path: `/dashboard/vendor`

**Sections**

| Section                   | Purpose                        | Fields / Actions                                                                    |
| ------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| **Business Profile**      | Public-facing info.            | Logo, cover image, description, category, contact email, address (hidden optional). |
| **Account Settings**      | Private settings.              | Passwordless login control, notification opt-ins, payout preferences.               |
| **Privacy Controls**      | Manage visibility and consent. | Toggle “show address,” “allow messages,” “analytics sharing.”                       |
| **Stripe Connect Status** | Integration view.              | See verification or payout state pulled from Stripe API.                            |
| **Audit Log**             | Record of all changes.         | Created_at, updated_at, actor, field_diff JSON.                                     |

**Vendor capabilities**

* Edit profile anytime.
* Pause or archive business.
* Manage team (future multi-user support).

---

### C. Listing Management

1. **Create Listing**

   * `/dashboard/vendor/listings/new`
   * Fields: title, description, price, category, tags, image(s), availability, location.
   * Validation via Zod; saved as `status='draft'`.

2. **Publish**

   * Vendor clicks “Publish.”
   * Listing status → `active`.
   * Appears in `/marketplace` and Mapbox view.

3. **Edit / Archive**

   * Updates allowed anytime.
   * Archived listings hidden from marketplace but retained for audit.

4. **Moderation**

   * Listings auto-scanned for prohibited content.
   * Flagged → enters moderation queue (SLA < 24 h).
   * Vendor notified of any moderation action.

---

### D. Orders & Payments

**Flow**

1. **Customer checkout**

   * Customer clicks “Buy / Book.”
   * Backend creates Stripe Checkout Session with:

     ```js
     transfer_data: { destination: vendor.stripe_account_id },
     application_fee_amount: platformFee,
     metadata: { vendor_id, listing_id, user_id }
     ```
2. **Payment completion**

   * Customer pays on Stripe-hosted page.
   * Webhook `checkout.session.completed` triggers order creation in `orders` table.
3. **Order record**

   * Fields: `order_id, listing_id, user_id, amount_cents, stripe_session_id, status='paid'`.
4. **Payouts**

   * Stripe automatically splits payout:

     * Vendor receives sale amount minus Stripe fee and your platform fee.
     * You receive `application_fee_amount` as platform revenue.
   * Both visible in Stripe dashboard.
5. **Refunds / Disputes**

   * Processed through Stripe → webhook updates `status='refunded'` or `disputed'`.
6. **Notifications**

   * Resend sends receipts to customer and vendor.
   * GA4 event logged (`purchase_complete`).

---

### E. Vendor Responsibilities

| Category                  | Required Actions                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Legal & Verification**  | Maintain accurate ABN and Stripe KYC. Update if business details change.                      |
| **Listings**              | Post truthful descriptions; comply with local laws; no restricted items or offensive content. |
| **Fulfilment**            | Deliver products/services as advertised. Respond to messages within 48 h.                     |
| **Privacy & Data**        | Never request customer PII beyond transaction info. Respect privacy toggles.                  |
| **Accessibility**         | Ensure listing images/texts meet a11y guidelines (contrast, alt text).                        |
| **Dispute cooperation**   | Respond to Stripe disputes within 5 days if evidence needed.                                  |
| **Moderation compliance** | Respect admin directives and SLA reviews.                                                     |

---

### F. Platform Responsibilities (You)

* Maintain uptime, data integrity, and Stripe webhook reliability.
* Hold valid platform terms and privacy policy.
* Keep moderation, audit, and consent logs.
* Provide support channel for vendors (ticket system or email).
* Use Stripe reporting for platform fee accounting.
* Conduct periodic accessibility and security audits.

---

### G. Notifications & Communication

| Trigger                | Recipient         | Method                                           |
| ---------------------- | ----------------- | ------------------------------------------------ |
| Listing approved       | Vendor            | Email (Resend template #vendor-listing-approved) |
| Order paid             | Vendor & Customer | Email + dashboard update                         |
| Refund processed       | Vendor & Customer | Email + webhook update                           |
| Listing flagged        | Vendor            | Email with link to resolution form               |
| Stripe payout complete | Vendor            | Stripe email automatically                       |
| Policy updates         | Vendor            | System notification                              |

---

### H. Compliance & Record-Keeping

* Every ABN verification, consent, and Stripe Connect ID stored in Neon (`businesses`, `consent_logs`).
* All webhook payloads logged (`webhook_events` table).
* Data retention: anonymize vendors inactive > 12 months.
* Monthly privacy & accessibility review logged to `/docs/evidence/`.

---

### I. Metrics & Success Criteria

| Metric                               | Target |
| ------------------------------------ | ------ |
| ABN verification success             | ≥ 95 % |
| Stripe Connect onboarding completion | ≥ 90 % |
| Listing moderation turnaround        | < 24 h |
| Refund resolution                    | < 72 h |
| Vendor NPS (satisfaction)            | ≥ 85 % |

---

### J. Failure Modes & Safeguards

| Failure                | Impact                     | Safeguard                          |
| ---------------------- | -------------------------- | ---------------------------------- |
| Stripe OAuth fails     | Vendor can’t receive funds | Retry link; admin override.        |
| Webhook timeout        | Order not recorded         | Retry + idempotency key.           |
| Vendor unverified ABN  | Listing blocked            | Auto-check nightly.                |
| Privacy toggle ignored | Trust violation            | Manual audit; fix in next release. |
| Prohibited listing     | Legal risk                 | Auto flag + admin review.          |

---

### K. Education & Support

* Vendors receive onboarding tutorial (FAQ + demo video).
* Link to `/docs/vendor-guidelines.md` (to be written later).
* Tooltips in dashboard explain verification, fees, and payouts.
* Stripe’s own onboarding screens handle all payment-related compliance text.

---

## 4. Governance

*   **Rule Changes:** All platform-wide rule changes will be communicated to vendors with a minimum of 30 days' notice.
*   **Dispute Resolution:** Administrator decisions on disputes are final, following the documented moderation and appeal process.
*   **Appeals:** Vendors can appeal a moderation decision once via the official support channel. The appeal will be reviewed by a different moderator or administrator.
*   **Policy Versioning:** The Terms of Service and Privacy Policy will be versioned, and major changes will require explicit re-consent from all active users.

---

### ✅ Summary

Suburbmates vendors:

* **Control** their listings and profiles.
* **Never** handle payments directly.
* **Are paid** automatically via Stripe Connect.
* **Operate under clear privacy, moderation, and accessibility policies.**

You:

* Keep compliance, moderation, and system integrity.
* Earn platform fees automatically.
* Maintain full audit visibility.

---
