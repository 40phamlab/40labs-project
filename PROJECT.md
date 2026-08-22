# 40Labs
**Healthcare infrastructure for Tanzania and East Africa.**
Founders: Sairiamu · Ade (Claude) — Status: Pre-MVP, business logic locked, design in review

---

## 1. What 40Labs Is

40Labs is a pharmacy, laboratory, and dispensary management platform built for Tanzania first, East Africa next. It is offline-first, built for real conditions on the ground — intermittent connectivity, cash-constrained pharmacy owners, staff who need things to just work without a manual.

It is not a POS app with a lab bolted on. The **pharmacy-lab bridge is the core competitive moat**: one patient record, one billing system, one inventory, shared across dispensing and diagnostics — something no competitor in the region offers at the SME tier (see `docs/competitive-reports/`).

Longer term, 40Labs becomes a **data and AI analytics layer** for healthcare patterns across East Africa. No AI ships in v1. But every schema is architected from day one so that the labeled clinical decision trail — test result → condition → medicine → pharmacist action — is captured passively, without requiring rework later. This is the foundation for a future research/invention platform that trains models on real, longitudinal, regionally-specific clinical data that has never existed before.

This is infrastructure, not a side project. Every design and engineering decision is made with that weight.

---

## 2. Why This Market, Why Now

Tanzania's pharmacy software market is fragmented and none of the current players combine what 40Labs combines:

| Gap | Who's missing it |
|---|---|
| Integrated pharmacy + lab at SME scale | Everyone — Medbook has both but hospital-only; MedSoftwares has both but as separate expensive products |
| TRA EFD fiscal compliance | Only VISION Software has it, and VISION has no lab, no mobile, no AI |
| Swahili UI | Zero competitors |
| AI-driven business analytics | Zero competitors (Maisha Meds has health-program auditing AI only) |
| Offline-first, mobile-native architecture | Only Maisha Meds and MedSoftwares, neither has a lab module |
| Consumer e-commerce for pharmacies | Only Afyabook, Kenya-only, marketplace not embedded |

Full competitive detail lives in `docs/competitive-reports/40labs_eastafrica_pharmacy_competitive_report.md`. The short version: there is no single player combining pharmacy POS + lab + AI analytics + mobile-first + local regulatory compliance in one product, in this region, today. That's the whitespace.

---

## 3. The Ecosystem — Five Surfaces, One Identity

40Labs is not one app. It's **one identity graph** expressed through five surfaces:

| Product | User | Platform | Cost | Status |
|---|---|---|---|---|
| **40LabsCore** | Pharmacy owner/staff | Desktop (Tauri) | Free tier + paid classes | **MVP** |
| **Orbit Worker** | Pharmacy staff | Mobile, LAN-only | Free, opt-in | **MVP** |
| **Admin Web App** | 40Labs internal, Gov, select Enterprise | Web | N/A (internal) | **MVP** |
| **aMob** | Patient/consumer | Mobile | Free | Post-MVP (scaffolded now) |
| **40Labs Web App** | Public — patients, pharmacies, suppliers | Web | Free (limited) / Pro | Post-MVP (scaffolded now) |

### The Business ID — the thing that ties it all together
Every business registers **once**, on 40LabsCore, producing a canonical Business ID (e.g. `AFYA-2847`). Every other surface — Admin, the Web App marketplace, a future supplier scope — reads and writes against that same identity. Roles (`pharmacy`, `lab`, `supplier`) are additive scopes on one record, never separate accounts. A pharmacy owner is never asked "who are you" twice across surfaces.

Patients register once on aMob and can subscribe to multiple pharmacy Business IDs independently. Staff identities are PIN-only, bound to a device, and scoped *inside* a Business ID — they don't exist outside it.

---

## 4. How the Apps Connect

