# 40Labs Core Desktop — Comprehensive System Audit Report

**Target:** `apps/core-desktop` (Tauri v2 + React 19 + Rust Backend)
**Date:** November 2026
**Phase:** 1 — Complete System Audit (No Code Changes)
**Scope:** 17 Technical Domains (Authentication, Sessions, PIN, TOTP/Recovery, RBAC, Permissions, Step-Up, Database, Exports, Receipts, File Explorer, Disaster Recovery, Sales/Inventory/Purchases/Lab, Notifications/Attachments/Devices, API Communication, Error Handling, Automated Tests).

---

## Executive Summary

The 40Labs Core Desktop monorepo (`apps/core-desktop`) implements a sophisticated offline-first Tauri v2 architecture for pharmacies, laboratories, and dispensaries in East Africa. The Rust backend features robust cryptographic primitives (Argon2id, Ed25519, HKDF), strict database transaction boundaries, immutable audit triggers, and comprehensive command policy gating.

However, our technical audit across the 17 specified domains identified several **Critical (P1)** and **High (P2)** severity findings—principally centered in the **Laboratory module** (branch isolation gaps, unvalidated state transitions, unbudgeted/unaudited result entry, hardcoded dashboard/QC metrics), **browser-mode mock API illusions**, and **partial attachment handling**. Conversely, core authentication, session management, disaster recovery, database migration framework, and file explorer security are exceptionally well-implemented.

---

## Detailed Audit Findings by Category

### 1. Authentication & Account Management
- **Status:** **Correctly Implemented with minor caveats**
- **Architecture:** One workspace, first-user SUDO creation, immutable usernames via trigger, Argon2id password hashing, account lockout exponential backoff (5 tiers up to hard lock).
- **Files:** `src-tauri/src/auth/engine.rs`, `src-tauri/src/commands/auth_cmd.rs`, `src-tauri/src/repositories/credential_repo.rs`.
- **Strengths:** Timing attack mitigation via dummy password verification for unknown users; atomic registration transaction.

### 2. Session Management & Idle Locking
- **Status:** **Correctly Implemented**
- **Architecture:** In-memory session state in Rust (never persisted to disk or sent to frontend), automatic idle timeout locking based on `idle_lock_minutes` configured on business settings (1–30 min), session re-validation on every command invocation.
- **Files:** `src-tauri/src/auth/session.rs`, `src-tauri/src/commands/auth_cmd.rs`.
- **Strengths:** Zero token leakage; secure in-memory revocation on logout or PIN failure (5 failures destroys session).

### 3. PIN Authentication & PIN Gating
- **Status:** **Correctly Implemented**
- **Architecture:** 6-digit PIN created by user on first login (never at registration), hashed with Argon2id + user-specific salt/HMAC-SHA256 pepper. Used exclusively for idle unlock and step-up authentication. Gated by `PIN_SETUP_REQUIRED` while `pin_hash IS NULL`.
- **Files:** `src-tauri/src/commands/auth_cmd.rs`, `src-tauri/src/auth/engine.rs`.

### 4. TOTP & Recovery Mechanisms
- **Status:** **Correctly Implemented**
- **Architecture:** 8 single-use recovery codes per SUDO, hashed in database (`recovery_code` table). Offline recovery capability for SUDO credentials loss.
- **Files:** `src-tauri/src/commands/totp_cmd.rs`, `src-tauri/src/repositories/recovery_repo.rs`.

### 5. Role-Based Access Control (RBAC) & 6. Permission Enforcement
- **Status:** **Correctly Implemented (with architectural safeguards)**
- **Architecture:** Role presets (`sudo`, `admin`, `pharmacist`, `lab_technician`) and atomic permission grants. `COMMAND_POLICY` mapping enforced via unit test (`test_command_policy_completeness`).
- **Files:** `src-tauri/src/auth/policy.rs`, `src-tauri/src/commands/mod.rs`.
- **Strengths:** Permissions re-read from database on every command invocation; SUDO bypasses all permission checks.

### 7. Step-Up Authentication & Privileged Approvals
- **Status:** **Correctly Implemented**
- **Architecture:** Two tiers (Self-tier vs SUDO-tier approval). Single-use, short-lived server-side grants bound to actor, permission, approver, and target resource.
- **Files:** `src-tauri/src/commands/auth_cmd.rs`, `src/features/auth/components/StepUpModal.tsx`.

### 8. Database Operations, Migrations & Data Integrity
- **Status:** **High (Path logging leak)** / **Robust Core**
- **Files:** `src-tauri/src/db.rs`, `infra/db/sqlite-schema/migrations/*.sql`.
- **Finding (P2):** `src-tauri/src/db.rs::resolve_db_url` prints the full absolute path and sensitive `DATABASE_URL` to stdout/logs.
- **Recommendation:** Redact path logging in release builds.

### 9. PDF, DOCX, CSV & Excel Exports
- **Status:** **High (Browser mock illusion)**
- **Files:** `src-tauri/src/services/documents.rs`, `src/api/` export APIs.
- **Finding (P2):** Browser-mode API wrappers return mock file paths and fabricated success states without performing actual disk writes or exports when running outside Tauri.

### 10. Receipts, Invoices & Business Identity
- **Status:** **Correctly Implemented**
- **Files:** `src-tauri/src/services/sales_service.rs`, `src/api/salesApi.ts`, `src-tauri/src/repositories/business_repo.rs`.
- **Strengths:** Robust persistence of fiscal receipts, Tanzanian business identification fields (TIN, TMDA number, Pharmacy Council number, Lipa Namba).

