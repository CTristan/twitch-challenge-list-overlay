# AGENTS.md - Development Reference Guide

## Project Overview

**Twitch Challenge Overlay** - Browser-based single-streamer challenge management with dual-mode architecture (admin/viewer). OBS Browser Source with Twitch IRC, zero-server deployment.

### Core Architecture

-   **Frontend-only** - No backend/database
-   **Event-driven** - Custom EventEmitter pattern
-   **Modular class-based** - Clear separation of concerns
-   **Configuration-driven** - External config files

### Directory Structure

```
├── src/                    # TypeScript source
│   ├── classes/           # AdminPanel, Challenge, ChallengeList, ConfigManager, ConfigExporter
│   ├── commands/          # Command pattern (15+ classes)
│   ├── twitch/            # TwitchChat, EventEmitter, message-parsers
│   ├── utils/             # CommandHandler, Timer, UIUpdateHandler, ConfigDefaults, ChallengeRenderer
│   ├── types/             # Type definitions and constants
│   ├── templates/         # AdminPanelTemplates
│   ├── animations/        # UI animations
├── styles/, tests/, types/globals.d.ts, _config.js, dist/, tsconfig.json, vite.config.ts
```

### Key Classes

-   **App**: Main controller, DOM rendering, chat commands, cross-window sync
-   **ChallengeList**: Challenge persistence with reload capability
-   **AdminPanel**: Admin interface with template-based UI
-   **ConfigManager**: Singleton configuration with localStorage
-   **CommandHandler/CommandRegistry**: Command execution and routing
-   **CommandParser**: key=value and simple string syntax parsing
-   **Constants**: MessageConstants, ColorConstants, ConfigConstants, DOMConstants, FileConstants, NumericConstants
-   **ChallengeRenderer**: Centralized DOM creation with ID prefix display
-   **WindowRefreshManager**: Cross-window BroadcastChannel communication
-   **TwitchChat**: WebSocket IRC client with OAuth validation
-   **Timer/TimerController**: Countdown and lifecycle management

### Technology Stack

-   **TypeScript** with ES modules, **Vite** (IIFE bundle), **Vitest** (jsdom)
-   **CSS Custom Properties**, **WebSocket**, **LocalStorage**
-   **No runtime dependencies** - completely self-contained

## Coding Standards & Patterns

### Naming Conventions

-   **Classes**: PascalCase (`Challenge`, `ChallengeList`, `TwitchChat`)
-   **Methods/Functions**: camelCase (`addChallenge`, `validateDescription`)
-   **Private fields**: `#` prefix (`#ws`, `#localStoreName`)
-   **Constants**: UPPER_SNAKE_CASE for config objects
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
// ✅ src/types/UIUpdateAction.ts
export enum UIUpdateAction {
    ADD = "add",
    EDIT = "edit",
    COMPLETE = "complete",
}
// ✅ Usage
import { UIUpdateAction } from "../types/UIUpdateAction";
const uiUpdate: UIUpdateData = { action: UIUpdateAction.ADD };
```

### Constants Management Guidelines

**CRITICAL**: All user-facing messages, error messages, response strings, configuration property names, DOM constants, colors, and numeric values must use centralized constant systems.

#### Comprehensive Constants System

-   **MessageConstants**: All message constants in `src/types/MessageConstants.ts` (ERROR_MESSAGES, SUCCESS_MESSAGES, HELP_MESSAGES, MODAL_TEXT, UI_ELEMENTS, ARIA_LABELS, etc.)
-   **ConfigConstants**: Configuration property names in `src/types/ConfigConstants.ts` (AUTH_CONFIG, BEHAVIOR_CONFIG, BACKGROUND_CONFIG, etc.)
-   **ColorConstants**: UI colors in `src/types/ColorConstants.ts` (DEFAULT_COLORS, STATUS_COLORS, SHADOW_COLORS)
-   **DOMConstants**: CSS classes, selectors, element IDs, HTML elements, HTML attribute names, HTML attribute values in `src/types/DOMConstants.ts` (CSS_CLASSES, ELEMENT_IDS, EVENT_NAMES, HTML_ELEMENTS, HTML_ATTRIBUTE_NAMES, HTML_ATTRIBUTES, MODAL_MODES, etc.)
-   **FileConstants**: File formats and filenames in `src/types/FileConstants.ts` (FILE_FORMATS, DEFAULT_FILENAMES)
-   **NumericConstants**: Validation constraints and calculations in `src/types/NumericConstants.ts` (FORM_CONSTRAINTS, COLOR_CONSTANTS)
-   **UPPER_SNAKE_CASE Naming**: All constants follow established naming convention
-   **Type Safety**: Use appropriate types for type-safe constant access
-   **No Magic Values**: Never use hardcoded strings, numbers, or CSS classes
-   **Centralized Organization**: Related constants grouped by purpose and functionality

#### DOMConstants Details

**HTML Attribute Names vs Values**:
-   **HTML_ATTRIBUTE_NAMES**: Attribute name strings for use in `setAttribute()` calls (ROLE, ARIA_LABEL, TABINDEX)
-   **HTML_ATTRIBUTES**: Attribute value strings (ROLE_BUTTON = "button", TABINDEX_ZERO = "0")

```typescript
// ✅ Usage examples
import { BACKGROUND_CONFIG, COLOR_CONFIG } from "../types/ConfigConstants";
import { DEFAULT_COLORS } from "../types/ColorConstants";
import { CSS_CLASSES, ELEMENT_IDS, EVENT_NAMES, HTML_ATTRIBUTE_NAMES, HTML_ATTRIBUTES } from "../types/DOMConstants";
import { ERROR_MESSAGES, MODAL_TEXT } from "../types/MessageConstants";

