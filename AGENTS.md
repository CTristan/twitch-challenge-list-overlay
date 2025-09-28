# AGENTS.md - Development Reference Guide

## Project Overview

**Twitch Challenge Overlay** - A lightweight browser-based single-streamer challenge management overlay for Twitch streamers with dual-mode architecture. Features an admin interface for streamers/moderators and a viewer display for on-stream use. Built as an OBS Browser Source with real-time Twitch IRC integration and zero-server deployment.

## Project Structure & Architecture

### Core Architecture

-   **Frontend-only application** - No backend/database required
-   **Event-driven architecture** using custom EventEmitter pattern
-   **Modular class-based design** with clear separation of concerns
-   **Configuration-driven** with external config files for customization

### Directory Structure

```
├── src/                    # Source code (fully TypeScript)
│   ├── classes/           # Core business logic (AdminPanel, Challenge, ChallengeList, ConfigManager, ConfigExporter)
│   ├── commands/          # Command pattern implementation (15+ command classes)
│   ├── twitch/            # Twitch IRC integration (TwitchChat, EventEmitter, message-parsers)
│   ├── utils/             # Utility modules (CommandHandler, Timer, UIUpdateHandler, etc.)
│   ├── types/             # TypeScript type definitions and constants
│   ├── animations/        # UI animations
│   ├── app.ts, index.ts, dualWindow.ts, modal.ts, styleLoader.ts
├── styles/                # CSS organization (admin, app, modal, utility, variables)
├── tests/                 # Unit tests (TypeScript) - 80% coverage requirement
├── types/globals.d.ts     # Global type definitions (interfaces/types only - NO enums)
├── _config.js, dist/, tsconfig.json, vite.config.ts, vitest.config.ts, index.html
```

### Key Classes & Responsibilities

