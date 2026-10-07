# 40Labs Public Website — Visual & Structural Foundation

This document establishes the official visual and structural foundation for the 40Labs public website (`apps/web-app`), ensuring a serious, premium, technological healthcare platform aesthetic.

---

## 1. Global Typography Hierarchy
- **Headings (Sora)**: Used for page titles, hero headers, and major section titles. Clean geometric structure with tight letter spacing (`-0.02em`).
  - Hero Title (`web-title-hero`): `clamp(2.5rem, 5vw, 4rem)`, font-weight 700, line-height 1.1.
  - Section Title (`web-title-section`): `clamp(1.75rem, 3vw, 2.5rem)`, font-weight 600, line-height 1.2.
- **Body & UI (Inter)**: Used for body paragraphs, descriptions, and UI controls.
  - Body (`web-body`): `1rem`, line-height 1.6, color `--color-text-secondary`.
  - UI Small / Muted labels.
- **Numeric & Metrics (JetBrains Mono)**: Used for codes, pricing, lots, and tabular data.

---

## 2. Consistent Spacing & Layout Rules
- Built on a dense **4px base grid** scale.
- Standard spacing tokens: `3xs` (2px), `2xs` (4px), `xs` (6px), `sm` (8px), `md` (12px), `lg` (16px), `xl` (20px), `2xl` (24px), `3xl` (32px), `4xl` (40px), `5xl` (48px).
- Generous padding and separation between major landing page sections (`pb-24`, `py-16` / `py-24`).

---

## 3. Container & Max-Width Rules
- Unified `.web-container` utility class:
  - Max-width: `1280px` (`max-w-7xl`).
  - Centered (`mx-auto`).
  - Responsive padding: `px-4` on mobile, `px-6` on tablet (`sm`), `px-8` on desktop (`lg`).

---

## 4. Surface & Card Rules
- **Environment**: Deep near-black graphite background (`#0B0F0D`).
- **Cards (`.web-card`)**:
  - Background: `--color-surface-primary` (`#1A221E`).
  - Border: `--color-border-default` (`#28362E`).
  - Radius: `--radius-card-lg` (`16px`).
  - Depth: Skeuomorphic outer drop shadow (`--shadow-skeu-outer`) combined with a top glossy inset highlight (`--shadow-skeu-inset`).
- **Pills (`.web-pill`)**:
  - Used for headers, search inputs, badges, and primary action bars (`--radius-pill`: `9999px`).

---

## 5. Border, Radius & Shadow Rules
- **Borders**: Subtle dividers (`#243029`), default borders (`#28362E`), active/focus borders (`#16A34A` brand green).
- **Radius**: `radius-card` (8px), `radius-card-lg` (16px), `radius-pill` (9999px).
- **Shadows**:
  - `shadow-skeu-outer`: `0 4px 12px rgba(0, 0, 0, 0.45)`
  - `shadow-skeu-inset`: `inset 0 1px 0 rgba(255, 255, 255, 0.12)`

---

## 6. Hover, Focus & Active States
- **Transitions**: Smooth transitions across properties (`transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1)`).
- **Hover**: Cards and interactive elements elevate borders to `--color-border-focus` (`#16A34A`) with enhanced drop shadow.
- **Focus**: Accessible focus rings (`focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] outline-none`).
- **Active**: Tactile press feedback (`scale(0.98)`).

---

## 7. Responsive Breakpoints
- Standard Tailwind breakpoints adhered to:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px

---

## 8. Dark-Theme Color Hierarchy
- **Primary Environment**: `#0B0F0D` (Graphite black)
- **Raised Surfaces / Accents**: `#14532D` (Deep emerald), `#16A34A` (Brand green highlight)
- **Intelligence / Action Accent**: `#F97316` (Secondary orange accent for wordmarks and active items)
- **Text Hierarchy**:
  - Primary text: `#F8FAFB` (`--color-text-primary`)
  - Secondary text: `#CBD5E1` (`--color-text-secondary`)
  - Muted text: `rgba(248, 250, 251, 0.6)` (`--text-on-dark-muted`)

---

## 9. Animation Timing & Easing Conventions
- Standard easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Standard duration: `200ms` for micro-interactions, `300ms` for layout transitions.
- Marquee and reveal effects integrated with pause-on-hover capabilities.

---

## 10. Accessibility & Reduced-Motion Behavior
- **Contrast**: WCAG AA/AAA compliant high-contrast text ratios on dark surfaces.
- **Focus Visibility**: Explicit outline rings on keyboard navigation.
- **Reduced Motion**: Full support for `@media (prefers-reduced-motion: reduce)`, disabling non-essential animations and transitions for sensitive users.
