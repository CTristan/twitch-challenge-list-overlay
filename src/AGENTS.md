# src/ - Source Code Patterns

Development patterns and guidelines for the source code directory.

## TypeScript Development

- **All files**: TypeScript (`.ts` extension) with explicit type annotations
- **Interfaces**: Define for complex objects, reuse across codebase
- **Build**: Vite compiles to single `dist/challengeBot.iife.js` IIFE bundle
- **Type Safety**: Explicit return types, prefer `interface` over `type`, strict null checks, optional chaining

## File Organization

```
src/
├── classes/     # Core business logic (AdminPanel, Challenge, ChallengeList, ConfigManager)
├── commands/    # Command pattern implementation (15+ command classes)
├── twitch/      # Twitch IRC integration (TwitchChat, EventEmitter, parsers)
├── utils/       # Utilities (handlers, renderers, validators, helpers)
├── types/       # Type definitions and centralized constants
├── templates/   # HTML template generators (AdminPanelTemplates)
└── animations/  # UI animation utilities
```

## Error Handling Standards

- **Input validation**: In constructors and setters with descriptive errors
- **Graceful degradation**: For optional features (BroadcastChannel, timers)
- **Console logging**: For debugging (visible in OBS logs)
- **Defensive programming**: Auto-correction and user feedback
- **Type checking**: Explicit checks before operations

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

- **Lightweight bundle**: Avoid heavy dependencies
- **Efficient DOM**: Use DocumentFragment for batch operations
- **Animation**: Web Animations API for smooth transitions
- **Memory management**: Clean up event listeners and intervals
- **Lazy loading**: Initialize features only when needed

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
