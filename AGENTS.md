# AGENTS.md - Development Reference

**Twitch Challenge Overlay** - Browser-based single-streamer challenge management with dual-mode architecture (admin/viewer). OBS Browser Source with Twitch IRC, zero-server deployment.

## Core Architecture

-   **Frontend-only** - No backend/database, event-driven, modular class-based, configuration-driven
-   **Tech Stack**: TypeScript, Vite (IIFE bundle), Vitest (jsdom), CSS Custom Properties, WebSocket, LocalStorage

### Directory Structure

```
src/
├── classes/    # AdminPanel, Challenge, ChallengeList, ConfigManager, ConfigExporter
├── commands/   # Command pattern (15+ classes)
├── twitch/     # TwitchChat, EventEmitter, message-parsers
├── utils/      # CommandHandler, Timer, UIUpdateHandler, ConfigDefaults, ChallengeRenderer
├── types/      # Type definitions and constants
├── templates/  # AdminPanelTemplates
└── animations/ # UI animations
```

### Key Classes

-   **App**: Main controller, DOM rendering, chat commands, cross-window sync
-   **ChallengeList**: Challenge persistence with reload capability
-   **AdminPanel**: Admin interface with template-based UI
-   **ConfigManager**: Singleton configuration with localStorage
-   **CommandHandler/CommandRegistry**: Command execution and routing
-   **CommandParser**: key=value and simple string syntax parsing
-   **Constants**: MessageConstants, ColorConstants, ConfigConstants, DOMConstants, FileConstants, NumericConstants, StorageConstants, ValidationConstants
-   **ChallengeRenderer**: Centralized DOM creation with ID prefix display
-   **UIUpdateHandler**: DOM manipulation for challenge list rendering, handles overlay background styling
-   **WindowRefreshManager**: Cross-window BroadcastChannel communication
-   **TwitchChat**: WebSocket IRC client with OAuth validation
-   **Timer/TimerController**: Countdown and lifecycle management
-   **TimerDisplayUtils**: Timer display formatting and DOM creation utilities
-   **StorageManager**: Centralized localStorage management with error handling and fallback strategies
-   **ErrorHandler**: Singleton error handler for storage, export, and validation errors
-   **PositionUtils**: Utility functions for position-based challenge references
-   **CollapsibleSection**: Utility class for collapsible sections with localStorage persistence

### AdminPanel Architecture

Delegates to specialized utility classes (all use static methods):

-   **AdminPanelColorManager** - Color configuration logic
-   **AdminPanelBackgroundManager** - Background configuration
-   **AdminPanelConfigValidator** - Configuration validation
-   **AdminPanelDOMBuilder** - DOM element creation using AdminPanelTemplates
-   **AdminPanelEventSetup** - Event listener registration

**Admin Panel Structure**: Header (always visible), 4 Collapsible Sections (Behavior Settings, Challenge Row Styling, Overlay Background, Twitch Chat Integration), Bottom Action Buttons (Backup, Restore, Reset, Clear All Data)

## Coding Standards & Patterns

### Naming Conventions

-   **Classes**: PascalCase (`Challenge`, `ChallengeList`)
-   **Methods/Functions**: camelCase (`addChallenge`, `validateDescription`)
-   **Private fields**: `#` prefix (`#ws`, `#localStoreName`)
-   **Constants**: UPPER_SNAKE_CASE
-   **CSS Variables**: kebab-case with `--` prefix (`--header-font-size`)

### Type Safety & Enum Usage

-   **Prefer enum references over string literals**: Use `UIUpdateAction.ADD` instead of `"add" as UIUpdateAction`
-   **Eliminate magic strings**: Replace hardcoded literals with centralized constants or enum values
-   **Centralized constants**: Use `CommandType`, `UIUpdateAction`, `MessageConstants` for type-safe operations

### Enum Management Guidelines

**CRITICAL**: All enums must be defined in separate `.ts` files, NOT in `types/globals.d.ts`.

-   **Enum Location**: Define in `src/types/` directory (e.g., `src/types/UIUpdateAction.ts`)
-   **Global Types Limitation**: `types/globals.d.ts` contains only interfaces/types - never enums
-   **Import Requirement**: Explicitly import: `import { EnumName } from "../types/EnumName"`

