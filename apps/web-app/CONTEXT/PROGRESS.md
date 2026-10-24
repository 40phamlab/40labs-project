# Web App — Progress Log

- [x] `CompanyHero` & Overlapping Hero Cards: 3 staggered overlapping cards (`CompanyHero.tsx`, `HeroCard.tsx`, `HeroCardCta.tsx`, `mock-data/hero.ts`).
- [x] `FeatureRows` / `FeatureZigZagRows`: 3-row feature zig-zag showcase with placeholder image slots and orange accent block.
- [x] `TrustedBySection`: 4 outlined rounded logo slots in a row (`4 across at ≥md, 2×2 at <md`), handling optional `logoUrl` and decorative empty outlined slots without fake company names.
- [x] `SiteHeader`: Modular navigation header (`logo-slot.tsx`, `nav-links.tsx`, `login-button.tsx`, `mobile-menu.tsx`, `app-launcher-menu.tsx`) with Title Case nav links, active path matching, and App Launcher dropdown.
- [x] `SiteFooter`: Large rounded outlined container (`rounded-[32px]`) with 4 link columns and newsletter input featuring client-side sanitization, validation, accessible label & error text, and `console.log` submission stub.
- [x] Routing & Proxy: Host-based routing middleware/proxy (`proxy.ts`) supporting `core.40labs.com` vs `40labs.com`, structured route groups `app/(company)/` and `app/core-site/`.
- [x] Unit Testing & Build: Complete test suite (proxy, nav-links, CompanyHero, TrustedBySection, site-footer newsletter validation) passing successfully with 0 errors/warnings and successful Next.js production build.

## Log
(2026-09-19) — Initial setup and repo hygiene.
(2026-03-31) — Established visual/structural foundation and `darkTokens`.
(2026-04-01) — Rebuilt modular `SiteHeader`, navigation links, active states, and stubs.
(2026-04-01) — Implemented `CompanyHero` with 3 staggered overlapping cards and unit tests.
(2026-04-01) — Rebuilt `TrustedBySection` (4 logo slots) and restyled `SiteFooter` as the large rounded outlined container with newsletter validation.
(2026-04-01) — Wired landing page (`app/(company)/page.tsx`) to compose `CompanyHero` → `FeatureRows` → `TrustedBy`. Verified clean lint, typecheck, and Next.js production build.

## Open questions & Token Todos
- Token-match TODOs: Several components (`CompanyHeader`, `CompanyFooter`, `FeatureZigZagRows`, `HeroOverlapCards`, `HeroCard`) currently use inline hex/rgb styles (`#16A34A`, `#F97316`, `#1F2A33`, `#B6C2CC`, etc.). These should be refactored to consume `darkTokens` or CSS variables directly when global token variables are fully expanded.
- Mock copy typos flagged: `"meet with Your patients Easily & Remotely"`, `"Deliver your most best service"`, `"Do more with us!!"`, and duplicate `"Manage"` heading in design artboard (rendered once per requirements).
