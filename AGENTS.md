# AGENTS.md — Development Reference

Twitch Challenge Overlay — frontend-only challenge management for OBS Browser Source. Dual-mode (admin/viewer), Twitch IRC, zero-server.

## Scope and guidelines
- Root AGENTS.md holds architecture and cross-cutting rules. Folder specifics belong in nested AGENTS.md files.
- Hard limit: 4,000 characters per AGENTS.md.

## Architecture
- Tech: TypeScript, Vite (IIFE), Vitest (jsdom), LocalStorage, WebSocket.
- Style: Event-driven, modular classes, configuration-driven, no backend.

### Core classes
- App: Main controller (DOM, chat commands, cross-window sync).
- ChallengeList: Persistence + reload; auto-saves on list ops.
- AdminPanel: Admin UI; delegates to ColorManager, BackgroundManager, ConfigValidator, DOMBuilder, EventSetup.
- ConfigManager: Singleton config over localStorage.
- CommandRegistry/Handler: Parse/route/execute commands.
- TwitchChat: WebSocket IRC + OAuth validation.
- WindowRefreshManager: BroadcastChannel-based cross-window sync.

### Constants (src/types)
MessageConstants, ColorConstants, ConfigConstants, DOMConstants, FileConstants, NumericConstants, StorageConstants, ValidationConstants.

## Standards (mandatory)
- TypeScript clean: no errors/warnings on modified files; avoid `any`/`@ts-ignore`.
- Naming: Classes PascalCase; methods camelCase; private `#prefix`; constants UPPER_SNAKE_CASE.
- Type safety: Enums live in dedicated .ts files (not globals.d.ts); use enum references (e.g., UIUpdateAction.ADD) and centralized constants (no magic strings).

## Storage keys
- Prefix: "twitch-overlay-" (StorageConstants.LOCALSTORAGE_PREFIX).
- Keys: CONFIG, CHALLENGE_LIST, CHALLENGE_LIST_TEST, *_SECTION_COLLAPSED.

## Cross-window sync
- WindowRefreshManager (src/utils/windowRefresh.ts):
	- notifyConfigurationSaved() → full page reload (auth/config changes).
	- notifyChallengeStateChanged() → DOM-only update (add/edit/complete/delete).
- App: setupChallengeListRefreshListener(), handleChallengeListRefresh(); call notifyChallengeStateChanged() after any challenge mutation.
- ChallengeList: loadFromLocalStorage(), saveToLocalStorage(); call save after direct property setters on a Challenge.

## Common patterns
- Configuration: `ConfigManager.getInstance().get(BEHAVIOR_CONFIG.MAX_CHALLENGES)`.
- Challenge persistence:
	- Auto-save: addChallengeObjects(...), toggleChallengeCompletion(id).
	- Manual save required after direct setters (e.g., challenge.setTitle()) → challengeList.saveToLocalStorage().
- DOM: Build with DocumentFragment; append once to minimize layout thrash.

## Testing
- Vitest + jsdom; target ≥80% coverage (statements/branches/functions/lines).
- Use beforeEach with ensureTestIsolation().

## Build
- Output: dist/challengeBot.iife.js.
- Scripts: pnpm run dev | build | test | test:coverage | type-check.

## Features
- Dual-mode via URL fragment (#admin vs viewer).
- Numeric IDs (1-based positions) on challenges.
- Timer with real-time visual states.
- Viewer connection warning when BroadcastChannel unavailable.
- Admin panel: auto-save, backup/restore, color/opacity, collapsible sections, text-only toggle; explicit Fail button in both standard and text-only admin modes; checkbox is binary (Complete/Uncomplete) and cannot set Failed.
- Text-only mode: admin-only rendering with explicit Complete/Fail buttons (viewer overlay unaffected).
- Commands: unified "!ch" prefix; moderator/broadcaster only.
