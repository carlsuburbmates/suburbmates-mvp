# Firestore Validation Checklist

- Docs URLs referenced (≥3 samples):
  - https://firebase.google.com/docs/firestore
  - Sample 1:
  - Sample 2:
  - Sample 3:
- Production readiness:
  - Env vars set (project ID, service account when server-side).
  - Indexes created (`firestore.indexes.json` updated).
  - Security rules aligned and deployed.
- Emulator tests:
  - Read/write, queries, security rules covered.
- Error handling:
  - Uses official error codes; retries/backoff where recommended.
- Performance:
  - Query filters and pagination per docs; avoids N+1 scans.
- Notes:
  - Deviations, benchmarks, rule rationales documented.
