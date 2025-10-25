# Copilot Instructions for suburbmates-mvp

## Project Overview
- **Type:** Next.js app with Firebase backend, styled with Tailwind CSS.
- **Purpose:** Local community hub and business directory.
- **Entry Point:** `src/app/page.tsx`.

## Architecture & Key Patterns
- **App Structure:**
  - `src/app/` contains all Next.js routes and layouts.
  - `src/components/` holds shared UI and layout components (e.g., `ui/`, `layout/`).
  - `src/firebase/` manages Firebase config, providers, and Firestore hooks.
  - `src/ai/` contains Genkit AI flows and related logic.
  - `src/lib/` provides utility functions and types.
- **Data:**
  - Uses Firestore for data storage. Firestore rules in `/firestore.rules`.
  - Firestore hooks: `src/firebase/firestore/use-collection.tsx`, `use-doc.tsx`.
- **AI/Genkit:**
  - AI flows in `src/ai/flows/` (e.g., summarization, validation).

## Developer Workflows
- **Install:** `npm install`
- **Dev Server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Test:** (No standard test script found; see `src/ai/tests/` for AI test examples.)
- **Firebase Emulation:**
  - Config in `firestore.rules`, `firestore.indexes.json`.
  - Use Firebase CLI for local emulation.

## Project-Specific Conventions
- **Component Structure:**
  - UI components in `src/components/ui/` follow atomic design (e.g., `button.tsx`, `card.tsx`).
  - Page-level logic in `src/app/` subfolders, often with `page.tsx` as entry.
- **TypeScript:**
  - Types in `src/lib/types.ts`.
- **AI Flows:**
  - Each flow in `src/ai/flows/` is a self-contained Genkit pipeline.
- **Error Handling:**
  - Centralized Firebase error handling in `src/components/FirebaseErrorListener.tsx` and `src/firebase/errors.ts`.

## Integration Points
- **Firebase:**
  - Config: `src/firebase/config.ts`.
  - Provider: `src/firebase/provider.tsx`.
- **Stripe:**
  - API routes in `src/app/api/stripe/` (checkout, connect, webhook).
- **Genkit AI:**
  - Entrypoint: `src/ai/genkit.ts`.

## Examples
- To add a new vendor dashboard page: create a folder in `src/app/dashboard/vendor/` and add a `page.tsx`.
- To add a new AI flow: add a file to `src/ai/flows/` and register it in `src/ai/genkit.ts`.

## References
- [README.md](../README.md)
- [src/app/](../src/app/)
- [src/components/](../src/components/)
- [src/ai/](../src/ai/)
- [src/firebase/](../src/firebase/)
- [src/lib/](../src/lib/)

---
For more details, see the referenced files and folders. Keep instructions concise and up-to-date with project structure and conventions.