-   **App**: Main controller, DOM rendering, chat command handling, timer display management
-   **ChallengeList**: Manages single unified challenge list and persistence
-   **Challenge**: Individual challenge with state management and timer integration
-   **AdminPanel**: Admin interface functionality and configuration management
-   **ConfigManager**: Singleton configuration management with localStorage persistence
-   **ConfigExporter**: Configuration backup and export functionality
-   **CommandHandler**: Command execution coordinator that delegates to CommandRegistry
-   **CommandRegistry**: Centralized command management using Command pattern
-   **Command/BaseCommand**: Command pattern interface and abstract base class for all commands
-   **Individual Command Classes**: Specific command implementations (AddCommand, EditCommand, etc.)
-   **CommandParser**: Command parsing utilities with key=value parameter syntax and simple string fallback support
-   **CommandTypes**: Type-safe command constants, aliasing system, and permission categorization
-   **MessageConstants**: Centralized string management system for all user-facing messages, error messages, and response strings
-   **ColorConstants**: Centralized color constants for UI elements, status indicators, and theming
-   **ConfigConstants**: Configuration property names and defaults with type-safe access patterns
-   **DOMConstants**: CSS classes, selectors, element IDs, and DOM-related constants
-   **FileConstants**: File format, extension, and filename constants for import/export operations
-   **NumericConstants**: Numeric constraints, validation values, and calculation constants
-   **CollapsibleSection**: Admin panel collapsible sections with localStorage persistence and accessibility
-   **ColorUtils**: Color manipulation, brightness detection, and optimal text color calculation
-   **ResponseFormatter**: Centralized response formatting with consistent messaging using MessageConstants
-   **StorageManager**: Storage management with localStorage fallback and error handling
-   **ValidationUtils**: Centralized validation utilities for consistent data validation
-   **PositionUtils**: Lightweight utility functions for position-based challenge references (e.g., #1, #2, #3)
-   **Timer**: Timer functionality with countdown, formatting, and state management
-   **TimerController**: Centralized timer lifecycle management with coordinated timer update intervals
-   **TimerDisplayUtils**: Shared utilities for timer display management to eliminate duplication
-   **ChallengeRenderer**: Shared utilities for challenge DOM creation to eliminate duplication
-   **DOMHelper**: Shared DOM manipulation routines for consistent challenge management operations
-   **UIUpdateHandler**: DOM manipulation and UI update coordination for command results
-   **TwitchChat**: WebSocket IRC client with event emission and OAuth token validation
-   **EventEmitter**: Custom event system for decoupled communication
-   **ErrorHandler**: Centralized error handling and logging system
-   **WindowRefresh**: BroadcastChannel communication for window refresh coordination

## Core Utility Classes

### UIUpdateHandler

Handles all DOM manipulation operations based on command results. Provides separation of concerns between command processing and UI updates.

### ChallengeRenderer

Shared utilities for challenge DOM creation to eliminate duplication between App.ts and UIUpdateHandler.ts rendering logic.

### TimerDisplayUtils

Shared utilities for timer display management with optimized performance using Map-based challenge lookup.

### DOMHelper

Shared DOM manipulation routines for consistent challenge management operations.

### TimerController

Centralized timer lifecycle management with coordinated timer update intervals.

### CollapsibleSection

Utility class for creating and managing collapsible sections with localStorage persistence and accessibility features.

### ColorUtils

Color manipulation and brightness detection utilities for background customization features.

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
-   **Established Pattern**: Follow the `UIUpdateAction` and `CommandType` patterns as examples of proper enum organization
-   **Single Source of Truth**: All enums are defined only in separate `.ts` files - no duplication in globals.d.ts

**Example of correct enum structure**:

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

#### Message Constants

-   **MessageConstants Location**: All message constants are defined in `src/types/MessageConstants.ts`
-   **Organized Categories**: Constants are grouped by purpose (ERROR_MESSAGES, SUCCESS_MESSAGES, HELP_MESSAGES, etc.)
-   **UPPER_SNAKE_CASE Naming**: All message constants follow the established naming convention
-   **Import Requirement**: Message constants must be explicitly imported: `import { ERROR_MESSAGES } from "../types/MessageConstants"`
-   **No Hardcoded Strings**: Avoid hardcoded string literals for any user-facing text
-   **Consistent Messaging**: All similar messages across the application use the same constant

#### Comprehensive Constants System

-   **ConfigConstants**: Configuration property names in `src/types/ConfigConstants.ts` (AUTH_CONFIG, BEHAVIOR_CONFIG, BACKGROUND_CONFIG, etc.)
-   **ColorConstants**: UI colors in `src/types/ColorConstants.ts` (DEFAULT_COLORS, STATUS_COLORS, SHADOW_COLORS)
-   **DOMConstants**: CSS classes, selectors, element IDs in `src/types/DOMConstants.ts` (CSS_CLASSES, ELEMENT_IDS, EVENT_NAMES)
-   **FileConstants**: File formats and filenames in `src/types/FileConstants.ts` (FILE_FORMATS, DEFAULT_FILENAMES)
-   **NumericConstants**: Validation constraints and calculations in `src/types/NumericConstants.ts` (FORM_CONSTRAINTS, COLOR_CONSTANTS)
-   **UPPER_SNAKE_CASE Naming**: All constants follow established naming convention
-   **Type Safety**: Use appropriate types for type-safe constant access
-   **No Magic Values**: Never use hardcoded strings, numbers, or CSS classes
-   **Centralized Organization**: Related constants grouped by purpose and functionality

**Example of correct usage**:

```typescript
// ✅ src/types/MessageConstants.ts
export const ERROR_MESSAGES = {
    NO_CHALLENGES_TO_CLEAR: "No challenges to clear",
    CHALLENGE_NOT_FOUND: "Challenge not found",
} as const;

// ✅ Usage in command files
import { ERROR_MESSAGES } from "../types/MessageConstants";
return this.createSuccessResponse(ERROR_MESSAGES.NO_CHALLENGES_TO_CLEAR);
```

```typescript
// ✅ src/types/ConfigConstants.ts
export const BACKGROUND_CONFIG = {
    CHALLENGE_BACKGROUND_COLOR: "challengeBackgroundColor",
    CHALLENGE_BACKGROUND_OPACITY: "challengeBackgroundOpacity",
} as const;

// ✅ Usage across the application
import { BACKGROUND_CONFIG } from "../types/ConfigConstants";
import { DEFAULT_COLORS } from "../types/ColorConstants";
import { CSS_CLASSES } from "../types/DOMConstants";

const backgroundColor = configManager.get(
    BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR
);
element.classList.add(CSS_CLASSES.DONE);
const color = DEFAULT_COLORS.PRIMARY_BACKGROUND;
```

**Avoid**: Never use hardcoded strings, CSS classes, colors, or numeric values. Always use centralized constants.

### Documentation Standards

-   **JSDoc comments** for all classes, methods, and complex functions
-   **TypeScript type annotations** for all code (native TypeScript types)
-   **Type definitions** in `types/globals.d.ts` and inline TypeScript interfaces
-   **Method documentation** includes parameters, return types, and throws

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

### Authentication & OAuth Token Handling

OAuth tokens are automatically validated and formatted by the TwitchChat class:

-   **Auto-correction**: Missing "oauth:" prefix is automatically added with console warning
-   **Validation**: Comprehensive null/undefined protection and format checking
-   **Error handling**: Clear feedback for invalid token scenarios

Generate tokens from **https://twitchtokengenerator.com** - the system will auto-correct format if needed.

### State Management

-   **Immutable updates** where possible
-   **LocalStorage persistence** with automatic serialization
-   **Event-driven updates** using custom EventEmitter
-   **Centralized state** in ChallengeList class

## TypeScript Development Guidelines

### Development Requirements

-   **All new files** must be written in TypeScript (`.ts` extension)
-   **Type annotations** must be explicit for all public methods, properties, and function parameters
-   **Interface definitions** should be created for complex object types and reused across the codebase
-   **Strict TypeScript configuration** enforced for all development

### TypeScript Configuration

The project uses strict TypeScript configuration with key settings: strict type checking, ES2022 target, ESNext modules, bundler resolution, and advanced TypeScript features like noUncheckedIndexedAccess, exactOptionalPropertyTypes, and path mapping for better imports.

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

// Get all configuration
const allConfig = configManager.getAll();
```

### Default Configuration Structure

The system includes built-in defaults for all configuration properties:

-   **Authentication settings**: Empty strings (configured via admin panel)
-   **Basic behavior**: maxChallenges: 10
-   **Command mappings**: Unified "!ch" prefix system
-   **Response templates**: Standardized bot responses
-   **Color configuration**: Optional challenge row styling

### OAuth Token Generation

For Twitch authentication, generate OAuth tokens from **https://twitchtokengenerator.com** - the system will auto-correct format if needed.

### Dynamic Style Loading

-   CSS custom properties updated via JavaScript
-   camelCase config keys converted to kebab-case CSS variables

## Testing Patterns

### Test Organization

-   **Unit tests** for each class in parallel file structure
-   **Global setup** with mocked configuration objects
-   **jsdom environment** for DOM testing
-   **Vitest** with coverage reporting and 80% coverage thresholds
-   **Specialized test utilities** (chatHandlerTestUtils.ts, domTestUtils.ts)
-   **Comprehensive test categories** (app/, classes/, commands/, integration/, twitch/, utils/)
-   **Integration-focused command testing** - commands tested through app-level integration tests rather than individual unit tests
-   **Command-specific tests** only for complex commands requiring detailed testing (e.g., UndoneCommand.test.ts)
-   **End-to-end command processing** validation through integration test suite

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

### Test Isolation Best Practices

-   **Simple test isolation**: Always call `ensureTestIsolation()` in `beforeEach` to clear localStorage for consistent test state
-   **State cleanup**: Reset any shared state between tests to prevent interference
-   **Consistent test data**: Use predictable test data that doesn't depend on previous test execution
-   **Mock external dependencies**: Mock DOM elements, localStorage, and other external systems for reliable testing

### Test Coverage Requirements

-   **Coverage thresholds**: 80% minimum across all metrics (statements, branches, functions, lines)
-   **Provider**: v8 coverage provider for accurate TypeScript coverage
-   **Reporting**: Text and HTML coverage reports generated
-   **Enforcement**: Build fails if coverage thresholds are not met

### Specialized Test Categories

-   **OAuth Validation Tests**: Comprehensive OAuth token validation scenarios
-   **Integration Tests**: End-to-end command processing and chat flow validation
-   **Increment-to-Completion Tests**: DOM update coordination for progress operations that trigger completion
-   **Permission Tests**: User role and access control validation
-   **Error Handling Tests**: Defensive programming and edge case coverage

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

## CSS Architecture

### CSS Organization

```css
/* styles/index.css - Main entry point */
@import url("./variables.css"); /* CSS custom properties */
@import url("./utility.css"); /* Utility classes */
@import url("./modal.css"); /* Modal-specific styles */
@import url("./admin.css"); /* Admin panel styles */
@import url("./app.css"); /* Main application styles */
```

### Styling Patterns

-   **CSS Custom Properties** for all configurable values
-   **BEM-like naming** for component classes
-   **Utility classes** for common patterns
-   **Responsive design** using viewport units and flexbox
-   **State-based styling** for timer visual indicators (warning, critical, expired)

### Timer-Specific CSS Variables

```css
/* Timer Display Variables */
--challenge-timer-font-size: 1.6rem;
--challenge-timer-color: #ffffff;
--challenge-timer-warning-color: #ffd700;
--challenge-timer-critical-color: #ff6b6b;
--challenge-timer-expired-color: #ff4757;
```

## Current Features

### Countdown Timer Display (Implemented)

The application features a comprehensive countdown timer display system for challenge rows:

#### Timer Display Functionality

-   **Real-time countdown**: Timers automatically count down every second with live updates
-   **Human-readable format**: Displays time in formats like "5:30", "1:23:45", "30s"
-   **Visual state indicators**: Dynamic color and emoji changes based on remaining time
-   **Seamless integration**: Works with existing Timer class infrastructure and command system

#### Visual State System

-   **Normal State**: White text with ⏱️ emoji for timers with >2 minutes remaining
-   **Warning State** (≤2 minutes): Gold color (#ffd700) with 🟡 emoji
-   **Critical State** (≤30 seconds): Red color (#ff6b6b) with 🔴 emoji
-   **Expired State**: Bright red (#ff4757) with ⏰ emoji when timer reaches zero

#### Technical Implementation

-   **DOM Structure**: Timer elements created as `<div class="challenge-timer">` within challenge rows
-   **Update System**: Uses `setInterval` for real-time updates with automatic cleanup
-   **State Management**: Timer state persists across window refreshes via existing storage system
-   **Performance**: Efficient DOM updates using targeted element queries and batch operations

### Dual-Mode Architecture (Implemented)

The application features a complete dual-mode architecture system with a single challenge panel that works in two different modes:

#### Architecture Implementation

-   **Single HTML file deployment** with zero-server requirements
-   **Single challenge panel display** - One unified challenge overlay visible to users
-   **URL fragment-based routing** for interface mode switching:
    -   `file:///path/to/index.html` - **Viewer Mode**: Clean challenge overlay only (for OBS Browser Source)
    -   `file:///path/to/index.html#admin` - **Admin Mode**: Challenge overlay + admin panel (for streamer configuration)
-   **Dynamic interface switching** via hash change events without affecting challenge display
-   **Vite build system** outputs single JavaScript bundle for production

#### Key Architecture Principles

-   **Single Challenge Panel**: Only ONE challenge list is displayed to users - no duplicate containers or visual duplication
-   **Mode-Based Interface**: The same challenge panel works in both viewer and admin modes
-   **Clean Separation**: Admin functionality is additive (admin panel appears/disappears) without duplicating the core challenge display

#### Permission Model (Single-Streamer Controlled)

The project implements a controlled single-streamer challenge management system:

-   **Single challenge panel** displayed on overlay (unified view)
-   **Restricted permissions** limited to streamer and moderators only
-   **No viewer interaction** - regular users cannot add, modify, or remove challenges
-   **Administrative control** exclusively managed by authorized users
-   **Centralized challenge management** with streamer-focused workflow
-   **Permission validation** integrated with Twitch user roles (broadcaster, moderator)
-   **Command filtering** to reject unauthorized challenge management attempts
-   **UI simplification** with single unified challenge display
-   **State management** using ChallengeList architecture
-   **Configuration-driven** command and response system
-   **Error messaging** for unauthorized access attempts

### Admin Panel Features (Implemented)

-   **Configuration management** with live editing capabilities
-   **Challenge list controls** (clear all, clear completed)
-   **Configuration export/import** functionality
-   **Color configuration** for challenge rows
-   **Real-time configuration updates** across windows
-   **Window refresh communication** via BroadcastChannel for automatic viewer window updates

### Unified Command System (Implemented)

The project implements a comprehensive unified command system with the following features:

#### Core Command Architecture

-   **Unified "!ch" prefix** for all commands with keyword subcommands
-   **Type-safe command processing** with centralized command type system
-   **Command aliasing** supporting multiple command variations that resolve to canonical types
-   **Dual syntax support** - both key=value parameters and simple string syntax
-   **Advanced challenge management** (increment, decrement, set progress, multiple target IDs)
-   **Robust error handling** and validation

#### Command Type System

The project uses a centralized command type system for type safety and maintainability:

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
    CHECK: "check",
    HELP: "help",

    // Admin commands
    CLEAR_ALL: "clearall",
    CLEAR_DONE: "cleardone",
} as const;

