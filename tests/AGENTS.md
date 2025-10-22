# tests/ - Testing Patterns & Coverage

Test organization, utilities, and coverage requirements.

## Test Organization

**Parallel structure**: Tests mirror `src/` directory

```
tests/
├── classes/      # Core class tests
├── commands/     # Command tests
├── twitch/       # IRC integration tests
├── utils/        # Utility tests
├── integration/  # Integration tests
└── app/          # App-level tests
```

## Coverage Requirements (MANDATORY)

- **Thresholds**: 80% minimum (statements, branches, functions, lines)
- **Provider**: v8 for TypeScript
- **Enforcement**: Build fails below thresholds
- **Command**: `pnpm run test:coverage`

## Test Structure

```typescript
import { beforeEach, describe, expect, it } from "vitest";

describe("ClassName", () => {
    let instance: ClassName;
    
    beforeEach(() => {
        ensureTestIsolation();  // CRITICAL: Clear state
        instance = new ClassName("param");
    });
    
    describe("methodName", () => {
        it("should describe expected behavior", () => {
            expect(instance.methodName()).toBe(expected);
        });
    });
});
```

## Coverage Summary

### High Coverage (90%+)
- index.ts: 100% (28 tests)
- CommandRegistry: 100% (34 tests)
- TwitchChat: 100% statements (34 tests)
- ChallengeRenderer, CommandHandler, ValidationUtils: 90%+

### Good Coverage (80-89%)
- App: 92.59% statements (27 tests)
- AdminPanel: 89.92% statements (35 tests)
- Commands: 10+ classes with 80%+

## Branch Coverage Strategies

**Test all branches**:
- Error paths (invalid inputs, null checks, boundaries)
- Conditional logic (admin vs viewer mode, feature flags)
- State variations (empty lists, max capacity, edge cases)
- DOM errors (missing elements)
- Integration flows (complete command paths)

**Example**:
```typescript
describe("handleCheckboxClick", () => {
    it("toggles in admin mode", () => {
        window.location.hash = "#admin";
        // Test logic
    });
    
    it("ignores in viewer mode", () => {
        window.location.hash = "";
        // Verify no change
    });
});
```

## Test Utilities

### ensureTestIsolation() - CRITICAL
Call in EVERY `beforeEach` block:
```typescript
beforeEach(() => {
    ensureTestIsolation();  // Clears localStorage, resets state
});
```

### domTestUtils.ts
- `createMockDOM()`: Mock DOM environment
- `cleanupDOM()`: Teardown
- `findElement(selector)`: Safe query

### chatHandlerTestUtils.ts
- `createMockChatMessage()`: Test messages
- `createMockUser()`: Test users
- `simulateCommand()`: Command execution

## Testing DOM

```typescript
import { JSDOM } from "jsdom";

beforeEach(() => {
    const dom = new JSDOM("<!DOCTYPE html><div id='container'></div>");
    global.document = dom.window.document;
    global.window = dom.window as any;
});
```

## Mocking localStorage

```typescript
const mockStorage = new Map<string, string>();
global.localStorage = {
    getItem: (key) => mockStorage.get(key) ?? null,
    setItem: (key, value) => mockStorage.set(key, value),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
    length: mockStorage.size,
    key: (index) => Array.from(mockStorage.keys())[index] ?? null
};
```

## Running Tests

```bash
pnpm run test              # All tests
pnpm run test:coverage     # Coverage report
pnpm test -- ClassName     # Specific file
pnpm test -- --watch       # Watch mode
```

## Debugging

- Console logs visible in output
- VS Code debugger with Vitest
- `it.only()` for focused test
- `it.skip()` to disable test
