# backend/ — Service & Store Guidance

-   Pure TypeScript modules only—no direct DOM access or Svelte component imports.
-   Use the `@backend/*` alias for internal cross-module references; surface UI-ready helpers via named exports rather than default singletons when possible.
-   Delegate storage keys, DOM selectors, and message constants to `@/types/*` modules to keep string literals centralized.
-   Expose functions or classes with explicit interfaces; prefer dependency injection over hidden globals so legacy scripts and the new Svelte frontend share the same entry points.
-   When adding side effects (BroadcastChannel, timers, WebSocket), provide cleanup hooks and idempotent `initialize*` helpers to support test isolation.
-   Keep Vitest coverage parity—add unit tests under `tests/backend/**` mirroring new modules and use `ensureTestIsolation()` in setup.