```typescript
// ✅ Examples: UIUpdateAction, RefreshMessageType, MessageVariant, WindowMode, ConfigType
export enum UIUpdateAction {
    ADD = "add",
    EDIT = "edit",
    COMPLETE = "complete",
}

export enum RefreshMessageType {
    CONFIG_SAVED = "config-saved",
    CHALLENGE_STATE_CHANGED = "challenge-state-changed",
}

// Usage
import { UIUpdateAction } from "../types/UIUpdateAction";
const uiUpdate: UIUpdateData = { action: UIUpdateAction.ADD };
```

### Constants Management Guidelines

**CRITICAL**: All user-facing messages, error messages, response strings, configuration property names, DOM constants, colors, and numeric values must use centralized constant systems.

#### Comprehensive Constants System

-   **MessageConstants**: `src/types/MessageConstants.ts` (ERROR_MESSAGES, SUCCESS_MESSAGES, HELP_MESSAGES, MODAL_TEXT, UI_ELEMENTS, ARIA_LABELS, CONFIG_EXPORT_MESSAGES, CONFIG_EXPORT_ERRORS, CONFIG_VALIDATION_ERRORS, CONFIG_EXPORT_TEMPLATES)
-   **ConfigConstants**: `src/types/ConfigConstants.ts` (AUTH_CONFIG, BEHAVIOR_CONFIG, BACKGROUND_CONFIG, EXPORT_METADATA_KEYS, EXPORT_METADATA_VALUES, EXPORT_PLACEHOLDERS, NETWORK_URLS, URL_PARAMS, GLOBAL_PROPERTIES, TWITCH_EVENTS)
-   **ColorConstants**: `src/types/ColorConstants.ts` (DEFAULT_COLORS, STATUS_COLORS, SHADOW_COLORS, COLOR_FORMAT)
-   **DOMConstants**: `src/types/DOMConstants.ts` (CSS_CLASSES, CSS_VALUES, CSS_PROPERTY_NAMES, ELEMENT_IDS, EVENT_NAMES, COMMON_STRINGS, HTML_ELEMENTS, HTML_ATTRIBUTE_NAMES, HTML_ATTRIBUTES, MODAL_MODES, DOM_COMMANDS, BROADCAST_CHANNEL_NAMES, COMMAND_CONSTANTS, KEYBOARD_KEYS, BUTTON_TEXT)
-   **FileConstants**: `src/types/FileConstants.ts` (FILE_FORMATS, DEFAULT_FILENAMES, FILENAME_PATTERNS, MIME_TYPES)
-   **NumericConstants**: `src/types/NumericConstants.ts` (FORM_CONSTRAINTS, COLOR_CONSTANTS, TIMING_CONSTANTS)
-   **StorageConstants**: `src/types/StorageConstants.ts` (LOCALSTORAGE_PREFIX, STORAGE_KEYS, getAllStorageKeys())
-   **ValidationConstants**: `src/types/ValidationConstants.ts` (VALIDATION_PATTERNS, VALIDATION_DEFAULTS, VALIDATION_CONSTRAINTS)

```typescript
// Usage
import { BACKGROUND_CONFIG } from "../types/ConfigConstants";
import { CSS_CLASSES, EVENT_NAMES } from "../types/DOMConstants";
const backgroundColor = configManager.get(BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR);
element.classList.add(CSS_CLASSES.DONE);
field.addEventListener(EVENT_NAMES.INPUT, callback);
```

### Class Structure Pattern

```typescript
export default class ClassName {
    #privateField: type | null = null;
    public publicProperty: type;
    constructor(param: type) {
        this.publicProperty = this.validateParam(param);
    }
    methodName(param: type): returnType { /* Implementation */ }
}
```

### Error Handling Patterns

-   **Input validation** in constructors and setters
-   **Explicit type checking** with descriptive error messages
-   **Graceful degradation** for optional features
-   **Console logging** for debugging (visible in OBS logs)
-   **Defensive programming** with auto-correction and user feedback

### Code Quality Requirements

**MANDATORY**: All source files and test files must be free of IDE warnings and errors before work is considered complete.

-   **Zero tolerance for TypeScript errors**: All TypeScript compilation errors must be resolved
-   **No IDE warnings**: Address all linting warnings, type safety issues, and deprecated API usage
-   **Verification required**: Run `diagnostics` tool on modified files to confirm no issues remain
-   **Test files included**: This requirement applies equally to both `src/` and `tests/` directories
-   **Pre-commit validation**: Always verify clean diagnostics before committing changes
-   **Type safety over convenience**: Use proper type annotations and assertions rather than suppressing errors with `any` or `@ts-ignore` unless absolutely necessary
-   **Deprecated API handling**: Replace or properly document deprecated API usage with appropriate comments explaining why it's needed

