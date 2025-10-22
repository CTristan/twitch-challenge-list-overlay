# src/utils/ - Utility Functions & Helpers

Reusable utilities for common operations across the application.

## Core Utilities

### WindowRefreshManager

**Cross-window BroadcastChannel communication**

-   `notifyConfigurationSaved()`: Full page reload (config changes)
-   `notifyChallengeStateChanged()`: DOM-only update (challenge mutations)
-   `isAvailable()`: Checks BroadcastChannel support

### ChallengeRenderer

**Centralized challenge DOM creation with dual rendering modes**

```typescript
// Standard styled rendering (viewer + admin default)
const element = ChallengeRenderer.createChallengeElement(challenge, {
    displayPosition: index + 1,
    includeEventListeners: true,
    eventHandler: handleCheckboxClick,
});

// Text-only rendering (admin mode only)
const textElement = ChallengeRenderer.createTextOnlyChallengeElement(
    challenge,
    {
        displayPosition: index + 1,
        editHandler,
        completeHandler,
        failHandler,
        incrementHandler,
        decrementHandler,
    }
);
```

**Text-only mode**: Plain text entries with explicit Complete/Fail buttons (no checkboxes, no styled rows)

### UIUpdateHandler

**DOM manipulation for challenge list**

-   Overlay background styling (color + opacity)
-   Challenge card creation and insertion (routes to text-only renderer when `adminTextOnlyMode` enabled)
-   CSS class management
-   `handleCompleteButtonClick()`: Direct "done" state transition
-   `handleFailButtonClick()`: Direct "failed" state transition
-   `handleCheckboxClick()`: Cycle through states (in-progress → done → failed → in-progress)

### CommandHandler & CommandParser

**Command routing and parsing**

-   CommandHandler: Routes chat commands to CommandRegistry
-   CommandParser: Dual syntax (`d="text" a=5` or simple string)
-   Extracts: description, amount, timer duration

### ValidationUtils

**Input validation with auto-correction**

```typescript
const title = ValidationUtils.validateChallengeTitle(input);
const amount = ValidationUtils.validateChallengeAmount(input);
const number = ValidationUtils.validateNumber(value, "field", {
    min: MIN,
    max: MAX,
    integer: true,
});
```

### StorageManager

**localStorage with error handling and fallback**

```typescript
StorageManager.save(STORAGE_KEYS.CONFIG, data, {
    version: "1.0.0",
    timestamp: true,
    fallbackToMemory: true,
    retryOnQuotaExceeded: true,
});

StorageManager.load(STORAGE_KEYS.CONFIG, defaultValue, validatorFn);
```

Features: automatic fallback to memory-only mode, quota management, validation support

### Timer & TimerController

**Countdown timer management**

-   Duration parsing ("5m", "1h30m", "45s")
-   Real-time updates (every second)
-   Visual states: Normal, Warning (≤2min), Critical (≤30s), Expired
-   TimerDisplayUtils: Formatting and DOM creation

### ColorUtils

**Color manipulation**

```typescript
const rgba = combineColorWithOpacity("#646464", 0.6);
// Returns: "rgba(100, 100, 100, 0.6)"
```

Hex to RGB conversion, opacity application

### ConfigDefaults

**Fallback configuration**

-   `createFallbackConfig()`: Default config generation
-   `isValidFallbackConfig()`: Validates structure
-   `getDefaultMaxChallenges()`: Returns 10
-   `getDefaultAuthConfig()`: Empty auth config

### AdminPanel Utilities (Static Methods)

-   **AdminPanelColorManager**: Color configuration
-   **AdminPanelBackgroundManager**: Background settings
-   **AdminPanelConfigValidator**: Config validation
-   **AdminPanelDOMBuilder**: DOM element creation
-   **AdminPanelEventSetup**: Event registration

### CollapsibleSection

**Collapsible UI sections**

-   localStorage state persistence
-   Keyboard accessible (Enter/Space)
-   Smooth CSS transitions
-   ARIA attributes
