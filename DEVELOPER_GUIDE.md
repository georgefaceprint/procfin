# ProcFin Developer Integration & Architecture Guide

Welcome to the internal developer guide for the ProcFin Tender Funding Platform. This document serves as the master reference for the platform's features, communication APIs, database schemas, and integration points.

---

## 1. Core Architecture Overview

ProcFin is divided into two primary workspaces:
1. **Frontend (`/procfin-react`)**: React SPA bundled with Vite, styled with TailwindCSS, deployed to Vercel (`procfin.online`).
2. **Backend (`/functions`)**: Firebase Cloud Functions v2 (Node.js 20 runtime) triggered by Firestore triggers (`onDocumentCreated`, `onDocumentUpdated`) or HTTP requests (`onRequest`, `onCall`).

---

## 2. Supplier Lifecycle & Verification Engine

SMEs source quotes from verified suppliers. To establish trust, we operate a Procurement Readiness Scorecard (PRS) that assigns Grades A-E and dynamically promotes users to Silver, Gold, or Platinum stones.

### A. Compliance Document Types (`user_documents` collection)
Uploaded documents are keyed by `${userId}_${docTypeId}`.
* **ID '1' (`csd`)**: CSD Registration Report (Public Sector path only)
* **ID '2' (`tax`)**: SARS Tax Clearance Pin/Status
* **ID '3' (`cipc`)**: CIPC Company Registration Certificate
* **ID '4' (`bank_confirm`)**: Bank Confirmation Letter
* **ID '5' (`id`)**: Directors ID Copies
* **ID '6' (`address`)**: Business Proof of Address (FICA)
* **ID '7' (`bbbee`)**: B-BBEE Certificate/Affidavit

### B. Scoring Heuristics (`SupplierReadinessScore.js`)
Calculated dynamically in the frontend and synced to the `users` Firestore document.

| Verification Pillar | Public / Government Vendor | Private B2B / Corporate |
| :--- | :--- | :--- |
| **Initial Channel** | CSD Registration verified (+20 pts) | 2+ Corporate Trade References (+20 pts) |
| **Tax Compliance** | SARS PIN verified (+20 pts) | SARS PIN verified (+20 pts) |
| **CIPC status** | Active registration (+15 pts) | Active registration (+15 pts) |
| **Bank Confirmation** | Bank Letter uploaded (+15 pts) | Bank Letter uploaded (+15 pts) |
| **Proof of Address** | Address FICA uploaded (+10 pts) | Address FICA uploaded (+10 pts) |
| **B-BBEE Status** | Certificate/Affidavit (+10 pts) | Certificate/Affidavit (+10 pts) |
| **Storefront catalog** | 3+ catalog products (+10 pts) | 3+ catalog products (+10 pts) |

#### **Score Ranges & Badges**:
* **Grade A (90–100 pts) ➔ Platinum Tier**: Prioritized searches, maximum PO funding confidence.
* **Grade B & C (60–89 pts) ➔ Gold Tier**: Verified active trading status.
* **Grade D & E (0–59 pts) ➔ Silver Tier**: Basic / unverified listing.

---

## 3. Communication Gateway (SMS & Email)

All transactional alerts are centralized in `/functions/index.js`.

### A. SMS / WhatsApp Notifications (BulkSMS.com REST API)
Sends outbound SMS/WhatsApp messages using an HTTP POST to `https://api.bulksms.com/v1/messages`.
* **Required Env Configuration**:
  ```bash
  BULKSMS_TOKEN_ID="your_token_id"
  BULKSMS_TOKEN_SECRET="your_token_secret"
  ```
* **Alert Triggers**:
  * OTP verification code request.
  * SME profile verified by Admin.
  * Funding Request submitted (notifying SME).
  * RFQ Broadcasted (notifying matching category suppliers).
  * Escrow Funding Securement (notifying both SME & Supplier that funds are locked).

### B. Email Notifications (Nodemailer SMTP)
Configured to dynamically select standard corporate SMTP servers or fallback to a legacy Gmail SMTP transport.
* **Required Env Configuration (Standard SMTP)**:
  ```bash
  SMTP_HOST="smtp.yourcompany.com"
  SMTP_PORT=465
  SMTP_SECURE="true" # Set to "false" if using port 587 or unencrypted
  SMTP_USER="notifications@procfin.online"
  SMTP_PASS="your_secure_smtp_password"
  ```
* **Gmail Fallback Env Configuration** (if `SMTP_HOST` is not set):
  ```bash
  EMAIL_USER="your-gmail@gmail.com"
  EMAIL_PASS="your-gmail-app-password"
  ```
* **Alert Triggers**:
  * Verification updates.
  * Funding prospectus dispatches (copied to `faceprint@icloud.com`).
  * RFQ / Quote Acceptance contracts.

---

## 4. eTenders OCDS Synchronization

* **Endpoint**: `https://synctenders-yswbgz5kpa-uc.a.run.app` (triggers `syncTenders` Cloud Function).
* **Parameters**:
  * `pages` (default `20`): Number of pages to pull in parallel.
  * `limit` (default `100`): Max releases per page request.
  * `dateFrom`: Defaults to 365 days ago (1 year window).
* **Search Matching**:
  SMEs query the synced tenders in [RfqForm.jsx](file:///Users/afriwalletg/Downloads/new%20anttograv/Vuvu%20Funding/procfin-react/src/components/RfqForm.jsx) using fuzzy client-side checks against `t.title`, `t.procuringEntity`, and `t.description`.

---

## 5. Main Component Map

* **Onboarding**: [Onboarding.jsx](file:///Users/afriwalletg/Downloads/new%20anttograv/Vuvu%20Funding/procfin-react/src/components/Onboarding.jsx) (Handles user account setup routes, CSD verify trigger, and manual details).
* **Supplier Workspace**: [SupplierDashboard.jsx](file:///Users/afriwalletg/Downloads/new%20anttograv/Vuvu%20Funding/procfin-react/src/components/SupplierDashboard.jsx) (Houses the readiness circular gauge, trade reference inputs, and tab routers).
* **Supplier Scoring Logic**: [SupplierReadinessScore.js](file:///Users/afriwalletg/Downloads/new%20anttograv/Vuvu%20Funding/procfin-react/src/utils/SupplierReadinessScore.js) (PRS points utility).
* **Sourcing Directory**: [SmeSourcing.jsx](file:///Users/afriwalletg/Downloads/new%20anttograv/Vuvu%20Funding/procfin-react/src/components/SmeSourcing.jsx) (SME search page displaying the dynamic supplier badges).
* **Tenders Board**: [RfqForm.jsx](file:///Users/afriwalletg/Downloads/new%20anttograv/Vuvu%20Funding/procfin-react/src/components/RfqForm.jsx) (eTenders feed rendering memoized `TenderCard` list items).
* **Document Vault**: [Vault.jsx](file:///Users/afriwalletg/Downloads/new%20anttograv/Vuvu%20Funding/procfin-react/src/components/Vault.jsx) (KYC file uploader).
