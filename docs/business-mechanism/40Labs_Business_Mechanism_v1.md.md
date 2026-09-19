# 40Labs --- Business Mechanism Documentation

**Version:** 1.0 · **Date:** August 2026 **Prepared by:** Ade (Claude) &
Sairiamu --- Co-Founders **Status:** Business logic locked pending
design review. Technology stack deliberately out of scope for this
document.

## 0. Ecosystem Map

40Labs is not one product --- it is **one identity graph** expressed
through five surfaces:

  --------------------------------------------------------------------------------
  **Product**      **User**           **Platform**   **Cost to      **Status**
                                                     User**         
  ---------------- ------------------ -------------- -------------- --------------
  **40LabsCore**   Pharmacy           Desktop        Free tier +    **MVP**
                   (owner/staff)      (Tauri)        paid classes   

  **Orbit Worker** Pharmacy staff     Mobile,        Free, opt-in   **MVP**
                                      LAN-only                      

  **aMob**         Patient/consumer   Mobile         Free           Post-MVP

  **40Labs Web     Public (patients,  Web            Free (limited) Post-MVP
  App**            pharmacies,                       / Pro          
                   suppliers)                                       

  **Admin Web      40Labs internal,   Web            N/A (internal) **MVP**
  App**            Gov, select                                      
                   Enterprise                                       
  --------------------------------------------------------------------------------

Every product resolves back to a single **Business ID** (e.g. AFYA-2847)
minted once at registration on 40LabsCore. A business does not get a new
identity when it appears on the Web App, gets a supplier scope, or shows
up in Admin --- it\'s the same record, with roles/scopes layered on top.
This is the backbone that makes cross-product trust (verification
badges, pricing tier, geolocation access) coherent everywhere.

## 1. Unified Identity System

- **Registration happens once**, on 40LabsCore, at business signup. This
  produces the canonical Business ID.

- **Roles are additive scopes on the same identity**, not separate
  accounts:

  - pharmacy (default)

  - lab (if the business runs a diagnostic lab module)

  - supplier (opt-in scope, unlocked via registration flag --- grants
    Pro marketplace treatment)

- **Patients register once** on aMob. A patient can hold subscriptions
  to multiple pharmacy Business IDs simultaneously --- the patient
  identity is independent of any single pharmacy.

- **Staff identities** (PIN-only, bound-device) are scoped *inside* a
  Business ID and do not exist outside it --- this matches the auth
  architecture already locked for 40LabsCore.

**Practical effect:** when a pharmacy owner logs into the Admin-facing
side of things or appears on the Web App marketplace as a supplier,
40Labs never asks \"who are you\" twice. One Business ID, many surfaces.

## 2. Product Mechanics

### 2.1 40LabsCore (Pharmacy Desktop --- the hub)

The system of record. Everything below reads from or writes to what
happens here.

- Every pharmacy that signs up automatically receives an aMob storefront
  presence (dormant until aMob ships, but the Business ID + basic
  profile exists from day one).

- Runs POS, inventory, dispensing, and the **lab module** (pharmacy-lab
  bridge --- the core moat).

- Is the sole source of truth for revenue, which matters directly for
  pricing tier enforcement (see §4).

### 2.2 Orbit Worker (Staff Mobile Companion)

- **Free, opt-in, LAN-only by design** --- this is a deliberate security
  boundary, not a limitation to fix later. Staff cannot reach business
  data from outside the building\'s network.

- **Pairing model:** QR-code pairing once per device. After pairing, the
  device stays trusted and reconnects automatically without
  re-confirmation, unless explicitly revoked/blocked by the owner from
  40LabsCore.

  - **Founder\'s note (Ade):** persistent trust is fine for
    *connectivity*, but it must never be treated as authorization for
    sensitive actions. Every PIN-gated action defined in 40LabsCore
    (refunds, stock adjustments, PO approval) remains PIN-gated on Orbit
    Worker too. Device trust gets you *in the door*; it does not hand
    you the keys to the safe.