### Authentication & OAuth Token Handling

OAuth tokens are automatically validated and formatted by the TwitchChat class with auto-correction for missing "oauth:" prefix. Generate tokens from **https://twitchtokengenerator.com**.

## TypeScript Development Guidelines

-   **All new files** must be written in TypeScript (`.ts` extension)
-   **Type annotations** must be explicit for all public methods, properties, and function parameters
-   **Interface definitions** should be created for complex object types and reused across the codebase
-   **Strict TypeScript configuration** enforced for all development
-   **Build Process**: Vite TypeScript support with automatic compilation, `pnpm run type-check` for validation
-   **Single bundle output**: TypeScript files compile to `dist/challengeBot.iife.js` bundle
-   **Type Safety**: Explicit return types, prefer `interface` over `type`, strict null checks with optional chaining, prefer `const enum` for compile-time constants

## Configuration System

### Configuration Management

Configuration is managed through the **ConfigManager** class with **localStorage persistence** and **fallback configuration support**. The system uses `_config.js` as a fallback when localStorage is unavailable or for initial setup.

### Configuration Architecture

-   **ConfigManager singleton**: Centralized configuration management
-   **localStorage persistence**: Automatic saving and loading of settings
-   **ConfigDefaults utility**: Modular fallback configuration creation with validation
-   **Default configuration**: Built-in fallback values for all settings
-   **Admin panel interface**: User-friendly configuration editing
-   **Import/export functionality**: Backup and restore configuration

### localStorage Key Naming Convention

All application localStorage keys use a consistent prefix for easy identification and cleanup:

-   **Prefix**: `"twitch-overlay-"` (defined in `StorageConstants.LOCALSTORAGE_PREFIX`)
-   **Centralized management**: All keys defined in `src/types/StorageConstants.ts`
-   **Clear All Data**: Removes all keys with the prefix, preserving non-application data

**STORAGE_KEYS**: CONFIG, CHALLENGE_LIST, CHALLENGE_LIST_TEST, CONFIG_SETTINGS_COLLAPSED, BEHAVIOR_SECTION_COLLAPSED, CHALLENGE_ROW_STYLING_SECTION_COLLAPSED, OVERLAY_BACKGROUND_SECTION_COLLAPSED, AUTHENTICATION_SECTION_COLLAPSED

```typescript
import { STORAGE_KEYS } from "../types/StorageConstants";
const config = localStorage.getItem(STORAGE_KEYS.CONFIG);
const challenges = localStorage.getItem(STORAGE_KEYS.CHALLENGE_LIST);
```

### Configuration Access Pattern

```typescript
import { BEHAVIOR_CONFIG } from "../types/ConfigConstants";
const configManager = ConfigManager.getInstance();
const maxChallenges = configManager.get(BEHAVIOR_CONFIG.MAX_CHALLENGES);
configManager.set(BEHAVIOR_CONFIG.MAX_CHALLENGES, 15);
```

### Default Configuration Structure

The system includes built-in defaults for all configuration properties:

-   **Twitch chat integration settings**: Empty strings (configured via admin panel)
-   **Basic behavior**: maxChallenges: 10
-   **Command mappings**: Unified "!ch" prefix system
-   **Response templates**: Standardized bot responses
-   **Color configuration**: Optional challenge row styling with opacity control
-   **Row colors opacity**: challengeRowColorsOpacity: 1.0 (100% opaque by default)

### ConfigDefaults Utility Module

Provides modular fallback configuration creation and validation with `createFallbackConfig()`, `isValidFallbackConfig()`, `getDefaultMaxChallenges()`, and `getDefaultAuthConfig()` functions for error recovery and testing.

## Testing Patterns

### Test Organization

-   **Unit tests** for each class in parallel file structure
-   **jsdom environment** for DOM testing with Vitest
-   **80% coverage thresholds** (statements, branches, functions, lines)
-   **Specialized test utilities** (chatHandlerTestUtils.ts, domTestUtils.ts)
-   **Dual-layer testing**: Integration tests (app-level) + Unit tests (individual commands)

### Test Coverage Summary

Key components maintain 80%+ coverage across all metrics. Major components include:

