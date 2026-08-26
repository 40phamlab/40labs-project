# 40LabsCore — Design Tokens & Constants

Source of truth for now. Mirror into `packages/design-tokens` as real
exported constants once that package is scaffolded — do not let this
file and the real token file drift apart.

## Colors
| Token           | Hex       | Usage                                  |
|-----------------|-----------|-----------------------------------------|
| `color-primary`   | `#16A34A` | Primary actions, brand, success states |
| `color-accent`    | `#F97316` | Secondary actions, highlights, warnings |
| `color-danger`    | `#EF4444` | Destructive actions, expired/critical  |
| `color-surface`   | `#F8FAFB` | Light-mode background                  |

Dark mode: per-business toggle only (locked decision — no per-business
custom theming beyond dark/light). Dark surface palette is NOT finalized —
this is an open item (see PROGRESS.md). Do not hardcode a dark bg hex
until that's locked.

## Typography
| Token          | Font           | Usage                        |
|----------------|----------------|-------------------------------|
| `font-heading` | Sora           | Page titles, section headers |
| `font-ui`      | Inter          | Body text, labels, buttons   |
| `font-mono`    | JetBrains Mono | Prices, codes, batch/lot IDs, Business IDs |

## Radius
| Token           | Value | Usage              |
|-----------------|-------|---------------------|
| `radius-card`   | 12px  | Cards, panels        |
| `radius-input`  | 8px   | Inputs, buttons, chips |

## Status colors (semantic, map to color tokens above — don't invent new hexes)
| State              | Token             |
|--------------------|-------------------|
| In stock / healthy | `color-primary`   |
| Low stock / warn   | `color-accent`    |
| Expired / critical | `color-danger`    |
| Synced             | `color-primary` (dot, small, passive) |
| Sync pending       | `color-accent` (dot, small, passive)  |
| Sync failed        | `color-danger` (dot, small, passive)  |

Sync status is NEVER a blocking banner or modal — dot indicator only,
per offline-first trust principle in 01-ARCHITECTURE.md.

## Spacing scale
Use Tailwind's default scale (4px base unit) — no custom spacing tokens
unless a specific screen proves the default scale insufficient. Don't
invent a parallel spacing system.

## Iconography
Not yet locked. Flag in PROGRESS.md if a screen build is blocked on this.

## Language
Swahili (sw-TZ) is default; English is switchable secondary — per PRD
Goal 5 / Requirement P0-12. Every user-facing string goes through i18n
from the first component built, not retrofitted later. Do not hardcode
English strings "temporarily."

## Elevation — "Clinical Claymorphism"

Direction: tactile, soft-dimensional UI — cards feel gently raised off the
surface, buttons feel pressable, inputs feel slightly recessed ("carved in").
NOT literal skeuomorphism (no screws, rivets, panel texture, or hardware
metaphors) unless explicitly scoped to a specific component — see
GOTCHAS.md #8. This is restraint applied to depth, not flatness.

Depends on: dark-mode surface palette (PROGRESS.md #1) — shadow tone must
be computed against the actual dark background once locked. Light-mode
values below are final; dark-mode values are placeholders, flagged.

### Light mode (surface = #F8FAFB — locked)
| Token           | box-shadow value | Usage |
|------------------|-------------------|-------|
| `elevation-flat`    | `none` | Backgrounds, non-interactive containers |
| `elevation-raised`  | `0 1px 2px rgba(16,24,32,0.06), 0 4px 10px rgba(16,24,32,0.08), inset 0 1px 0 rgba(255,255,255,0.6)` | Cards, panels, KPI tiles — default resting state |
| `elevation-hover`   | `0 2px 4px rgba(16,24,32,0.08), 0 6px 16px rgba(16,24,32,0.10), inset 0 1px 0 rgba(255,255,255,0.7)` | Card/button hover — subtle lift, ~100ms transition |
| `elevation-pressed` | `inset 0 2px 4px rgba(16,24,32,0.15), inset 0 -1px 0 rgba(255,255,255,0.4)` | Active/pressed button state — shadow flips inward |
| `elevation-inset`   | `inset 0 1px 3px rgba(16,24,32,0.12), inset 0 -1px 0 rgba(255,255,255,0.5)` | Text inputs, search fields, selects — "carved in" |

### Dark mode (PLACEHOLDER — do not use until dark surface hex is locked)
Same shadow structure, but rgba base shifts from `rgba(16,24,32,...)` toward
a lighter/desaturated tone and the inset highlight uses a dimmer white
(`rgba(255,255,255,0.08–0.12)` range) so raised elements don't look blown
out on a dark background. Do not guess exact values — flag in PROGRESS.md
if a screen build is blocked on this specifically.

### Application rules
- Cards/panels: `elevation-raised` at rest, `elevation-hover` on hover only
  if interactive (clickable card), never on static display cards.
- Primary/secondary buttons: `elevation-raised` at rest → `elevation-pressed`
  on `:active`. Transition shadow only, not layout (no scale/translate jump).
- Inputs, search bars, selects: `elevation-inset` always — this is what
  visually distinguishes "you can type here" from "this is a display card"
  without relying on border color alone.
- Max 2 shadow layers per element. Do not stack elevation tokens.
- Danger/destructive buttons keep `elevation-raised`/`elevation-pressed`
  shape but use `color-danger` background — depth language is uniform
  across all button intents, only color changes.

### What we're explicitly NOT doing
No corner screws, no panel/metal texture, no terminal-style monospace
readouts outside their locked use (prices/codes/batch IDs per Typography
tokens), no gradient-heavy "glossy plastic" look. Depth comes from shadow
only — backgrounds stay flat `color-surface`, no background gradients
unless a specific component spec calls for one explicitly.