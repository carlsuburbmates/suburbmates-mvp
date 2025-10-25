
# Suburbmates Application Blueprint

> **Classification:** Technical Architecture & System Overview
> **Status:** Active (Live Document)
> **Last Updated:** Synced with latest build.

---

## 1. Overview

**Suburbmates** is a modern, full-stack Next.js application designed to be a trusted digital hub for local communities. It combines a **Verified Vendor Marketplace** with a **Civic Hub** for community discussions, all built on a secure and scalable serverless architecture.

The platform's primary goal is to connect residents with local businesses, foster community engagement, and automate administrative tasks using integrated AI agents.

### Core Principles:
-   **Trust & Safety:** All vendors are verified, content is moderated, and transactions are secure.
-   **Community Focus:** The platform is designed to serve the specific needs of a local suburban area.
-   **Accessibility & Privacy:** Adherence to WCAG 2.1 AA standards and a commitment to user privacy are foundational.
-   **Modern Tech Stack:** Leverages the best of the serverless ecosystem with Next.js, Firebase, and Genkit for a performant and maintainable application.

---

## 2. Technical Architecture

### 2.1. Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [ShadCN/UI](https://ui.shadcn.com/) for components.
-   **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore, Authentication, Storage).
-   **Generative AI:** [Google's Genkit](https://firebase.google.com/docs/genkit) with Gemini models.
-   **Payments:** [Stripe Connect](https://stripe.com/connect) for marketplace transactions and vendor payouts.
-   **Transactional Emails:** [Resend](https://resend.com/)
-   **Hosting:** [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

### 2.2. Project Structure

The project follows a standard Next.js App Router structure with clear separation of concerns.

```
/
├── src/
│   ├── app/                # Next.js routes, pages, and layouts
│   │   ├── admin/          # Admin dashboard (protected)
│   │   ├── api/            # API routes (Stripe integration)
│   │   ├── dashboard/      # User dashboard (resident, vendor)
│   │   ├── forums/         # Civic Hub: Discussions & Events
│   │   └── vendors/        # Business Directory & Profiles
│   │
│   ├── ai/                 # Genkit AI flows and configuration
│   │   ├── flows/          # Individual AI agent logic (e.g., validation, summarization)
│   │   └── genkit.ts       # Genkit initialization
│   │
│   ├── components/         # Shared React components
│   │   ├── layout/         # Header, Footer
│   │   └── ui/             # ShadCN UI components (Button, Card, etc.)
│   │
│   ├── firebase/           # Firebase configuration and hooks
│   │   ├── config.ts       # Firebase config object
│   │   ├── provider.tsx    # Core Firebase context provider
│   │   └── client-provider.tsx # Client-side provider wrapper
│   │
│   └── lib/                # Shared utilities, types, and constants
│       ├── types.ts        # Core TypeScript types for the app
│       └── email.ts        # Transactional email sending logic
│
├── docs/                 # Documentation & static data
│   ├── backend.json      # **Canonical schema for all data entities**
│   └── workflows/        # Markdown files explaining key processes
│
├── public/               # Static assets (images, fonts)
│
├── package.json          # Project dependencies and scripts
└── next.config.ts        # Next.js configuration
```

---

## 3. Core Features & Implementation

### 3.1. Verified Vendor Marketplace

-   **Functionality:** Allows local businesses to register, create a profile, and (once approved) sell goods and services. Residents can browse, search, and purchase from these vendors.
-   **Vendor Onboarding (`/dashboard/vendor/register`):**
    1.  User registers a business profile.
    2.  An AI agent (`validateAbn` flow) verifies the Australian Business Number (ABN) against a live government registry.
    3.  A second AI agent (`verifyVendorQuality` flow) analyzes the business description for quality and safety, generating a recommendation for the admin.
    4.  The vendor connects a Stripe account via a secure OAuth flow (`/api/stripe/connect`).
    5.  An admin reviews the AI summary and approves the vendor in the `/admin` dashboard, enabling payments.
-   **Marketplace Transactions (`/api/stripe/checkout`):**
    1.  A resident clicks "Buy Now" on a listing.
    2.  A Stripe Checkout session is created. The platform fee is calculated and included in the `payment_intent_data`.
    3.  Upon successful payment, a Stripe webhook (`checkout.session.completed`) triggers the creation of an `Order` document in Firestore.
    4.  Transactional emails are sent to the buyer and vendor.

### 3.2. Civic Hub Forums

-   **Functionality:** A community space for discussions and local event listings.
-   **Discussions (`/forums`):**
    -   Threads and posts are stored in Firestore.
    -   An AI agent (`summarizeDiscussion` flow) provides on-demand summaries of long discussion threads.
    -   A content moderation AI agent (`moderateForumPost` flow) pre-screens every new post for inappropriate content *before* it is saved to the database.
-   **Events (`/forums` - Events Tab):**
    -   A chronological list of community events.
    -   Features an AI summary tool (`summarizeEvents` flow) for detailed event descriptions.

### 3.3. AI Integration (Genkit)

The application uses several AI agents to automate tasks and enhance user experience. These are defined as Genkit flows in `src/ai/flows/`.

| Agent / Flow                | File (`src/ai/flows/...`)      | Purpose                                                                                                 |
| --------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **ABN Validator**           | `validate-abn.ts`              | Uses a tool to call an external API and verify a business's ABN.                                        |
| **Vendor Quality Agent**    | `verify-vendor-quality.ts`     | Analyzes a new vendor's profile for quality, safety, and PII, outputting a structured summary for admins. |
| **Dispute Summarizer**      | `summarize-dispute.ts`         | Translates technical Stripe dispute reasons into a human-readable summary and risk assessment.            |
| **Forum Content Moderator** | `moderate-forum-post.ts`       | Pre-emptively blocks inappropriate forum posts based on safety settings.                                |
| **Discussion Summarizer**   | `summarize-discussions.ts`     | Generates a bulleted summary of a long forum thread.                                                    |
| **Event Summarizer**        | `summarize-events.ts`          | Creates a concise summary of detailed event descriptions.                                               |
| **Natural Language Search** | `natural-language-search.ts`   | Translates conversational queries (e.g., "dog-friendly cafe") into structured search filters.             |
| **Support Chatbot**         | `support-chat.ts`              | A RAG-powered chatbot that answers user questions based on the project's documentation.                   |

---

## 4. Data Model (Firestore)

The Firestore database structure is the backbone of the application. Its schema is authoritatively defined in `docs/backend.json`.

### Key Collections:

-   `/vendors/{vendorId}`
    -   **Schema:** `Business`
    -   **Description:** Stores the primary profile for every registered business. If `paymentsEnabled` is `true`, they are considered a "Vendor" and can sell in the marketplace.

-   `/vendors/{vendorId}/listings/{listingId}`
    -   **Schema:** `Listing`
    -   **Description:** A sub-collection containing all products or services offered by a specific vendor.

-   `/vendors/{vendorId}/orders/{orderId}`
    -   **Schema:** `Order`
    -   **Description:** A record of every sale made by the vendor.

-   `/vendors/{vendorId}/reviews/{reviewId}`
    -   **Schema:** `Review`
    -   **Description:** Contains all customer reviews for that business.

-   `/forumThreads/{threadId}`
    -   **Schema:** `ForumThread`
    -   **Description:** Top-level documents for each discussion in the Civic Hub.

-   `/forumThreads/{threadId}/posts/{postId}`
    -   **Schema:** `ForumPost`
    -   **Description:** A sub-collection containing all replies within a specific thread.

-   `/disputes/{disputeId}`
    -   **Schema:** `Dispute`
    -   **Description:** A mirrored record of Stripe payment disputes, enriched with an AI-generated summary.

-   `/logs/webhooks/events/{eventId}` & `/logs/emails/sends/{sendId}`
    -   **Schema:** `LogEntry`
    -   **Description:** Provides an audit trail for all incoming Stripe webhooks and outgoing Resend emails for debugging and monitoring.

---

## 5. Authentication & User Roles

Authentication is managed by **Firebase Authentication**, supporting Email/Password and social providers (Google, Facebook). User roles are primarily determined by data in Firestore and custom claims on the user's token.

-   **Guest:** Unauthenticated user. Can browse public content.
-   **Resident:** Standard authenticated user. Can purchase, review, and post in forums.
-   **Business:** A user who has created a document in the `/vendors` collection but is not yet approved to sell (`paymentsEnabled: false`).
-   **Vendor:** A business that has connected Stripe and been approved by an admin (`paymentsEnabled: true`). This status is also stored as a custom claim (`vendor: true`) for faster UI rendering.
-   **Administrator:** A user with a `admin: true` custom claim, granting access to the `/admin` dashboard.

---

## 6. Key Workflows

### Vendor Registration & Onboarding
1.  **Sign Up:** User creates a standard account.
2.  **Register Business:** User navigates to `/dashboard/vendor/register` and submits business details.
3.  **AI Validation:** `validateAbn` and `verifyVendorQuality` flows run.
4.  **Data Persistence:** A new document is created in the `/vendors` collection with the AI analysis attached.
5.  **Connect Stripe:** User is redirected to Stripe to connect their account. `stripeAccountId` is saved on the vendor document via webhook.
6.  **Admin Approval:** An admin reviews the pending vendor in `/admin`, checks the AI summary, and toggles `paymentsEnabled` to `true`, which also sets a custom auth claim.

### Resident Purchase
1.  **Browse:** Resident finds a listing on a vendor's profile page.
2.  **Checkout:** Clicks "Buy Now". A server-side API call to `/api/stripe/checkout` creates a Stripe Checkout session.
3.  **Payment:** Resident completes payment on the secure, Stripe-hosted page.
4.  **Webhook:** Stripe sends a `checkout.session.completed` event to `/api/stripe/webhook`.
5.  **Order Creation:** The webhook handler creates an `Order` document in Firestore under the corresponding vendor's sub-collection.
6.  **Notification:** Buyer and seller receive confirmation emails via Resend.
