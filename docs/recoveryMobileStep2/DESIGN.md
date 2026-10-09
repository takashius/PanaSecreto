---
name: PanaSecreto Mobile
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f1ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f3'
  surface-container-highest: '#e5e0ed'
  on-surface: '#1c1b24'
  on-surface-variant: '#49454e'
  inverse-surface: '#312f39'
  inverse-on-surface: '#f3effc'
  outline: '#7a757e'
  outline-variant: '#cac4ce'
  surface-tint: '#645881'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#20153a'
  on-primary-container: '#8a7da9'
  inverse-primary: '#cebfef'
  secondary: '#815600'
  on-secondary: '#ffffff'
  secondary-container: '#feae10'
  on-secondary-container: '#6a4600'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001e2e'
  on-tertiary-container: '#2b8cbd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cebfef'
  on-primary-fixed: '#20153a'
  on-primary-fixed-variant: '#4c4068'
  secondary-fixed: '#ffddb1'
  secondary-fixed-dim: '#ffba49'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#624000'
  tertiary-fixed: '#c7e7ff'
  tertiary-fixed-dim: '#84cfff'
  on-tertiary-fixed: '#001e2e'
  on-tertiary-fixed-variant: '#004c6c'
  background: '#fcf8ff'
  on-background: '#1c1b24'
  surface-variant: '#e5e0ed'
typography:
  display:
    fontFamily: Epilogue
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Epilogue
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Epilogue
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system blends lively Venezuelan cultural celebration with the polished tactile precision of contemporary mobile consumer tech. Designed for cross-platform iOS and Android experiences, it translates the spirit of "Amigo Secreto" (Secret Santa) into an engaging, confidential, and festive ritual.

### Emotional Persona & Identity
- **Pana & Parranda:** Warm, inclusive, and witty. Capturing the warmth of family gaitas, holiday gatherings, and authentic camaraderie.
- **Mischievous Mystery:** Anonymous matchmaking, sealed yellow envelopes, playful interrogations, and dramatic reveal countdowns.
- **Modern Polish:** Fluid interactions, crisp visual containment, ergonomic thumb-zone controls, and clean typography that prevent festive themes from degrading into kitsch.

### Mascot Integration
The mascot—an expressive Guacamaya sporting a tricolor cap, cool sunglasses, and clutching a sealed golden envelope—serves as the master of ceremonies. The character anchors empty states, celebration lotties, progress checks, onboarding reveals, and push banners, establishing an instant narrative hook.

## Colors

The palette balances nocturnal intrigue with tropical, high-energy accents drawn directly from Venezuelan holiday folklore and biodiversity:

- **Primary (`#1E1338` - Morado Noche):** Deep midnight purple anchoring master headers, floating tab bars, confidential drawer overlays, and premium states. Replaces harsh blacks with rich mystery.
- **Accent / Interactive (`#F7A800` - Amarillo Araguaney):** Vibrant golden yellow reserved for primary high-intent action buttons, interactive envelope seals, active toggle states, and celebration highlights.
- **Secondary (`#1D84B5` - Azul Caribe):** Crisp Caribbean blue applied to wishlist chips, auxiliary filters, informational badges, gift registry links, and secondary interactive paths.
- **Alert / Urgency (`#D62828` - Rojo Guacamaya):** Tropical crimson designated for countdown tickers, deadline warnings, exclusions, and destructive actions.
- **Scaffold & Surfaces:**
  - Background: `#F8F9FA` (Hueso Suave) provides a clean, eye-resting app canvas.
  - Surface Containers: `#FFFFFF` (Blanco Puro) for cards, bottom sheets, and elevated overlays.
- **Text & Contrast:** `#1C1B24` (Carbón Lente) guarantees AAA compliance on light surfaces, while `#8E8B99` handles muted labels and helper cues.

## Typography

The type system pairs **Epilogue**—a geometric display face packed with charisma and buoyant rhythm—with **Inter** for clean, readable utility.

- **Display & Headlines (Epilogue):** Chosen for its punchy personality, round proportions, and playful posture. It commands draw announcements, participant rosters, group titles, and mascot dialogue bubbles.
- **Body & Controls (Inter):** Neutral, hyper-legible, and performance-tuned. Manages anonymous messaging boards, gift links, setup forms, and system labels without cognitive strain.
- **Numbers & Monetary Values:** Rendered in tabular Inter or Epilogue bold weights to ensure budget limits (e.g., "$25 USD máx") remain distinct and structured across currency inputs.

