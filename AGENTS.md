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
│   ├── classes/           # Core business logic classes
│   │   ├── AdminPanel.ts  # Admin interface functionality
│   │   ├── Challenge.ts   # Individual challenge management
│   │   ├── ChallengeList.ts # Single unified challenge list
│   │   ├── ConfigManager.ts # Configuration management
│   │   └── ConfigExporter.ts # Configuration backup/export
│   ├── commands/         # Command pattern implementation
│   │   ├── Command.ts    # Base command interface and abstract class
│   │   ├── CommandRegistry.ts # Centralized command management
│   │   ├── AddCommand.ts # Add challenge command
│   │   ├── EditCommand.ts # Edit challenge command
│   │   ├── DoneCommand.ts # Complete challenge command
│   │   ├── UndoneCommand.ts # Revert completed challenges command
│   │   ├── FailCommand.ts # Fail challenge command
│   │   ├── DeleteCommand.ts # Delete challenge command
│   │   ├── IncrementCommand.ts # Increment progress command
│   │   ├── DecrementCommand.ts # Decrement progress command
│   │   ├── SetCommand.ts # Set progress command
│   │   ├── ListCommand.ts # List challenges command
│   │   ├── ShowCommand.ts # Show challenge details command
│   │   ├── CheckCommand.ts # Check statistics command
│   │   ├── HelpCommand.ts # Help command
│   │   ├── ClearAllCommand.ts # Clear all challenges command
│   │   └── ClearDoneCommand.ts # Clear completed challenges command
│   ├── twitch/           # Twitch IRC integration
│   │   ├── TwitchChat.ts  # WebSocket IRC client
│   │   ├── EventEmitter.ts # Custom event system
│   │   ├── message-parsers.ts # Chat message parsing
│   │   └── loadTestUsers.ts # Test user data loading
│   ├── utils/            # Utility modules
│   │   ├── CommandHandler.ts # Command execution coordinator
│   │   ├── CommandParser.ts # Command parsing utilities
│   │   ├── ResponseFormatter.ts # Response formatting utilities
│   │   ├── StorageManager.ts # Storage management with fallback
│   │   ├── ValidationUtils.ts # Centralized validation utilities
│   │   ├── Timer.ts       # Timer functionality
│   │   ├── TimerController.ts # Centralized timer lifecycle management
│   │   ├── TimerDisplayUtils.ts # Timer display management utilities
│   │   ├── PositionUtils.ts # Position-based challenge reference utilities
│   │   ├── ChallengeRenderer.ts # Shared challenge DOM creation utilities
│   │   ├── DOMHelper.ts   # Shared DOM manipulation routines
│   │   ├── UIUpdateHandler.ts # DOM manipulation and UI update coordination
│   │   ├── errorHandler.ts # Error handling and logging
│   │   └── windowRefresh.ts # Window refresh communication
│   ├── types/            # TypeScript type definitions
│   │   ├── CommandTypes.ts # Command type system and aliasing
│   │   └── MessageConstants.ts # Centralized string management system
│   ├── animations/       # UI animations
│   │   └── animateScroll.ts # Scroll animations
│   ├── app.ts            # Main application controller
│   ├── index.ts          # Application entry point
│   ├── dualWindow.ts     # Dual-window architecture
│   ├── modal.ts          # Modal functionality
│   └── styleLoader.ts    # Dynamic style loading
├── styles/               # CSS organization
│   ├── admin.css         # Admin panel styles
│   ├── app.css           # Main application styles
│   ├── modal.css         # Modal styles
│   ├── utility.css       # Utility classes
│   ├── variables.css     # CSS custom properties
│   └── index.css         # Main CSS entry point
├── tests/                # Unit tests (TypeScript)
│   ├── app/             # Application-level tests
│   ├── classes/         # Class-specific tests
│   ├── commands/        # Command-specific tests
│   ├── debug/           # Debug utilities (empty)
│   ├── integration/     # Integration tests
│   ├── twitch/          # Twitch integration tests
│   ├── utils/           # Utility function tests
│   │   ├── chatHandlerTestUtils.ts # Chat command testing utilities
│   │   └── domTestUtils.ts # DOM testing utilities
│   ├── globalSetup.ts   # Global test configuration
│   ├── dualWindow.test.ts # Dual window tests
│   └── windowRefresh.test.ts # Window refresh tests
├── types/                # TypeScript type definitions
│   └── globals.d.ts     # Global type definitions (interfaces, types, and global declarations only - NO enums)
├── _config.js            # Fallback configuration file
├── dist/                 # Build output
├── jsconfig.json         # Legacy JavaScript configuration (for editor support)
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── vitest.config.ts      # Vitest test configuration
└── index.html            # Entry point
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

