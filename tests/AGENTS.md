# tests/ - Testing Patterns & Coverage

Tests mirror `src/` structure. 80% minimum per-file coverage (v8). Barrel files (`src/**/index.ts`) and type-only modules (`src/types/**`) are excluded from coverage.

## Test Structure

```typescript
describe("ClassName", () => {
    beforeEach(() => {
        ensureTestIsolation(); // CRITICAL: Clear state before each test
    });
    it("should describe expected behavior", () => {
        expect(result).toBe(expected);
    });
});
```

## Performance Requirement

**CRITICAL**: Individual unit tests MUST complete in under 1 second. Vitest is configured with a 1-second timeout (`testTimeout: 1000`). If tests time out:

1. **Refactor the test**: Simplify setup, reduce iterations, or remove unnecessary operations.
2. **Refactor the code**: Eliminate performance bottlenecks in the implementation.
3. **Break up code**: Split complex logic into smaller, testable units.

Never increase the timeout—fix the test or the underlying code instead.

## TypeScript Strict Patterns

**Optional properties**: `{...(val !== undefined && {prop: val})}` (never pass undefined)
**Dataset access**: `element.dataset[DATA_ATTRIBUTES.KEY]` (bracket notation only)

## Coverage Strategy

Target ≥80% statements/branches/functions/lines per file. Focus on:

1. Exercising error paths (listener throws, BroadcastChannel unavailability, timer absence).
2. Covering optional parameter branches (challenge add/update fields, config setAll/reset/import variants).
3. Branch variance for admin vs viewer modes (hash-based).

Avoid artificially inflating coverage with meaningless assertions—prefer meaningful state transitions.

## Branch Coverage

Test all branches: error paths, conditionals (admin/viewer mode), state variations (empty/max), DOM errors, integration flows. For listener error handling, subscribe first with a conditional throw flag set after initial `init` emission to ensure the service’s internal try/catch blocks are executed.

## Test Utilities

**ensureTestIsolation()**: Call in EVERY `beforeEach` (clears localStorage, resets state)
**domTestUtils.ts**: createMockDOM(), cleanupDOM(), findElement()
**chatHandlerTestUtils.ts**: createMockChatMessage(), createMockUser(), simulateCommand()

## Mocking

**DOM**: Use JSDOM to set global.document/window
**localStorage**: Map-based mock with getItem/setItem/removeItem/clear/length/key

## Running Tests

-   All: `runTests()`
-   Specific: `runTests({files: ["path/to/test.ts"]})`
-   Coverage: `runTests({mode: "coverage", coverageFiles: ["path/to/file.ts"]})`
-   Debug: `it.only()` to focus, `it.skip()` to disable

> Preferred runner is the VS Code runTests integration; `pnpm test` acceptable for full textual coverage diagnostics or CI parity.
