# Web App — Known Gotchas

Things that will bite you if you assume instead of checking.

1. **Nested workspace file.** `apps/web-app/pnpm-workspace.yaml` was left behind
   by the initial scaffold. Only the root `pnpm-workspace.yaml` should exist.
   Remove it (Task 0) — otherwise `packages/*` won't resolve as workspace deps.

2. **design-tokens is light-theme only, today.** `packages/design-tokens`
   currently defines a light theme (`Surface #F8FAFB`) built for core-desktop.
   There is no dark/skeuomorphic theme yet — it must be ADDED as a new theme
   alongside the existing one, never overwritten. Don't assume dark tokens
   exist; check before importing.

3. **Tailwind version unknown until verified.** `apps/web-app` has no
   `tailwind.config.*` file, consistent with Tailwind v4's CSS-first `@theme`
   approach — but this hasn't been confirmed against what `design-tokens` or
   `ui-components` actually assume. Check the `tailwindcss` version in each
   package's `package.json` before wiring tokens in; don't assume they match.

4. **ui-components was built for core-desktop (Vite, client-only React).**
   Components there may have zero `"use client"` directives and may assume
   browser globals (`window`, `localStorage`) exist unconditionally. Before
   importing one into web-app, check whether it needs a `"use client"`
   boundary or a guard — don't assume it's portable as-is.

5. **`packages/api-client` and `packages/i18n` are empty.** There is nothing to
   import from them yet. Don't reference them; use `mock-data/` instead.

6. **`turbo.json` has no tasks for `web-app` yet.** Don't assume `build`/`dev`/
   `lint` are wired — add them (Task 0) and verify.

7. **Reference screenshots contain design-tool chrome, not UI.** The purple
   "path" label, the "X: ___px / Y: ___px" readout box, and the crosshair
   cursor icon are Figma/prototyping artifacts. Do not implement them.

8. **Only Home is fully designed.** Products/Services/Blog/About intentionally
   have no real content yet — just header + footer + a placeholder block (or,
   for Blog/About, one extra element per DESIGN.md). Don't invent content to
   fill them in.

9. **No backend exists.** Sign Up, search, and newsletter-subscribe must never
   attempt a real network call. Stub with `console.log` or a disabled state.

10. **Stray root-level files** (`desktop.ini`, an empty `v/` folder) are
    accidental, outside `apps/web-app`, and being cleaned up by the founder
    directly — not something the agent needs to touch.