-   **index.ts** (28 tests): 100% coverage across all metrics (statements, branches, functions, lines)
-   **App** (27 tests): 92.59% statement, 88.46% branch
-   **AdminPanel** (35 tests): 89.92% statement, 82.22% branch
-   **CommandRegistry** (34 tests): 100% coverage across all metrics
-   **TwitchChat** (34 tests): 100% statement, 90.19% branch
-   **Commands**: 10+ command classes with 80%+ coverage
-   **Utilities**: ChallengeRenderer, CommandHandler, ValidationUtils, ResponseFormatter all 90%+ coverage

### Test Structure

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import ClassName from "../src/path/ClassName";

describe("ClassName", () => {
    let instance: ClassName;
    beforeEach(() => {
        ensureTestIsolation();
        instance = new ClassName("param");
    });
    describe("methodName", () => {
        it("should describe expected behavior", () => {
            expect(instance.methodName()).toBe(expected);
        });
    });
});
```

### Branch Coverage Testing Strategies

-   **Error paths**: Invalid commands, DOM errors, command handler exceptions
-   **Conditional branches**: Admin vs viewer mode, config-dependent logic, timer states
-   **Integration-style**: Complete command flows, error scenarios, DOM state validation

### Test Coverage Requirements

-   **Thresholds**: 80% minimum (statements, branches, functions, lines)
-   **Provider**: v8 for TypeScript coverage
-   **Enforcement**: Build fails below thresholds

## Build & Deployment

### Build Configuration

-   **Vite** builds to IIFE format for browser compatibility
-   **Single bundle** output: `dist/challengeBot.iife.js`
-   **No public directory** - all assets referenced relatively
-   **ES modules** in source, bundled for distribution

### Development Workflow

```bash
pnpm run dev          # Development server
pnpm run build        # Production build
pnpm run build:watch  # Watch mode for development
pnpm run test         # Run tests
pnpm run test:coverage # Coverage report
pnpm run type-check   # TypeScript type checking
pnpm run type-check:watch # Continuous type checking
```

### Deployment

-   **Static files** - no server required
-   **OBS Browser Source** - local file deployment
-   **Manual refresh** required for configuration changes

## Current Features

### Dual-Mode Architecture

Single challenge panel with dual-mode interface:

-   **Single HTML file** - Zero-server deployment
-   **URL fragment routing**: `file:///path/to/index.html` (Viewer Mode), `file:///path/to/index.html#admin` (Admin Mode)
-   **Permission Model**: Streamer/moderators only, no viewer interaction

### Challenge Display with Numeric ID Prefixes

-   **Numeric ID prefix**: Each challenge displays position number (e.g., "1. ", "2. ", "3. ")
-   **Visual format**: `"{id}. {challenge_title}"` where `{id}` is 1-based position
-   **Command integration**: IDs correspond to command parameters (`!ch done 1`, `!ch edit 2`, `!ch delete 3`)
-   **Implementation**: ChallengeRenderer accepts `displayPosition` parameter (index + 1)

### Challenge Metadata Row Layout

-   **Metadata row container**: Amount and timer positioned in `.challenge-metadata` flexbox container
-   **Prevents text truncation**: Title and description display fully without being cut off
-   **Flexbox layout**: `display: flex` with `justify-content: space-between` (amount left, timer right)
-   **Conditional rendering**: Metadata row only created when amount > 1 OR timer exists

### Countdown Timer Display

-   **Real-time countdown**: Live updates every second in human-readable format ("5:30", "1:23:45", "30s")
-   **Visual states**: Normal (⏱️ white), Warning ≤2min (🟡 gold), Critical ≤30s (🔴 red), Expired (⏰ bright red)

### Unified Command System

-   **Unified "!ch" prefix** with keyword subcommands
-   **Type-safe processing** with centralized command types in `CommandTypes.ts`
-   **Command aliasing** - multiple variations resolve to canonical types
-   **Dual syntax** - key=value (`d=`, `a=`, `t=`) and simple string
-   **Advanced management** - increment, decrement, set, multiple IDs
-   **Command Pattern**: Interface, BaseCommand, individual command classes, CommandRegistry
-   **Permission Model**: ALL commands require moderator/broadcaster permissions
    **Processing Flow**: TwitchChat → App.chatHandler → CommandParser → CommandTypes.normalizeCommand() → CommandHandler → CommandRegistry → Command class → Response

### Admin Panel Features

