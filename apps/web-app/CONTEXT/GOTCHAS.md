# Web App — Known Gotchas

Things that will bite you if you assume instead of checking.

1. **Nested workspace file.** `apps/web-app/pnpm-workspace.yaml` was left behind by initial scaffolds. Only the root `pnpm-workspace.yaml` should exist.

2. **Dark Theme Tokens & `darkTokens`.** `packages/design-tokens` defines `darkTokens` alongside original `tokens`. Use `darkTokens` for web-app to match skeuomorphic design spec.

3. **Shared Packages Specs & Transpilation.** `@40labs/ui-components`, `@40labs/design-tokens`, and `@40labs/types` ship raw TypeScript source and MUST be added to `transpilePackages` in `next.config.ts`.

4. **Client Components in UI Components.** `ui-components` was built for Vite/core-desktop (client-only React) and may assume browser globals. Wrap imports in `"use client"` boundaries or add the directive when consuming in `web-app`.

5. **i18n Packages Status.** `@40labs/i18n` is fully present and provides translation/formatting infrastructure (with passing unit tests in its package), whereas initial stubs were minimal. Use or configure i18n where required, falling back to mock data or i18n utils as appropriate.

6. **Host-Based Routing (`proxy.ts`) & Route Groups.** Next.js route groups (`app/(company)/`) help organize layout grouping, but route groups sharing the root path `/` alongside other top-level routes (like `app/core-site/`) require host-based middleware proxying (`proxy.ts`) to correctly route `core.40labs.com` vs `40labs.com` to the respective subtree.

7. **Reference screenshots contain design-tool chrome, not UI.** The purple "path" label, "X: ___px / Y: ___px" readout boxes, and crosshair cursor are Figma/prototyping artifacts. Do not implement them.

8. **No backend exists.** Sign Up, search, and newsletter-subscribe must never attempt real network calls. Stub with `console.log` or a disabled state.
