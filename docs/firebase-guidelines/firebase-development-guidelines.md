# Firebase Development Guidelines

All Firebase work must be traceable to official documentation and verifiable against production requirements. This document operationalizes the strict guidelines.

## 1) Documentation Compliance

- Always begin with the official docs: https://firebase.google.com/docs
- Bookmark service docs: Firestore, Auth, Functions, Storage, Hosting, Performance, Crashlytics.
- Maintain a changelog recording doc updates that affect implementation.
- Reference doc section URLs in code comments and implementation notes.

## 2) Implementation Standards

- Follow Firebase-recommended patterns for:
  - Data modeling (collections/subcollections, indexes, validation).
  - Auth flows (ID token, session cookies, custom claims, SSR/middleware guards).
  - Cloud Functions (idempotency, retries, event filtering, structured logging).
  - Storage (rules, signed URLs, metadata, resumable uploads).
- Use only officially supported SDK APIs (Web v9 modular, Admin SDK).
- Implement error handling using Firebase error codes as documented.

## 3) Code Validation Process

- Before committing Firebase code:
  - Cross-reference with ≥3 official code samples for the same feature.
  - Verify production requirements (env vars, service accounts, indexes, quotas).
  - Test using Firebase Emulator Suite for Firestore/Auth/Functions/Storage where applicable.
- Maintain per-service validation checklists under `docs/firebase-guidelines/validation-checklists/*`.

## 4) Error Handling Protocol

- Identify the Firebase service involved (Firestore, Auth, Functions, Storage).
- Locate the official doc section describing the error case and expected codes.
- Implement solutions using Firebase's built-in mechanisms only (e.g., retry policies, error codes).
- Document the resolution path with direct links to docs (URL + section heading).

## 5) Security and Performance

- Security: comply with Firestore/Storage rules best practices, least privilege, rule functions.
- Performance: follow official guidance for indexing, query shaping, pagination, and batched writes.
- Monitoring: enable Firebase Performance Monitoring for client; use Admin logs for server.
- Logging: use Crashlytics for client errors; structured logs for server handlers.

## 6) Maintenance Procedures

- Quarterly reviews:
  - Check for deprecated APIs/methods and update SDKs.
  - Verify documentation alignment; update changelog.
  - Re-run emulator tests; re-validate indexes.
  - Optimize per updated best practices (queries, rules, caching).

## 7) Documentation Requirements

- Keep detailed implementation notes:
  - Reference specific doc sections (URL + anchor).
  - Note deviations and rationales.
  - Record performance benchmarks and index choices.
  - Document security rule rationales and client/server access split.
