# styles/ - CSS Architecture

Styling patterns and responsive design system.

## File Organization

- **variables.css**: CSS custom properties (colors, sizes, spacing)
- **index.css**: Global styles and resets
- **app.css**: Viewer mode and challenge display
- **admin.css**: Admin panel specific styles
- **modal.css**: Modal dialog styles
- **utility.css**: Utility classes

## CSS Custom Properties

### Variable Naming
- Kebab-case with `--` prefix
- Semantic names: `--header-font-size`, `--primary-color`
- Scoped to `:root` for global access

### Core Variables (variables.css)
```css
:root {
    --header-font-size: 2.25rem;
    --challenge-font-size: 2rem;
    --card-padding: 1.5rem;
    --checkbox-size: calc(var(--challenge-font-size) * 0.9);
}
```

## Responsive Design (CRITICAL)

### Viewport Breakpoints

**Vertical Docks (width-based)**:
- `@media (max-width: 400px)`: Small vertical (320-400px)
- `@media (max-width: 320px)`: Extreme vertical (≤320px)

**Horizontal Docks (height-based)**:
- `@media (max-height: 350px)`: Small horizontal (250-350px)
- `@media (max-height: 250px)`: Extreme horizontal (≤250px)

### Progressive Scaling

**Font Sizes**:
- Header: 2.25rem → 1.25rem → 1rem
- Challenge text: 2rem → 1.1rem → 0.95rem → 0.9rem
- Admin labels: 14px → 12px → 11px → 10px

**Spacing**:
- Card padding: 1.5rem → 0.75rem → 0.5rem
- Element gaps: Proportional reduction at each breakpoint

**Interactive Elements**:
- Checkbox: Auto-calculated from font size
- Buttons: Maintain touch-friendly minimum sizes
- Color pickers: 60px → 50px → 45px → 40px

### Responsive Pattern

```css
/* Base (desktop/large OBS) */
:root {
    --header-font-size: 2.25rem;
}

/* Small vertical dock */
@media (max-width: 400px) {
    :root {
        --header-font-size: 1.25rem;
    }
}

/* Extreme vertical dock */
@media (max-width: 320px) {
    :root {
        --header-font-size: 1rem;
    }
}
```

## Key CSS Classes

### Layout
- `.card`: Main container with background/opacity
- `.challenge-list`: Challenge container
- `.challenge-container`: Individual challenge wrapper
- `.challenge-metadata`: Flexbox for amount/timer

### State Classes
- `.done`: Completed challenge styling
- `.warning`: Timer warning state (≤2min)
- `.critical`: Timer critical state (≤30s)
- `.expired`: Timer expired state
- `.expanded`: Collapsible section open state

### Component Classes
- `.checkbox-wrapper`: Checkbox container
- `.checkbox-custom`: Styled checkbox
- `.challenge-title`: Challenge title text
- `.challenge-description`: Challenge description
- `.timer-display`: Timer countdown display
- `.edit-icon`: Edit button (admin only)

### Admin Panel
- `.admin-panel`: Panel container
- `.collapsible-section`: Collapsible section wrapper
- `.collapsible-header`: Section header (clickable)
- `.collapsible-content`: Section content (expandable)
- `.color-pickers-container`: Color picker group

## Dynamic Styling

### Overlay Background Opacity
Applied via inline styles in `UIUpdateHandler`:

```typescript
const rgba = combineColorWithOpacity(hexColor, opacity);
challengeCard.style.backgroundColor = rgba;
challengeCard.classList.add(CSS_CLASSES.CUSTOM_OVERLAY_BACKGROUND);
```

### Challenge Row Colors
Three tiers (primary, secondary, tertiary) with opacity control:
- Applied by index: `index % 3` determines tier
- Colors from ConfigManager
- Opacity applied at render time

## Accessibility

- **ARIA labels**: All interactive elements
- **Keyboard navigation**: Focus styles, tab order
- **Color contrast**: WCAG AA compliance
- **Screen readers**: Semantic HTML, ARIA attributes

## Performance

- **CSS variables**: Efficient theme switching
- **Transform animations**: Hardware accelerated
- **Will-change**: For animated properties
- **Contain**: Layout containment where appropriate
