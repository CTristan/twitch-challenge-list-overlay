# src/ - Source Code Patterns

Development patterns and guidelines for the source code directory.

## TypeScript Development

-   **All files**: TypeScript (`.ts` extension) with explicit type annotations
-   **Interfaces**: Define for complex objects, reuse across codebase
-   **Build**: Vite compiles to single `dist/challengeBot.iife.js` IIFE bundle
-   **Type Safety**: Explicit return types, prefer `interface` over `type`, strict null checks, optional chaining
-   **Style loader guardrails**: Clamp `styleLoader`'s admin control height to 1.2–2.0rem so challenge rows stay at or below admin action button height.

## File Organization

```
src/
├── backend/     # Non-visual services, stores, and adapters consumed by Svelte UI
├── frontend/    # Svelte components, entrypoints, and UI utilities
├── classes/     # Core business logic (AdminPanel, Challenge, ChallengeList, ConfigManager)
├── commands/    # Command pattern implementation (15+ command classes)
├── twitch/      # Twitch IRC integration (TwitchChat, EventEmitter, parsers)
├── utils/       # Utilities (handlers, renderers, validators, helpers)
├── types/       # Type definitions and centralized constants
├── templates/   # HTML template generators (AdminPanelTemplates)
└── animations/  # UI animation utilities
```

## Error Handling Standards

-   **Input validation**: In constructors and setters with descriptive errors
-   **Graceful degradation**: For optional features (BroadcastChannel, timers)
-   **Console logging**: For debugging (visible in OBS logs)
-   **Defensive programming**: Auto-correction and user feedback
-   **Type checking**: Explicit checks before operations

## Class Structure Standard

```typescript
export default class ClassName {
    #privateField: type | null = null;
    public publicProperty: type;

    constructor(param: type) {
        this.publicProperty = this.validateParam(param);
    }

    methodName(param: type): returnType {
        /* Implementation */
    }

    #privateMethod(): void {
        /* Internal logic */
    }
}
```

## Performance Patterns

-   **Lightweight bundle**: Avoid heavy dependencies
-   **Efficient DOM**: Use DocumentFragment for batch operations
-   **Animation**: Web Animations API for smooth transitions
-   **Memory management**: Clean up event listeners and intervals
-   **Lazy loading**: Initialize features only when needed
-   **Test performance**: All unit tests must complete in <1 second (enforced by Vitest timeout). Code that causes slow tests requires refactoring.

## Module Imports

```typescript
// Constants
import { BEHAVIOR_CONFIG } from "./types/ConfigConstants";
import { CSS_CLASSES, EVENT_NAMES } from "./types/DOMConstants";

// Classes
import ConfigManager from "./classes/ConfigManager";
import ChallengeList from "./classes/ChallengeList";

// Utils
import { ValidationUtils } from "./utils/ValidationUtils";
import ChallengeRenderer from "./utils/ChallengeRenderer";
```

## Svelte Integration

-   Use the `@frontend/*` alias when importing Svelte components or utilities and `@backend/*` for non-visual services.
-   Adopt Svelte v5 mount/unmount in app entrypoints; avoid legacy `new App(...)` component API.
-   Components must keep DOM contract parity with existing constants—import selectors, dataset keys, and hash values from `src/types` rather than inlining strings.
-   Keep Svelte component script sections in TypeScript mode (`lang="ts"`) and expose explicit props with typed interfaces.
-   Shared stores should live in `src/backend` if they own persistence or side effects; re-export UI-friendly helpers from `src/frontend` when needed to avoid cross-layer coupling.

## Coverage & Barrels

-   Coverage is enforced per file (≥80%) with V8 provider. Barrel files under `src/**/index.ts` and type-only files under `src/types/**` are excluded from coverage.
-   Do not add executable code to barrels to game coverage. Keep logic in dedicated modules with tests.