### 11. File Explorer & Filesystem Operations
- **Status:** **Correctly Implemented**
- **Files:** `src-tauri/src/services/explorer_service.rs`, `src-tauri/src/commands/explorer_cmd.rs`.
- **Strengths:** Robust path sanitization, directory traversal prevention, explicit blocklisting of database files from filesystem operations.

### 12. Disaster Recovery & Backup Restoration
- **Status:** **Correctly Implemented**
- **Files:** `src-tauri/src/services/disaster_recovery.rs`, `src-tauri/src/commands/backup_cmd.rs`.
- **Strengths:** Encrypted backup export, password verification, decryption roundtrip with unit test coverage.

---

### 13. Sales, Inventory, Purchases & Laboratory Operations (Critical Module Focus)

The laboratory and operational modules exhibit several significant functional and architectural defects identified in the functional audit:

- **F1 (Critical - P1): Laboratory data is not branch-isolated**
  - *Files:* `src-tauri/src/commands/lab_cmd.rs`, `src-tauri/src/repositories/lab_repo.rs`.
  - *Root Cause:* List and update queries filter strictly by `workspace_id` but omit `branch_id`, allowing multi-branch leakage within the same workspace.
  - *Solution:* Scope all lab queries and updates by both `workspace_id` and `branch_id`.

- **F2 (Critical - P1): Lab status changes allow invalid transitions and falsely report success**
  - *Files:* `src-tauri/src/commands/lab_cmd.rs`, `src-tauri/src/repositories/lab_repo.rs`, frontend components.
  - *Root Cause:* Arbitrary status strings accepted without state machine validation; repository ignores `rows_affected()`. Frontend toasts success before IPC resolution.
  - *Solution:* Enforce legal state transitions server-side, check `rows_affected() == 1`, and await IPC mutation before firing UI success toasts.

- **F3 (Critical - P1): Result entry is unaudited/unapproved and lacks report lifecycle**
  - *Files:* `src-tauri/src/commands/lab_cmd.rs`, `src-tauri/src/services/lab_service.rs`.
  - *Root Cause:* `enter_lab_result` directly inserts results without audit trail logging, sample readiness verification, or authorized review/release workflow.

- **F4 (Critical - P1): Requisition patient selection fallback bug**
  - *Files:* `src/features/laboratory/components/NewLabOrderModal.tsx`.
  - *Root Cause:* Defaults to `customers[0]?.id` if no customer is explicitly selected, silently attaching new manual-entry patient data to an existing random customer.

- **F5 (High - P2): Lab operational views present fabricated metrics as live facts**
  - *Files:* `src/features/laboratory/LabScreen.tsx`.
  - *Root Cause:* QC panel, equipment calibration, TAT analytics, and store stock levels display hardcoded literal mock values (e.g., 98.2% TAT, 1.45M TZS revenue) rather than runtime database aggregates.

- **F6 & F7 (Medium - P2): Incomplete Lab Audit & Read-only Destinations**
  - Lab mutations bypass audit logging; analytics and QC destinations lack backend persistence.

---

### 14. Notifications, Attachments & Device Management
- **Status:** **Medium (P2)**
- **Files:** `src-tauri/src/commands/notification_cmd.rs`, `src/api/notificationsApi.ts`.
- **Finding:** MIME type validation relies on user-declared headers; multi-attachment uploads can partially fail while reporting overall success; browser fallback simulates persistence.

### 15. Frontend / Backend API Communication
- **Status:** **Medium (P2)**
- **Files:** `src/api/client.ts`, all `src/api/*.ts` modules.
- **Finding:** Dual Tauri IPC / Browser Mock client architecture means browser builds silently fabricate success responses, risking accidental deployment of non-functional browser bundles.

### 16. Error Handling, Loading States & Application Crashes
- **Status:** **Medium (P2)**
- **Finding:** UI optimistic toasts fire before backend transactions complete; unhandled IPC rejection toasts lack consistent fallback handling.

### 17. Automated Tests & Missing Test Coverage
- **Status:** **Good Rust Test Coverage (61 tests), Missing Lab Integration Tests**
- **Finding:** Two LAN pairing unit tests failed during cargo test execution due to test assertion expectations on error response bodies. Comprehensive test coverage for multi-branch laboratory isolation and state transitions is required before production release.

---

## Summary Table of Action Items for Implementation Phase

| ID | Category | Severity | Summary | Recommended Solution |
|---|---|---|---|---|
| A1 | Laboratory | **Critical (P1)** | Cross-branch lab data leakage | Add `branch_id` predicates to all lab repo queries and mutation handlers. |
| A2 | Laboratory | **Critical (P1)** | Invalid lab status state transitions | Implement state machine validation and `rows_affected() == 1` check. |
| A3 | Laboratory | **Critical (P1)** | Unaudited lab result entry | Wire result entry to audit log, sample validation, and approval workflow. |
| A4 | Laboratory | **Critical (P1)** | Implicit wrong patient selection | Remove `customers[0]` fallback in `NewLabOrderModal.tsx`. |
| A5 | Lab UI | **High (P2)** | Hardcoded mock metrics in QC/Analytics | Replace literal metrics with live DB queries or hide unsupported panels. |
| A6 | Security | **High (P2)** | Sensitive path logging in `db.rs` | Redact filesystem paths in release log outputs. |
| A7 | API / Browser | **High (P2)** | Browser mock persistence illusion | Enforce Tauri-only release builds and disable mock fallbacks in production. |
| A8 | Testing | **Medium (P2)** | LAN pairing unit test failures | Fix test assertions in `src-tauri/src/services/lan/pairing.rs`. |

*Report generated as part of Prompt 1 System Audit — No code modified.*
