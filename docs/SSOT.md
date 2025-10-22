
# Single Source of Truth (SSOT) - Core Terminology

This document defines the canonical terminology for the Darebin Business Directory application. All user-facing text, documentation, and code comments should adhere to these definitions to ensure clarity and consistency.

---

## 1. Core User Personas

### 1.1. Guest
- **Definition:** An anonymous, unauthenticated visitor to the website.
- **Abilities:**
    - Browse all public content: Business Directory, Marketplace listings, and Civic Hub.
    - View individual profiles and discussions.
    - Use discovery tools like filtering and AI summaries.
- **Limitations:** Cannot perform any action requiring an identity (purchase, post, review, manage content).

### 1.2. Resident
- **Definition:** A user who has created a basic account, typically via a social login like Google. This is the standard authenticated user for community participation.
- **Abilities:**
    - All abilities of a Guest.
    - Purchase items from Vendors.
    - Post reviews on Business profiles.
    - Reply to discussions in the Civic Hub.
    - Access a basic user dashboard.
- **Key Distinction:** They do not have a business listing and have not registered via the business-specific flow.

### 1.3. Business (Directory Listing)
- **Definition:** A user who has successfully registered their business via the dedicated "Become a Vendor" flow, creating a business profile.
- **Abilities:**
    - All abilities of a `Resident`.
    - Appears in the public **Business Directory**.
    - Can edit their business profile information (name, address, etc.).
- **Key Distinction:** This user has a `vendor` document in Firestore with `paymentsEnabled` set to `false`. They are not yet able to sell.

### 1.4. Vendor (Marketplace Seller)
- **Definition:** A `Business` that has successfully connected a Stripe account and has been approved by an Administrator.
- **Abilities:**
    - All abilities of a `Business`.
    - Create, edit, and delete product/service listings.
    - Appear in the filtered **Marketplace** view.
    - Receive payments for sales via Stripe Connect.
    - Access advanced dashboard panels for Orders and Payments.
- **Key Distinction:** Their `vendor` document in Firestore has `paymentsEnabled` set to `true`.

### 1.5. Administrator
- **Definition:** The platform owner and operator (you).
- **Abilities:**
    - Access the secure `/admin` dashboard.
    - Review all registered Businesses.
    - Approve a `Business` to become a `Vendor` by toggling their payment status.

---

## 2. Core Feature Terminology

### 2.1. Business Directory
- **Definition:** The primary public section, located at `/vendors`, that lists **all** registered `Businesses` and `Vendors`. It is the comprehensive index of local enterprises and can be viewed as a list or on a map.

### 2.2. Marketplace
- **Definition:** A **filtered view** of the Business Directory. It is not a separate page but rather the result of toggling the "Show Marketplace Vendors Only" switch. It exclusively displays `Vendors` and their sellable listings.

### 2.3. Civic Hub
- **Definition:** The community engagement section of the site, located at `/forums`. It contains two main tabs: **Discussions** (forum threads) and **Local Events**.

### 2.4. Dashboard
- **Definition:** The private, authenticated area located at `/dashboard/vendor` where all logged-in users (`Residents`, `Businesses`, and `Vendors`) manage their accounts and activities. The content and navigation within the dashboard adapt based on the user's status.
