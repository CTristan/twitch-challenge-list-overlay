# AGENTS.md - Development Reference Guide

## Project Overview

**Twitch Challenge Overlay** - Browser-based single-streamer challenge management overlay with dual-mode architecture (admin/viewer). OBS Browser Source with Twitch IRC integration, zero-server deployment.

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
│   ├── utils/             # CommandHandler, Timer, UIUpdateHandler, ConfigDefaults
│   ├── types/             # Type definitions and constants
│   ├── animations/        # UI animations
│   ├── app.ts, index.ts, dualWindow.ts, modal.ts, styleLoader.ts
├── styles/                # CSS (admin, app, modal, utility, variables)
├── tests/                 # Unit tests - 80% coverage requirement
├── types/globals.d.ts     # Global types (interfaces/types only - NO enums)
├── _config.js, dist/, tsconfig.json, vite.config.ts, vitest.config.ts, index.html
```

### Key Classes

-   **App**: Main controller, DOM rendering, chat commands, timer display
-   **ChallengeList**: Unified challenge list and persistence
-   **Challenge**: State management and timer integration
-   **AdminPanel**: Admin interface and configuration
-   **ConfigManager**: Singleton configuration with localStorage
-   **CommandHandler/CommandRegistry**: Command execution and routing
-   **Command/BaseCommand**: Command pattern interface and base class
-   **CommandParser**: key=value and simple string syntax parsing
-   **CommandTypes**: Type-safe command constants and aliasing
-   **MessageConstants**: Centralized user-facing messages
-   **ColorConstants**: UI colors and status indicators
-   **ConfigConstants**: Configuration property names
-   **DOMConstants**: CSS classes, selectors, element IDs
-   **FileConstants**: File formats and filenames
-   **NumericConstants**: Validation constraints
-   **UIUpdateHandler**: DOM manipulation coordination
-   **ConfigDefaults**: Fallback configuration utility
-   **TwitchChat**: WebSocket IRC client with OAuth validation
-   **EventEmitter**: Custom event system
-   **Timer**: Countdown, formatting, state management
-   **TimerController**: Timer lifecycle management

## Technology Stack

### Core Technologies

-   **TypeScript** with ES modules (fully migrated from JavaScript ES6+)
-   **Vite** for build tooling (IIFE bundle format) with TypeScript support
-   **Vitest** for testing with jsdom environment
-   **CSS Custom Properties** for dynamic styling
-   **WebSocket** for Twitch IRC connection
-   **LocalStorage** for data persistence

### External Dependencies

-   **Standard Version** for release management
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
-   **Eliminate magic strings**: Replace hardcoded string literals with centralized constants or enum values
-   **Type assertions discouraged**: Avoid `"string_literal" as EnumType` patterns in favor of proper enum references
-   **Centralized constants**: Use established systems like `CommandType`, `UIUpdateAction`, and `MessageConstants` for type-safe operations
-   **Message constants**: Use `MessageConstants` for all user-facing messages, error messages, and response strings instead of hardcoded strings

### Enum Management Guidelines

**CRITICAL**: All enums must be defined in separate `.ts` files, NOT in `types/globals.d.ts`.

-   **Enum Location**: Define all enums in individual `.ts` files within `src/types/` directory (e.g., `src/types/UIUpdateAction.ts`)
-   **Global Types Limitation**: `types/globals.d.ts` should contain only interfaces, types, and global declarations - never enums
-   **Import Requirement**: Enums must be explicitly imported where needed using ES module syntax: `import { EnumName } from "../types/EnumName"`
-   **TypeScript Resolution**: Enums in `.d.ts` files are not properly accessible for import in ES modules, causing `ReferenceError: [EnumName] is not defined`

```typescript
// ✅ src/types/UIUpdateAction.ts
export enum UIUpdateAction {
    ADD = "add",
    EDIT = "edit",
    COMPLETE = "complete",
}