- **Permission model is lighter than desktop** --- staff get a
  permission set defined by the owner (e.g. \"can update stock, cannot
  delete,\" \"can add lab sample, cannot issue refund\"), scanned in via
  QR, then they\'re operating.

- Typical actions: stock update/add, quick sale, add lab sample, take a
  photo (e.g. for supplier delivery note or lab sample documentation).

### 2.3 aMob (Patient App) --- \"afyaMob\"

- Patient signs up once, can browse and **subscribe to multiple
  pharmacies**.

- **In-app commerce is real, not just informational** --- but the
  MVP-stage rollout starts narrow: patient-to-pharmacy (or
  patient-to-lab) contact happens via an **in-app message that routes
  through WhatsApp**, rather than a custom chat/checkout system. This is
  a deliberate scope reduction to test product-market fit before
  building full escrow/delivery infrastructure.

- **Data lifecycle on unsubscribe (as specified):** unsubscribing
  terminates the active relationship. On the pharmacy\'s next sync, that
  patient\'s data attached to that pharmacy is deleted.

  - **Founder\'s note (Ade) --- open decision, flagged not overridden:**
    I\'d recommend *anonymize-and-retain* instead of hard delete.
    Reasoning: (1) this is the exact longitudinal clinical data --- test
    result → condition → medicine → outcome --- that the whole future
    AI/research platform depends on, and it can\'t be reconstructed once
    gone; (2) if a patient resubscribes later or moves to another 40Labs
    pharmacy, continuity of care is lost with a hard delete; (3) the
    safer default in health data generally is sever-access-on-request,
    not destroy-the-record. Recommend: on unsubscribe, the pharmacy
    immediately loses read/write access and the patient disappears from
    their live dashboards (this satisfies the \"relationship
    terminated\" requirement), but the underlying clinical events get
    stripped of PII and folded into the anonymized research corpus
    rather than deleted outright. **This needs your explicit sign-off
    before it\'s built either way --- documenting your original spec
    above, and my counter-proposal here, so nothing gets silently
    changed.**

### 2.4 40Labs Web App (Public Layer)

Serves three audiences under one roof, all gated by tier:

- **Everyone gets a listing/profile page** generated from their Business
  ID (pharmacy, lab, or supplier) --- this is automatic, not opt-in.

- **Free tier:** browse, ask, subscribe only --- no transactions.

- **Paid/Pro tier:** buying, ordering, full marketplace participation
  unlocked.

- **Supplier scope:** not a separate product --- it\'s a registration
  flag on an existing Business ID. Flipping it on unlocks Pro
  marketplace treatment (product posting, sales/analytics tooling) for
  the supplier side specifically.

- **Marketplace economics at launch:** traffic-driver, not a take-rate.
  No commission taken initially --- the goal is liquidity (enough
  suppliers and pharmacies transacting) before monetizing the
  marketplace layer itself.

- **Trust & Verification system** (must-have, not optional):

  - Tiered badges: e.g. **40Labs Verified** (registration + phone
    verified), **TMDA Registered** (license uploaded and confirmed), and
    space for additional recognized regional certifications.

  - Verification review is an **Admin Web App** function (see §2.5) ---
    this is where the \"read + request-permission\" mechanic directly
    plugs in: Admin can view submitted documentation and approve/reject
    a badge.

- Product listing at launch is unfiltered (\"list all products\");
  demographic/geo filters (age, gender, etc.) are an explicit post-MVP
  layer.

### 2.5 Admin Web App (Internal / Gov / Select Enterprise)

- **Fully separate application** from the customer-facing Web App ---
  different audience, different trust model, not a shared
  codebase-by-convenience.

- **Primary users:** the 40Labs internal team. Read access by default.

- **Gov and large enterprise (e.g. medicine producers)** can be granted
  **scoped, read-only, permission-gated access** --- for example, a
  government health office monitoring regional stockouts, or a
  manufacturer running marketing/education/analytics against aggregated
  (not per-patient) data. Any access beyond the default read tier
  requires an explicit request-and-approval flow --- nothing is open by
  default.

- This is also the home of the verification/trust workflow described in
  §2.4.

- **Boundary vs. 40LabsCore\'s own reporting:** a single pharmacy
  owner\'s day-to-day sales/stock/lab reporting lives inside 40LabsCore
  --- that\'s their private operational view. Admin Web App is the
  cross-business, platform-level view (many pharmacies, many labs,
  regional patterns) --- it does not replace or duplicate a single
  business\'s own dashboard.

## 3. Revenue & Pricing Model

**Enforcement mechanism:** because 40LabsCore *is* the point of sale,
monthly revenue used to determine tier eligibility is measured directly
from the system\'s own transaction ledger --- not self-reported. A
pharmacy cannot quietly under-declare revenue to stay on the free tier
without also refusing to record its own sales, which defeats the purpose
of using the software at all. This is a structurally fraud-resistant
gate and should be treated as a real product strength, not just a
pricing mechanic.

  -----------------------------------------------------------------------------
  **Tier**          **Eligibility**   **Price**         **Notes**
  ----------------- ----------------- ----------------- -----------------------
  **Free**          Recording \< TZS  TZS 0             Limited AI credits, 50
                    250,000/month                       product cap, cannot
                                                        receive patient
                                                        consultations

  **Class 1**       Any business,     TZS 25,000/month  Entry paid tier
                    opt-in                              

  **Class 2**       Any business,     TZS 45,000/month  Mid tier
                    opt-in                              

  **Class 3**       Any business,     TZS 69,000/month  Upper tier
                    opt-in                              

  **Class 4 ---     Chains, large     Fixed +           Negotiated per
  Enterprise**      orgs              usage-based,      requirements/services
                                      custom            
  -----------------------------------------------------------------------------

- Each paid class unlocks additional **branch count** and **geolocation
  access scope** --- i.e. how many staff/regions can access the
  business\'s data, and whether access is limited to a single
  branch/region or extends platform-wide.

- Access can also be scoped by **module** --- pharmacy-only, lab-only,
  or both --- independent of the class tier.

- **Supersedes** the earlier three-tier figure (Starter/Growth/Pro at
  45K/90K/180K TZS) referenced in the June 2026 competitive report ---
  that pricing is now retired in favor of the table above.

## 4. Data Ownership & the AI Corpus Policy

- 40Labs (the platform) is the permanent custodian of clinical event
  data (test → condition → medicine → pharmacist action), independent of
  any single pharmacy relationship --- this is what makes the future
  AI/research platform possible.

- A pharmacy owns the *operational relationship* with a patient while
  subscribed (can message, see history, fulfill orders) but does not own
  the underlying data outright --- see open decision in §2.3 on what
  happens to that data after unsubscribe.

- Data collection for the AI corpus is **passive by design in v1** ---
  no AI features ship yet, but every schema is built so the labeled
  clinical decision trail is captured from day one without requiring
  later rework. This principle was already locked before this document
  and remains unchanged.

## 5. MVP Scope & Sequencing

**Confirmed MVP = 40LabsCore + Orbit Worker + Admin Web App.**

aMob and the public 40Labs Web App are **designed now, built later** ---
deliberately deferred, not abandoned. Practical implication for the MVP
phase:

- aMob\'s \"every pharmacy automatically gets a storefront\" behavior
  exists as a *dormant Business ID + profile record* during MVP --- the
  app itself isn\'t live yet, so nothing patient-facing ships until aMob
  is built.

- The Web App\'s public listing page similarly waits --- but because
  it\'s driven by the same Business ID, no re-registration will be
  needed for a pharmacy when it does go live.

- This sequencing means: build the identity/data model **now** to
  already accommodate aMob and Web App fields, even though those two
  products aren\'t in the current build queue. This avoids a costly
  schema migration later --- consistent with the existing rule that
  every table carries workspace_id/branch_id from day one even though
  multi-branch is a later phase.

**One sequencing risk worth naming directly:** five products designed in
parallel by a single founder is not something to build in parallel ---
it\'s something to *design* in parallel (which is what this document
does) and *build* strictly in the MVP order above. I\'d treat any
pressure to start Orbit Worker or Admin before 40LabsCore\'s core
POS/lab/auth flow is solid as scope creep, even though all three are
\"MVP.\"

## 6. Open Decisions Requiring Sign-Off

1.  **Patient data on unsubscribe** --- hard delete (as originally
    specified) vs. anonymize-and-retain for the AI corpus (Ade\'s
    recommendation). See §2.3.

2.  **Orbit Worker sensitive-action gating** --- confirm that persistent
    device pairing never bypasses PIN/role checks for refunds,
    deletions, or overrides (Ade\'s recommendation, not yet explicitly
    confirmed by Sairiamu). See §2.2.

3.  **Verification badge criteria** --- who signs off on \"TMDA
    Registered\" specifically (manual document review by the 40Labs team
    via Admin Web App is assumed here, but not yet explicitly stated).

*This document governs business mechanism only. Technical architecture,
database schema, and API design are intentionally out of scope and will
follow once designs are reviewed.*
