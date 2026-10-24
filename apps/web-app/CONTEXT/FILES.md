# Web App — File & Folder Manifest

apps/web-app/
├── CONTEXT/
│   ├── AGENT_HANDOFF.md
│   ├── DESIGN.md
│   ├── FILES.md
│   ├── FOUNDATION.md
│   ├── GOTCHAS.md
│   └── PROGRESS.md
├── app/
│   ├── layout.tsx                    [new] Shared root layout (fonts, metadata, html lang)
│   ├── (company)/
│   │   ├── layout.tsx                [new] Company group layout (SiteHeader + main + SiteFooter)
│   │   ├── page.tsx                  [new] Company landing page (composes CompanyHero → FeatureRows → TrustedBy)
│   │   ├── about/page.tsx            [new] Stub page
│   │   ├── blog/page.tsx             [new] Stub page
│   │   ├── pricing/page.tsx          [new] Stub page
│   │   ├── products/page.tsx         [new] Stub page
│   │   ├── publications/page.tsx     [new] Stub page
│   │   └── services/page.tsx         [new] Stub page
│   └── core-site/
│       └── page.tsx                  [new] Core site stub page
├── components/
│   ├── company/
│   │   ├── CompanyFooter.tsx         [existing]
│   │   ├── CompanyHeader.tsx         [existing]
│   │   ├── FeatureZigZagRows.tsx     [new] Feature rows component
│   │   └── TrustedBySection.tsx      [new] Trusted By 4-slot component & tests
│   ├── layout/
│   │   ├── app-launcher-menu.tsx     [new] App launcher dropdown tools grid
│   │   ├── login-button.tsx          [new] Orange login action button
│   │   ├── logo-slot.tsx             [new] Brand logo slot
│   │   ├── mobile-menu.tsx           [new] Responsive mobile menu
│   │   ├── nav-links.tsx             [new] Title case nav links with active state
│   │   ├── nav-links.test.ts         [new] Active path tests
│   │   ├── site-footer.tsx           [new] Large rounded outlined container footer & newsletter validation
│   │   └── site-footer.test.tsx      [new] Newsletter validation tests
│   └── sections/
│       ├── home/
│       │   ├── CompanyHero.tsx       [new] Staggered overlapping hero cards
│       │   ├── CompanyHero.test.tsx  [new] Hero unit tests
│       │   ├── HeroCard.tsx          [new] Hero individual card
│       │   └── HeroCardCta.tsx       [new] Hero card CTA button
│       └── trusted-by.tsx            [new] Trusted by wrapper
├── mock-data/
│   ├── hero.ts                       [new] Hero mock data
│   ├── navigation.ts                 [new] Navigation links mock data
│   └── trusted-partners.ts           [new] Trusted partners mock data
├── proxy.ts                          [new] Host-based multi-tenant routing resolver middleware
├── proxy.test.ts                     [new] Routing unit tests
├── package.json                      [existing]
├── next.config.ts                    [existing]
└── tsconfig.json                     [existing]