// ✅ Usage in command files
import { UIUpdateAction } from "../types/UIUpdateAction";
const uiUpdate: UIUpdateData = { action: UIUpdateAction.ADD };
```

### Constants Management Guidelines

**CRITICAL**: All user-facing messages, error messages, response strings, configuration property names, DOM constants, colors, and numeric values must use centralized constant systems.

#### Comprehensive Constants System

-   **MessageConstants**: All message constants in `src/types/MessageConstants.ts` (ERROR_MESSAGES, SUCCESS_MESSAGES, HELP_MESSAGES, etc.)
-   **ConfigConstants**: Configuration property names in `src/types/ConfigConstants.ts` (AUTH_CONFIG, BEHAVIOR_CONFIG, BACKGROUND_CONFIG, etc.)
-   **ColorConstants**: UI colors in `src/types/ColorConstants.ts` (DEFAULT_COLORS, STATUS_COLORS, SHADOW_COLORS)
-   **DOMConstants**: CSS classes, selectors, element IDs in `src/types/DOMConstants.ts` (CSS_CLASSES, ELEMENT_IDS, EVENT_NAMES)
-   **FileConstants**: File formats and filenames in `src/types/FileConstants.ts` (FILE_FORMATS, DEFAULT_FILENAMES)
-   **NumericConstants**: Validation constraints and calculations in `src/types/NumericConstants.ts` (FORM_CONSTRAINTS, COLOR_CONSTANTS)
-   **UPPER_SNAKE_CASE Naming**: All constants follow established naming convention
-   **Type Safety**: Use appropriate types for type-safe constant access
-   **No Magic Values**: Never use hardcoded strings, numbers, or CSS classes
-   **Centralized Organization**: Related constants grouped by purpose and functionality

```typescript
// ✅ Usage across the application
import { BACKGROUND_CONFIG } from "../types/ConfigConstants";
import { DEFAULT_COLORS } from "../types/ColorConstants";
import { CSS_CLASSES } from "../types/DOMConstants";
import { ERROR_MESSAGES } from "../types/MessageConstants";

const backgroundColor = configManager.get(
    BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR
);
element.classList.add(CSS_CLASSES.DONE);
const color = DEFAULT_COLORS.PRIMARY_BACKGROUND;
return this.createSuccessResponse(ERROR_MESSAGES.NO_CHALLENGES_TO_CLEAR);
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
// Get ConfigManager instance
const configManager = ConfigManager.getInstance();

// Get specific configuration values
const maxChallenges = configManager.get("maxChallenges");
const authConfig = configManager.get("auth");

// Update configuration
configManager.set("maxChallenges", 15);
configManager.set("auth", {
    twitch_oauth: "your_oauth_token",
    twitch_username: "your_username",
    twitch_channel: "your_channel",
});
```

### Default Configuration Structure

The system includes built-in defaults for all configuration properties:

-   **Authentication settings**: Empty strings (configured via admin panel)
-   **Basic behavior**: maxChallenges: 10
-   **Command mappings**: Unified "!ch" prefix system
-   **Response templates**: Standardized bot responses
-   **Color configuration**: Optional challenge row styling

### ConfigDefaults Utility Module

The **ConfigDefaults** utility provides modular fallback configuration creation and validation:

#### Core Functions

-   **`createFallbackConfig()`**: Creates a complete, valid Config object with default values for error recovery
-   **`isValidFallbackConfig()`**: Validates configuration structure with comprehensive property checking
-   **`getDefaultMaxChallenges()`**: Returns the default maximum challenges value (10)
-   **`getDefaultAuthConfig()`**: Returns default auth configuration with empty credential strings

#### Usage Pattern

```typescript
import { createFallbackConfig } from "./utils/ConfigDefaults";