-   **Auto-save configuration** - All configuration changes automatically saved to localStorage
-   **Configuration management** with live editing, backup/restore, reset to defaults
-   **Challenge list controls** (clear all, clear completed)
-   **Color configuration** for challenge rows with opacity control
-   **Overlay background opacity control** - Configurable opacity (0-100%, default: 60%) for main container (`.card` element) background transparency
-   **Challenge row background opacity control** - Separate opacity control for individual challenge container backgrounds
-   **Real-time configuration updates** - Config changes trigger full page reload in viewer window
-   **Real-time challenge state synchronization** - Challenge changes trigger DOM-only updates in viewer window
-   **Window refresh communication** via BroadcastChannel
-   **Interactive checkboxes** - Clickable in admin mode, toggle completion with real-time sync
-   **Add/Edit Challenge modals** - Modal interface with mode switching (MODAL_MODES.ADD / MODAL_MODES.EDIT)
-   **Edit icon (✏️)** - Appears next to checkboxes in admin mode only
-   **Clear All Data with confirmation** - Confirmation dialog before clearing all application data, refreshes both admin and viewer windows after clearing

**Background Opacity Configuration**:

-   **Storage format**: Hex color (`#646464`) + numeric opacity (0.0-1.0) stored separately
-   **Rendering**: Combined at render time using `combineColorWithOpacity()` utility to create RGBA string
-   **Applied in**: `UIUpdateHandler.renderChallengeList()` method before appending challenge card to DOM

**Clear All Data Functionality**:

-   **Confirmation dialog**: Shows warning with list of data to be deleted before proceeding
-   **Comprehensive cleanup**: Removes ALL localStorage keys with `twitch-overlay-` prefix
-   **Preserves non-application data**: Only removes application-specific keys, leaves other localStorage data intact
-   **Cross-window refresh**: After clearing, broadcasts `notifyConfigurationSaved()` to refresh viewer window, then reloads admin window
-   **Visual feedback**: Button shows success message with count of removed keys (e.g., "Cleared! (1 keys)")
-   **Error handling**: Shows "Error!" if no keys are removed or if an exception occurs
-   **Implementation**: `AdminPanel.clearLocalStorage()` method with inline localStorage iteration to avoid tree-shaking issues
-   **Key requirement**: All application localStorage keys MUST use the `"twitch-overlay-"` prefix (defined in `LOCALSTORAGE_PREFIX` constant in `StorageConstants.ts`) for proper cleanup

## Cross-Window Synchronization

The application uses **BroadcastChannel API** for real-time synchronization between admin and viewer windows.

### WindowRefreshManager

**Location**: `src/utils/windowRefresh.ts`

The WindowRefreshManager handles cross-window communication with two distinct message types:

#### Message Types

1. **`'config-saved'`** - Configuration changes (triggers full page reload)
    - Used when: Auth settings, behavior config, colors, or background settings change
    - Action: Full `window.location.reload()` in viewer window
    - Called via: `notifyConfigurationSaved()`

2. **`'challenge-state-changed'`** - Challenge state changes (triggers DOM-only update)
    - Used when: Challenges are added, edited, completed, deleted, or cleared
    - Action: Reload challenge list from localStorage and re-render DOM
    - Called via: `notifyChallengeStateChanged()`

#### Key Methods

-   **`notifyConfigurationSaved()`** - Broadcasts config change and triggers full page reload
-   **`notifyChallengeStateChanged()`** - Broadcasts challenge state change and triggers DOM refresh
-   **`triggerChallengeListRefresh()`** - Dispatches custom `'challenge-list-refresh'` event
-   **`isAvailable()`** - Checks if BroadcastChannel is supported

### App Class Synchronization Methods

**Location**: `src/app.ts`

-   **`setupChallengeListRefreshListener()`** - Sets up listener for `'challenge-list-refresh'` event
-   **`handleChallengeListRefresh()`** - Reloads challenge list from localStorage and re-renders
-   **`handleCheckboxClick()`** - Calls `notifyChallengeStateChanged()` after toggling completion
-   **`handleClearFinishedClick()`** - Calls `notifyChallengeStateChanged()` after clearing completed challenges
-   **`createChallengeFromForm()`** - Calls `notifyChallengeStateChanged()` after adding challenge via modal
-   **`updateChallengeFromForm()`** - Calls `challengeList.saveToLocalStorage()` and `notifyChallengeStateChanged()` after editing challenge via modal

### ChallengeList Persistence Methods

**Location**: `src/classes/ChallengeList.ts`