// Command aliasing system
export const CommandAliases: Record<string, CommandTypeValue> = {
    // Primary command names
    add: CommandType.ADD,
    edit: CommandType.EDIT,
    done: CommandType.DONE,
    undone: CommandType.UNDONE,
    fail: CommandType.FAIL,
    delete: CommandType.DELETE,
    "+": CommandType.INCREMENT,
    "-": CommandType.DECREMENT,
    set: CommandType.SET,
    list: CommandType.LIST,
    show: CommandType.SHOW,
    check: CommandType.CHECK,
    help: CommandType.HELP,
    clearall: CommandType.CLEAR_ALL,
    cleardone: CommandType.CLEAR_DONE,

    // Alternative aliases (del, remove, complete, finish, revert, uncomplete, undo, inc, dec, clearlist, clear, ls, status, info, display)
};

// Permission Model: ALL commands require moderator/broadcaster permissions
// No permission categorization needed - universal access control applied
```

**Benefits:**

-   **Compile-time type safety** - prevents typos and invalid command references
-   **Centralized command management** - all command types defined in one place
-   **Flexible aliasing** - multiple command strings can resolve to the same canonical type
-   **Universal permission model** - all commands require moderator/broadcaster permissions
-   **Future configurability** - easy to add new commands or modify existing ones

#### Command Pattern Implementation

The command system uses the Command pattern for extensibility and maintainability:

-   **Command Interface**: Defines the contract for all command implementations
-   **BaseCommand Abstract Class**: Provides common functionality and dependencies
-   **Individual Command Classes**: Specific implementations for each command type
-   **CommandRegistry**: Manages command instances and routing
-   **Type-safe Command Routing**: Uses the centralized command type system

#### Unified Command Handler Architecture

The command handling system has been simplified and unified:

-   **Single CommandHandler class** handles all commands with unified "!ch" prefix
-   **CommandRegistry delegation** for actual command execution using Command pattern
-   **Type-safe command routing** using the centralized command type system and `normalizeCommand()` function
-   **Enhanced command parsing** with CommandParser supporting both key=value and simple string syntax
-   **Permission checking** with universal moderator/broadcaster requirement for all commands
-   **Automatic command normalization** through the aliasing system
-   **Multiple target ID support** for commands like "!ch done 1,3" to complete multiple challenges
-   **Timer parameter support** with automatic validation and format parsing for timer-enabled challenges

#### Dual Command Syntax Support

The system supports flexible command syntaxes for maximum user convenience:

1. **Key=value parameter syntax**: `!ch add "Challenge Name" d="Description" a=5 t=10m`
    - **Abbreviated parameters**: `d=`, `a=`, `t=` (preferred for brevity)
    - **Full parameters**: `desc=`, `amount=`, `timer=` (also supported)
    - **Mixed usage**: Both formats can be used in the same command
2. **Simple string syntax**: `!ch add Challenge Name` (uses entire string as title)

#### Direct Array Indexing System

-   **Simple numeric ID system** provides human-readable challenge references (#1, #2, #3)
-   **Direct array indexing** uses array position for challenge management
-   **Sequential numbering** for intuitive challenge references
-   **Lightweight utilities** in PositionUtils for position calculations

## Command System Implementation Details

### Current Command Processing Flow

1. **Command Reception**: TwitchChat receives "!ch [keyword] [parameters]" from IRC
2. **Command Validation**: App.chatHandler validates command format and user permissions
3. **Command Parsing**: CommandParser extracts keyword and parameters using dual syntax support
4. **Command Normalization**: CommandTypes.normalizeCommand() converts aliases to canonical types
5. **Command Execution**: CommandHandler routes to CommandRegistry which delegates to appropriate Command class
6. **Response Generation**: Formatted response returned to chat with success/error messaging

### Enhanced Command Features

-   **Multiple Target ID Support**: Commands like "!ch done 1,3,5" can operate on multiple challenges simultaneously
-   **Parameter Validation**: Comprehensive validation for title length, timer format, amount values, etc.
-   **Timer Integration**: Full support for timer parameters in add commands with format validation
-   **Error Handling**: Detailed error messages for invalid commands, missing permissions, or malformed parameters
-   **Command Help System**: Built-in help command provides usage information for all available commands
-   **DOM Update Coordination**: Automatic completion status detection ensures real-time visual updates when progress operations trigger completion state changes

#### Timer Command Examples

```bash
# Add challenge with timer (abbreviated parameters)
!ch add "Speed Run" t=5m
!ch add "Boss Fight" t=10s
!ch add "Collection Quest" t=1h30m

