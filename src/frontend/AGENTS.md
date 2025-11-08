# frontend/ — Svelte Component Standards

### Svelte Version & Mount

Use Svelte v5 functional API. Application bootstrap must call:

```ts
import App from "./App.svelte";
import { mount } from "svelte";
mount(App, { target: document.getElementById("app-root")! });
```

Never instantiate with `new App(...)` (legacy v3/4 pattern). Tests should mount/unmount via the Svelte testing helpers or the returned object’s `unmount()`—do not rely on `$destroy()`.

### Component & Store Rules

1. Import selectors, data attributes, storage keys, and URL hashes from `@/types/*` modules—no hardcoded strings.
2. Keep `<script>` blocks in TypeScript (`lang="ts"`); export a single typed `props` object when passing multiple related values.
3. Respect OBS dock constraints (≤400px width, ≤350px height). Avoid fixed heights that cause scrollbars; prefer flex layouts with wrapping.
4. Use `$store` syntax for reactive markup; when calling `subscribe()` manually, ensure the unsubscribe runs in `onDestroy`.
5. Place feature components under `lib/components/<FeatureName>/` and re-export from a local barrel if the folder exposes >1 symbol. (Barrel files are excluded from coverage but still reviewed for clarity.)
6. Accessibility: label all interactive controls, manage focus on modal open/close, provide ARIA roles for non-semantic containers, and preserve keyboard interaction parity with AdminPanel legacy elements.

### Styling Practices

-   Co-locate component-specific styles; keep global overrides minimal and use `:global()` sparingly.
-   Reference shared class names via `CSS_CLASSES` to maintain a stable DOM contract for tests.

### Error & Edge Handling

-   Components should degrade gracefully when required DOM nodes are absent (tests assert fallback behavior rather than failing).
-   Prefer derived stores for computed UI state over ad-hoc reactive statements with multiple dependencies.

### Testing Guidance

-   Mount with `mount()`; unmount once per test. Guard against double-unmount warnings by tracking mount state in the test harness.
-   Cover branch variants (admin vs viewer hash, text-only vs styled modes) using injected stores or mocked location hash.
-   Avoid snapshot tests; assert semantic output (text content, classes, ARIA attributes).