```typescript
// Usage example
const uiUpdateHandler = new UIUpdateHandler(challengeList);
uiUpdateHandler.handleCommandResult(response);
uiUpdateHandler.updateTimerDisplays();
```

### ChallengeRenderer

Shared utilities for challenge DOM creation to eliminate duplication between App.ts and UIUpdateHandler.ts rendering logic.

```typescript
// Create challenge elements consistently
const challengeElement = ChallengeRenderer.createChallengeElement(challenge, {
    includeEventListeners: true,
    eventHandler: this.handleCheckboxClick,
});
```

### TimerDisplayUtils

Shared utilities for timer display management with optimized performance using Map-based challenge lookup.

```typescript
// Update all timer displays efficiently
const hasActiveTimers = TimerDisplayUtils.updateAllTimerDisplays(challengeList);
```

### DOMHelper

Shared DOM manipulation routines for consistent challenge management operations.

```typescript
// Complete a challenge in the DOM
DOMHelper.completeChallengeFromDOM(challengeId);

// Delete a challenge from the DOM
DOMHelper.deleteChallengeFromDOM(challengeId);

// Create challenge card with header
const cardElement = DOMHelper.createChallengeCard(completedCount, totalCount);
```

### TimerController

Centralized timer lifecycle management with coordinated timer update intervals.

```typescript
// Usage example
const timerController = new TimerController(challengeList);
timerController.startTimerUpdates();
timerController.updateTimerDisplays();
timerController.stopTimerUpdates();
```

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
    // ...
}

// ✅ Usage in command files
import { UIUpdateAction } from "../types/UIUpdateAction";
import type { UIUpdateData } from "../types/UIUpdateData";

const uiUpdate: UIUpdateData = {
    action: UIUpdateAction.ADD,
    // ...
};
```

**Interfaces that use enums**:

```typescript
// ✅ src/types/UIUpdateData.ts - Interface that uses enum
import type Challenge from "../classes/Challenge";
import type { UIUpdateAction } from "./UIUpdateAction";

export interface UIUpdateData {
    action: UIUpdateAction;
    challengeIndices?: number[];
    challenges?: Challenge[];
    // ...
}
```

**Avoid**:

```typescript
// ❌ Never define enums in types/globals.d.ts
enum UIUpdateAction /* ... */ {}

// ❌ Never use global type declarations for enums
type UIUpdateAction = "add" | "edit" | "complete";
```

### String Management Guidelines

**CRITICAL**: All user-facing messages, error messages, response strings, and configuration property names must use centralized constant systems.

#### Message Constants
-   **MessageConstants Location**: All message constants are defined in `src/types/MessageConstants.ts`
-   **Organized Categories**: Constants are grouped by purpose (ERROR_MESSAGES, SUCCESS_MESSAGES, HELP_MESSAGES, etc.)
-   **UPPER_SNAKE_CASE Naming**: All message constants follow the established naming convention
-   **Import Requirement**: Message constants must be explicitly imported: `import { ERROR_MESSAGES } from "../types/MessageConstants"`
-   **No Hardcoded Strings**: Avoid hardcoded string literals for any user-facing text
-   **Consistent Messaging**: All similar messages across the application use the same constant

#### Configuration Property Constants
-   **ConfigConstants Location**: All configuration property names are defined in `src/types/ConfigConstants.ts`
-   **Categorized Organization**: Properties grouped by purpose (AUTH_CONFIG, BEHAVIOR_CONFIG, BACKGROUND_CONFIG, etc.)
-   **UPPER_SNAKE_CASE Naming**: All configuration constants follow the established naming convention
-   **Type Safety**: Use `ConfigPropertyValue` type for type-safe configuration access
-   **No Magic Strings**: Never pass hardcoded strings to `configManager.get()` or `configManager.set()`
-   **Centralized Defaults**: Default values defined as constants rather than inline literals

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

// ✅ Usage in configuration access
import { BACKGROUND_CONFIG } from "../types/ConfigConstants";

const backgroundColor = configManager.get(BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR);
configManager.set(BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_OPACITY, 0.8);
```

