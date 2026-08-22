# 40Labs — Product Requirements Document (PRD)
**Version:** 1.0 · **Date:** August 2026
**Scope:** MVP — 40LabsCore + Orbit Worker + Admin Web App
**Prepared by:** Ade (Claude) & Sairiamu — Co-Founders
**Status:** Draft for review. Derived from `40Labs_Business_Mechanism_v1.md` (business logic locked) and the competitive intelligence report (June 2026). Supersedes no prior PRD — this is the first.

> This document turns the locked business mechanism into buildable requirements. Where the Business Mechanism doc already made a decision, this PRD does not relitigate it — it operationalizes it. Where a decision is still open (§2.3, §2.2, §2.4 of that doc), it's carried forward here as an Open Question, not silently resolved.

---

## 1. Problem Statement

Tanzanian and East African pharmacies, dispensaries, and small diagnostic labs run on a mix of paper records, disconnected desktop POS software, or nothing at all. The competitive landscape confirms a structural gap: no existing platform combines pharmacy POS, lab management, offline-first operation, TRA fiscal compliance, and Swahili localization in one product. Pharmacy owners lose revenue to stockouts and expired stock they can't predict; patients get no continuity of care between a pharmacy visit and a lab result; and regulators get no reliable digital trail of dispensing and stock movement.

The cost of not solving this: pharmacies keep bleeding margin to preventable waste (expiry, theft, poor reorder timing), patients keep experiencing fragmented care, and the region's healthcare data — which could eventually train models that improve outcomes — never gets captured in a usable form.

**Who experiences this:** independent and small-chain pharmacy owners, pharmacy staff, attached lab technicians, and — indirectly — the patients they serve. This is a daily, every-transaction problem, not an occasional one.

---

## 2. Goals

1. **Zero-internet operability** — a pharmacy can complete a full sale (dispense, print receipt, update stock) with no internet connection, 100% of the time. This is the platform's core trust promise.
2. **Unified pharmacy + lab record** — a single patient, a single medicine catalog, a single inventory ledger shared across POS and lab modules, with zero duplicate records. (Directly closes Gap 1 from the competitive report — no competitor offers this at SME scale.)
3. **Fraud-resistant tier enforcement** — revenue-based pricing tier is measured from the system's own transaction ledger, not self-reported, from day one.
4. **Structural readiness for AI** — every schema captures the clinical/operational trail (test → condition → medicine → outcome) in a labeled, de-identifiable format from v1, even though no AI features ship in MVP.
5. **Swahili-first adoption** — UI ships with Swahili as the primary language, English secondary, closing Gap 4 from the competitive report at launch, not as a later localization pass.

---

## 3. Non-Goals (MVP)

1. **aMob (patient app) is not built in MVP** — the Business ID + dormant profile record is created for every pharmacy, but no patient-facing app ships. *Rationale: confirmed post-MVP in the Business Mechanism doc §5; building it now risks the "five products in parallel" trap already flagged.*
2. **40Labs Web App (public marketplace/listing) is not built in MVP** — same reasoning as above. Schema fields are reserved so no re-registration is needed later.
3. **AI/analytics features are not built in MVP** — demand forecasting, expiry prediction, and clinical decision support are Phase 2+ per the competitive report's phased roadmap. MVP only ensures the data is captured correctly for later training.
4. **Insurance/SHA claims integration is out of scope for MVP** — flagged as Phase 2 in the competitive report; no regulatory blocker forces this into v1.
5. **Multi-branch operation is designed for, not activated** — every table carries `workspace_id` + `branch_id` from day one (non-negotiable per the system prompt), but multi-branch UX/enforcement is a later phase. Building the toggle now without the schema would be the expensive mistake; building the schema without the toggle is cheap insurance.
6. **Regional expansion (Kenya, Uganda, Rwanda compliance) is out of scope for MVP** — Tanzania-first (TMDA, Pharmacy Council, TRA EFD) per the competitive report's Phase 3 sequencing.

---

## 4. User Stories

