import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPanel from "../../src/classes/AdminPanel";
import ConfigManager from "../../src/classes/ConfigManager";

// Mock setTimeout to control timing in tests
const mockSetTimeout = vi.fn();
global.setTimeout = mockSetTimeout as any;

// Test Utilities
const createTestConfig = (): Config => ({
    auth: {
        twitch_oauth: "test_oauth",
        twitch_username: "test_user",
        twitch_channel: "test_channel",
    },
    maxChallenges: 10,
    challengeRowColors: [],
    commands: {
        clearAll: ["!ch clearlist", "!ch clearall"],
        clearDone: ["!ch cleardone"],
        addChallenge: ["!ch add"],
        editChallenge: ["!ch edit"],
        finishChallenge: ["!ch done"],
        deleteChallenge: ["!ch delete", "!ch del"],
        check: ["!ch check"],
        help: ["!ch help"],
        incrementChallenge: ["!ch +"],
        decrementChallenge: ["!ch -"],
        setProgress: ["!ch set"],
        failChallenge: ["!ch fail"],
        listChallenges: ["!ch list"],
        showChallenge: ["!ch show"],
    },
    responses: {
        clearAll: "All challenges cleared",
        clearDone: "Done challenges cleared",
        addChallenge: "Challenge added",
        editChallenge: "Challenge edited",
        finishChallenge: "Challenge completed",
        deleteChallenge: "Challenge deleted",
        deleteAll: "All challenges deleted",
        check: "Current challenges",
        help: "Help message",
        maxChallengesAdded: "Max challenges reached",
        noChallengeFound: "No challenge found",
        invalidCommand: "Invalid command",
    },
});

const setupDOMElements = (): HTMLButtonElement => {
    document.body.innerHTML = `
        <button id="clear-localstorage-btn">Clear LocalStorage</button>
    `;
    return document.getElementById(
        "clear-localstorage-btn"
    ) as HTMLButtonElement;
};

const setupMocks = (): void => {
    vi.clearAllMocks();
    mockSetTimeout.mockClear();
};

const setupConfigManager = (config: Config = createTestConfig()): void => {
    (ConfigManager as any).instance = null;
    ConfigManager.getInstance(config);
};

const createMockApp = (): any => ({
    clearListFromDOM: vi.fn(),
});

const setupLocalStorage = (): void => {
    localStorage.removeItem("overlay_config");
    localStorage.setItem("testKey", "testValue");
};

const setupTestEnvironment = (
    adminMode: boolean = false
): {
    clearButton: HTMLButtonElement;
    mockApp: any;
} => {
    const clearButton = setupDOMElements();
    setupMocks();
    setupConfigManager();
    const mockApp = createMockApp();
    setupLocalStorage();

    window.location.hash = adminMode ? "#admin" : "";

    return { clearButton, mockApp };
};

const assertButtonFeedback = (
    button: HTMLButtonElement,
    expectedText: string,
    expectedBgColor: string
): void => {
    expect(button.textContent).toBe(expectedText);
    expect(button.style.backgroundColor).toBe(expectedBgColor);
};

const triggerTimeoutCallback = (): void => {
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    const lastCall =
        mockSetTimeout.mock.calls[mockSetTimeout.mock.calls.length - 1];
    if (lastCall && lastCall[0]) {
        const timeoutCallback = lastCall[0];
        timeoutCallback();
    }
};