-   **`loadFromLocalStorage()`** - Public method to reload challenges from localStorage (resets counters, clears challenge map, reloads all challenges)
-   **`saveToLocalStorage()`** - Public method to persist challenge list changes to localStorage (used when external code modifies challenge properties directly, calls internal `#commitToLocalStorage()` method, required after calling challenge setters)

## Troubleshooting Common Issues

### Authentication Problems
-   **Symptoms**: Bot doesn't respond to `!ch` or `!ch help` commands
-   **Solution**: Generate new OAuth token from https://twitchtokengenerator.com, update `_config.js`, ensure `oauth:` prefix, rebuild with `pnpm run build`

### Timer-Related Issues
-   **Symptoms**: Timer commands execute but timer doesn't appear
-   **Solution**: Ensure Timer imports use ES module syntax: `import Timer from "../utils/Timer";`, rebuild application

### Overlay Background Opacity Issues
-   **Symptoms**: Overlay background opacity slider changes don't affect visual transparency
-   **Solution**: Verify `UIUpdateHandler.renderChallengeList()` retrieves `overlayBackgroundColor` and `overlayBackgroundOpacity`, combines using `combineColorWithOpacity()`, applies RGBA to `challengeCard.style.backgroundColor`, adds `custom-overlay-background` class, performs before appending to DOM

### Clear All Data Not Removing Challenges
-   **Symptoms**: "Clear All Data" button doesn't remove challenges
-   **Solution**: Ensure `STORAGE_KEYS.CHALLENGE_LIST` uses prefixed key: `"twitch-overlay-challenge-list"` (not `"challengeList"`)

### Command Processing Issues
-   **Expected Behavior**: Regular viewers' commands are silently ignored (no response)
-   **Authorized Users**: Only broadcasters and moderators can use bot commands

### Admin Panel Slider Not Visible
-   **Symptoms**: Slider controls not visible in admin panel sections
-   **Solution**: Add `expanded` class to `.color-pickers-container` in `AdminPanelTemplates.ts` for always-visible sections

## Development Guidelines

### Adding New Features
1. **Write in TypeScript** - All new files must use `.ts` extension
2. **Define types** in TypeScript interfaces or `types/globals.d.ts` if needed
3. **Create classes** following established patterns with explicit type annotations
4. **Add configuration** options if user-customizable
5. **Write tests** for new functionality
6. **Update documentation** and configuration comments

### Modifying Existing Code
1. **No backward compatibility or legacy code** - Remove any legacy parameters, deprecated methods, or backward compatibility code
2. **Follow existing naming conventions**
3. **Update tests** for changed behavior
4. **Use native TypeScript type annotations**
5. **Test with OBS Browser Source**

### Performance Considerations
-   **Lightweight bundle** - avoid heavy dependencies
-   **Efficient DOM updates** - use DocumentFragment for batch operations
-   **Animation optimization** - use Web Animations API
-   **Memory management** - clean up event listeners and intervals

## Common Patterns

### Configuration Access
```typescript
import { BEHAVIOR_CONFIG } from "../types/ConfigConstants";
const configManager = ConfigManager.getInstance();
const maxChallenges = configManager.get(BEHAVIOR_CONFIG.MAX_CHALLENGES);
```

### Fallback Configuration Pattern
```typescript
import { createFallbackConfig } from "./utils/ConfigDefaults";
try {
    configManager = ConfigManager.getInstance(userConfig);
} catch (error) {
    configManager = ConfigManager.getInstance(createFallbackConfig());
}
```

### DOM Manipulation
```typescript
const fragment = document.createDocumentFragment();
items.forEach((item: Challenge) => {
    fragment.appendChild(createElement(item));
});
container.appendChild(fragment);
```

### StorageManager Pattern
```typescript
import { StorageManager } from "../utils/StorageManager";
import { STORAGE_KEYS } from "../types/StorageConstants";

const result = StorageManager.save(STORAGE_KEYS.CONFIG, config, {
    version: "1.0.0", timestamp: true, fallbackToMemory: true, retryOnQuotaExceeded: true
});

const loadResult = StorageManager.load(STORAGE_KEYS.CONFIG, defaultConfig,
    (data): data is Config => isValidConfiguration(data)
);
```

**Key Points**: Automatic fallback to memory-only mode, error handling with structured results, validation support, quota management, transparent fallback

