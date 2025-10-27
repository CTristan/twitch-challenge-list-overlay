# AGENTS.md — Development Reference

Twitch Challenge Overlay — OBS browser-source overlay with admin/viewer modes, Twitch IRC integration, and no server.

## Scope

Root reference for architecture plus cross-cutting rules. Folder-specific guidance lives next to code. Keep all AGENTS.md documents ≤4k characters.

## Architecture

Tech: TypeScript, Svelte, Vite (IIFE bundle), Vitest (jsdom), LocalStorage, WebSocket. Style: event-driven, modular, configuration-driven.
Core classes/services: App, ChallengeList, AdminPanel, ConfigManager, CommandRegistry/Handler, TwitchChat, WindowRefreshManager.
Svelte layout: `src/frontend` hosts UI shell/components; `src/backend` contains stores/services. Import with `@frontend/*`, `@backend/*`, `@/types/*`. UI must pull selectors, storage keys, and hashes from `src/types` constants—never inline DOM strings.

## Standards

-   TypeScript only; avoid `any`/`@ts-ignore`. `exactOptionalPropertyTypes` enforced.
-   Naming: PascalCase classes, camelCase methods, `#private` fields, UPPER_SNAKE constants.
-   Use enums and central constants; no magic DOM selectors.
-   Optional props: `...(value !== undefined && { prop: value })` to drop undefined.
-   Dataset access: `element.dataset[DATA_ATTRIBUTES.KEY]` (bracket notation only).
-   Remove deprecated code immediately; no shims.
-   OBS dock constraint ≤400px × 350px: validate every layout/style change.

## Storage

LocalStorage prefix `twitch-overlay-`. Keys: CONFIG, CHALLENGE_LIST, CHALLENGE_LIST_TEST, `*_SECTION_COLLAPSED`.

## Sync

WindowRefreshManager: `notifyConfigurationSaved()` → reload; `notifyChallengeStateChanged()` → DOM update.
App: call `notifyChallengeStateChanged()` after mutating challenges.
ChallengeList: auto-saves list operations; call save after direct model setters.

## Patterns

-   Config access: `ConfigManager.getInstance().get(BEHAVIOR_CONFIG.MAX_CHALLENGES)`.
-   DOM selectors: `CSS_SELECTORS.CHALLENGE_CONTAINER`; classes from `CSS_CLASSES`.
-   Dataset lookups: `element.dataset[DATA_ATTRIBUTES.CHALLENGE_ID]`.
-   URL hash guard: `window.location.hash === URL_HASH.ADMIN`.
-   DOM build: use `DocumentFragment`, append once.

## Testing

Vitest + jsdom; coverage ≥80%. Call `ensureTestIsolation()`. Refactor large or complex code instead of adding brittle tests. Run suites via VS Code `runTests` tool only (never `pnpm test`).
Refactor triggers: >20 public methods, >6 returns, >12 branches, >5 args, >15 vars, >50 statements, >5 boolean clauses in an `if`, or >5 nested blocks.

## Build

Output: `dist/challengeBot.iife.js`. Build with `pnpm run build`.

## Features

-   Dual-mode via URL hash (`#admin` vs default viewer).
-   Challenges numbered (1-based). Checkbox cycles states; text-only buttons provide Edit, Complete/Uncomplete, Fail/Unfail, +/-.
-   Timer exposes real-time visual states.
-   Viewer warns when BroadcastChannel is unavailable.
-   Admin panel: auto-save, backup/restore, color & opacity controls, collapsible sections, text-only mode.
-   Text-only admin view affects admin UI only; viewer overlay stays unchanged.
-   Commands: unified `!ch` prefix; moderator/broadcaster restricted.
