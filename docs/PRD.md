# Suburbmates MVP – Product Requirements Document (PRD)

## Overview

Suburbmates is a marketplace connecting local residents with vetted vendors for home services and community engagement. The MVP focuses on vendor discovery, booking flows, forums for Q&A, and AI-powered support chat to help users navigate the product and troubleshoot.

## Goals

- Enable residents to browse vendors, view details, and request services.
- Provide vendors with a dashboard to manage requests and refunds.
- Offer a helpful AI support chat embedded across key pages.
- Ensure secure authentication and reliable data storage via Firebase.
- Deliver responsive, accessible UI with consistent design system.

## Users & Roles

- Resident: browses services, submits requests, manages orders/refunds.
- Vendor: views requests, processes refunds, updates info.
- Admin: monitors system, accesses operational tasks.

## Core Features

- Vendor listing and detail pages (`/vendors`, `/vendors/[vendorId]`).
- Resident dashboard (`/dashboard/resident`) and refunds flow.
- Vendor dashboard (`/dashboard/vendor`) and refunds flow.
- Forums (`/forums`, `/forums/[id]`) for community Q&A.
- Policy pages: Terms, Privacy, Accessibility, How it Works.
- Authentication (Firebase Auth) with non-blocking login.
- AI Support Chat widget present on key pages.

## Navigation & Pages

- Home: `/` – hero content, quick links to vendors and forums.
- Vendors: `/vendors` – search, filters, vendor cards.
- Vendor detail: `/vendors/[vendorId]` – services offered, contact/CTA.
- Forums: `/forums` – topics list; `/forums/[id]` – topic detail + replies.
- Resident dashboard: `/dashboard/resident` – orders/refunds overview.
- Vendor dashboard: `/dashboard/vendor` – requests/refunds overview.
- Policy pages: `/terms`, `/privacy`, `/policy`, `/accessibility`.
- Login/Signup: `/login`, `/signup` – non-blocking login flows.

## AI-Powered Features

- Support Chat (`src/components/chat-widget.tsx`):
  - Context-aware help (page-aware hints, vendor and forum context).
  - Escalation paths to human support (future), basic triage now.
  - Response accuracy: must be grounded in documented workflows.
  - Guardrails: no hallucinations about unimplemented features.
- AI flows (`src/ai/flows/`):
  - Support chat orchestration and prompt strategies.
  - Genkit integration (`src/ai/genkit.ts`) for provider wiring.

## Architecture

- Frontend: Next.js App Router, Tailwind CSS, components in `src/components`.
- Backend/API: Next.js API routes under `src/app/api`.
- Data: Firebase (Firestore, Storage) with rules in `firestore.rules`, `storage.rules`.
- Auth: Firebase Auth, providers via `src/firebase/provider.tsx` and non-blocking login.

## Data Model (MVP level)

- Users: Auth users with role (resident/vendor).
- Vendors: basic profile, services, pricing.
- Orders/Refunds: resident ↔ vendor transactions.
- Forums: topics, replies, authors.

## Integrations

- Stripe (checkout, connect, webhook) for payments.
- Firebase client setup in `src/firebase/` with hooks in `firestore/`.

## Non-Functional Requirements

- Accessibility: WCAG AA intentions for color contrast, focus states, aria labels.
- Performance: Fast initial load, code splitting, cache static assets.
- Security: Firebase rules enforce role-based access; secret scanning in CI.
- Reliability: Handle network errors gracefully; FirebaseErrorListener.

## Environments

- Local: `.env.local` required keys validated by `scripts/check-env.ts`.
- Dev/Prod: `.firebaserc` project configs; `firebase.json` hosting and emulators.

## Acceptance Criteria

- All pages render without console errors.
- Navigation works: header/footer links, bottom nav on mobile.
- Vendor and forum flows complete basic tasks.
- AI support chat responds within 3s and aligns with documented workflows.
- Auth flow does not block core navigation; login renders appropriate state.
- No sensitive tokens present in repo; pushes pass GitHub push protection.

## Test Plan Overview

- Frontend E2E via Playwright on localhost:3000.
- Page render tests: home, vendors, vendor detail, forums list, forum detail.
- Dashboard render tests: resident and vendor dashboards.
- Policy pages render tests: privacy, terms, accessibility.
- AI chat tests: widget mounts, responds with grounded content, no forbidden claims.
- Auth tests: non-blocking login state reflected in UI.

## AI Response Quality Guidelines

- Ground responses in docs: `docs/workflows/*`, `docs/PRODUCTION_OPERATIONS.md`.
- Avoid claiming features outside MVP scope.
- Prefer concise steps and references over speculative advice.
- Escalate unclear intents to human support (if available) or provide safe fallback.

## Out of Scope (MVP)

- Full booking payment flow beyond Stripe integration stubs.
- Advanced moderation in forums (basic only).
- Multi-tenant vendor management.
