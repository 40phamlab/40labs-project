# Web App — Design Reference

## Direction
Skeuomorphic, dark theme. Deep near-black background; emerald green surfaces
with real depth (soft gradients, subtle inset/outer shadows, glossy highlight
on pills/cards); orange accent on wordmark lettering.

## Proposed token values (add to packages/design-tokens as a new dark theme —
these are starting values to keep the agent from inventing its own; confirm/
adjust once reviewed, don't treat as final)

- `--surface-dark-bg: #0B0F0D` — page background
- `--surface-dark-raised: #14532D` — card/pill base fill (deep emerald)
- `--surface-dark-highlight: #16A34A` — existing brand green, reused for active
  states and borders
- `--accent-orange: #F97316` — existing token, reused for wordmark/active nav text
- `--text-on-dark: #F8FAFB` — primary text on dark surfaces
- `--text-on-dark-muted: rgba(248,250,251,0.6)` — inactive nav links, placeholders
- `--shadow-skeu-outer: 0 4px 12px rgba(0,0,0,0.45)` — card/pill drop shadow
- `--shadow-skeu-inset: inset 0 1px 0 rgba(255,255,255,0.12)` — glossy top edge
- `--radius-pill: 9999px`, `--radius-card: 16px`

## Component specs (from reference screenshots)

**Header** — full-width pill, `--radius-pill`, `--surface-dark-highlight` fill,
~64px tall (h-16). Nav links: Home/Products/Services/Articles/Blog/About. Active link
= orange (`--accent-orange`), weight 600; inactive = `--text-on-dark-muted`.
Right side actions: small icon buttons + a dark pill "Sign Up" button.
- Sign Up button: h-10 (40px), px-5, text-sm, font-semibold, dark fill.
- Positioning: Sign Up button is flush right; 12px (gap-3) between action items; 
  32px (ml-8) gap between nav links group and actions group.
- App Launcher: Grid icon button (LayoutGrid) to the left of Sign Up. Opens a 
  dropdown grid of tool tiles. Dropdown styled with `--surface-dark-bg`, 
  `--radius-card`, and `--shadow-skeu-outer`.
- Vertically centered on the same baseline as nav links.

**Hero + search** — centered "40Labs" wordmark ("40" orange, "Labs" white),
below it a full-width pill search input (dark fill, placeholder "search...",
disabled/no-op), below that a small muted label "Access via: Swahili".

**Feature cards** — 3-column grid, gap 24px, `--radius-card`, filled with
`--surface-dark-highlight`, white centered label text, `--shadow-skeu-outer`.
Labels: "Med Product Suppliers", "e-Pharmacy", "Health Blog".

**Tools showcase** — heading "Get Best Of Our Tools" + 3 outlined ghost pills
(dark fill, green border, `--radius-pill`): "40LabsCore", "vLabs", "aDesk" —
each label's first character in orange, rest in white/muted.

**Trusted by** — heading "Trusted By" + 2–3 overlapping stacked cards
(`--radius-card`, outlined, empty for now — real logos come later).

**Footer** — `--surface-dark-highlight` background, 4 link columns (placeholder
groups for now), newsletter input (dark pill, placeholder "subscribe to our
news letter") + black "Subscribe" pill button (client-side no-op, console.log
on submit).

## Route map (design coverage)
| Route | Header | Footer | Content |
|---|---|---|---|
| `/` | ✓ | ✓ | Fully designed (all sections above) |
| `/products` | ✓ | ✓ | One `placeholder-block` only |
| `/services` | ✓ | ✓ | One `placeholder-block` only |
| `/blog` | ✓ | ✓ | Full-width search/filter pill + one `placeholder-block` |
| `/about` | ✓ | ✓ | 3-column "Related" row (empty labeled boxes) + one `placeholder-block` |

`app/layout.tsx` owns header/footer once — no page redefines them.