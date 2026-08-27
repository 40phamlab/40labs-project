# 40LabsCore — Design Tokens & Constants

Source of truth for the desktop application. Keep this aligned with
`packages/design-tokens` and the Tailwind v4 token sheet.

## Colors
| Token | Hex | Usage |
|---|---|---|
| `color-primary` | `#16A34A` | Primary actions, brand, success states |
| `color-accent` | `#F97316` | Secondary actions, highlights, warnings |
| `color-danger` | `#EF4444` | Destructive actions, expired/critical |
| `color-surface` | `#F1F5F2` | Global light background |
| `color-surface-strong` | `#F8FAF8` | Elevated/content surfaces; never pure white |

Light mode is intentionally warm/soft rather than pure white. This palette
follows the reference UI direction while preserving 40Labs green/orange brand
semantics. Dark mode remains an explicit future design decision.

## Typography
| Token | Font | Usage |
|---|---|---|
| `font-heading` | Sora | Page titles, section headers |
| `font-ui` | Inter | Body text, labels, buttons |
| `font-mono` | JetBrains Mono | Prices, codes, batch/lot IDs, Business IDs |

## Radius
| Token | Value | Usage |
|---|---|---|
| `radius-card` | 18px | Cards, panels |
| `radius-input` | 14px | Inputs, buttons, chips |

## Status colors (semantic — do not invent new hexes)
| State | Token |
|---|---|
| In stock / healthy | `color-primary` |
| Low stock / warn | `color-accent` |
| Expired / critical | `color-danger` |
| Synced | `color-primary` |
| Sync pending | `color-accent` |
| Sync failed | `color-danger` |

## Language
Swahili (sw-TZ) is the product default; English is switchable secondary.
Every user-facing string should go through i18n as the feature is hardened.

## Elevation — "Clinical Claymorphism"

Direction: tactile, soft-dimensional UI — cards feel gently raised off the
surface, buttons feel pressable, inputs feel slightly recessed. Depth comes
from restrained shadow, not gradients or decorative skeuomorphism.

### Light mode
| Token | Usage |
|---|---|
| `elevation-flat` | Backgrounds and non-interactive containers |
| `elevation-raised` | Cards, panels, KPI tiles |
| `elevation-hover` | Interactive card/button hover |
| `elevation-pressed` | Active/pressed button state |
| `elevation-inset` | Inputs, search fields, selects |

### Application rules
- Cards/panels use `elevation-raised` at rest; interactive cards may use hover elevation.
- Buttons use raised → pressed shadow language without layout movement.
- Inputs/search/selects use inset elevation.
- Maximum two shadow layers per element.
- No pure-white page/card backgrounds; use `color-surface` or
  `color-surface-strong`.
- No gradient-heavy glossy surfaces.
