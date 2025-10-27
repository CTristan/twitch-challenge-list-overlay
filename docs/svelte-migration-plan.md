# Svelte Migration Plan

## Executive Summary
- Convert the existing TypeScript + DOM implementation into a modular Svelte application while preserving feature parity for both admin and viewer modes.
- Maintain Vite as the build tool, producing a single bundle compatible with the OBS browser dock constraints (≤400px width, ≤350px height).
- Adopt a two-tier source layout with `src/backend` (logic + data services) and `src/frontend` (Svelte UI) to enforce a clear separation between state management and presentation layers.
- Stage delivery in increments to guarantee the overlay remains functional throughout the migration and that Twitch command integrations stay stable.

## Guiding Principles
- Respect the architectural contracts defined in `AGENTS.md`, especially centralized constants, storage prefixes, and Twitch command behavior.
- Mirror current functionality first; only ship behavioral changes once parity is reached and validated by automated tests.
- Leverage Svelte stores for shared state, keeping persistence responsibilities in a dedicated module analogous to `ChallengeList` + `ConfigManager`.
- Maintain accessibility and performance budgets; keep the DOM lightweight and minimize layout thrash to stay OBS-friendly.
- Build defensively so viewer-only mode remains passive and cannot mutate state.

## Current System Inventory
| Legacy Module / Feature | Responsibility | Proposed Svelte Construct | Notes |
| --- | --- | --- | --- |
| `src/app.ts` | App bootstrap, URL hash routing, BroadcastChannel sync | `src/frontend/App.svelte` shell + `src/backend/services/windowMode.ts` | Separate shells for admin/viewer routed via hash.
| `src/index.ts` | Entrypoint wiring & DOM ready | `src/frontend/main.ts` mounting entry | Replace manual DOM bootstrapping with `new App({ target })`.
| `src/classes/ChallengeList.ts` | Challenge persistence & mutations | `src/backend/stores/challengeStore.ts` (writable store with actions) | Keep auto-save + manual save patterns.
| `src/classes/Challenge.ts` | Individual challenge model | `src/backend/models/Challenge.ts` helper | Provide TS helpers for serialization.
| `src/classes/AdminPanel.ts` + `templates/AdminPanelTemplates.ts` | Admin UI render + event wiring | `src/frontend/lib/components/AdminPanel/*` component tree | Split into controls, list, modals.
| `src/twitch/TwitchChat.ts` | IRC client wrapper | `src/backend/services/twitchChat.ts` + reactive store bridge | Maintain command dispatch & reconnect logic.
| `src/commands/*.ts` | Chat command handlers | `src/backend/commands/*` dispatcher functions | Keep `!ch` prefix contract + responses.
| `src/utils/*` | Color, DOM, validation utilities | `src/backend/utils/*` and `src/frontend/lib/utils/*` as appropriate | Convert DOM builders to components/actions.
| `styles/*.css` | Global stylesheets | `src/frontend/lib/styles` (scoped + global reset) | Ensure OBS sizing rules remain.
| `tests/**/*.test.ts` | Vitest coverage | Vitest + @testing-library/svelte suites across frontend/backend | Update or add tests alongside components.

## Target Svelte Architecture
- `src/frontend/main.ts`: Mount Svelte app, initialize Config + Challenge stores, attach BroadcastChannel listeners.
- `src/frontend/App.svelte`: Top-level layout that switches between `AdminApp` and `ViewerApp` based on a derived `windowMode` store.
- `src/frontend/lib/stores/`: Writable stores for challenges, configuration, timer state, and Twitch connection status (export typed interfaces for backend consumption when required).
- `src/frontend/lib/components/`: Feature-based folders (`AdminPanel`, `ChallengeList`, `Timer`, `Modal`, `CommandLog`).
- `src/backend/services/`: Non-visual modules (Twitch chat, storage sync, window refresh manager).
- `src/backend/utils/`: Ported helpers (validation, formatting, color conversions).

## Source Directory Layout Targets
- `src/backend`: Pure TypeScript modules responsible for persistence, configuration management, Twitch command logic, BroadcastChannel handlers, and other non-UI logic.
- `src/frontend`: Svelte components, presentation-focused helpers, and UI-oriented glue code. Only import backend services through well-defined interfaces to maintain layering.
- Shared types/constants remain in `src/types` to mirror existing `AGENTS.md` guidance and avoid circular dependencies.
- Introduce barrel manifests where beneficial (`src/backend/index.ts`, `src/frontend/index.ts`) to simplify imports and testing.

## Migration Phases & Checklists

### Phase 1 — Project Foundation
- [ ] Create `src/backend` and `src/frontend` directories (retain `src/types`, `src/utils`, etc.) and update project tooling to treat them as first-class roots.
- [ ] Install `@sveltejs/vite-plugin-svelte` and configure `vite.config.ts` for Svelte + TypeScript, including aliases that map `@frontend/*` and `@backend/*` to the new directories.
- [ ] Add `svelte.config.js` with OBS-compatible compiler and preprocess options (e.g., PostCSS, SCSS if needed).
- [ ] Update `tsconfig.json` / `jsconfig.json` paths to include Svelte type support plus path mappings for `src/frontend` and `src/backend` entry points.
- [ ] Introduce `src/frontend/main.ts` mounting logic and placeholder `src/frontend/App.svelte`, exporting any necessary hooks through `src/backend/index.ts` for non-UI services.
- [ ] Ensure linting/type-check pipeline (ESLint or `svelte-check`) is wired into CI and understands the dual-namespace layout.

