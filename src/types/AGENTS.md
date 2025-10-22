# src/types/ - Type Definitions & Constants

Centralized type definitions and constant systems for type-safe operations.

## Enum Management (CRITICAL)

**All enums MUST be in separate `.ts` files** (NOT in `globals.d.ts`):

```typescript
// src/types/UIUpdateAction.ts
export enum UIUpdateAction {
    ADD = "add",
    EDIT = "edit",
    COMPLETE = "complete",
    DELETE = "delete"
}

// Usage
import { UIUpdateAction } from "../types/UIUpdateAction";
const action = UIUpdateAction.ADD; // ✅ Correct
const action = "add" as UIUpdateAction; // ❌ Avoid
```

**Existing Enums**: UIUpdateAction, RefreshMessageType, MessageVariant, WindowMode, ConfigType, CommandType

## Constants System

### MessageConstants.ts
- **ERROR_MESSAGES**: Validation errors, operation failures
- **SUCCESS_MESSAGES**: Operation confirmations
- **HELP_MESSAGES**: Command help text
- **MODAL_TEXT**: Modal UI strings
- **UI_ELEMENTS**: Button labels, placeholders
- **ARIA_LABELS**: Accessibility labels
- **CONFIG_EXPORT_***: Export/import messages

### ConfigConstants.ts
- **AUTH_CONFIG**: Twitch authentication keys (channel, username, oauth)
- **BEHAVIOR_CONFIG**: App behavior (maxChallenges, command prefix)
- **BACKGROUND_CONFIG**: UI styling (colors, opacity)
- **EXPORT_METADATA_***: Export file metadata
- **NETWORK_URLS**: External URLs (token generator)
- **URL_PARAMS**: URL hash values (#admin)

### DOMConstants.ts
- **CSS_CLASSES**: All CSS class names
- **CSS_VALUES**: CSS property values
- **CSS_PROPERTY_NAMES**: CSS property keys
- **ELEMENT_IDS**: DOM element IDs
- **EVENT_NAMES**: DOM event types (input, change, click)
- **HTML_ELEMENTS**: HTML tag names
- **HTML_ATTRIBUTE_NAMES**: Attribute keys (role, aria-label)
- **HTML_ATTRIBUTES**: Attribute values
- **MODAL_MODES**: Modal states (add, edit)
- **KEYBOARD_KEYS**: Key event codes

### ColorConstants.ts
- **DEFAULT_COLORS**: Primary, secondary, tertiary colors
- **STATUS_COLORS**: Done, warning, error states
- **SHADOW_COLORS**: Drop shadow values
- **COLOR_FORMAT**: Regex patterns for validation

### StorageConstants.ts
- **LOCALSTORAGE_PREFIX**: `"twitch-overlay-"` (required for all keys)
- **STORAGE_KEYS**: CONFIG, CHALLENGE_LIST, *_SECTION_COLLAPSED
- **getAllStorageKeys()**: Returns all storage key values

### ValidationConstants.ts
- **VALIDATION_PATTERNS**: Regex for URLs, colors, durations
- **VALIDATION_DEFAULTS**: Default validation values
- **VALIDATION_CONSTRAINTS**: Min/max values (title, description, amount)

### NumericConstants.ts
- **FORM_CONSTRAINTS**: Max lengths, min/max values
- **COLOR_CONSTANTS**: Opacity ranges, color format lengths
- **TIMING_CONSTANTS**: Debounce delays, animation durations

### FileConstants.ts
- **FILE_FORMATS**: Export file extensions (.json)
- **DEFAULT_FILENAMES**: Export filename patterns
- **MIME_TYPES**: File MIME types

## Usage Pattern

```typescript
import { BACKGROUND_CONFIG } from "../types/ConfigConstants";
import { CSS_CLASSES, EVENT_NAMES } from "../types/DOMConstants";
import { VALIDATION_CONSTRAINTS } from "../types/ValidationConstants";

// Configuration
const color = config.get(BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR);

// DOM
element.classList.add(CSS_CLASSES.DONE);
field.addEventListener(EVENT_NAMES.INPUT, handler);

// Validation
const isValid = title.length <= VALIDATION_CONSTRAINTS.TITLE_MAX_LENGTH;
```
