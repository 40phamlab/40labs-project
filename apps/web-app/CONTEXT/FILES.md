# Web App — File & Folder Manifest

Status legend: [existing/fix] needs correction · [existing/keep] fine as-is ·
[new] must be created.

apps/web-app/
├── CONTEXT/                          [new] this folder — read fully each session
│   ├── AGENT_HANDOFF.md              [new] mission, non-negotiables, done criteria
│   ├── GOTCHAS.md                    [new] known traps, check before assuming
│   ├── DESIGN.md                     [new] tokens, component specs, route map
│   ├── files.md                      [new] this file
│   └── PROGRESS.md                   [new] task checklist + log + open questions
├── app/
│   ├── layout.tsx                    [new] shared shell — imports site-header/footer
│   ├── page.tsx                      [new] Home — composes sections only, no markup
│   ├── products/page.tsx             [new]
│   ├── services/page.tsx             [new]
│   ├── blog/page.tsx                 [new]
│   └── about/page.tsx                [new]
├── components/
│   ├── layout/
│   │   ├── site-header.tsx           [new]
│   │   └── site-footer.tsx           [new]
│   └── sections/
│       ├── hero-search.tsx           [new]
│       ├── feature-cards.tsx         [new]
│       ├── tools-showcase.tsx        [new]
│       ├── trusted-by.tsx            [new]
│       └── placeholder-block.tsx     [new] reusable "coming soon" block
├── mock-data/
│   ├── trusted-partners.ts           [new]
│   ├── tools.ts                      [new]
│   └── feature-cards.ts              [new]
├── public/                           [existing/keep]
├── package.json                      [existing/fix — verify deps vs. root workspace]
├── next.config.ts                    [existing/keep, revisit for Vercel deploy later]
├── eslint.config.mjs                 [existing/keep for now — packages/config is empty]
├── postcss.config.mjs                [existing/keep]
├── tsconfig.json                     [existing/keep]
├── pnpm-workspace.yaml               [existing/fix — DELETE, see GOTCHAS.md #1]
├── PROGRESS.md                       [new — top-level progress, mirrors core-desktop]
└── README.md                         [existing/keep]

Anything generic enough for another surface to reuse (a base Button/Card
primitive, for example) belongs in packages/ui-components, NOT in this tree.

