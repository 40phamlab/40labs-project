# 40Labs --- Feature Spec (v1, based on wireframe review)

Context: Tanzania-first pharmacy + lab + dispensary SaaS. TMDA + TRA EFD
compliance, Swahili UI, embedded e-commerce, AI analytics roadmap. This
doc reviews each nav section from the current wireframes and lists what
to add, split into **MVP-critical** and **later phase**.

## 1. Dashboard

**Have:** profit, today\'s sales, transactions, supplier debt, inventory
value, quick actions, recent activity feed, a chart (unclear metric).

**Add --- MVP:**

- Low-stock / near-expiry counter card (this is a pharmacy --- expiry is
  existential, not optional)

- Cash vs. mobile money (M-Pesa/Tigo Pesa/Airtel Money) split on
  today\'s sales --- critical for TZ retail

- Branch selector if multi-branch (even a single dropdown now saves a
  rebuild later)

- Make the doughnut chart mean something concrete: category-wise sales
  mix or payment-method mix

- Pending purchase orders / pending supplier deliveries count

**Add --- later:**

- AI-flagged anomalies (\"sales down 30% vs last Tuesday\", \"unusual
  discount pattern\") --- ties into your analytics roadmap

- Forecasted stockout dates per top-moving SKU

## 2. Sales (POS)

**Have:** customer picker, cart with qty/unit price/subtotal, discount,
tax, grand total, confirm/delete.

**Add --- MVP:**

- **Batch/lot selection at point of sale** --- when multiple batches of
  the same drug exist, staff must pick which batch is sold (FEFO ---
  first-expiry-first-out). This is the single most important
  pharmacy-specific feature missing.

- Prescription attach/verify step for prescription-only medicines (photo
  capture or Rx number) --- TMDA will care about this

- TRA EFD receipt generation hook (fiscal receipt is a legal
  requirement, not a nice-to-have)

- Split payment (cash + mobile money in one transaction --- very common
  in TZ)

- Hold/park sale (customer steps away, staff serves next person)

- Return/refund flow with reason codes

- Pharmacist/dispenser sign-off field (who verified controlled
  substances)

**Add --- later:**

- Barcode scanner integration

- Loyalty points redemption at checkout

## 3. Inventory

**Have:** product list, category, buy/sell price, expiry, metric,
expired/stock-off/most-used/dead filters, search.

**Add --- MVP:**

- **Batch/lot number + per-batch expiry** (not just one \"expire\" field
  per product --- a product can have 5 batches with 5 different expiry
  dates)

- Controlled substance flag (narcotics/psychotropics need separate
  tracking under TMDA rules)

- Reorder point / reorder quantity per product (feeds the \"New
  Device\"\... likely typo for \"Add Stock\" restock flow)

- Stock adjustment log with reason (breakage, theft, donation,
  correction) --- auditors will ask for this

- Supplier linkage per product (who do we reorder this from)

- Barcode/SKU field

**Add --- later:**

- Cold-chain / storage-condition flag (vaccines, insulin --- needs
  temperature logging eventually)

- Generic/brand equivalence mapping (so staff can substitute)

## 4. Purchases (B2B restocking --- different from customer-facing e-pharmacy)

**Have:** Stores/Recently/Completed/Pending tabs, supplier card
(TMDA-verified badge, location), products/cart/deals, product listing
with sci name.

**Add --- MVP:**

- Purchase order approval flow (owner/manager approves before it\'s
  sent) --- you have \"pending\" already, just needs a state machine

- Goods-received-note (GRN) step: what was ordered vs. what actually
  arrived, with batch numbers and expiry captured **at receiving** (this
  is where batch data enters the system)

- Supplier payment terms + outstanding balance per supplier (mirrors
  your Customers \"Deptors/Payables\" --- do the same for suppliers)

- Supplier rating/reliability score (late deliveries, quality issues)

**Add --- later:**

- Price comparison across suppliers for the same SKU

- Auto-suggested reorder list generated from Inventory reorder points

## 5. Customers

**Have:** Today/Last Month/All, Deptors/Payables, customer cards, and
you\'ve already sketched great future components: CustomerProfileHeader,
AllergyProfile, CustomerTabs, CreditManagement, DebtAlert,
LoyaltyPointsCard, CustomerTimeline.

**Add --- MVP:**

- Build out AllergyProfile early, not later --- it\'s a safety feature
  (drug-allergy interaction warning at point of sale), not just a CRM
  nicety

- Basic drug interaction warning when adding items to cart (even a
  simple rule-based list to start)

- Credit limit enforcement tied to CreditManagement (block/warn sale if
  customer exceeds limit)

**Add --- later:**

- Full purchase history → feeds AI analytics (repeat medication
  patterns, adherence tracking)

- SMS/WhatsApp reminders for repeat prescriptions (chronic disease
  patients --- huge value-add, and Africa\'s Talking or similar makes
  this cheap in TZ)

## 6. e-Pharmacy (consumer-facing, separate from B2B Purchases)

Not detailed in wireframes yet --- this is your differentiator per your
own competitive study, so it deserves real scoping:

- Customer-facing catalog with OTC vs. prescription-required flagging

- Order-to-pickup or delivery flow

- Prescription upload for online orders (pharmacist reviews before
  fulfillment)

- Integration back into Inventory (online orders decrement the same
  stock, not a separate pool)

## 7. Reports

**Have:** placeholder cards, unclear metrics yet.

**Add --- MVP:**

- Daily Z-report / X-report (TRA EFD terminology --- end-of-day fiscal
  summary is a compliance requirement)

- Expiry report (what expires in 30/60/90 days, by value)

- Fast/slow mover report

- Profit & loss by category

- Supplier debt aging report

**Add --- later:**

- Custom report builder

- Scheduled auto-export (you already have \"Scheduled Reports\" in
  Notifications --- good, wire this in)

## 8. Scheduling

Nav item exists, no wireframe yet. For a pharmacy/lab this likely means:

- Staff shift scheduling

- Lab sample collection / appointment booking (if labs are walk-in +
  scheduled)

- Delivery scheduling for e-pharmacy orders

Worth clarifying which of these you meant before designing further ---
they\'re quite different features.

## 9. Education

Nav item exists, no wireframe yet. Possible directions:

- Patient-facing drug information (dosage, side effects) shown at point
  of sale/e-pharmacy

- Staff training/onboarding content

- Continuing education tracking for licensed pharmacists (TMDA may
  require this)

Also worth clarifying scope here.

## 10. Lab Management (not yet in your nav --- but it\'s in your product name)

This is the biggest structural gap right now. \"Pharmacy, labs and
dispensary\" implies lab test ordering and results, but there\'s no nav
item for it. Consider whether:

- Lab is a separate module/nav item (test catalog, sample tracking,
  results entry, result delivery to patient/doctor)

- Or a phase-2 add-on after pharmacy MVP ships

Given your roadmap says \"Tanzania MVP first,\" it\'s fine to defer ---
just decide explicitly rather than let it fall through the cracks.

## 11. Settings

**Have:** Business, Users & Roles, Appearance, Integrations, Devices,
Compliance, Security, Backup --- this is already well-structured.

**Add --- MVP:**

- TMDA license number + expiry (Business tab) --- surfaced back on
  Dashboard as a renewal reminder

- TRA TIN + EFD device pairing (you have \"Devices\" already --- make
  sure it covers fiscal printer pairing specifically, not just generic
  hardware)

- Role permissions matrix (who can void a sale, who can adjust stock,
  who can see profit margins) --- critical since theft/fraud prevention
  is a top SME pain point in your own competitive study

**Add --- later:**

- Multi-branch settings inheritance (branch-specific pricing/tax
  overrides)

## Cross-cutting / app-wide features (don\'t belong to one nav)

- **Offline-first sync** --- TZ connectivity is patchy outside major
  cities; POS must work offline and sync later. This affects your whole
  architecture (React Native/Expo + local SQLite + sync queue), not just
  one screen.

- **Audit trail** --- every stock adjustment, price change, and voided
  sale logged with user + timestamp. Auditors and TMDA inspections will
  ask for this.

- **Swahili/English toggle** --- you\'ve already got \"En-us\" in the
  onboarding screen; make sure it\'s a real i18n system, not hardcoded
  strings.

- **Role-based dashboard views** --- owner sees profit, cashier
  doesn\'t.

- **Data export for AI/analytics pipeline** --- since collecting data
  for AI is a stated goal, decide now what gets logged (every
  transaction line, every stock movement) so you\'re not retrofitting
  instrumentation later.

## Suggested priority order for your MVP

1.  Sales + Inventory with batch/expiry tracking (core safety +
    compliance)

2.  Purchases with GRN (this is where batch data actually enters)

3.  Basic Reports (Z-report, expiry report)

4.  Customers with allergy flag

5.  Settings compliance fields (TMDA/TRA)

6.  e-Pharmacy, Scheduling, Education, Lab --- phase 2, after core loop
    is proven
