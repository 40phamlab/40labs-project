# Web App — Progress Log

## Milestone: 40labs.com Company Landing Page (landpage.ai design match)
- [x] Host-based routing proxy (`proxy.ts` routing `40labs.com` to `(company)` route group and `core.40labs.com` to `/core-site`)
- [x] Company route group (`app/(company)/layout.tsx`, `app/(company)/page.tsx`) with light blue-grey background (`#E4E9EC`)
- [x] `CompanyHeader`: rounded outlined nav bar, logo slot, nav links (Home, products, blog, pricing, publications, about), orange "logIn" button
- [x] `HeroOverlapCards`: 3 staggered overlapping cards (Orange Telemed, Deep-Green Management, White Insights) with pill CTA buttons
- [x] `FeatureZigZagRows`: 3 zig-zag feature rows with alternating image slots and orange accent block
- [x] `TrustedBySection`: heading + 4 outlined logo slots
- [x] `CompanyFooter`: large outlined rounded container footer shell with newsletter input
- [x] Font integration (`next/font/google` for Sora, Inter, JetBrains Mono)
- [x] Build, lint, and typecheck verified successfully (0 ESLint errors/warnings)

## Log
(2026-09-19) — Completed initial setup and repo hygiene. Wired shared packages (ui-components, design-tokens, types) with Next.js transpilation. Added dark/skeuomorphic theme tokens. Built shared shell (SiteHeader/SiteFooter) and Home page sections. Created stub pages for Products, Services, Blog, and About with placeholder content blocks. Verified build and workspace resolution. Implemented App Launcher Menu with dropdown tools grid.
(2026-03-31) — Established the complete visual and structural foundation for the 40Labs public website: added public web brand tokens to `@40labs/design-tokens` (colors, elevation, Tailwind bridge), refined `apps/web-app/app/globals.css` with layout, container, skeuomorphic surface/card classes, typography scales, responsive breakpoints, hover/focus/active state transitions, accessibility rules, and reduced-motion support. Created `apps/web-app/CONTEXT/FOUNDATION.md` detailing the 10 foundation pillars.
(2026-03-31) — Built professional website header and navigation (`SiteHeader`) featuring the 40Labs brand wordmark, ecosystem navigation structure (Platform, Solutions, Intelligence, Company), "Sign In" secondary action, "Get Started" primary CTA, App Launcher integration, responsive mobile drawer menu, and clean glass scroll transition states. Verified build passes clean.
(2026-03-31) — Fixed all ESLint errors and warnings across `apps/web-app` (0 errors, 0 warnings). Documented pre-existing `SheetViewer.tsx` type check failure in `packages/ui-components` per instructions.
(2026-04-01) — Rebuilt company `SiteHeader` matching design specs (rounded outlined nav bar, Title Case nav links: Home, Products, Blog, Pricing, Publications, About; separate orange "Log In" button; split into sub-components: `logo-slot.tsx`, `nav-links.tsx`, `login-button.tsx`, `mobile-menu.tsx`; navigation mock data in `mock-data/navigation.ts`). Added missing stub pages (`pricing`, `publications`) using `PlaceholderBlock`. Added active-link unit tests (`nav-links.test.ts`). Build, lint, and unit tests pass successfully.

## Open questions
(none)