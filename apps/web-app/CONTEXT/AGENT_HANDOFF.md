# Web App — Agent Handoff

Read this first, every session, before writing any code. Then read GOTCHAS.md,
DESIGN.md, and files.md in that order. PROGRESS.md tells you what's already done.

## Mission
The public-facing surface of 40Labs — patients, pharmacies, suppliers eventually
transact here. Right now: pre-MVP placeholder UI only. No backend, no auth, no
live API. Purpose today is to exist as a real, polished holding page — a place
to point people while 40LabsCore/Orbit Worker/Admin (the actual MVP) get built,
and a download point for the core desktop app.

## Non-negotiables
1. Shared UI → `@40labs/ui-components`. Shared tokens → `@40labs/design-tokens`.
   Shared types → `@40labs/types`. Never fork or duplicate these locally.
2. If a component belongs in `packages/ui-components` (generic, reusable by
   admin-web/amob later) but doesn't exist yet — build it there, import it here.
   App-specific composition only lives in `apps/web-app`.
3. No hardcoded color/spacing/font values anywhere in `apps/web-app`. If a token
   is missing, add it to `packages/design-tokens` first.
4. One component per file. Split anything past ~150 lines.
5. Server Components by default. `"use client"` only on the smallest leaf that
   truly needs it (state, event handlers, browser APIs).
6. No secrets/keys committed, even placeholders.
7. Sanitize all user input, even on inert placeholder forms.
8. Never touch other apps' folders. Cross-surface code only via `packages/`.

## Definition of done for the current milestone
- Home (`/`) visually matches the reference design: header, hero+search, 3
  feature cards, tools showcase, trusted-by, footer.
- `/products`, `/services`, `/blog`, `/about` render the shared header/footer
  + the correct placeholder pattern for each (see DESIGN.md route map).
- Zero hardcoded hex/px values outside `packages/design-tokens`.
- `pnpm --filter web-app build` and `lint` both pass clean.
- PROGRESS.md updated with what was done.

## If something isn't covered here
Do not guess and proceed silently. Add it to the "Open questions" section at
the bottom of PROGRESS.md and make the smallest reasonable placeholder choice,
clearly marked, so it's easy to find and revisit.