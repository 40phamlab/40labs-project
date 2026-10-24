# Web App — Design Reference (Shipped Specification)

## Direction
Skeuomorphic, dark theme. Deep near-black background; emerald green surfaces with real depth (soft gradients, subtle inset/outer shadows, glossy highlight on pills/cards); orange accent on wordmark lettering and login actions.

## Shipped Architecture & Components

**Header (`SiteHeader`)** — full-width pill, rounded border, glass scroll transition. Title Case navigation links: `Home`, `Products`, `Blog`, `Pricing`, `Publications`, `About`. Active link = green highlight (`#16A34A`), weight 600; inactive = muted text. Separate orange `Log In` button (`#F97316`), App Launcher grid menu dropdown, and responsive mobile menu drawer.

**Landing Page (`app/(company)/page.tsx`)** — Composed strictly of:
1. `CompanyHero` — 3 staggered overlapping cards (orange, emerald, white) with verified mock copy and interactive CTAs.
2. `FeatureRows` (`FeatureZigZagRows`) — 3-row zig-zag feature showcase with image slots and orange accent block.
3. `TrustedBySection` (`TrustedBy`) — 4 outlined rounded logo slots in a row (`4 across at ≥md, 2×2 at <md`), rendering optional logo images or empty outlined slots without fake company names.

**Footer (`SiteFooter`)** — Large rounded outlined container (`rounded-[32px]`) containing 4 link columns and newsletter input with robust client-side sanitization, validation, accessible label & error text, and `console.log` submission stub.

## Route Map (Shipped)
| Route | Header | Footer | Content |
|---|---|---|---|
| `/` (company root) | ✓ (`SiteHeader`) | ✓ (`SiteFooter`) | CompanyLandingPage (`CompanyHero` → `FeatureRows` → `TrustedBy`) |
| `/products` | ✓ | ✓ | PlaceholderBlock stub |
| `/services` | ✓ | ✓ | PlaceholderBlock stub |
| `/pricing` | ✓ | ✓ | PlaceholderBlock stub |
| `/publications` | ✓ | ✓ | PlaceholderBlock stub |
| `/blog` | ✓ | ✓ | PlaceholderBlock stub |
| `/about` | ✓ | ✓ | PlaceholderBlock stub |
| `/core-site` | ✓ (Core) | ✓ (Core) | Core site stub |

`app/(company)/layout.tsx` and `app/layout.tsx` own the shared header/footer shell.
