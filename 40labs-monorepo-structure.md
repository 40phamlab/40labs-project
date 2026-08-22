# 40Labs — Monorepo Structure v1.0
**Prepared by:** Ade & Sairiamu · **Status:** Proposed — needs sign-off on 3 open decisions (bottom)

---

## 0. Why one repo

Five products (Core, Orbit Worker, aMob, Web App, Admin) share one identity graph (Business ID), one design system, one API contract, and — per the locked business mechanism doc — the schema has to accommodate all five *now* even though only three are MVP. A monorepo is the only sane way to keep those in sync without version drift between apps. Split repos later if/when you have separate teams per surface — you don't yet.

---

## 1. Top-level layout

```
40labs/
├── apps/                     # Every user-facing surface
├── services/                 # Backend — Rust/Axum core + future satellite services
├── packages/                 # Shared code — types, UI, config, i18n, api client
├── infra/                    # Docker, K8s, OCI, DB migrations, CI/CD
├── docs/                     # PRD, business mechanism, competitive reports, ADRs
├── scripts/                  # Dev tooling, codegen, seed/migration runners
├── .github/workflows/        # CI/CD pipelines
├── pnpm-workspace.yaml       # JS/TS workspace root
├── Cargo.toml                # Rust workspace root
├── turbo.json                # Build graph + caching
└── package.json
```

---

## 2. `apps/` — one folder per surface, mapped to the ecosystem table

```
apps/
├── core-desktop/             # 40LabsCore — MVP, the hub, system of record
│   ├── src/
│   │   ├── modules/
│   │   │   ├── pos/
│   │   │   ├── inventory/
│   │   │   ├── dispensing/
│   │   │   ├── lab/                 # pharmacy-lab bridge — the moat
│   │   │   ├── customers/           # shared record, referenced not duplicated
│   │   │   ├── staff/               # PIN gates, device binding
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── stores/           # Zustand, slice-based
│   │   ├── queries/          # React Query hooks (imports packages/api-client)
│   │   └── components/       # app-specific only; shared UI comes from packages/ui-components
│   ├── src-tauri/            # Tauri v2 Rust shell — SQLite local, sync trigger, OCR, barcode
│   └── package.json
│
├── orbit-worker/              # Staff mobile companion — MVP, LAN-only by design
│   ├── src/
│   │   ├── modules/
│   │   │   ├── quick-sale/
│   │   │   ├── stock-update/
│   │   │   ├── lab-sample/
│   │   │   └── pairing/             # QR pairing, device trust store
│   │   └── ...
│   └── app.json               # Expo config
│
├── admin-web/                 # Internal/Gov/Enterprise — MVP, fully separate trust model
│   ├── src/
│   │   ├── modules/
│   │   │   ├── verification/        # badge review — TMDA Registered etc.
│   │   │   ├── access-requests/     # gov/enterprise scoped read approval flow
│   │   │   └── platform-analytics/  # cross-business, not per-patient
│   │   └── ...
│   └── package.json
│
├── amob/                       # Patient app — post-MVP, SCAFFOLD ONLY at this stage
│   └── README.md               # placeholder: Business ID + dormant profile already
│                                # exists server-side per §2.1 of business mechanism doc
│
└── web-app/                    # Public marketplace — post-MVP, SCAFFOLD ONLY
    └── README.md                # same rationale — designed now, built later
```

**Note on `amob/` and `web-app/`:** I'm scaffolding empty shells with just a README rather than skipping the folders entirely. That keeps the monorepo's shape truthful to the 5-surface architecture from day one, without you burning a single hour building UI you're not shipping yet.

---

## 3. `services/` — backend

```
services/
├── api-core/                  # Rust + Axum — THE backend for MVP
│   ├── src/
│   │   ├── modules/           # mirrors apps/core-desktop modules — pos, inventory,
│   │   │                      # lab, dispensing, customers, staff, identity
│   │   ├── middleware/
│   │   │   ├── auth.rs        # PIN/role checks — never trust frontend alone
│   │   │   └── workspace.rs   # enforces workspace_id/branch_id on every query
│   │   ├── db/
│   │   │   ├── models/
│   │   │   └── migrations/    # -> mirrored in infra/db for review
│   │   └── main.rs
│   └── Cargo.toml
│
├── sync-service/               # SQLite -> Postgres background sync, silent
│   └── (Rust — can start as a module inside api-core, extract when it earns it)
│
├── notification-service/       # WhatsApp Business API + Gmail SMTP dispatch
│   └── (Rust or lightweight Node — low urgency, keep thin)
│
└── ai-service/                 # Python + LangGraph + Polars — SCAFFOLD ONLY
    └── README.md                # not built until passive data collection (already
                                  # architected into v1 schema) has enough volume
```

