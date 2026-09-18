# Web App — Known Gotchas

Things that will bite you if you assume instead of checking.

1. **Nested workspace file.** `apps/web-app/pnpm-workspace.yaml` was left behind
   by the initial scaffold. Only the root `pnpm-workspace.yaml` should exist.
   Remove it (Task 0) — otherwise `packages/*` won't resolve as workspace deps.

2. **Dark Theme Tokens are now available.** `packages/design-tokens`
   defines `darkTokens` alongside the original `tokens` (light theme). Use 
   `darkTokens` for the web app to match the skeuomorphic design spec.

3. **Shared Packages Specs.** Verified specifications for wiring:
   - `@40labs/ui-components`: `main: "src/index.ts"`, `types: "src/index.ts"`, `peerDependencies: { "react": "^19.0.0" }`.
   - `@40labs/design-tokens`: `main: "src/index.ts"`, `types: "src/index.ts"`, no peer deps.
   - `@40labs/types`: `main: "src/index.ts"`, `types: "src/index.ts"`, no peer deps.
   All three ship raw TypeScript source and MUST be added to `transpilePackages` in `next.config.ts`.

4. **ui-components was built for core-desktop (Vite, client-only React).**
   Components there have zero `"use client"` directives and may assume browser globals (`window`, `localStorage`) exist unconditionally. **Mandatory:** Wrap imports in a `"use client"` boundary or add the directive to the consuming file in `web-app`. Don't assume they are RSC-compatible.

5. **Tailwind version confirmation.** `apps/web-app` uses Tailwind v4 (`tailwindcss: "^4"` in `package.json`). `ui-components` also depends on `tailwindcss: "^4.3.3"` (via `core-desktop` usage) and uses the `@theme` approach. Wiring is confirmed.

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