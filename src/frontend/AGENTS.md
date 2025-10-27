# frontend/ — Svelte Component Standards

-   Svelte components must import selectors, data attributes, and storage keys from `@/types/DOMConstants` (or related constants) instead of hardcoding strings.
-   Keep `<script>` blocks in TypeScript mode and export typed props; use derived stores or helper functions from `@backend/*` for stateful logic.
-   Layouts must respect OBS dock constraints (≤400px width, ≤350px height). Ensure styles are scoped or composed via `:global()` sparingly and avoid introducing fixed dimensions that exceed limits.
-   Prefer store subscriptions with the `$store` syntax in markup; when imperative access is required, unsubscribe in `onDestroy` to prevent leaks.
-   Organize components by feature folders (e.g., `lib/components/AdminPanel/*`) and re-export public widgets from barrel files to keep imports tidy.
-   All new UI should maintain accessibility: label interactive controls, manage focus on modal open/close, and honour keyboard interaction patterns established in the legacy AdminPanel.