describe("AdminPanel", () => {
    let adminPanel: AdminPanel;
    let clearButton: HTMLButtonElement;

    beforeEach(() => {
        const testEnv = setupTestEnvironment();
        clearButton = testEnv.clearButton;
    });

    describe("when in admin mode", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            adminPanel = new AdminPanel();
        });

        it("should initialize and add click listener to clear button", () => {
            // Verify button exists and has expected initial state
            expect(clearButton).toBeTruthy();
            expect(clearButton.textContent).toBe("Clear LocalStorage");

            // Add some configuration data to localStorage
            localStorage.setItem(
                "overlay_config",
                JSON.stringify({ test: "data" })
            );
            expect(localStorage.getItem("overlay_config")).toBeTruthy();

            // Click the button to test the actual behavior
            clearButton.click();

            // Check that configuration was cleared (but other localStorage items remain)
            expect(localStorage.getItem("overlay_config")).toBeNull();
            expect(localStorage.getItem("testKey")).toBe("testValue"); // Other items should remain

            // Check visual feedback using helper function
            assertButtonFeedback(clearButton, "Cleared!", "rgb(40, 167, 69)");

            // Verify setTimeout was called for the reset
            expect(mockSetTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                2000
            );
        });

        it("should handle localStorage errors gracefully", () => {
            // Mock the ConfigManager's clearStorage method to return false (indicating error)
            const configManager = ConfigManager.getInstance();
            const originalClearStorage = configManager.clearStorage;
            configManager.clearStorage = vi.fn(() => false);

            // Mock console.error to verify error logging
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Click the button to trigger the error
            clearButton.click();

            // Check that clearStorage was attempted
            expect(configManager.clearStorage).toHaveBeenCalled();

            // Check visual feedback for error using helper function
            assertButtonFeedback(clearButton, "Error!", "rgb(220, 53, 69)");

            // Restore original method and console
            configManager.clearStorage = originalClearStorage;
            consoleSpy.mockRestore();
        });

        it("should reset button appearance after timeout", () => {
            // Store original text
            const originalText = clearButton.textContent;

            // Click the button
            clearButton.click();

            // Verify initial feedback using helper function
            assertButtonFeedback(clearButton, "Cleared!", "rgb(40, 167, 69)");

            // Execute timeout callback using helper function
            triggerTimeoutCallback();

            // Verify button was reset to original text
            expect(clearButton.textContent).toBe(originalText);
            expect(clearButton.style.backgroundColor).toBe("");
        });
    });

    describe("when not in admin mode", () => {
        beforeEach(() => {
            window.location.hash = "";
            adminPanel = new AdminPanel();
        });

        it("should not add click listener when not in admin mode", () => {
            // Verify localStorage still has test data
            expect(localStorage.getItem("testKey")).toBe("testValue");

            // Click the button - should not trigger clear functionality
            clearButton.click();

            // Verify localStorage was NOT cleared
            expect(localStorage.getItem("testKey")).toBe("testValue");
            expect(localStorage.length).toBe(1);

            // Verify button appearance unchanged using helper function
            assertButtonFeedback(clearButton, "Clear LocalStorage", "");

            // Verify setTimeout was not called for the clear functionality
            const clearTimeoutCalls = mockSetTimeout.mock.calls.filter(
                (call) => call[1] === 2000
            );
            expect(clearTimeoutCalls).toHaveLength(0);
        });
    });

    describe("hash change handling", () => {
        it("should reinitialize when hash changes to admin", () => {
            // Start in non-admin mode
            window.location.hash = "";
            adminPanel = new AdminPanel();

            // Verify button doesn't work initially
            clearButton.click();
            expect(localStorage.getItem("testKey")).toBe("testValue");

            // Change to admin mode
            window.location.hash = "#admin";

            // Trigger hashchange event
            const hashChangeEvent = new Event("hashchange");
            window.dispatchEvent(hashChangeEvent);

            // Now button should work
            clearButton.click();
            expect(localStorage.getItem("overlay_config")).toBeNull();
            expect(clearButton.textContent).toBe("Cleared!");
        });
    });

    describe("import/export functionality", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            adminPanel = new AdminPanel();
        });

        const createValidConfig = () => ({
            auth: {
                twitch_oauth: "oauth:test",
                twitch_username: "testuser",
                twitch_channel: "testchannel",
            },
            maxChallenges: 5,
            commands: {
                addChallenge: ["!add"],
                editChallenge: ["!edit"],
                finishChallenge: ["!done"],
                deleteChallenge: ["!delete"],
            },
            responses: {
                addChallenge: "Added",
                editChallenge: "Edited",
                finishChallenge: "Finished",
                deleteChallenge: "Deleted",
            },
        });

        const validateConfiguration = (config: any) =>
            (adminPanel as any).validateImportedConfiguration(config);

        it("should validate imported configuration correctly", () => {
            const validConfig = createValidConfig();
            const result = validateConfiguration(validConfig);

            expect(result.isValid).toBe(true);
            expect(result.errorMessage).toBe("");
        });

        // Parameterized validation tests
        const invalidConfigTestCases = [
            {
                name: "missing auth property",
                config: { maxChallenges: 5, commands: {}, responses: {} },
                expectedError: "Missing required property: auth",
            },
            {
                name: "missing maxChallenges property",
                config: {
                    auth: {
                        twitch_oauth: "test",
                        twitch_username: "test",
                        twitch_channel: "test",
                    },
                    commands: {},
                    responses: {},
                },
                expectedError: "Missing required property: maxChallenges",
            },
            {
                name: "missing commands property",
                config: {
                    auth: {
                        twitch_oauth: "test",
                        twitch_username: "test",
                        twitch_channel: "test",
                    },
                    maxChallenges: 5,
                    responses: {},
                },
                expectedError: "Missing required property: commands",
            },
            {
                name: "missing responses property",
                config: {
                    auth: {
                        twitch_oauth: "test",
                        twitch_username: "test",
                        twitch_channel: "test",
                    },
                    maxChallenges: 5,
                    commands: {},
                },
                expectedError: "Missing required property: responses",
            },
        ];

        invalidConfigTestCases.forEach(({ name, config, expectedError }) => {
            it(`should reject configuration with ${name}`, () => {
                const result = validateConfiguration(config);
                expect(result.isValid).toBe(false);
                expect(result.errorMessage).toContain(expectedError);
            });
        });

        it("should handle metadata-wrapped configuration", () => {
            const wrappedConfig = {
                _metadata: {
                    exportedAt: "2024-01-01T00:00:00.000Z",
                    version: "1.0.0",
                    source: "Test",
                },
                config: createValidConfig(),
            };

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            (adminPanel as any).processImportedConfiguration(
                JSON.stringify(wrappedConfig),
                "test-btn"
            );

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Importing configuration exported on: 2024-01-01T00:00:00.000Z"
                )
            );

            consoleSpy.mockRestore();
        });
    });
});
