# styles/ - CSS Conventions (≤4000 chars)

High-level reference for styling the Twitch overlay. Keep styles lean, selector-driven, and aligned with TypeScript constants in `DOMConstants`.

## File Map

-   `variables.css` — design tokens (colors, spacing, typography)
-   `index.css` — resets + global base
-   `app.css` — viewer overlay + challenge rows
-   `admin.css` — admin panel layout/forms
-   `modal.css` — dialog layout + transitions
-   `utility.css` — helper classes (spacing, alignment)

## Core Rules

-   Always use CSS custom properties declared in `variables.css`; extend tokens instead of hardcoding raw values.
-   Selector strings must match constants from `CSS_CLASSES`/`CSS_SELECTORS`; never drift from TypeScript names.
-   Keep challenge row DOM split into:
    -   `.challenge-content-wrapper` (checkbox + text stack)
    -   `.challenge-actions` (secondary controls, same order in standard/text-only modes)
-   Maintain parity: color, hover/active states, and enabled buttons should be identical between standard and text-only admin layouts.
-   Use flexbox for row alignment; avoid absolute positioning to preserve responsive wrapping.

## Responsive System

-   Breakpoints target OBS docks:
    -   Width ≤400px (compact vertical)
    -   Width ≤320px (extreme vertical)
    -   Height ≤350px (compact horizontal)
    -   Height ≤250px (extreme horizontal)
-   Scale typography, padding, gap, and picker sizes proportionally; smallest breakpoint keeps controls touch-safe (>36px tap targets).
-   Derive checkbox size from `--challenge-font-size` (`--checkbox-size` custom property).

## Key Classes (abridged)

-   Layout: `.card`, `.challenge-list`, `.challenge-container`, `.challenge-metadata`
-   State: `.done`, `.warning`, `.critical`, `.expired`, `.expanded`
-   Components: `.checkbox-wrapper`, `.checkbox-custom`, `.challenge-content-wrapper`, `.challenge-actions`, `.challenge-title`, `.challenge-description`, `.timer-display`, `.edit-icon`
-   Admin panel: `.admin-panel`, `.collapsible-section`, `.collapsible-header`, `.collapsible-content`, `.color-pickers-container`

## Dynamic Styling Notes

-   Overlay background color = `combineColorWithOpacity` result stored inline + `CSS_CLASSES.CUSTOM_OVERLAY_BACKGROUND` flag.
-   Challenge row colors rotate primary/secondary/tertiary palettes based on `index % 3`; always apply opacity at render time.

## Accessibility & Performance

-   Every interactive element needs a visible focus style and matching ARIA label; ensure contrast meets WCAG AA.
-   Prefer transforms/opacity for animations; reserve `will-change` for frequently animated elements.
-   Keep styles modular—unused rules inflate bundle size. Prune when removing features.