### Pharmacy Owner (40LabsCore)
- As a pharmacy owner, I want to register my business once and receive a permanent Business ID, so that I never have to re-register when I add lab, supplier, or web-facing capabilities later.
- As a pharmacy owner, I want to complete sales and update stock with zero internet connection, so that a network outage never stops me from serving a customer.
- As a pharmacy owner, I want every refund, stock adjustment, and PO approval to require a PIN, so that I can trust the audit trail even when staff share a device.
- As a pharmacy owner, I want to see my own sales, stock, and lab reporting inside 40LabsCore, so that I have a private operational view that isn't mixed with platform-wide data.
- As a pharmacy owner, I want my tier (Free / Class 1–4) to be calculated automatically from my actual recorded revenue, so that I don't have to self-report or manually upgrade.

### Pharmacist / Dispensing Staff (40LabsCore + Orbit Worker)
- As a pharmacist, I want to link a lab test order to a patient's existing record, so that the pharmacy-lab-patient triangle stays in one workflow instead of three disconnected systems.
- As a staff member, I want to pair my phone with the pharmacy's Orbit Worker once via QR code and stay trusted afterward, so that I don't need to re-authenticate every shift.
- As a staff member with a limited permission set (e.g. "can add lab sample, cannot issue refund"), I want the app to enforce that boundary even though my device is already trusted, so that device trust never becomes a backdoor to sensitive actions.
- As a staff member, I want to take a photo of a supplier delivery note or a lab sample directly from Orbit Worker, so that documentation happens at the point of work, not later at a desktop.

### Lab Technician (40LabsCore — lab module)
- As a lab technician, I want to record a sample, process a result, and attach it to the same patient record used by the pharmacy side, so that a patient's medicine history and test history live together.

### 40Labs Internal / Admin (Admin Web App)
- As a 40Labs team member, I want read access by default to platform-wide (not per-pharmacy) data, so that I can monitor regional patterns without needing to request access for routine oversight.
- As a 40Labs team member, I want to review submitted TMDA/Pharmacy Council documentation and approve or reject a verification badge, so that the trust/verification system (built for the future Web App) has a working backend from day one.
- As a government health office (scoped, read-only, approved), I want aggregated regional stockout visibility, so that I can monitor public health patterns without accessing per-patient data.

### Edge Cases / Error States
- As a pharmacy owner, if I lose internet mid-sale, the sale must still complete and sync silently once connectivity returns — no error state should block the transaction.
- As a staff member, if my device pairing is revoked by the owner, my next action attempt must fail cleanly with a clear message, not a silent hang.
- As a pharmacy owner, if my recorded revenue crosses a tier threshold mid-month, I want a clear, non-disruptive notice of the tier change — not a surprise lockout.

---

## 5. Requirements

### P0 — Must-Have (MVP cannot ship without these)

