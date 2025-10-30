# Auth Validation Checklist

- Docs URLs referenced (≥3 samples):
  - https://firebase.google.com/docs/auth
  - Sample 1:
  - Sample 2:
  - Sample 3:
- Production readiness:
  - Session cookie handling; token verification (Admin SDK).
  - Custom claims logic reviewed; SSR/middleware guards in place.
  - OAuth provider setup completed with correct redirect domains.
- Emulator tests:
  - Sign-in/out, session cookie issuance, protected routes.
- Error handling:
  - Uses official error codes; recovers gracefully.
- Security:
  - Least privilege; server-side operations via Admin only.
- Notes:
  - Deviations, benchmarks, rule rationales documented.