## Layout & Spacing

The mobile layout adheres to an ergonomic thumb-first 4-to-8px spatial rhythm:

- **Margins & Safe Zones:** A base screen margin of `1.25rem` (20px) ensures content avoids bezel clipping on modern iOS dynamic islands and Android punch-hole notches. 
- **Component Padding:** Standard cards utilize `1rem` (16px) internal padding, while hero draw units and reveal envelopes scale to `1.5rem` (24px).
- **Navigation Bounds:** Floating tab bar anchors `1rem` above the bottom home indicator, floating cleanly over scrolling viewports with a subtle backdrop blur.
- **Vertical Rhythm:** Content chunks (e.g., Wishlist vs. Exclusion Rules vs. Anonymous Clues) are separated by `1.5rem` to `2rem` spacing intervals.

## Elevation & Depth

Visual hierarchy uses warm, tinted ambient drop shadows combined with layered white cards over the bone canvas (`#F8F9FA`):

- **Level 0 (Flat Scaffold):** Canvas background `#F8F9FA`.
- **Level 1 (Resting Cards & List Modules):** `#FFFFFF` with `box-shadow: 0 4px 16px -2px rgba(30, 19, 56, 0.06), 0 2px 6px -1px rgba(30, 19, 56, 0.03)`. Tinted softly with Morado Noche rather than neutral gray.
- **Level 2 (Interactive Floating Actions & Modals):** `box-shadow: 0 10px 24px -4px rgba(30, 19, 56, 0.12), 0 4px 10px -2px rgba(30, 19, 56, 0.06)`. Used for bottom sheets, draw envelopes, and active popovers.
- **Level 3 (Secret Reveal Envelope Overlay):** Glowing, tactile highlight with `0 14px 32px -4px rgba(247, 168, 0, 0.35)` to emphasize the moment of the draw.

## Shapes

The shape system adopts a friendly, tactile curvature (`roundedness: 2` base, reaching 16px–20px on cards):

- **Inputs, Buttons, and Chips:** Set to `12px` (0.75rem) or full pill (`9999px`) for chips and badges to invite direct interaction.
- **Cards, Draw Groups, and Modals:** Radii set between `16px` and `20px` to mirror the mascot’s curved aesthetic.
- **Envelopes and Mascot Dialogue Bubbles:** Feature asymmetric rounded corners (e.g., top-left, top-right, bottom-right 18px; bottom-left 4px) to convey dialogue and gift-wrapping characteristics.

## Components

### 1. Buttons
- **Primary CTA ("Sacar Papelito" / "Crear Grupo"):** Background `#F7A800`, text `#1E1338`, font Epilogue 600, height 52px, radius 14px, subtle tactile bottom border (`#D99300` 2px).
- **Secondary Action:** Ghost or soft Morado surface (`#1E1338` with 8% opacity), text `#1E1338`, font Inter 600.
- **Destructive Action:** Text `#D62828`, border `#D62828` 1px, or filled `#D62828` for final exclusions.

### 2. Envelope Card (Amigo Secreto Reveal)
- Golden yellow card (`#F7A800`) textured with subtle confetti micro-dots.
- Sealed with an interactive Morado wax-seal badge featuring the Guacamaya glasses icon.
- Tap-to-break seal haptic interaction with animated slide-up card revealing the assigned person.

### 3. Anonymous Chat Bubbles
- **Secret Santa (Sender):** Morado Noche (`#1E1338`) background with white typography and a small masquerade mask icon next to the timestamp.
- **Recipient:** Clean white (`#FFFFFF`) card with `#1C1B24` text and soft Level 1 shadow.

### 4. Chips & Wishlist Tags
- Height 32px, rounded pill (9999px), background `#EAF4F9`, text `#1D84B5`, active state switches to solid Azul Caribe with white copy.

### 5. Input Fields & Amount Selectors
- Background `#FFFFFF`, border 1.5px solid `#E4E3EA`, focus border 2px solid `#1E1338`.
- Helper text in `#8E8B99`. Currency inputs feature fixed `#F7A800` currency badges.

### 6. Empty States & Mascot Integration
- Centered layout containing a 140px Guacamaya illustration holding the secret envelope.
- Epilogue 20px bold heading, friendly instructional body copy, and a primary CTA within reach of the user's thumb.