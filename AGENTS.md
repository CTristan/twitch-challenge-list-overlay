# AGENTS.md — Development Reference

Twitch Challenge Overlay — frontend-only challenge management for OBS Browser Source. Dual-mode (admin/viewer), Twitch IRC, zero-server.

## Scope

-   Root AGENTS.md: architecture + cross-cutting rules. Folder specifics in nested AGENTS.md.
-   Hard limit: 4,000 characters.

## Architecture

Tech: TypeScript, Vite (IIFE), Vitest (jsdom), LocalStorage, WebSocket. Style: Event-driven, modular classes, configuration-driven, no backend.

**Core classes:** App (main controller), ChallengeList (persistence), AdminPanel (UI + delegates), ConfigManager (singleton), CommandRegistry/Handler, TwitchChat (WebSocket IRC), WindowRefreshManager (BroadcastChannel sync).

**Constants (src/types):** Message, Color, Config, DOM, File, Numeric, Storage, Validation.

## Standards

-   TypeScript: no errors/warnings; avoid `any`/`@ts-ignore`. Project uses `exactOptionalPropertyTypes: true`.
-   Naming: PascalCase (classes), camelCase (methods), `#prefix` (private), UPPER_SNAKE_CASE (constants).
-   Type safety: Enums in dedicated .ts; use enum refs (UIUpdateAction.ADD) + centralized constants (no magic strings).
-   **DOM operations:** Always use constants from `src/types/DOMConstants.ts` (CSS_SELECTORS, CSS_CLASSES, DATA_ATTRIBUTES, URL_HASH, etc.). Never hardcode selectors like ".challenge" or dataset keys like "challengeId".
-   **Optional properties:** Use spread with conditional: `...(value !== undefined && { prop: value })` to avoid passing undefined to optional properties.
-   **Dataset access:** Use bracket notation: `element.dataset[DATA_ATTRIBUTES.KEY]`, never dot notation.
-   **No deprecated/legacy code:** Remove deprecated methods immediately; do not maintain backward compatibility layers.

## Storage

Prefix: "twitch-overlay-" (LOCALSTORAGE_PREFIX). Keys: CONFIG, CHALLENGE_LIST, CHALLENGE_LIST_TEST, \*\_SECTION_COLLAPSED.

## Sync

**WindowRefreshManager:** notifyConfigurationSaved() → reload; notifyChallengeStateChanged() → DOM update.
**App:** Call notifyChallengeStateChanged() after challenge mutations.
**ChallengeList:** Auto-save on list ops; manual save after direct setters (challenge.setTitle()).

## Patterns

-   Config: `ConfigManager.getInstance().get(BEHAVIOR_CONFIG.MAX_CHALLENGES)`.
-   DOM selectors: `CSS_SELECTORS.CHALLENGE_CONTAINER`, `CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM`.
-   Dataset access: `element.dataset[DATA_ATTRIBUTES.CHALLENGE_ID]`.
-   URL checks: `window.location.hash === URL_HASH.ADMIN`.
-   DOM: Build with DocumentFragment; append once.

## Testing

Vitest + jsdom; ≥80% coverage. Use ensureTestIsolation(). **Testability over workarounds:** Refactor large methods (>50 lines), tightly-coupled logic, complex conditionals. Extract methods, separate concerns, use DI.

> **Execution rule:** Always run tests via the VS Code native testing integration (runTests tool). **Never run** `pnpm test` or other CLI shortcuts from the terminal.

### Refactoring triggers

-   > 20 public methods → split class.
-   > 6 returns, >12 branches, >5 args, >15 vars, >50 statements, >5 bools in `if`, >5 nested blocks → simplify/extract.

## Build

Output: dist/challengeBot.iife.js. Use VS Code runTests tool for execution and coverage.

## Features

-   Dual-mode via URL fragment (#admin vs viewer).
-   Numeric IDs (1-based positions) on challenges.
-   Timer with real-time visual states.
-   Viewer connection warning when BroadcastChannel unavailable.
-   Admin panel: auto-save, backup/restore, color/opacity, collapsible sections, text-only toggle.
-   Text-only mode: admin-only plain text rendering with action buttons: Edit, Complete/Uncomplete, Fail/Unfail, +/- (for multi-step). All buttons render as plain text with color coding. Viewer overlay unaffected.
-   Challenge states: Active, completed (reversible via Uncomplete), failed (reversible via Unfail). Checkbox cycles states; text-only buttons provide direct state control.
-   Commands: unified "!ch" prefix; moderator/broadcaster only.
