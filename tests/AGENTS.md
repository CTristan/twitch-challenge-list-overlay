# tests/ - Testing Patterns & Coverage

Tests mirror `src/` structure. 80% minimum coverage (v8). Use runTests tool with mode="coverage".

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

## TypeScript Strict Patterns

**Optional properties**: `{...(val !== undefined && {prop: val})}` (never pass undefined)
**Dataset access**: `element.dataset[DATA_ATTRIBUTES.KEY]` (bracket notation only)

## Coverage Summary

**High (90%+)**: index.ts, CommandRegistry, TwitchChat, ChallengeRenderer, CommandHandler, ValidationUtils
**Good (80-89%)**: App (92.59%), AdminPanel (89.92%), Commands (10+ classes)

## Branch Coverage

Test all branches: error paths, conditionals (admin/viewer mode), state variations (empty/max), DOM errors, integration flows.

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