| # | Requirement | Acceptance Criteria |
|---|---|---|
| 1 | Business ID registration on 40LabsCore | Given a new business signs up, when registration completes, then a canonical Business ID (e.g. `AFYA-XXXX`) is minted once and used across all current and future surfaces. |
| 2 | Offline-first POS (sale, dispense, receipt) | Given no internet connection, when a sale is completed, then the transaction is recorded in SQLite, a receipt prints, and stock updates locally with zero errors. |
| 3 | Silent background sync (SQLite → PostgreSQL) | Given connectivity returns after an offline period, when sync runs, then all queued transactions upload without user intervention or visible disruption. |
| 4 | `workspace_id` + `branch_id` on every table | Given any new table is created, then it includes both columns from creation, even if `branch_id` is unused until multi-branch ships. |
| 5 | PIN-gated sensitive actions (server-enforced) | Given a refund, stock adjustment, PO approval, or interaction override is attempted, then the action is blocked server-side without a valid PIN — frontend-only checks are not sufficient. |
| 6 | Immutable audit log | Given any PIN-gated action completes, then it is written to an audit log entry that cannot be updated or deleted by any role. |
| 7 | Shared Customer / Medicine / Inventory records | Given a patient, medicine, or inventory item exists, then it is referenced (not duplicated) by every module — POS, lab, reporting — that touches it. |
| 8 | Lab module: order → sample → result → report | Given a lab test is ordered from a patient's record, then it can progress through sample collection, result entry, and report generation, linked back to that same patient and (if applicable) prescription. |
| 9 | Orbit Worker QR pairing, LAN-only | Given a staff device scans the pairing QR code, then it connects only while on the pharmacy's local network, and reconnects automatically on trusted return without re-confirmation — unless revoked by the owner. |
| 10 | Orbit Worker permission scoping | Given an owner defines a staff permission set (e.g. stock update yes / refund no), then Orbit Worker enforces exactly that set, with sensitive actions still routed through the same server-side PIN gate as desktop. |
| 11 | Revenue-based tier enforcement from ledger | Given a business's monthly recorded revenue crosses a tier threshold, then tier eligibility is calculated from the transaction ledger itself — not a self-reported field. |
| 12 | Swahili-first UI | Given the app loads, then Swahili (sw-TZ) is the default language with English as a switchable secondary — not the reverse. |
| 13 | TRA EFD/EFP fiscal integration | Given a sale is finalized, then a TRA-compliant fiscal receipt is generated via integration with certified fiscal devices (e.g. INCOTEX, DATECS). |
| 14 | Admin Web App: default read access | Given a 40Labs internal team member logs into Admin Web App, then they have read access to platform-wide (not per-patient) data by default, with any elevated access requiring explicit request-and-approval. |
| 15 | Admin Web App: verification review workflow | Given a business submits TMDA/Pharmacy Council documentation, then an Admin user can view it and approve/reject a verification badge — even though the public-facing badge display (Web App) isn't live until post-MVP. |
| 16 | Dormant Business ID profile for future aMob/Web App | Given a business registers, then a profile record with reserved aMob/Web App fields is created immediately, even though those surfaces aren't live — so no re-registration is needed later. |

### P1 — Nice-to-Have (improves MVP but core use case works without them)

| # | Requirement | Notes |
|---|---|---|
| 1 | Photo capture in Orbit Worker (delivery notes, lab samples) | Improves documentation quality; POS/lab core flow works without it. |
| 2 | Tier-change notification UX | Fraud-resistant enforcement (P0-11) works without a polished notice; the notice is a UX improvement. |
| 3 | Multi-device staff pairing history view (owner-facing) | Owner can already revoke a device; a full history log is a convenience, not a blocker. |
| 4 | Cold-chain/temperature logging fields in inventory schema | Regulatory requirement long-term (Good Storage and Distribution Practices Regs 2021), but not required for MVP dispensing flow to function. |

### P2 — Future Considerations (explicitly out of scope for v1, designed for now)

| # | Item | Why it's reserved now |
|---|---|---|
| 1 | AI analytics (demand forecasting, expiry prediction, fraud detection) | Schema must capture clinical/operational data in labeled form from day one (Goal 4) so this can "turn on" later without rework. |
| 2 | aMob patient app + WhatsApp-routed in-app commerce | Business ID + dormant profile exists now (P0-16); app itself is a separate build. |
| 3 | 40Labs Web App public listings + verification badges | Admin-side workflow exists now (P0-15); public display is deferred. |
| 4 | Supplier marketplace / B2B ordering portal | Named as a network-effect moat in the competitive report; requires liquidity (many pharmacies + suppliers) before it's viable — sequencing, not a technical blocker. |
| 5 | Multi-branch activation UX | Schema is ready (P0-4); the toggle and cross-branch reporting UI are v3.5 per the system prompt. |
| 6 | Regional compliance modules (KE eTIMS/SHA, UG NDA, RW RFDA + Kinyarwanda) | Phase 3 per competitive report; Tanzania-first for MVP. |

---

## 6. Success Metrics