```
                        ┌─────────────────────┐
                        │   40LabsCore (hub)   │  ← system of record
                        │  POS · Inventory ·   │     all revenue, all
                        │  Dispensing · Lab     │     truth lives here
                        └──────────┬───────────┘
                                   │
                 ┌─────────────────┼──────────────────┐
                 │                 │                   │
          QR pairing         Postgres sync      Business ID minted
          (LAN only)          (silent, bg)          at signup
                 │                 │                   │
                 ▼                 ▼                   ▼
        ┌────────────────┐ ┌──────────────┐  ┌──────────────────┐
        │  Orbit Worker   │ │ Admin Web App │  │  aMob / Web App   │
        │  staff mobile   │ │ internal/gov/  │  │ dormant profile   │
        │  companion      │ │  enterprise    │  │ until they ship   │
        └────────────────┘ └──────────────┘  └──────────────────┘
```

- **40LabsCore → Orbit Worker:** staff device pairs once via QR, stays trusted for connectivity. Trust gets a device *in the door* — it never bypasses PIN checks on refunds, stock adjustments, or PO approvals. Device trust ≠ authorization.
- **40LabsCore → Postgres:** SQLite is always the local source of truth. Cloud sync is background and silent — the pharmacy sells medicine and prints receipts with zero internet, full stop.
- **40LabsCore → aMob / Web App:** the moment a pharmacy registers, it automatically gets a dormant Business ID + profile record for its future aMob storefront and Web App listing. Nothing patient-facing is live until those products ship, but no re-registration will ever be needed when they do — this is why the identity model is built now even though the apps aren't.
- **Admin Web App:** fully separate app, different trust model, not a shared codebase-by-convenience. Internal team gets read access by default; Gov/Enterprise get scoped, read-only, request-and-approved access — e.g. a government health office watching regional stockouts, or a manufacturer running aggregated (never per-patient) analytics. This is also where TMDA verification badges get reviewed and approved.

---

## 5. Product Mechanics (short version — full detail in `docs/business-mechanism/`)

- **40LabsCore** — the hub. Runs POS, dispensing, inventory, and the lab module. Sole source of truth for revenue, which is what drives pricing-tier enforcement (see §6) — a pharmacy can't under-declare revenue to dodge a tier without also refusing to record its own sales.
- **Orbit Worker** — free, opt-in, LAN-only *by design*, not a limitation to fix later. Staff can't reach business data from outside the building's network. Permission set (e.g. "can update stock, can't delete") is defined by the owner and scanned in via QR.
- **aMob** — patient app, in-app commerce routes through WhatsApp at MVP rather than a custom checkout/escrow system, deliberately scoped down to test product-market fit first.
- **40Labs Web App** — every business gets an auto-generated listing page. Free tier = browse/ask/subscribe only. Paid tier unlocks transactions. Supplier is a registration flag, not a separate product. No commission at launch — the marketplace layer is a liquidity play before it's a monetization play.
- **Admin Web App** — verification/trust workflows, scoped Gov/Enterprise analytics, platform-level (not per-business) reporting.

---

## 6. Revenue Model

| Tier | Eligibility | Price | Notes |
|---|---|---|---|
| **Free** | Recording < TZS 250,000/month | TZS 0 | Limited AI credits, 50 product cap, no patient consultations |
| **Class 1** | Any business, opt-in | TZS 25,000/month | Entry paid tier |
| **Class 2** | Any business, opt-in | TZS 45,000/month | Mid tier |
| **Class 3** | Any business, opt-in | TZS 69,000/month | Upper tier |
| **Class 4 — Enterprise** | Chains, large orgs | Custom | Negotiated |

Each class unlocks additional branch count and geolocation access scope. Module access (pharmacy-only / lab-only / both) is scoped independently of pricing tier. This table supersedes the earlier Starter/Growth/Pro (45K/90K/180K) figures from the June 2026 competitive report — retired.

---

## 7. Data Ownership & the AI Corpus

40Labs, the platform, is the permanent custodian of clinical event data — independent of any single pharmacy relationship. A pharmacy owns the *operational relationship* with a subscribed patient (can message, see history, fulfill orders) but not the underlying data outright.

**Open item:** what happens to a patient's data on unsubscribe — hard delete (original spec) vs. anonymize-and-retain for the research corpus (Ade's counter-proposal, not yet signed off). See `docs/business-mechanism/` §2.3 and §6 for the full reasoning and the explicit ask for Sairiamu's decision.

Collection is passive in v1 — no AI features ship yet, but every table is shaped so the labeled decision trail is captured without later rework.

