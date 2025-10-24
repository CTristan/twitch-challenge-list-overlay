# src/types/ — Type Definitions & Constants

Centralized enums and constants for type-safe operations.

## Enums (CRITICAL)

**All enums in separate `.ts` files** (NOT `globals.d.ts`). Use enum refs, not strings.

**Existing**: UIUpdateAction, RefreshMessageType, MessageVariant, WindowMode, ConfigType, CommandType, ChallengeStatus

```ts
// ChallengeStatus.ts — lifecycle states (replaces legacy booleans)
export enum ChallengeStatus {
    IN_PROGRESS = "in-progress",
    COMPLETED = "completed",
    FAILED = "failed",
}

// Usage
import { ChallengeStatus } from "../types/ChallengeStatus";
challenge.setStatus(ChallengeStatus.COMPLETED); // ✅
```

## Constants Files

**MessageConstants**: ERROR_MESSAGES, SUCCESS_MESSAGES, HELP_MESSAGES, MODAL_TEXT, UI_ELEMENTS (button labels: TEXT_ONLY_\*), ARIA_LABELS, CONFIG_EXPORT\_\*

**ConfigConstants**: AUTH_CONFIG (Twitch auth), BEHAVIOR_CONFIG (maxChallenges, prefix), BACKGROUND_CONFIG (colors, opacity), EXPORT_METADATA\_\*, NETWORK_URLS, URL_PARAMS

**DOMConstants**: CSS_CLASSES (includes CHALLENGE_TEXT_ONLY\_\*), CSS_VALUES, CSS_PROPERTY_NAMES, ELEMENT_IDS, EVENT_NAMES, HTML_ELEMENTS, HTML_ATTRIBUTE_NAMES, HTML_ATTRIBUTES, MODAL_MODES, KEYBOARD_KEYS

**ColorConstants**: DEFAULT_COLORS, STATUS_COLORS, SHADOW_COLORS, COLOR_FORMAT

**StorageConstants**: LOCALSTORAGE_PREFIX ("twitch-overlay-"), STORAGE_KEYS, getAllStorageKeys()

**ValidationConstants**: VALIDATION_PATTERNS (regex), VALIDATION_DEFAULTS, VALIDATION_CONSTRAINTS (min/max)

**NumericConstants**: FORM_CONSTRAINTS, COLOR_CONSTANTS, TIMING_CONSTANTS

**FileConstants**: FILE_FORMATS, DEFAULT_FILENAMES, MIME_TYPES

## Usage

```ts
import { BACKGROUND_CONFIG } from "../types/ConfigConstants";
import { CSS_CLASSES } from "../types/DOMConstants";

const color = config.get(BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR);
element.classList.add(CSS_CLASSES.DONE);
```