# Timer formats supported
timer=30s      # 30 seconds
timer=5m       # 5 minutes
timer=2h       # 2 hours
timer=1h30m    # 1 hour 30 minutes
timer=5:30     # 5 minutes 30 seconds
```

#### Timer Response Format

When a challenge with a timer is successfully added, the bot responds with:

```
[#ID] Challenge Title — 0/1 • 30s timer started 🔴 added!
```

## Future Development Opportunities

### Potential Enhancements

-   **Challenge categories** and filtering
-   **Progress tracking** with visual indicators
-   **Challenge templates** for common tasks
-   **Export functionality** for challenge data
-   **Theme customization** beyond color configuration
-   **Sound effects** for challenge completion
-   **Integration with other streaming tools**
-   **Timer sound notifications** for warning and expiration states

### Technical Improvements

-   **Performance optimization** for large challenge lists
-   **Accessibility improvements** for screen readers
-   **Mobile-responsive admin interface**
-   **Keyboard shortcuts** for admin functions
-   **Undo/redo functionality** for challenge operations

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

**Prevention**: The TwitchChat class now automatically validates and corrects OAuth token format, preventing this issue in future deployments.

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

#### Timer Validation Failures

**Symptoms**: Timer parameter extracted correctly but challenge created without timer.

**Prevention**: Use proper ES module imports and comprehensive timer format validation.

#### OAuth Token Validation Errors

**Common Error Messages**: `"OAuth token is required and must be a valid string"`, `"OAuth token cannot be empty"`, `"OAuth token must contain content after 'oauth:' prefix"`

**Auto-Correction Warnings**: `"[TwitchChat] OAuth token format auto-corrected: Added missing 'oauth:' prefix"`

**Resolution**: The system automatically handles most token format issues. If errors persist, verify the token is valid and properly formatted.

### Connection Issues

#### WebSocket Connection Failures

**Symptoms**: Console shows connection errors or "Invalid OAuth access token" messages.

**Troubleshooting Steps**: Verify OAuth token is current and valid, check token permissions, regenerate token if expired, verify network connectivity to Twitch IRC servers.

#### Bot Not Joining Channel

**Symptoms**: No "Joined #channelname" message in console.

**Common Causes**: Incorrect channel name in configuration, OAuth token lacks channel access permissions, network connectivity issues.

### Command Processing Issues

#### Commands Ignored for Regular Users

**Expected Behavior**: Regular viewers' commands are silently ignored (no response).

**Authorized Users**: Only broadcasters and moderators can use bot commands.

**Verification**: Check user permissions in Twitch chat - ensure you're testing with broadcaster or moderator account.

### DOM Update Issues

#### Increment Commands Not Showing Completion State

**Symptoms**: When increment commands cause a challenge to reach completion (e.g., `!ch + 1` changing 4/5 to 5/5), the backend state updates correctly but the overlay doesn't show completion styling (no "done" class or checked checkbox) until manual browser refresh.

**Root Cause**: Progress operations not detecting completion status changes and returning incorrect UI update actions.

**Solution**: This issue has been resolved in the current version through enhanced completion status detection in the `executeProgressOperation` method.

**Prevention**: The system now automatically detects completion status changes during all progress operations (increment, decrement, set) and applies appropriate DOM updates.

#### Progress Operations Not Triggering Visual Updates

**Symptoms**: Commands like `!ch + 2`, `!ch - 1`, or `!ch set 3` execute successfully but don't trigger visual changes in the overlay.

**Resolution**: Ensure all progress commands use the enhanced `executeProgressOperation` method which automatically handles completion status detection and UI action coordination.

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