### Phase 2 — Shared State & Services
- [ ] Create Svelte stores in `src/frontend/lib/stores` that mirror `ChallengeList`, `ConfigManager`, and timer state while delegating persistence to `src/backend` services.
- [ ] Port `WindowRefreshManager` notification logic into backend BroadcastChannel utilities with frontend store subscribers wiring updates.
- [ ] Abstract Twitch `EventEmitter` + `TwitchChat` into `src/backend/services/twitchChat.ts` and expose reactive connection state via a frontend adapter store.
- [ ] Provide a migration wrapper so legacy scripts can read from the new stores during incremental roll-out (if dual-running is required).

### Phase 3 — UI Shell & Global Layout
- [ ] Implement `src/frontend/App.svelte` shell with hash-based mode switching (admin vs viewer) using derived store or `onMount` hash listener.
- [ ] Build shared layout components in `src/frontend/lib/components/layout/*` (header, footer, background manager) with responsive constraints for OBS.
- [ ] Recreate color/background managers as frontend Svelte components or actions backed by `src/backend/services/colorManager.ts` and `AdminPanelBackgroundManager` successors.
- [ ] Migrate modal infrastructure (`modal.ts`) into `src/frontend/lib/components/modal/*` using portals or root-level conditional components for accessibility.

### Phase 4 — Feature Components

#### Challenge List & Item Rendering
- [ ] Convert challenge list rendering from `ChallengeList` DOM methods into `ChallengeList.svelte` + `ChallengeItem.svelte` with keyed `#each` loops.
- [ ] Preserve numeric IDs and state transitions (active/completed/failed) via props + store actions.
- [ ] Re-implement drag/reorder or step increment/decrement controls within Svelte events.
- [ ] Add text-only mode variant component to satisfy admin overlay requirement.

#### Admin Controls & Panels
- [ ] Port admin configuration sections into modular Svelte components (General Settings, Appearance, Backup/Restore, Commands).
- [ ] Replace `AdminPanelDOMBuilder` with Svelte form components binding directly to config store values.
- [ ] Ensure validation rules from `AdminPanelConfigValidator` surface as reactive form errors.
- [ ] Maintain auto-save behavior with debounced store updates + persistence notifications.

#### Timer & Status Indicators
- [ ] Create `Timer.svelte` managing countdown display, colour transitions, and end behavior configuration.
- [ ] Ensure timer state persists via store across refresh and syncs via BroadcastChannel to viewers.
- [ ] Implement visual state cues consistent with OBS sizing restrictions.

#### Modal & Toast Feedback
- [ ] Rebuild modal dialogs and toast notifications using Svelte transitions.
- [ ] Ensure focus management and ESC/overlay dismissal behaviours align with accessibility standards.

### Phase 5 — Commands & Twitch Integration
- [ ] Migrate command registry to `src/backend/commands/index.ts`, exposing `executeCommand(command, context)` that mutates backend-managed stores.
- [ ] Port each command handler (`AddCommand`, `ClearAllCommand`, etc.) into `src/backend/commands/*.ts` consuming backend services and emitting typed events to the frontend.
- [ ] Integrate Twitch chat events by bridging `src/backend/services/twitchChat.ts` to frontend stores via derived adapters and Svelte `onMount` hooks.
- [ ] Recreate command feedback UI (if any) using `src/frontend/lib/components/command-feedback/*` while reusing centralized message constants from `src/types`.

### Phase 6 — Testing & Quality Assurance
- [ ] Introduce `@testing-library/svelte` for component-level tests.
- [ ] Backfill unit tests for stores to mirror coverage previously achieved by class-based tests.
- [ ] Add integration tests covering admin interactions, viewer rendering, and Twitch command flows.
- [ ] Configure snapshot or visual regression testing for OBS-specific layouts if necessary.
- [ ] Ensure Vitest configuration supports Svelte preprocess and jsdom environment.

### Phase 7 — Deployment & Launch
- [ ] Update build pipelines to emit final bundle (`dist/challengeBot.iife.js`) from Svelte entrypoint.
- [ ] Perform performance regression checks (bundle size, load time, memory) against legacy implementation.
- [ ] Conduct OBS dock smoke tests in both modes (admin/viewer) on Windows + macOS.
- [ ] Prepare documentation describing new component structure, store usage, and developer onboarding.
- [ ] Plan release communication and rollback strategy.

## Cross-Cutting Workstreams
- **Design tokens & styling**: Gradually migrate global CSS into Svelte scoped styles, preserving variables in `styles/variables.css` or moving into a global stylesheet imported in `src/frontend/App.svelte`.
- **Accessibility**: Audit tab order, ARIA roles, and keyboard shortcuts within Svelte components as they are ported.
- **Localization readiness**: Structure components to accept string constants from centralized modules, easing future i18n.
- **Analytics/telemetry**: Re-add any OBS logging or analytics hooks once components are in place.

## Risks & Mitigations
- **State divergence**: Mitigate by centralizing logic in stores and writing regression tests before deprecating legacy classes.
- **OBS rendering quirks**: Maintain manual QA in OBS after each phase, and keep fallback CSS for known issues.
- **Incremental adoption challenges**: Optionally ship hybrid builds where Svelte renders only part of the UI while legacy code handles the remainder until full parity is achieved.
- **Third-party dependencies**: Validate that Twitch IRC libraries remain compatible with bundling changes.

## Definition of Done
- All legacy DOM-manipulation classes are removed or shimmed by Svelte components without loss of functionality.
- Stores cover challenge data, configuration, timer state, Twitch status, and UI preferences with persistence + broadcast support.
- Vitest suite (component + integration) passes with ≥80% coverage, including the migrated areas.
- Build output remains a single file consumable by OBS with no console errors in admin/viewer modes.
- Documentation updated: developer onboarding, architecture overview, and appendices listing migrated components.
