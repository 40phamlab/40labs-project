# 40LabsCore — Design Tokens & Constants

Source of truth for the desktop application. The supplied Sales reference is now the canonical
visual direction for the whole desktop: dark, solid, tactile, compact, and skeuomorphic-inspired
without decorative hardware metaphors. Keep this aligned with `packages/design-tokens` and the
Tailwind v4 token sheet.

## Colors
| Token | Hex | Usage |
|---|---|---|
| `color-surface` | `#1A1A1A` | Application background/chrome |
| `color-surface-strong` | `#313131` | Main workspace shell |
| `color-panel` | `#4D4D4D` | Columns/panels/solid cards |
| `color-panel-strong` | `#494949` | Inner raised cards |
| `color-input` | `#666666` | Inputs/search bars |
| `color-field` | `#BDCCD4` | Information/detail fields |
| `color-primary` | `#39B54A` | Confirm/proceed/healthy/in-stock |
| `color-accent` | `#F7931E` | Active navigation/warnings/highlights |
| `color-danger` | `#EF4444` | Destructive/critical |
| `color-text` | `#D7D7D7` | Primary text |
| `color-text-muted` | `#A9A9A9` | Secondary text |
| `color-border` | `#606060` | Quiet separators |

Pure white is not used for page, panel, card, or input surfaces.

## Typography
- `font-heading`: Sora
- `font-ui`: Inter
- `font-mono`: JetBrains Mono for prices, quantities, codes, batches

## Radius
- `radius-card`: 12px
- `radius-input`: 8px
- pill: 999px

## Elevation — Solid Tactile / Claymorphism
The supplied Sales reference is built from solid color blocks and tactile depth. Use raised,
pressed, and inset shadow states. Do not use glassmorphism, gradient-heavy glossy surfaces, or
arbitrary local shadows.

- `elevation-raised`: `0 2px 0 #252525, 0 5px 10px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.05)`
- `elevation-hover`: `0 2px 0 #252525, 0 7px 14px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.06)`
- `elevation-pressed`: `inset 0 2px 3px rgba(0,0,0,.32), inset 0 -1px 0 rgba(255,255,255,.04)`
- `elevation-inset`: `inset 0 2px 4px rgba(0,0,0,.26), inset 0 -1px 0 rgba(255,255,255,.04)`

### Application rules
- Cards/panels: raised at rest; hover elevation only when interactive.
- Buttons: raised at rest → pressed on active; no scale/translate jump.
- Inputs/search/selects: inset elevation always.
- Maximum two shadow layers per element.
- Surfaces remain solid; depth comes from shadow and contrast.
- Green = confirm/proceed/healthy. Orange = active/warn/highlight. Never use both as the same semantic state.
