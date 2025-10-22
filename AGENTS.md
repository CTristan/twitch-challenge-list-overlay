# AGENTS.md - Development Reference

**Twitch Challenge Overlay** - Browser-based challenge management with dual-mode architecture (admin/viewer). OBS Browser Source, Twitch IRC, zero-server deployment.

## AGENTS.md File Guidelines

**CRITICAL**: Each AGENTS.md file must be ≤4,000 characters (HARD MAXIMUM). When exceeding limit: (1) Move folder-specific content to nested AGENTS.md files in appropriate subdirectories, (2) Condense while keeping critical info, (3) Keep architecture/cross-cutting concerns in root, move details to nested files.

## Architecture

**Tech**: TypeScript, Vite (IIFE), Vitest (jsdom), LocalStorage, WebSocket
**Pattern**: Frontend-only, event-driven, modular class-based, configuration-driven

### Key Classes
- **App**: Main controller, DOM, chat commands, cross-window sync
- **ChallengeList**: Challenge persistence with reload capability  
- **AdminPanel**: Admin UI (delegates to utility classes: ColorManager, BackgroundManager, ConfigValidator, DOMBuilder, EventSetup)
- **ConfigManager**: Singleton config with localStorage
- **CommandHandler/Registry**: Command execution/routing
- **TwitchChat**: WebSocket IRC with OAuth validation
- **WindowRefreshManager**: BroadcastChannel cross-window sync

### Constants (src/types/)
MessageConstants, ColorConstants, ConfigConstants, DOMConstants, FileConstants, NumericConstants, StorageConstants, ValidationConstants

## Critical Standards

### Code Quality (MANDATORY)
- Zero TypeScript errors/warnings before completion
- Run diagnostics on all modified files
- No `any` or `@ts-ignore` unless absolutely necessary

### Naming
- Classes: PascalCase, Methods: camelCase, Private: `#prefix`, Constants: UPPER_SNAKE_CASE

### Type Safety
- All enums in separate `.ts` files (NOT `globals.d.ts`)
- Use enum references: `UIUpdateAction.ADD` not `"add"`
- Eliminate magic strings via centralized constants

### localStorage Keys
- Prefix: `"twitch-overlay-"` (StorageConstants.LOCALSTORAGE_PREFIX)
- Keys: CONFIG, CHALLENGE_LIST, CHALLENGE_LIST_TEST, *_SECTION_COLLAPSED

## Cross-Window Sync (BroadcastChannel)

**WindowRefreshManager** (`src/utils/windowRefresh.ts`):
- `notifyConfigurationSaved()` → full page reload (auth/config changes)
- `notifyChallengeStateChanged()` → DOM-only update (add/edit/complete/delete)

**App methods**: `setupChallengeListRefreshListener()`, `handleChallengeListRefresh()`, call `notifyChallengeStateChanged()` after challenge mutations

**ChallengeList persistence**: `loadFromLocalStorage()`, `saveToLocalStorage()` (required after direct challenge setters)

## Key Patterns

### Configuration
```typescript
import { BEHAVIOR_CONFIG } from "../types/ConfigConstants";
const config = ConfigManager.getInstance();
const max = config.get(BEHAVIOR_CONFIG.MAX_CHALLENGES);
```

### Challenge Persistence
```typescript
// Auto-saves
challengeList.addChallengeObjects(challenge);
challengeList.toggleChallengeCompletion(id);

// Manual save required
challenge.setTitle(newTitle);
challengeList.saveToLocalStorage(); // REQUIRED
```

### DOM Manipulation
```typescript
const fragment = document.createDocumentFragment();
items.forEach(item => fragment.appendChild(createElement(item)));
container.appendChild(fragment);
```

## Testing
- 80% coverage thresholds (statements/branches/functions/lines)
- jsdom environment, Vitest
- Test structure: `beforeEach` with `ensureTestIsolation()`

## Build
- Vite IIFE bundle → `dist/challengeBot.iife.js`
- Commands: `pnpm run dev|build|test|test:coverage|type-check`

## Features
- **Dual-mode**: URL fragment routing (`#admin` vs viewer)
- **Numeric IDs**: Challenges show position (1-based)
- **Timer display**: Real-time countdown with visual states
- **Connection warning**: Viewer mode only, shows when BroadcastChannel unavailable
- **Admin panel**: Auto-save config, backup/restore, color/opacity controls, collapsible sections
- **Commands**: Unified "!ch" prefix, moderator/broadcaster only
