# Cloud Functions Validation Checklist

- Docs URLs referenced (≥3 samples):
  - https://firebase.google.com/docs/functions
  - Sample 1:
  - Sample 2:
  - Sample 3:
- Production readiness:
  - Runtime and region selection per docs.
  - Idempotency implemented; retries and dead-letter queues where recommended.
  - Service account permissions scoped minimally.
- Emulator tests:
  - Triggers and handlers tested (HTTP, auth, firestore, storage).
- Error handling:
  - Structured errors; backoff/retry per docs.
- Monitoring:
  - Logging structured; Crashlytics/Performance integrated as applicable.
- Notes:
  - Deviations, benchmarks, rule rationales documented.