### Validation Pattern
```typescript
import { ValidationUtils } from "../utils/ValidationUtils";
import { VALIDATION_CONSTRAINTS } from "../types/ValidationConstants";

const title = ValidationUtils.validateChallengeTitle(userInput);
const description = ValidationUtils.validateChallengeDescription(descInput, { allowEmpty: true });
const amount = ValidationUtils.validateChallengeAmount(amountInput);
const validated = ValidationUtils.validateNumber(value, "amount", {
    min: VALIDATION_CONSTRAINTS.AMOUNT_MIN,
    max: VALIDATION_CONSTRAINTS.AMOUNT_MAX,
    integer: true
});
```

### Challenge Persistence Pattern
```typescript
// ✅ CORRECT: Using ChallengeList methods (auto-saves)
this.challengeList.addChallengeObjects(challenge);
this.challengeList.toggleChallengeCompletion(challengeId);

// ✅ CORRECT: Direct property modification + manual save
const challenge = this.challengeList.getChallengeById(challengeId);
challenge.setTitle(newTitle);
this.challengeList.saveToLocalStorage(); // Required
```

**Key Points**: ChallengeList methods auto-save, direct challenge setters do NOT auto-save, always call `saveToLocalStorage()` after setters, cross-window sync requires `notifyChallengeStateChanged()`

### Challenge Rendering with ID Prefix Pattern
```typescript
import ChallengeRenderer from "../utils/ChallengeRenderer";

challenges.forEach((challenge: Challenge, index: number) => {
    const listItem = ChallengeRenderer.createChallengeElement(challenge, {
        displayPosition: index + 1,
        includeEventListeners: true,
        eventHandler: handleCheckboxClick
    });
    container.appendChild(listItem);
});
```

### HTML Attribute Setting Pattern
```typescript
import { HTML_ATTRIBUTE_NAMES, HTML_ATTRIBUTES } from "../types/DOMConstants";
editIcon.setAttribute(HTML_ATTRIBUTE_NAMES.ROLE, HTML_ATTRIBUTES.ROLE_BUTTON);
editIcon.setAttribute(HTML_ATTRIBUTE_NAMES.ARIA_LABEL, ARIA_LABELS.EDIT_CHALLENGE);
```

### Event Listener Pattern
```typescript
import { EVENT_NAMES } from "../types/DOMConstants";
field.addEventListener(EVENT_NAMES.INPUT, callback);
checkbox.addEventListener(EVENT_NAMES.CHANGE, callback);
```

**Event Type Guidelines**: `INPUT` for real-time updates, `CHANGE` for form validation/auto-save on blur, `CLICK` for button clicks

### Overlay Background Styling Pattern
```typescript
import { combineColorWithOpacity } from "./ColorUtils";
import { BACKGROUND_CONFIG, BACKGROUND_DEFAULTS } from "../types/ConfigConstants";

const overlayBackgroundColor = this.configManager.get(BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR);
if (overlayBackgroundColor) {
    const overlayBackgroundOpacity = this.configManager.get(BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY) ?? BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY;
    const overlayBackgroundRGBA = combineColorWithOpacity(overlayBackgroundColor, overlayBackgroundOpacity);
    challengeCard.style.backgroundColor = overlayBackgroundRGBA;
    challengeCard.classList.add(CSS_CLASSES.CUSTOM_OVERLAY_BACKGROUND);
}
```

**Key Points**: Apply in `UIUpdateHandler.renderChallengeList()`, apply before appending to DOM, hex color + numeric opacity stored separately, use `combineColorWithOpacity()` utility

### Admin Panel Template Pattern
```typescript
import { AdminPanelTemplates } from "../templates/AdminPanelTemplates";

const colorContent = AdminPanelTemplates.colorSection({
    primaryBackgroundColor: DEFAULT_COLORS.PRIMARY_BACKGROUND,
    primaryTextColor: DEFAULT_COLORS.PRIMARY_TEXT,
    rowColorsOpacityPercent: 100,
    elementIds: ELEMENT_IDS
});
```

**Benefits**: Separation of concerns, type safety, maintainability, reusability

### Collapsible Section Pattern

**CSS Classes**: `.collapsible-section`, `.collapsible-header`, `.collapsible-title`, `.collapsible-icon`, `.collapsible-content`, `.expanded`

**Implementation**: Each section independently collapsible, state persisted to localStorage with section-specific keys, keyboard accessible (Enter/Space), smooth CSS transitions, proper ARIA attributes