**Design call:** I'm recommending `api-core` as a **modular monolith** — one Axum binary with clean internal module boundaries — not five microservices from day one. Splitting `sync-service` and `notification-service` out into their own binaries now buys you deployment complexity with zero payoff at your current scale (one founder, pre-launch). The module boundaries inside `api-core` are drawn so that extraction later is a cut-and-paste, not a rewrite. This is a real recommendation, not a default — flagging it as decision #1 below.

---

## 4. `packages/` — shared code, the thing that keeps 5 surfaces from drifting

```
packages/
├── types/                # TS types generated/mirrored from Rust structs —
│                          # Business ID shape, roles, PIN-gate enum, API contracts
├── api-client/            # Typed fetch + React Query hooks wrapping api-core's REST contract
├── design-tokens/          # Single source: Green #16A34A, Orange #F97316, Danger #EF4444,
│                            # Surface #F8FAFB, Sora/Inter/JetBrains Mono, radius 12/8
├── ui-components/           # Shared React components (core-desktop + admin-web + web-app later)
├── ui-native/                 # Shared React Native components (orbit-worker + amob later)
├── i18n/                       # sw-TZ primary, en secondary — locale strings
└── config/                      # eslint, tsconfig, tailwind base — one config, extended per app
```

Rust side gets its own shared crate inside the Cargo workspace for anything api-core and a future extracted service would both need (e.g. `workspace_id` enforcement logic, shared DB models) — call it `crates/40labs-core-lib/` alongside `services/`.

---

## 5. `infra/`

```
infra/
├── docker/
│   ├── api-core.Dockerfile
│   └── docker-compose.dev.yml     # local Postgres + api-core for dev
├── k8s/                             # manifests/Helm — dormant until you actually need
│                                    # to scale past a single OCI compute instance
├── oci/                              # Terraform for OCI free-tier resources
├── db/
│   ├── migrations/                    # Postgres — source of truth, mirrors api-core/db/migrations
│   └── sqlite-schema/                  # local-first schema, kept in lockstep with Postgres
└── ci-cd/                                # (mirrors .github/workflows, kept here for reference/docs)
```

---

## 6. `docs/`

```
docs/
├── prd/
├── business-mechanism/          # your existing v1.0 doc lives here
├── competitive-reports/         # existing competitive intel report lives here
└── adr/                          # Architecture Decision Records — one file per major
                                   # call (e.g. "ADR-001: modular monolith not microservices")
```

Putting the business mechanism doc and competitive report *in the repo* (not just Notion/Drive) means every future code decision can cite them directly, and they're versioned alongside the code they justify.

---

## 7. Tooling choices (assumed, flagging as decision #2)

- **JS/TS workspace manager:** `pnpm` workspaces + `Turborepo` for build caching and task orchestration across `apps/` and `packages/`. Alternative would be Nx — more powerful but heavier learning curve for solo-founder velocity; pnpm+Turbo is the lighter, faster-to-adopt choice.
- **Rust workspace:** single `Cargo.toml` workspace at root, `services/api-core` as the main binary crate, shared logic in a `crates/` lib crate.
- **CI:** GitHub Actions — lint/typecheck/test on PR, matched to your GitHub-first workflow.

---

## 8. Open Decisions Requiring Sign-Off

1. **Modular monolith vs. microservices for `services/`** — I'm recommending one Axum binary with internal module boundaries (§3) rather than splitting sync/notifications out now. Confirm or override.
2. **pnpm + Turborepo vs. Nx** — recommending the lighter option (§7). Confirm or override.
3. **Scaffold-only folders for `amob/` and `web-app/`** — confirm you want empty-but-present folders now (keeps repo shape honest to the 5-surface architecture) vs. leaving them out entirely until post-MVP build starts.

Once you sign off on these three, I can generate the actual root config files (`pnpm-workspace.yaml`, `turbo.json`, `Cargo.toml`, base `tsconfig`/`eslint` in `packages/config`) and the first real scaffold for `core-desktop` + `api-core` — matching the [PHASE X] output format from the system prompt, Phase 1 only.
