# 40LabsCore — Coding Conventions

## TypeScript
- Strict mode always. No `any`. No implicit returns on complex functions.
- Import shared entity types from `packages/types` — never redefine inline.

## Rust (services/api-core, referenced from this app via packages/api-client)
- Async, `Result<>` error propagation. No `unwrap()` in production paths.

## Components
- Small, single-responsibility, composable. No 400-line files.
- Design tokens applied exactly per 02-DESIGN-TOKENS.md — no inline hex,
  no inline font-family, no ad-hoc radius values.

## Naming
- Feature folders match SPEC file names (e.g. `features/lab/` ↔ `SPEC/lab-module.md`)
- API hooks: `use[Entity][Action]` e.g. `useCreateSale`, `useInventoryList`

## Phase tagging (mandatory on every new file)
Every new component/screen file starts with a header comment:

// [PHASE: MVP | POST-MVP | DEFERRED]
// [SPEC: CONTEXT/SPEC/<file>.md]

Do not build POST-MVP or DEFERRED screens against real data bindings —
mock/static only, clearly marked, if built at all before their phase.

## Never (carried from system prompt, restated here for the coding agent)
- Never skip the offline-first check
- Never implement a PIN-gated action without the server-side check
- Never duplicate Customer/Medicine/Inventory records per module
- Never produce boilerplate filler — mark TODOs with `[reason] [phase]`