### Leading Indicators (days–weeks post-launch)
- **Offline sale success rate:** 100% of sales complete without error while offline (this is a trust-critical metric, not a soft target).
- **Sync reliability:** ≥99.5% of queued offline transactions sync successfully within 5 minutes of reconnection.
- **Staff pairing completion:** ≥90% of invited staff complete Orbit Worker QR pairing within their first shift.
- **Swahili UI adoption:** ≥70% of users remain on the default Swahili UI rather than switching to English (signals the localization is actually usable, not just present).

### Lagging Indicators (weeks–months post-launch)
- **Tier conversion:** % of Free-tier businesses that cross into Class 1+ within 90 days, driven by organic revenue growth (validates the pricing model is reachable, not just theoretical).
- **Lab-linked prescriptions:** % of dispensing events that have a linked lab order/result, where clinically relevant — validates Goal 2 (unified record) is actually being used, not just technically possible.
- **Data completeness for future AI corpus:** % of transactions with fully labeled clinical trail fields populated (test → condition → medicine → outcome) — measured even though no AI ships yet, since Goal 4 depends on this being right from the start.
- **Audit log integrity incidents:** zero tolerance — any instance of a PIN-gated action bypassing the gate, or an audit entry being altered, is a P0 defect regardless of when it's found.

---

## 7. Open Questions

Carried forward from the Business Mechanism doc §6 — these are genuinely unresolved and block related implementation, not just documentation:

1. **Patient data on unsubscribe (aMob)** — hard delete vs. anonymize-and-retain for the AI corpus. *Owner: Sairiamu (product/data policy decision). Blocking for: aMob data model, but since aMob is post-MVP, this does not block the current build — flagged so it isn't forgotten before aMob work starts.*
2. **Orbit Worker sensitive-action gating confirmation** — Ade's recommendation (persistent pairing never bypasses PIN checks) is reflected as P0-10 above, but needs explicit sign-off it's the final word, not just the working assumption. *Owner: Sairiamu. Blocking for: Orbit Worker auth middleware implementation — should be confirmed before that module is built, not after.*
3. **Verification badge criteria** — is manual document review by the 40Labs team via Admin Web App the confirmed process, and what's the SLA/rejection criteria? *Owner: Sairiamu + Ade jointly (product + ops). Non-blocking for MVP code (P0-15 only needs the review workflow to exist, not the full criteria doc) but should be resolved before the first real business submits documentation.*
4. **PRD-to-schema handoff sequencing** — now that this PRD exists, does `packages/types` get built directly from it, or does a design pass (auth/device-binding screens) need to land first for the identity-graph portions specifically? *Owner: Sairiamu (workflow decision). Non-blocking for schema work unrelated to auth UI (Business ID, workspace/branch columns, tier fields); blocking for anything touching the Staff/Pharmacist/Admin auth flow specifically, which is already known to be under redesign.*

---

## 8. Timeline Considerations

- **No hard external deadline** is documented for MVP launch — this should be explicitly set by Sairiamu if one exists (investor commitment, pilot pharmacy agreement, etc.), since none is currently on record.
- **Dependency chain:** `packages/types` → `infra/db/sqlite-schema` → `packages/design-tokens` / `packages/i18n` (parallel-safe) → `services/api-core` skeleton → `apps/core-desktop` non-auth screens can begin once schema is stable. **`apps/core-desktop` auth screens are blocked** until the Staff/Pharmacist/Admin redesign and device-binding logic are finalized — this is an existing, explicit blocker, not a new one introduced by this PRD.
- **Phasing:** This PRD covers MVP only (40LabsCore + Orbit Worker + Admin Web App). A Phase 2 PRD (AI analytics, patient app, insurance integration) should be drafted separately once MVP is in Closed Beta — bundling it into this document would violate the scope-management principle of keeping v1 and v2 clearly separated.

---

*This PRD operationalizes `40Labs_Business_Mechanism_v1.md`. It does not introduce new business logic — where a decision required judgment beyond what that document specified, it is listed in §7 as an open question rather than resolved silently here.*
