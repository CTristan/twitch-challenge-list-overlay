# backend/ — Service & Store Guidance

-   Pure TypeScript modules only—no direct DOM access or Svelte component imports.
-   Use the `@backend/*` alias for internal cross-module references; surface UI-ready helpers via named exports rather than default singletons when possible.
-   Delegate storage keys, DOM selectors, and message constants to `@/types/*` modules to keep string literals centralized.
-   Expose functions or classes with explicit interfaces; prefer dependency injection over hidden globals so legacy scripts and the new Svelte frontend share the same entry points.
-   When adding side effects (BroadcastChannel, timers, WebSocket), provide cleanup hooks and idempotent `initialize*` helpers to support test isolation.
-   Keep Vitest coverage parity—add unit tests under `tests/backend/**` mirroring new modules and use `ensureTestIsolation()` in setup.

## Window Sync

-   Prefer `@backend/services/windowSyncService` for inter-window communication. It wraps BroadcastChannel and provides:
    -   `notifyConfigurationSaved({ suppressSelfRefresh? })`, `notifyConfigurationSavedViewerOnly()`
    -   `notifyChallengeStateChanged()` and custom DOM event dispatch (`challenge-list-refresh`)
    -   Heartbeat connectivity tracking for viewer windows
-   When broadcasting from within a service that also listens for sync messages, set an "ignore next local" flag to prevent self-originated events from reprocessing.
-   Always wrap external calls in try/catch and log succinct errors—tests assert error handling without throwing.

## Testing Patterns

-   Mock `windowSyncService` with `vi.mock` and provide `__emit*` helpers to simulate external events.
-   For listener error coverage, subscribe normally and trigger errors on subsequent emissions (not during the initial `init` snapshot).
-   Validate both admin and viewer hash modes by overriding `window.location.hash` per test.
