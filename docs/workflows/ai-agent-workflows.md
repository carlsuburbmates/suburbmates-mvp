
# Workflow: AI Agent Automations

> Classification: Technical Specification & Operational Guide
> Status: *In Progress*
> *Last validated 2025-10-22*

---

## 1. Purpose

This document provides a technical and operational overview of the AI agents integrated into the Suburbmates platform. These agents are designed to automate administrative tasks, reduce manual workload, and move the administrator's role from operator to auditor.

---

## 2. Agent Roster

| Agent Name                              | Trigger                                  | Core Function                                       | Status      |
| --------------------------------------- | ---------------------------------------- | --------------------------------------------------- | ----------- |
| **Vendor Onboarding & Quality (VOQ)**   | New Business Registration                | Verification, Quality Scoring, & Content Moderation | `ACTIVE`    |
| **Dispute Summarizer**                  | Stripe Webhook (`charge.dispute.created`) | Summarizes Dispute Reasons for Fast Auditing        | `ACTIVE`    |
| **Forum Content Moderator**             | New Forum Post                           | Flags Inappropriate Content for Review              | `PLANNED`   |

---

## 3. Detailed Breakdown: Vendor Onboarding & Quality (VOQ) Agent

### 3.1. Purpose & Trigger

The VOQ Agent is a multi-skilled AI system designed to automate the initial screening process for new business registrations.

-   **Trigger:** This agent is automatically invoked within the `handleVendorRegistration` function in `src/app/dashboard/vendor/register/page.tsx` immediately after a vendor's ABN has been successfully validated.

### 3.2. Analysis Performed

The agent performs a multi-faceted analysis of the vendor's submitted `businessName`, `description`, and `category` to assess:

1.  **Content Safety:** It reviews the business description for any inappropriate content (e.g., hate speech, spam, harassment, illegal services) and detects the presence of Personally Identifiable Information (PII).
2.  **Description Quality:** It evaluates the business description based on clarity, professionalism, grammar, and completeness, assigning a score from 1 (poor) to 10 (excellent).
3.  **Category Verification:** It determines the most fitting category from a pre-defined list and compares it to the user's chosen category to check for a logical match.

### 3.3. Structured Output: `verificationSummary`

Upon completion, the agent generates a comprehensive `verificationSummary` object, which is then saved to the vendor's document in Firestore. This object has a strict schema to ensure consistent and reliable output.

**Schema (`VerificationSummary` type in `src/lib/types.ts`):**

```typescript
{
  // The final, overall recommendation for the admin.
  "overallRecommendation": "AUTO_APPROVE" | "NEEDS_REVIEW" | "AUTO_REJECT",
  "recommendationReason": "A brief explanation for the recommendation.",

  // Analysis of content safety and PII.
  "safetyAnalysis": {
    "rating": "SAFE" | "NEEDS_REVIEW",
    "reason": "Reasoning for the safety rating.",
    "piiDetected": boolean
  },

  // Analysis of the business description's quality.
  "descriptionQuality": {
    "score": number,      // Score from 1-10
    "confidence": number, // Confidence in the score (0-100)
    "reason": "Reasoning for the quality score."
  },

  // Analysis of the business category.
  "categoryVerification": {
    "isMatch": boolean,
    "confidence": number, // Confidence in the match assessment (0-100)
    "suggestion": "The most appropriate category.",
    "reason": "Reasoning for the category assessment."
  },

  // The version of the prompt used for this analysis.
  "promptVersion": "1.0"
}
```

### 3.4. Integration with Admin Dashboard

The `verificationSummary` is directly utilized by the **Admin Dashboard** (`src/app/admin/page.tsx`) to empower the administrator:

-   **At-a-Glance Auditing:** The vendor management table displays the `overallRecommendation`, allowing the admin to quickly identify which vendors are pre-approved and which require manual review.
-   **Prioritized Workflow:** The "Show Pending Approval Only" filter sorts vendors to place those marked as `NEEDS_REVIEW` or `AUTO_REJECT` at the top of the list.
-   **Deep Dive Analysis:** The "View Details" modal in the admin table presents the full `verificationSummary` object, giving the admin complete context on the AI's decision-making process.

This system effectively transforms the vendor approval process from a manual queue into an efficient, AI-assisted audit.

---

## 4. Detailed Breakdown: Dispute Summarizer Agent

### 4.1. Purpose & Trigger

The Dispute Summarizer Agent translates cryptic Stripe dispute reasons into clear, actionable intelligence.

- **Trigger:** This agent is automatically invoked within the Stripe webhook handler (`src/app/api/stripe/webhook/route.ts`) when a `charge.dispute.created` event is received.

### 4.2. Analysis Performed

The agent analyzes the `reason` code from the Stripe dispute object, along with the product name and amount. It performs two key functions:

1. **Summarization:** It converts technical reasons like `product_not_received` into a human-readable summary like "Customer claims they did not receive the product."
2. **Risk Assessment:** It categorizes the dispute into a risk level (`LOW`, `MEDIUM`, `HIGH`) to help prioritize admin attention. For example, `fraudulent` is high-risk, while `product_unacceptable` is low-risk.

### 4.3. Structured Output: `disputeSummary`

The agent generates a `disputeSummary` object, which is then saved to the specific `Dispute` document in Firestore.

**Schema (`DisputeSummary` type in `src/lib/types.ts`):**
```typescript
{
  "summary": "A concise, one-sentence summary of the dispute.",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "recommendedAction": "A brief, recommended next step for the admin or vendor."
}
```

### 4.4. Integration with Dashboards

The `disputeSummary` is used in both the Admin and Vendor dashboards to improve clarity:

- **Admin Dashboard (`/admin`):** The "Disputes" tab now shows the clean `summary` and a color-coded `riskLevel` badge, allowing for a platform-wide audit at a glance.
- **Vendor Dashboard (`/dashboard/vendor/disputes`):** Vendors see the same clear summary and risk level for disputes against their sales, helping them understand the issue faster.
- **Deeper Context:** Both dashboards provide a way to view the AI's `recommendedAction` and the original raw `reason` from Stripe for complete context.

---
