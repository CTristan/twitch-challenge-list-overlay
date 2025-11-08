# src/utils/ - Utility Functions & Helpers

Reusable utilities for common operations across the application.

**DOM Operations:** Always import and use constants from `src/types/DOMConstants.ts` for selectors (CSS_SELECTORS), classes (CSS_CLASSES), dataset keys (DATA_ATTRIBUTES), etc. Never hardcode strings like ".challenge-container" or "challengeId".

## Core Utilities

### WindowSyncService (Replaces legacy WindowRefreshManager)

BroadcastChannel communication & connectivity:

-   `notifyConfigurationSaved({ suppressSelfRefresh? })` → schedules reload after delay
-   `notifyConfigurationSavedViewerOnly()` → viewer windows only, admin origin skips self-refresh
-   `notifyChallengeStateChanged()` → challenge refresh event + DOM update
-   Heartbeat: viewer windows track admin availability; tests simulate heartbeat messages to cover connection state transitions.

### ChallengeRenderer

Dual rendering: `createChallengeElement()` (styled), `createTextOnlyChallengeElement()` (admin text-only). Styled mode builds a `CSS_CLASSES.CHALLENGE_CONTENT_WRAPPER` container and nests all non-checkbox controls inside `CSS_CLASSES.CHALLENGE_ACTIONS` so actions sit on their own line beneath the challenge text—mirror this pattern for new controls. Text-only: plain entries + action buttons (Edit, Complete/Uncomplete, Fail/Unfail, +/-) as DIVs with role="button". No checkboxes/styled rows.

**Viewer overlay rule**: Pass `includeCheckbox: false` when rendering viewer mode—checkboxes are reserved for admin controls only.

### UIUpdateHandler

DOM manipulation: overlay styling, challenge insertion (routes to text-only when `adminTextOnlyMode` enabled), CSS management. Text-only handlers: `handleCompleteButtonClick()`, `handleUncompleteButtonClick()`, `handleFailButtonClick()`, `handleUnfailButtonClick()`. `handleCheckboxClick()`: cycles states (in-progress → done → failed → in-progress).

### CommandHandler & CommandParser

Routes chat commands to CommandRegistry. Dual syntax: `d="text" a=5` or simple string. Extracts: description, amount, timer duration.

### ValidationUtils

Input validation: `validateChallengeTitle()`, `validateChallengeAmount()`, `validateNumber(value, field, {min, max, integer})`. Auto-correction built-in.

### StorageManager

localStorage with error handling: `save(key, data, {version, timestamp, fallbackToMemory, retryOnQuotaExceeded})`, `load(key, default, validator)`. Automatic memory fallback, quota management.

### Timer & TimerController

Duration parsing ("5m", "1h30m", "45s"), real-time updates. Visual states: Normal, Warning (≤2min), Critical (≤30s), Expired. Auto-marks Failed on expiry (from In-Progress only). Persists state, notifies windows. Expired timer stays visible with `expired` class + ⏰.

### ColorUtils

Hex to RGB conversion, opacity: `combineColorWithOpacity("#646464", 0.6)` → "rgba(100, 100, 100, 0.6)".

### ConfigDefaults

Fallback config: `createFallbackConfig()`, `isValidFallbackConfig()`, `getDefaultMaxChallenges()` (returns 10), `getDefaultAuthConfig()` (empty).

### AdminPanel Utilities

Static helpers: AdminPanelColorManager (color config), AdminPanelBackgroundManager (background), AdminPanelConfigValidator (validation), AdminPanelDOMBuilder (DOM creation), AdminPanelEventSetup (event registration).

### CollapsibleSection

UI sections: localStorage persistence, keyboard accessible (Enter/Space), CSS transitions, ARIA attributes.
