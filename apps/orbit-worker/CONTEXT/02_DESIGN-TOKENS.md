# 02 — Orbit Design Tokens (Claymorphism, dark + light)

Source of truth for values: `packages/design-tokens/src/*.ts` (shared with desktop). This file defines how they map onto React Native and what is Orbit-specific. The mockups are structure and layout references only: do not sample their gray pixels as colors; map each surface to a token by role.

## Direction
Soft, solid, tactile. Depth comes from shadow and contrast, never from gradients, glass, hardware metaphors (screws, textures), or decorative icons. Max 2 shadow layers per element. Matches desktop rules (apps/core-desktop/CONTEXT/02-DESIGN-TOKENS.md).

## Typography
Sora (headings, screen titles), Inter (UI text), JetBrains Mono (quantities, prices, batch/codes, counts on Today card). Bundle fonts in the app (offline); loading them is an ask-first dependency decision. Minimum body size 14; touch targets at least 48x48 dp.

## Radius
Card 12, input 8, pill 999 (chips, FAB, status chips). Tiles on Home use card radius.

## Color roles (dark, from desktop tokens)
| Role | Token | Hex | Mockup element it maps to |
|---|---|---|---|
| Screen background | color-surface-strong | #313131 | Phone screen body |
| App chrome / deepest | color-surface | #1A1A1A | FAB "New", pressed wells |
| Card / tile / bottom bar | color-panel / color-panel-strong | #4D4D4D / #494949 | Today card, action tiles, history rows, bottom bar |
| Input / chip (unselected) | color-input | #666666 | Filter chips, search fields |
| Primary text / muted | color-text / color-text-muted | #D7D7D7 / #A9A9A9 | Titles, labels |
| Accent | color-accent | #F7931E | Scan frame, "scan to connect", active tab, Active dot |
| Primary (confirm/healthy) | color-primary | #39B54A | Confirm buttons, success |
| Danger | color-danger | #EF4444 | Unread count dot, revoked, destructive |
| Border | color-border | #606060 | Quiet separators |
Green = confirm/proceed/healthy; orange = active/warn/highlight. Never use both for the same state. No pure white for any surface.

## Light theme: PROVISIONAL (not defined anywhere in the repo; requires Sairiamu's approval)
Add as `lightTokens` in `packages/design-tokens` (currently `darkTokens = tokens` and nothing else). Provisional values: surface #E4E9EC, surface-strong #EDF1F3, panel #F3F6F8, panel-strong #F7F9FA, input #DCE3E7, text #1F2A33, text-muted #55636E, border #C5CED4; accent, primary, danger unchanged. Verify contrast (text on panel at least 4.5:1; accent text on light only at 18sp+ or bold) before shipping.

## Elevation on React Native (verify before relying)
Desktop elevations are CSS box-shadows (raised, hover, pressed, inset). On native:
- Use the `boxShadow` style prop (New Architecture) for raised and inset (including `inset`) if the chosen Expo SDK's React Native version supports it; confirm in current RN docs for that version. Express the 2 layers as in desktop tokens, with light-theme counterparts (light highlight above, soft shadow below).
- Fallback if unsupported: iOS `shadow*` props + Android `elevation` for raised; for inset/pressed use a nested View with a darker background and an inner highlight border (still max 2 layers).
- Implement once as `useElevation('raised' | 'pressed' | 'inset')` returning a style object. Components never write shadow values.
States: card = raised at rest; Tile/Button = raised -> pressed on touch (shadow change only, no scale or translate jump); inputs and search fields = inset always; selected chip = pressed/inset + accent text; FAB = raised on surface color.

## Component notes from the mockups
- Status dot: 10dp circle + label, never a banner. Notification dot: red circle with count (cap "9+").
- Scan frame: 4 orange corner brackets (accent), solid 2dp scan line using accent at ~60% opacity. The mockup's white-to-gray gradient bar is a functional indicator only; do not introduce gradients elsewhere.
- Bottom bar: 4 raised icon buttons, active = accent icon + label, each with a text label (a11y + Swahili).
- FAB menu ("New"): pill FAB bottom right above the bar; opens a raised card with 4 rows; tap outside closes.
- Today card: 2x3 grid, label (muted) + value (JetBrains Mono).
- Disabled tile: pressed/inset look, muted text, lock glyph; tap shows a one-line "no access" message.

## Theme switching
Only dark/light (plus "follow system" is NOT included: locked decision is a dark/light toggle). Persist choice locally; default dark until light is approved. The toggle logic lives in one place (`src/theme`), used by Settings only.