**Avoid**:

```typescript
// ❌ Never use hardcoded strings for user-facing messages
return this.createSuccessResponse("No challenges to clear");

// ❌ Never use hardcoded strings for configuration property names
const backgroundColor = configManager.get("challengeBackgroundColor");
configManager.set("challengeBackgroundOpacity", 0.8);
```

### Documentation Standards

-   **JSDoc comments** for all classes, methods, and complex functions
-   **TypeScript type annotations** for all code (native TypeScript types)
-   **Type definitions** in `types/globals.d.ts` and inline TypeScript interfaces
-   **Method documentation** includes parameters, return types, and throws

### Class Structure Pattern

```typescript
/**
 * @class ClassName
 * @property {type} property - Description
 * @method methodName - Description
 */
export default class ClassName {
    #privateField: type | null = null;
    public publicProperty: type;

    /**
     * @constructor
     * @param param - Description
     */
    constructor(param: type) {
        this.publicProperty = this.validateParam(param);
    }

    /**
     * Method description
     * @param param - Description
     * @returns Description
     * @throws {Error} Condition
     */
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

The project uses strict TypeScript configuration with the following key settings:

```typescript
// tsconfig.json highlights
{
  "compilerOptions": {
    "strict": true,              // Enable all strict type checking
    "noEmit": true,              // Vite handles compilation
    "isolatedModules": true,     // Required for Vite bundling
    "target": "ES2022",          // Modern JavaScript features
    "module": "ESNext",          // ES modules with bundler resolution
    "moduleResolution": "Bundler", // Modern bundler resolution

    // Advanced TypeScript features
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,

    // Path mapping for better imports
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@/types/*": ["types/*"]
    }
  }
}
```

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

For Twitch authentication, generate OAuth tokens from **https://twitchtokengenerator.com**:

1. **Visit the token generator**: Navigate to https://twitchtokengenerator.com
2. **Authorize the application**: Click "Connect" and authorize with your Twitch account
3. **Copy the OAuth token**: The generated token will include the required "oauth:" prefix
4. **Update configuration**: Add the token to your `_config.js` file or admin panel

**Note**: The TwitchChat class automatically validates OAuth tokens and will auto-correct missing "oauth:" prefixes with a console warning.

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

-   **OAuth Validation Tests**: `tests/twitch/TwitchChat.oauthValidation.test.ts` - Comprehensive OAuth token validation scenarios
-   **Integration Tests**: End-to-end command processing and chat flow validation
-   **Increment-to-Completion Tests**: `tests/integration/incrementToCompletion.test.ts` - DOM update coordination for progress operations that trigger completion
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

#### CSS Styling Architecture

```css
.challenge-timer {
    font-size: var(--challenge-timer-font-size);
    color: var(--challenge-timer-color);
    /* Base timer styling */
}
.challenge-timer.warning {
    color: var(--challenge-timer-warning-color);
}
.challenge-timer.critical {
    color: var(--challenge-timer-critical-color);
}
.challenge-timer.expired {
    color: var(--challenge-timer-expired-color);
}
```

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

##### Current System Features

-   **Single challenge panel** displayed on overlay (unified view)
-   **Restricted permissions** limited to streamer and moderators only
-   **No viewer interaction** - regular users cannot add, modify, or remove challenges
-   **Administrative control** exclusively managed by authorized users
-   **Centralized challenge management** with streamer-focused workflow

##### Implementation Details

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

    // Alternative aliases
    del: CommandType.DELETE,
    remove: CommandType.DELETE,
    complete: CommandType.DONE,
    finish: CommandType.DONE,
    revert: CommandType.UNDONE,
    uncomplete: CommandType.UNDONE,
    undo: CommandType.UNDONE,
    inc: CommandType.INCREMENT,
    dec: CommandType.DECREMENT,
    clearlist: CommandType.CLEAR_ALL,
    clear: CommandType.CLEAR_ALL,
    ls: CommandType.LIST,
    status: CommandType.CHECK,
    info: CommandType.SHOW,
    display: CommandType.SHOW,
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

# Add challenge with timer (full parameters)
!ch add "Speed Run" timer=5m
!ch add "Boss Fight" timer=10s
!ch add "Collection Quest" timer=1h30m

# Mixed parameter formats (both work identically)
!ch add "Mixed Example" d="Short desc" amount=3 t=15m

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

The response includes:

-   **Challenge ID**: Position-based ID for reference (#1, #2, #3, etc.)
-   **Challenge Title**: The challenge name
-   **Progress**: Current progress (0/amount)
-   **Timer Status**: Duration and start confirmation with emoji
-   **Action Confirmation**: "added!" to confirm successful creation

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

**Common Causes**:

-   Using `require()` instead of ES module `import` statements in TypeScript files
-   Timer validation failing due to module loading issues
-   Missing Timer class import in command files

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

**Debugging Steps**:

1. **Enable debug logging** temporarily in `AddCommand.ts`
2. **Check timer format**: Ensure formats like "10s", "5m", "1h30m" are used
3. **Verify Timer.parseDuration()**: Test timer parsing in browser console
4. **Check command response**: Look for timer confirmation in bot response message

**Prevention**: Use proper ES module imports and comprehensive timer format validation.

#### OAuth Token Validation Errors

**Common Error Messages**:

-   `"OAuth token is required and must be a valid string"`
-   `"OAuth token cannot be empty"`
-   `"OAuth token must contain content after 'oauth:' prefix"`

**Auto-Correction Warnings**:

-   `"[TwitchChat] OAuth token format auto-corrected: Added missing 'oauth:' prefix"`

**Resolution**: The system automatically handles most token format issues. If errors persist, verify the token is valid and properly formatted.

### Connection Issues

#### WebSocket Connection Failures

**Symptoms**: Console shows connection errors or "Invalid OAuth access token" messages.

**Troubleshooting Steps**:

1. **Verify OAuth token** is current and valid
2. **Check token permissions** - ensure it has chat access
3. **Regenerate token** if expired
4. **Verify network connectivity** to Twitch IRC servers

#### Bot Not Joining Channel

**Symptoms**: No "Joined #channelname" message in console.

**Common Causes**:

-   Incorrect channel name in configuration
-   OAuth token lacks channel access permissions
-   Network connectivity issues

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

**Verification Steps**:

1. **Test increment-to-completion**: Add a multi-step challenge and increment to completion
2. **Check DOM immediately**: Verify completion styling appears without refresh
3. **Test in both modes**: Ensure fix works in viewer and admin overlay modes
4. **Run integration tests**: Execute `pnpm test tests/integration/incrementToCompletion.test.ts`

**Prevention**: The system now automatically detects completion status changes during all progress operations (increment, decrement, set) and applies appropriate DOM updates.

#### Progress Operations Not Triggering Visual Updates

**Symptoms**: Commands like `!ch + 2`, `!ch - 1`, or `!ch set 3` execute successfully but don't trigger visual changes in the overlay.

**Common Causes**:

-   UI update actions not properly coordinated with command results
-   Missing or incorrect UIUpdateAction enum values in command responses
-   DOM update handler not receiving completion status change information

**Debugging Steps**:

1. **Check browser console**: Look for UI update coordination errors
2. **Verify command responses**: Ensure commands return proper UIUpdateData with correct actions
3. **Test with simple operations**: Start with basic increment/decrement before testing completion scenarios
4. **Validate DOM structure**: Ensure challenge elements exist and have proper IDs for DOM updates

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

### Event Handling

```typescript
// Custom event emitter pattern
client.on("command", (data: ChatData) => {
    const response = app.chatHandler(data);
    if (!response.error) {
        client.say(response.message);
    }
});
```

### Configuration Access

```typescript
// ConfigManager-based configuration access with centralized constants
import { BEHAVIOR_CONFIG, COLOR_CONFIG, BACKGROUND_CONFIG } from "../types/ConfigConstants";

const configManager = ConfigManager.getInstance();
const maxChallenges = configManager.get(BEHAVIOR_CONFIG.MAX_CHALLENGES);
const colors = configManager.get(COLOR_CONFIG.CHALLENGE_ROW_COLORS);
const backgroundColor = configManager.get(BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR);

// Command types are now managed through the centralized type system
import { CommandType, normalizeCommand } from "../types/CommandTypes";
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