const backgroundColor = configManager.get(
    BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR
);
element.classList.add(CSS_CLASSES.DONE);
window.addEventListener(EVENT_NAMES.CHALLENGE_LIST_REFRESH, handler);

// HTML attribute usage
element.setAttribute(HTML_ATTRIBUTE_NAMES.ROLE, HTML_ATTRIBUTES.ROLE_BUTTON);
element.setAttribute(HTML_ATTRIBUTE_NAMES.ARIA_LABEL, ARIA_LABELS.EDIT_CHALLENGE);
element.setAttribute(HTML_ATTRIBUTE_NAMES.TABINDEX, HTML_ATTRIBUTES.TABINDEX_ZERO);
```

### Class Structure Pattern

```typescript
export default class ClassName {
    #privateField: type | null = null;
    public publicProperty: type;

    constructor(param: type) {
        this.publicProperty = this.validateParam(param);
    }

    methodName(param: type): returnType {
        // Implementation
    }
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

#### Common Fixes for IDE Issues:

-   **Undefined values**: Use optional chaining (`?.`) and nullish coalescing (`??`) operators
-   **Type assertions**: Prefer explicit type guards over `as any` type assertions
-   **Mock types**: Use `any` type for complex mock objects where proper typing is impractical
-   **Deprecated APIs**: Add explanatory comments when deprecated APIs must be used for backward compatibility or testing

```typescript
// ✅ Good: Proper null handling
const value = mockFunction.mock.calls[0]?.[0];
if (value) {
    processValue(value);
}

// ✅ Good: Documented use of any for complex mocks
let createElementSpy: any; // Complex DOM mock with overloaded signatures

// ✅ Good: Documented deprecated API usage
// Note: execCommand is deprecated but still used as a fallback in the implementation
(document as any).execCommand = execCommandMock;

// ❌ Bad: Ignoring type errors
// @ts-ignore
const value = mockFunction.mock.calls[0][0];
```

### Authentication & OAuth Token Handling

OAuth tokens are automatically validated and formatted by the TwitchChat class:

-   **Auto-correction**: Missing "oauth:" prefix is automatically added with console warning
-   **Validation**: Comprehensive null/undefined protection and format checking
-   **Error handling**: Clear feedback for invalid token scenarios

Generate tokens from **https://twitchtokengenerator.com** - the system will auto-correct format if needed.

## TypeScript Development Guidelines

### Development Requirements

-   **All new files** must be written in TypeScript (`.ts` extension)
-   **Type annotations** must be explicit for all public methods, properties, and function parameters
-   **Interface definitions** should be created for complex object types and reused across the codebase
-   **Strict TypeScript configuration** enforced for all development

### Build Process Integration

-   **Vite TypeScript support**: Automatic TypeScript compilation during development and build
-   **Type checking**: Run `pnpm run type-check` for standalone type validation
-   **Watch mode**: Use `pnpm run type-check:watch` for continuous type checking during development
-   **Single bundle output**: TypeScript files compile to the same `dist/challengeBot.iife.js` bundle
-   **No runtime overhead**: TypeScript types are stripped during compilation

### Type Safety Best Practices

-   **Explicit return types**: Always specify return types for public methods
-   **Interface over type**: Prefer `interface` declarations for object shapes that may be extended
-   **Strict null checks**: Handle `null` and `undefined` explicitly with optional chaining and nullish coalescing
-   **Generic constraints**: Use generic type parameters with constraints for reusable components
-   **Enum usage**: Prefer `const enum` for compile-time constants to reduce bundle size

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

### Configuration Access Pattern

```typescript
const configManager = ConfigManager.getInstance();
const maxChallenges = configManager.get("maxChallenges");
configManager.set("maxChallenges", 15);
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
        // Simple test isolation - clear localStorage for consistent test state
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

### Dual-Mode Architecture (Implemented)

Single challenge panel with dual-mode interface:

-   **Single HTML file** - Zero-server deployment
-   **URL fragment routing**:
    -   `file:///path/to/index.html` - Viewer Mode (OBS Browser Source)
    -   `file:///path/to/index.html#admin` - Admin Mode (overlay + admin panel)
-   **Permission Model**: Streamer/moderators only, no viewer interaction
-   **Command filtering**: Rejects unauthorized attempts

### Challenge Display with Numeric ID Prefixes (Implemented)

-   **Numeric ID prefix**: Each challenge row displays its position number at the beginning (e.g., "1. ", "2. ", "3. ")
-   **Visual format**: `"{id}. {challenge_title}"` where `{id}` is the 1-based position number
-   **Consistent display**: ID prefix appears in both viewer mode (OBS overlay) and admin mode
-   **User experience benefit**: Makes it easier for moderators to identify which numeric ID to use in chat commands
-   **Command integration**: IDs correspond to command parameters (e.g., `!ch done 1`, `!ch edit 2 title="New Title"`, `!ch delete 3`)
-   **Implementation**: ChallengeRenderer accepts optional `displayPosition` parameter for rendering ID prefix
-   **Position calculation**: Display position is calculated as `index + 1` (converting 0-based array indices to 1-based user-facing IDs)

**Example output formats**:

-   Simple challenge: `"1. Complete the tutorial"`
-   Challenge with progress: `"2. Collect 5 items (3/5)"`
-   Challenge with timer: `"3. Speed run challenge ⏱️ 5:30"`
-   Challenge with description:
    ```
    1. Testing Descriptions
    Should see a description for this challenge!
    ```

### Challenge Metadata Row Layout (Implemented)

-   **Metadata row container**: Challenge amount and timer are positioned in a dedicated `.challenge-metadata` flexbox container
-   **Prevents text truncation**: Title and description always display fully without being cut off by timer
-   **Proper positioning**: Amount on bottom-left, timer on bottom-right, never overlapping
-   **Flexbox layout**: Uses `display: flex` with `justify-content: space-between` for automatic spacing
-   **Conditional rendering**: Metadata row only created when amount > 1 OR timer exists
-   **Improved readability**: Challenge description font weight increased from 300 (light) to 400 (normal) for better readability

**Layout structure**:
```
.challenge (flex container, horizontal)
├── .challenge-checkbox
├── .challenge-edit-icon (admin only)
├── .challenge-increment-button (admin only, if amount > 1)
├── .challenge-decrement-button (admin only, if amount > 1)
└── .challenge-text (flex container, vertical)
    ├── .challenge-title
    ├── .challenge-description (if different from title)
    └── .challenge-metadata (flex container, horizontal)
        ├── .challenge-amount (left side)
        └── .challenge-timer (right side)
```

### Countdown Timer Display (Implemented)

-   **Real-time countdown**: Timers automatically count down every second with live updates
-   **Human-readable format**: Displays time in formats like "5:30", "1:23:45", "30s"
-   **Visual state indicators**: Dynamic color and emoji changes based on remaining time
-   **Normal State**: White text with ⏱️ emoji for timers with >2 minutes remaining
-   **Warning State** (≤2 minutes): Gold color (#ffd700) with 🟡 emoji
-   **Critical State** (≤30 seconds): Red color (#ff6b6b) with 🔴 emoji
-   **Expired State**: Bright red (#ff4757) with ⏰ emoji when timer reaches zero

### Unified Command System (Implemented)

Comprehensive command system with:

-   **Unified "!ch" prefix** with keyword subcommands
-   **Type-safe processing** with centralized command types
-   **Command aliasing** - multiple variations resolve to canonical types
-   **Dual syntax** - key=value and simple string
-   **Advanced management** - increment, decrement, set, multiple IDs
-   **Robust validation** and error handling

#### Command Type System

```typescript
// Centralized command types in src/types/CommandTypes.ts
export const CommandType = {
    // Challenge management commands
    ADD: "add",
    EDIT: "edit",
    DONE: "done",
    UNDONE: "undone",
    FAIL: "fail",
    DELETE: "delete",
    // Progress commands
    INCREMENT: "+",
    DECREMENT: "-",
    SET: "set",
    // Information commands
    LIST: "list",
    SHOW: "show",
    HELP: "help",
    // Admin commands
    CLEAR_ALL: "clearall",
    CLEAR_DONE: "cleardone",
} as const;

// Command aliasing system supports multiple aliases for each command type
// Permission Model: ALL commands require moderator/broadcaster permissions
```

#### Command Pattern Implementation

The command system uses the Command pattern for extensibility and maintainability:

-   **Command Interface**: Defines the contract for all command implementations
-   **BaseCommand Abstract Class**: Provides common functionality and dependencies
-   **Individual Command Classes**: Specific implementations for each command type
-   **CommandRegistry**: Manages command instances and routing
-   **Type-safe Command Routing**: Uses the centralized command type system

#### Current Command Processing Flow

1. **Command Reception**: TwitchChat receives "!ch [keyword] [parameters]" from IRC
2. **Command Validation**: App.chatHandler validates command format and user permissions
3. **Command Parsing**: CommandParser extracts keyword and parameters using dual syntax support
4. **Command Normalization**: CommandTypes.normalizeCommand() converts aliases to canonical types
5. **Command Execution**: CommandHandler routes to CommandRegistry which delegates to appropriate Command class
6. **Response Generation**: Formatted response returned to chat with success/error messaging

#### Dual Command Syntax Support

1. **Key=value parameter syntax**: `!ch add "Challenge Name" d="Description" a=5 t=10m`
    - **Abbreviated parameters**: `d=`, `a=`, `t=` (preferred for brevity)
    - **Full parameters**: `desc=`, `amount=`, `timer=` (also supported)
2. **Simple string syntax**: `!ch add Challenge Name` (uses entire string as title)

#### Enhanced Command Features

-   **Multiple Target ID Support**: Commands like "!ch done 1,3,5" can operate on multiple challenges simultaneously
-   **Parameter Validation**: Comprehensive validation for title length, timer format, amount values, etc.
-   **Timer Integration**: Full support for timer parameters in add commands with format validation
-   **Error Handling**: Detailed error messages for invalid commands, missing permissions, or malformed parameters
-   **Command Help System**: Built-in help command provides usage information for all available commands
-   **DOM Update Coordination**: Automatic completion status detection ensures real-time visual updates when progress operations trigger completion state changes

### Admin Panel Features (Implemented)

-   **Auto-save configuration** - All configuration changes are automatically saved to localStorage immediately when modified
-   **Configuration management** with live editing capabilities
-   **Challenge list controls** (clear all, clear completed)
-   **Configuration backup/restore** - Export and import configuration as JSON files
-   **Reset to defaults** - Restore default configuration values
-   **Color configuration** for challenge rows with opacity control
-   **App background opacity control** - Configurable opacity (0-100%) for the main app container background, allowing fully transparent overlays (default: 0%)
-   **Real-time configuration updates** across windows - Configuration changes trigger full page reload in viewer window
-   **Real-time challenge state synchronization** - Challenge state changes trigger DOM-only updates in viewer window
-   **Window refresh communication** via BroadcastChannel for automatic viewer window updates
-   **Interactive checkboxes** - Checkboxes in admin mode are clickable and toggle challenge completion status with real-time sync
-   **Checkbox styling consistency** - Admin mode checkboxes respect configured text colors from row color configuration
-   **Clear Finished Challenges button** - Dedicated button in admin mode to remove all completed challenges with real-time sync
-   **Add Challenge modal** - Admin panel modal for adding challenges with real-time sync to viewer window
-   **Edit Challenge modal** - Reuses Add Challenge modal infrastructure with mode switching (MODAL_MODES.ADD / MODAL_MODES.EDIT)
-   **Edit icon (✏️)** - Clickable edit icon appears next to checkboxes in admin mode only (conditionally rendered based on window.location.hash)

## Cross-Window Synchronization

The application uses **BroadcastChannel API** for real-time synchronization between admin and viewer windows, enabling automatic updates without manual browser refreshes.

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

### Synchronization Flow

#### Challenge State Changes (DOM-only update)

1. **Admin Action**: User performs action in admin mode (checkbox click, clear finished, add challenge)
2. **Local Update**: Challenge list updates in localStorage and local DOM updates
3. **Broadcast**: `notifyChallengeStateChanged()` sends BroadcastChannel message
4. **Viewer Receives**: WindowRefreshManager receives `'challenge-state-changed'` message
5. **Custom Event**: Dispatches `'challenge-list-refresh'` event on window
6. **App Handler**: `App.handleChallengeListRefresh()` catches event
7. **Reload & Render**: Calls `challengeList.loadFromLocalStorage()` and re-renders DOM
8. **Real-time Sync**: Changes appear immediately in viewer overlay

#### Configuration Changes (full page reload)

1. **Admin Action**: User modifies configuration in admin panel
2. **Auto-save**: Configuration saves to localStorage
3. **Broadcast**: `notifyConfigurationSaved()` sends BroadcastChannel message
4. **Viewer Receives**: WindowRefreshManager receives `'config-saved'` message
5. **Full Reload**: Triggers `window.location.reload()` in viewer window

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

-   **`loadFromLocalStorage()`** - Public method to reload challenges from localStorage
    -   Resets counters (`#challengesCompleted`, `#totalChallenges`)
    -   Clears challenge map (`#challengeMap`)
    -   Reloads all challenges via `#loadChallengeListFromLocalStorage()`
-   **`saveToLocalStorage()`** - Public method to persist challenge list changes to localStorage
    -   Used when external code modifies challenge properties directly (e.g., via setters)
    -   Calls internal `#commitToLocalStorage()` method
    -   Required after calling challenge setters like `setTitle()`, `setDescription()`, `setAmount()`, `setTimer()`

### DOMConstants Event Names

**Location**: `src/types/DOMConstants.ts`

-   **`EVENT_NAMES.CHALLENGE_LIST_REFRESH`** - Custom event name for challenge list refresh (`'challenge-list-refresh'`)

### Admin Actions with Real-Time Sync

All admin panel interactions that modify challenge state trigger `notifyChallengeStateChanged()`:

| Action                | Method                           | Trigger                     |
| --------------------- | -------------------------------- | --------------------------- |
| Checkbox click        | `App.handleCheckboxClick()`      | Toggle challenge completion |
| Clear Finished button | `App.handleClearFinishedClick()` | Remove completed challenges |
| Add Challenge modal   | `App.createChallengeFromForm()`  | Add new challenge           |
| Edit Challenge modal  | `App.updateChallengeFromForm()`  | Edit existing challenge     |

### Testing Cross-Window Synchronization

1. **Open two browser windows**:

    - Admin: `file:///path/to/index.html#admin`
    - Viewer: `file:///path/to/index.html`

2. **Test challenge state sync**:

    - Add challenge in admin → appears immediately in viewer
    - Edit challenge in admin → changes appear immediately in viewer
    - Click checkbox in admin → completion status updates immediately in viewer
    - Clear finished in admin → completed challenges removed immediately in viewer

3. **Test configuration sync**:
    - Change colors in admin → viewer reloads with new colors
    - Update max challenges in admin → viewer reloads with new limit

## Troubleshooting Common Issues

### Authentication Problems

**Help Commands Not Responding**

-   **Symptoms**: Bot doesn't respond to `!ch` or `!ch help` commands in Twitch chat, but other commands like `!ch add Test` work.
-   **Root Cause**: Invalid or missing OAuth token format causing authentication failures.
-   **Solution**:
    1. Generate new OAuth token from https://twitchtokengenerator.com
    2. Update `_config.js` with the new token
    3. Ensure proper format: Token must start with `oauth:` prefix
    4. Rebuild application: Run `pnpm run build`
    5. Refresh overlay in OBS or browser

### Timer-Related Issues

**Timer Not Displaying in Overlay**

-   **Symptoms**: Commands like `!ch add title="Test" timer=10s` execute successfully but timer doesn't appear in challenge rows.
-   **Root Cause**: Import/require issues in TypeScript/ES module environment causing timer validation to fail silently.
-   **Solution**:
    1. Check import statements: Ensure all Timer imports use ES module syntax: `import Timer from "../utils/Timer";`
    2. Rebuild application: Run `pnpm run build` after fixing imports
    3. Test with browser console: Use Playwright or browser dev tools to verify timer creation
    4. Check console logs: Look for timer validation errors during command processing

### Command Processing Issues

**Commands Ignored for Regular Users**

-   **Expected Behavior**: Regular viewers' commands are silently ignored (no response).
-   **Authorized Users**: Only broadcasters and moderators can use bot commands.
-   **Verification**: Check user permissions in Twitch chat - ensure you're testing with broadcaster or moderator account.

### DOM Update Issues

**Increment Commands Not Showing Completion State**

-   **Symptoms**: When increment commands cause a challenge to reach completion (e.g., `!ch + 1` changing 4/5 to 5/5), the backend state updates correctly but the overlay doesn't show completion styling until manual browser refresh.
-   **Solution**: This issue has been resolved in the current version through enhanced completion status detection in the `executeProgressOperation` method.
-   **Prevention**: The system now automatically detects completion status changes during all progress operations (increment, decrement, set) and applies appropriate DOM updates.

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
import { CSS_CLASSES, ELEMENT_IDS } from "../types/DOMConstants";

const configManager = ConfigManager.getInstance();
const maxChallenges = configManager.get(BEHAVIOR_CONFIG.MAX_CHALLENGES);
element?.classList.add(CSS_CLASSES.EXPANDED);
```

### Fallback Configuration Pattern

```typescript
import { createFallbackConfig } from "./utils/ConfigDefaults";

try {
    configManager = ConfigManager.getInstance(userConfig);
} catch (error) {
    const fallbackConfig = createFallbackConfig();
    configManager = ConfigManager.getInstance(fallbackConfig);
}
```

### DOM Manipulation

```typescript
// Fragment-based updates for performance
const fragment = document.createDocumentFragment();
items.forEach((item: Challenge) => {
    const element = createElement(item);
    fragment.appendChild(element);
});
container.appendChild(fragment);
```

### Validation Pattern

```typescript
validateInput(input: string): string {
    if (typeof input !== "string") {
        throw new Error("Input must be of type string");
    }
    input = input.trim();
    if (input.length === 0) {
        throw new Error("Input invalid");
    }
    return input;
}
```

### Challenge Persistence Pattern

When modifying challenge properties directly (outside of ChallengeList methods), you must manually persist changes to localStorage:

```typescript
// ✅ CORRECT: Using ChallengeList methods (auto-saves)
this.challengeList.addChallengeObjects(challenge); // Internally calls #commitToLocalStorage()
this.challengeList.toggleChallengeCompletion(challengeId); // Internally calls #commitToLocalStorage()
this.challengeList.incrementChallengeProgress(challengeId); // Internally calls #commitToLocalStorage()

// ✅ CORRECT: Direct property modification + manual save
const challenge = this.challengeList.getChallengeById(challengeId);
challenge.setTitle(newTitle);
challenge.setDescription(newDescription);
challenge.setAmount(newAmount);
this.challengeList.saveToLocalStorage(); // Required to persist changes

// ❌ INCORRECT: Direct property modification without save
const challenge = this.challengeList.getChallengeById(challengeId);
challenge.setTitle(newTitle); // Changes lost on page refresh!
```

**Key Points**:

-   **ChallengeList methods** (add, delete, toggle, increment, etc.) automatically save to localStorage
-   **Direct challenge setters** (setTitle, setDescription, setAmount, setTimer) do NOT auto-save
-   **Always call** `challengeList.saveToLocalStorage()` after using challenge setters
-   **Cross-window sync** requires calling `notifyChallengeStateChanged()` after persistence

### Challenge Rendering with ID Prefix Pattern

```typescript
import ChallengeRenderer from "../utils/ChallengeRenderer";

challenges.forEach((challenge: Challenge, index: number) => {
    const listItem = ChallengeRenderer.createChallengeElement(challenge, {
        displayPosition: index + 1, // Convert 0-based index to 1-based ID
        includeEventListeners: true,
        eventHandler: handleCheckboxClick,
    });
    container.appendChild(listItem);
});
```

**Key Points**:
- Use `displayPosition: index + 1` for ID prefix
- Format: `"{id}. {title}"` (e.g., "1. Complete tutorial")
- Metadata row (`.challenge-metadata`) automatically created when amount > 1 OR timer exists
- Amount and timer positioned side-by-side in metadata row (amount left, timer right)

### HTML Attribute Setting Pattern

Use `HTML_ATTRIBUTE_NAMES` constants for attribute names in `setAttribute()` calls:

```typescript
import { HTML_ATTRIBUTE_NAMES, HTML_ATTRIBUTES } from "../types/DOMConstants";
import { ARIA_LABELS, UI_ELEMENTS } from "../types/MessageConstants";

// ✅ CORRECT: Use constants for both attribute names and values
const editIcon = document.createElement(HTML_ELEMENTS.DIV);
editIcon.textContent = UI_ELEMENTS.EDIT_ICON;
editIcon.setAttribute(
    HTML_ATTRIBUTE_NAMES.ROLE,
    HTML_ATTRIBUTES.ROLE_BUTTON
);
editIcon.setAttribute(
    HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
    ARIA_LABELS.EDIT_CHALLENGE
);
editIcon.setAttribute(
    HTML_ATTRIBUTE_NAMES.TABINDEX,
    HTML_ATTRIBUTES.TABINDEX_ZERO
);

// ❌ INCORRECT: Hardcoded attribute names
editIcon.setAttribute("role", HTML_ATTRIBUTES.ROLE_BUTTON);
editIcon.setAttribute("aria-label", ARIA_LABELS.EDIT_CHALLENGE);
```

**Key Points**:
- **HTML_ATTRIBUTE_NAMES**: Attribute name strings (ROLE = "role", ARIA_LABEL = "aria-label", TABINDEX = "tabindex")
- **HTML_ATTRIBUTES**: Attribute value strings (ROLE_BUTTON = "button", TABINDEX_ZERO = "0")
- Always use constants for both attribute names and values to eliminate magic strings

### Admin Panel Template Pattern

HTML templates for admin panel sections are centralized in `src/templates/AdminPanelTemplates.ts`:

```typescript
import { AdminPanelTemplates } from "../templates/AdminPanelTemplates";

const colorContent = AdminPanelTemplates.colorSection({
    primaryBackgroundColor: DEFAULT_COLORS.PRIMARY_BACKGROUND,
    // ... other parameters
});
```

**Benefits**: Separation of concerns, type safety, maintainability, reusability