// Error recovery in configuration loading
try {
    configManager = ConfigManager.getInstance(userConfig);
} catch (error) {
    console.warn("Configuration loading failed, using fallback");
    const fallbackConfig = createFallbackConfig();
    configManager = ConfigManager.getInstance(fallbackConfig);
}
```

#### Refactoring Benefits

-   **Improved testability**: Fallback configuration logic can be tested independently
-   **Better modularity**: Configuration creation separated from error handling
-   **Enhanced coverage**: Achieves 97.5% statement coverage with comprehensive unit tests
-   **Type safety**: Full TypeScript support with proper Config interface compliance

## Testing Patterns

### Test Organization

-   **Unit tests** for each class in parallel file structure
-   **jsdom environment** for DOM testing with Vitest
-   **80% coverage thresholds** (statements, branches, functions, lines)
-   **Specialized test utilities** (chatHandlerTestUtils.ts, domTestUtils.ts)
-   **Dual-layer testing**: Integration tests (app-level) + Unit tests (individual commands)

### Test Coverage Summary

| Component        | Tests | Statement | Branch | Function | Line   |
| ---------------- | ----- | --------- | ------ | -------- | ------ |
| App              | 27    | 92.59%    | 88.46% | 95.45%   | 92.59% |
| AdminPanel       | 35    | 89.92%    | 82.22% | 92.3%    | 89.92% |
| Index.ts         | 21    | 84.5%     | 90%    | 100%     | 84.5%  |
| CommandRegistry  | 34    | 100%      | 100%   | 100%     | 100%   |
| ConfigDefaults   | 18    | 97.5%     | 95%    | 100%     | -      |
| TwitchChat       | 34    | 100%      | 90.19% | 100%     | 100%   |
| loadTestUsers    | 25    | 100%      | 100%   | 100%     | 100%   |
| AddCommand       | 27    | -         | -      | -        | -      |
| EditCommand      | 47    | 98.14%    | 95.23% | 100%     | 98.14% |
| DoneCommand      | 32    | 88.88%    | 82.35% | 100%     | 88.88% |
| UndoneCommand    | 32    | 89.33%    | 88.23% | 100%     | 89.33% |
| DeleteCommand    | 30    | 83.33%    | 83.33% | 100%     | 83.33% |
| FailCommand      | 33    | 84.12%    | 82.35% | 100%     | 84.12% |
| HelpCommand      | 43    | 100%      | 100%   | 100%     | 100%   |
| ListCommand      | 45    | 93.28%    | 92.85% | 100%     | 93.28% |
| SetCommand       | 38    | 100%      | 100%   | 100%     | 100%   |
| ShowCommand      | 24    | 94.93%    | 95.23% | 100%     | 94.93% |
| ClearAllCommand  | 10    | 100%      | 100%   | 100%     | 100%   |
| ClearDoneCommand | 13    | 100%      | 100%   | 100%     | 100%   |

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

### Test Suite Categories

**App (27 tests, 7 categories)**: Constructor/initialization, checkbox error handling, timer methods, admin mode, DOM errors, integration tests, branch coverage

**Index.ts (21 tests, 5 categories)**: Module initialization, config error handling, error path testing, window load events, TwitchChat handlers

**AdminPanel (35 tests, 10 categories)**: Initialization/mode handling, config validation, save/reset, background config, export, import file handling, UI refresh, feedback system

**CommandRegistry (34 tests, 8 categories, 100% coverage)**: Constructor/init, getCommand, hasCommand, getRegisteredCommands, executeCommand, registerCommand, unregisterCommand, command pattern integration

**ConfigDefaults (18 tests, 4 categories)**: createFallbackConfig, isValidFallbackConfig, getDefaultMaxChallenges, getDefaultAuthConfig

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

-   **Configuration management** with live editing capabilities
-   **Challenge list controls** (clear all, clear completed)
-   **Configuration export/import** functionality
-   **Color configuration** for challenge rows
-   **Real-time configuration updates** across windows
-   **Window refresh communication** via BroadcastChannel for automatic viewer window updates

## Troubleshooting Common Issues

### Authentication Problems

#### Help Commands Not Responding

**Symptoms**: Bot doesn't respond to `!ch` or `!ch help` commands in Twitch chat, but other commands like `!ch add Test` work.
**Root Cause**: Invalid or missing OAuth token format causing authentication failures.
**Solution**:

1. **Generate new OAuth token** from https://twitchtokengenerator.com
2. **Update `_config.js`** with the new token
3. **Ensure proper format**: Token must start with `oauth:` prefix
4. **Rebuild application**: Run `pnpm run build`
5. **Refresh overlay** in OBS or browser

### Timer-Related Issues

#### Timer Not Displaying in Overlay

**Symptoms**: Commands like `!ch add title="Test" timer=10s` execute successfully but timer doesn't appear in challenge rows.
**Root Cause**: Import/require issues in TypeScript/ES module environment causing timer validation to fail silently.
**Solution**:

1. **Check import statements**: Ensure all Timer imports use ES module syntax:
    ```typescript
    import Timer from "../utils/Timer"; // ✅ Correct
    // const Timer = require("../utils/Timer").default;  // ❌ Incorrect
    ```
2. **Rebuild application**: Run `pnpm run build` after fixing imports
3. **Test with browser console**: Use Playwright or browser dev tools to verify timer creation
4. **Check console logs**: Look for timer validation errors during command processing

### Command Processing Issues

#### Commands Ignored for Regular Users

**Expected Behavior**: Regular viewers' commands are silently ignored (no response).
**Authorized Users**: Only broadcasters and moderators can use bot commands.
**Verification**: Check user permissions in Twitch chat - ensure you're testing with broadcaster or moderator account.

### DOM Update Issues

#### Increment Commands Not Showing Completion State

**Symptoms**: When increment commands cause a challenge to reach completion (e.g., `!ch + 1` changing 4/5 to 5/5), the backend state updates correctly but the overlay doesn't show completion styling until manual browser refresh.
**Solution**: This issue has been resolved in the current version through enhanced completion status detection in the `executeProgressOperation` method.
**Prevention**: The system now automatically detects completion status changes during all progress operations (increment, decrement, set) and applies appropriate DOM updates.

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
// Comprehensive constants usage across the application
import {
    BEHAVIOR_CONFIG,
    COLOR_CONFIG,
    BACKGROUND_CONFIG,
} from "../types/ConfigConstants";
import { DEFAULT_COLORS, STATUS_COLORS } from "../types/ColorConstants";
import { CSS_CLASSES, ELEMENT_IDS, EVENT_NAMES } from "../types/DOMConstants";
import { FORM_CONSTRAINTS } from "../types/NumericConstants";
import { CommandType, normalizeCommand } from "../types/CommandTypes";

const configManager = ConfigManager.getInstance();
const maxChallenges = configManager.get(BEHAVIOR_CONFIG.MAX_CHALLENGES);
const backgroundColor = configManager.get(
    BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR
);

// DOM manipulation with constants
const element = document.getElementById(ELEMENT_IDS.CONFIG_FORM);
element?.classList.add(CSS_CLASSES.EXPANDED);
element?.addEventListener(EVENT_NAMES.CLICK, handler);

// Color and validation with constants
const primaryColor = DEFAULT_COLORS.PRIMARY_BACKGROUND;
const maxValue = FORM_CONSTRAINTS.MAX_CHALLENGES_MAX;
const commandType = normalizeCommand("add"); // Returns CommandType.ADD
```

### Fallback Configuration Pattern

```typescript
import { createFallbackConfig } from "./utils/ConfigDefaults";

// Error recovery in configuration loading
let configManager: ConfigManager;
try {
    configManager = ConfigManager.getInstance(userConfig);
} catch (error) {
    console.warn("Configuration loading failed, using fallback");
    const fallbackConfig = createFallbackConfig();
    configManager = ConfigManager.getInstance(fallbackConfig);
}

// Validation of fallback configuration
import { isValidFallbackConfig } from "./utils/ConfigDefaults";
const config = createFallbackConfig();
if (isValidFallbackConfig(config)) {
    // Configuration is valid and ready to use
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