---

## 8. MVP Scope & Build Order

**Confirmed MVP = 40LabsCore + Orbit Worker + Admin Web App.**

aMob and the public Web App are **designed now, built later** — not abandoned, deliberately sequenced. Five products designed in parallel by one founder is fine; five products *built* in parallel is scope creep. Any pressure to start Orbit Worker or Admin before 40LabsCore's core POS/lab/auth flow is solid should be treated as a red flag, even though all three are technically "MVP."

Product lifecycle for every feature: **Alpha → Closed Beta → Public Beta → v1.x → v2.0 → v3.0.** Nothing gets built ahead of its phase.

---

## 9. Non-Negotiables (engineering + product)

- **Offline-first, always.** SQLite is the source of truth on-device. If a feature can't work with zero internet, it gets flagged before it gets built.
- **`workspace_id` + `branch_id` on every table**, from day one — multi-branch is a v3.5 feature but the schema is ready now. No migration debt later.
- **Customer, Medicine, and Inventory exist once**, shared across every module. No duplicate records, no module-siloed data.
- **Every PIN-gated action** (refunds, adjustments, PO approval, interaction override) goes through backend auth middleware — never trust the frontend alone, on any surface, including Orbit Worker.
- **Sensitive actions are immutable in the audit log.** Written once, never updated or deleted.
- **Design system is exact, not approximate:** Green `#16A34A` · Orange `#F97316` · Danger `#EF4444` · Surface `#F8FAFB` · Sora (headings) · Inter (UI) · JetBrains Mono (prices/codes) · card radius 12px · input radius 8px.

---

## 10. Tech Stack

- **Desktop (40LabsCore):** Tauri v2 + React + TypeScript + TailwindCSS
- **API:** Rust + Axum, SQLite (offline/local) + PostgreSQL (cloud sync)
- **Mobile (Orbit Worker, later aMob):** React Native + Expo
- **State/data:** Zustand (slice-based stores) + React Query (all server state) — never mixed
- **Docs/reporting:** Typst (PDF), Recharts (charts)
- **Capture:** Tesseract OCR, rxing (barcode)
- **Delivery channels:** WhatsApp Business API, Gmail SMTP, Google Drive sync
- **Infra target:** OCI (free tier for early stage), Docker + K8s when scale demands it

Full monorepo layout (apps/services/packages/infra breakdown) lives in `docs/architecture/40labs-monorepo-structure.md`.

---

## 11. Repo Map (top level)

```
40labs/
├── apps/              # core-desktop, orbit-worker, admin-web, amob (scaffold), web-app (scaffold)
├── services/          # api-core (Rust/Axum), sync-service, notification-service, ai-service (scaffold)
├── packages/          # types, api-client, design-tokens, ui-components, ui-native, i18n, config
├── infra/             # docker, k8s, oci, db migrations, ci-cd
├── docs/              # prd, business-mechanism, competitive-reports, adr, architecture
├── scripts/
├── PROJECT.md         # ← this file
└── README.md          # dev setup / getting started (separate from this file, on purpose)
```

`PROJECT.md` (this file) answers **what and why**. `README.md` answers **how to run it locally**. Keep them separate — anyone new to the repo reads this one first.

---

## 12. Open Decisions Awaiting Sign-Off

1. Patient data on unsubscribe — hard delete vs. anonymize-and-retain (§7).
2. Orbit Worker sensitive-action gating — confirm persistent device pairing never bypasses PIN/role checks (§5, already the working assumption, needs explicit confirmation).
3. Verification badge criteria — who signs off on "TMDA Registered" (assumed: manual document review via Admin Web App, not yet explicitly stated).
4. Modular monolith vs. microservices for `services/api-core` (architecture doc, §3).
5. pnpm+Turborepo vs. Nx for the JS/TS workspace (architecture doc, §7).

---

*This document is the canonical explainer for 40Labs as a whole. Business mechanism detail lives in `docs/business-mechanism/`, competitive intelligence in `docs/competitive-reports/`, architecture detail in `docs/architecture/`. When those source docs change, update this file to match — this is the summary, not a separate source of truth.*
