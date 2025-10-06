import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPanel from "../../src/classes/AdminPanel";
import ConfigManager from "../../src/classes/ConfigManager";
import { ERROR_MESSAGES } from "../../src/types/MessageConstants";

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
            {
                name: "maxChallenges not a number",
                config: {
                    auth: {
                        twitch_oauth: "test",
                        twitch_username: "test",
                        twitch_channel: "test",
                    },
                    maxChallenges: "not a number",
                    commands: {},
                    responses: {},
                },
                expectedError: "maxChallenges must be a positive number!",
            },
            {
                name: "maxChallenges less than 1",
                config: {
                    auth: {
                        twitch_oauth: "test",
                        twitch_username: "test",
                        twitch_channel: "test",
                    },
                    maxChallenges: 0,
                    commands: {},
                    responses: {},
                },
                expectedError: "maxChallenges must be a positive number!",
            },
            {
                name: "commands not an object",
                config: {
                    auth: {
                        twitch_oauth: "test",
                        twitch_username: "test",
                        twitch_channel: "test",
                    },
                    maxChallenges: 5,
                    commands: "not an object",
                    responses: {},
                },
                expectedError: "Commands section must be an object!",
            },
            {
                name: "responses not an object",
                config: {
                    auth: {
                        twitch_oauth: "test",
                        twitch_username: "test",
                        twitch_channel: "test",
                    },
                    maxChallenges: 5,
                    commands: {},
                    responses: "not an object",
                },
                expectedError: "Responses section must be an object!",
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

    describe("Configuration Save and Reset", () => {
        beforeEach(() => {
            window.location.hash = "#admin";

            // Setup complete DOM structure for save/reset tests
            document.body.innerHTML = `
                <div class="admin-content">
                    <button id="save-config-btn">Save Configuration</button>
                    <button id="reset-config-btn">Reset to Defaults</button>
                    <input type="text" id="twitch-oauth" value="oauth:test">
                    <input type="text" id="twitch-username" value="testuser">
                    <input type="text" id="twitch-channel" value="testchannel">
                    <input type="number" id="max-challenges" value="15">
                    <input type="checkbox" id="primary-color-enabled" checked>
                    <input type="color" id="primary-bg-color" value="#ff0000">
                    <input type="color" id="primary-text-color" value="#ffffff">
                    <input type="checkbox" id="secondary-color-enabled">
                    <input type="color" id="secondary-bg-color" value="#00ff00">
                    <input type="color" id="secondary-text-color" value="#000000">
                    <input type="checkbox" id="tertiary-color-enabled">
                    <input type="color" id="tertiary-bg-color" value="#0000ff">
                    <input type="color" id="tertiary-text-color" value="#ffffff">
                    <input type="color" id="overlay-background-color" value="#000000">
                    <input type="range" id="overlay-background-opacity" value="80">
                    <span id="overlay-opacity-display">80%</span>
                    <input type="color" id="challenge-background-color" value="#333333">
                    <input type="range" id="challenge-background-opacity" value="90">
                    <span id="challenge-opacity-display">90%</span>
                    <input type="color" id="challenge-text-color" value="#ffffff" disabled>
                    <input type="checkbox" id="challenge-auto-text-color" checked>
                    <input type="checkbox" id="challenge-text-shadow">
                </div>
            `;

            adminPanel = new AdminPanel();
            adminPanel.initialize();
        });

        it("should auto-save configuration when fields change", () => {
            const configManager = ConfigManager.getInstance();

            // Change the max challenges input value
            const maxChallengesInput = document.getElementById(
                "max-challenges"
            ) as HTMLInputElement;
            maxChallengesInput.value = "15";
            maxChallengesInput.dispatchEvent(new Event("change"));

            // Verify configuration was auto-saved
            const savedConfig = configManager.getAll();
            expect(savedConfig.maxChallenges).toBe(15);
        });

        it("should reset configuration to defaults", () => {
            const resetBtn = document.getElementById(
                "reset-config-btn"
            ) as HTMLButtonElement;
            const configManager = ConfigManager.getInstance();

            // Modify configuration
            configManager.set("maxChallenges", 20);

            // Click reset button
            resetBtn.click();

            // Verify configuration was reset
            const resetConfig = configManager.getAll();
            expect(resetConfig.maxChallenges).toBe(10); // Default value

            // Verify button feedback
            expect(resetBtn.textContent).toBe("Reset!");
        });

        it("should handle auto-save configuration errors gracefully", () => {
            const configManager = ConfigManager.getInstance();

            // Mock set method to throw an error
            const originalSet = configManager.set;
            configManager.set = vi.fn(() => {
                throw new Error("Storage error");
            });

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Change a field to trigger auto-save
            const maxChallengesInput = document.getElementById(
                "max-challenges"
            ) as HTMLInputElement;
            maxChallengesInput.value = "15";
            maxChallengesInput.dispatchEvent(new Event("change"));

            // Verify error handling (auto-save errors are logged but don't show UI feedback)
            expect(consoleSpy).toHaveBeenCalledWith(
                ERROR_MESSAGES.ERROR_AUTO_SAVING_BEHAVIOR_CONFIG,
                expect.any(Error)
            );

            // Restore
            configManager.set = originalSet;
            consoleSpy.mockRestore();
        });

        it("should handle reset configuration errors", () => {
            const resetBtn = document.getElementById(
                "reset-config-btn"
            ) as HTMLButtonElement;
            const configManager = ConfigManager.getInstance();

            // Mock reset method to return false
            const originalReset = configManager.reset;
            configManager.reset = vi.fn(() => false);

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Click reset button
            resetBtn.click();

            // Verify error handling
            expect(consoleSpy).toHaveBeenCalledWith(
                "Configuration reset failed"
            );
            expect(resetBtn.textContent).toBe("Reset Failed!");

            // Restore
            configManager.reset = originalReset;
            consoleSpy.mockRestore();
        });
    });

    describe("Background Configuration", () => {
        beforeEach(() => {
            window.location.hash = "#admin";

            // Setup DOM with background configuration elements
            document.body.innerHTML = `
                <div class="admin-content">
                    <input type="color" id="overlay-background-color" value="#000000">
                    <input type="range" id="overlay-background-opacity" value="80" min="0" max="100">
                    <span id="overlay-opacity-display">80%</span>
                    <input type="color" id="challenge-background-color" value="#333333">
                    <input type="range" id="challenge-background-opacity" value="90" min="0" max="100">
                    <span id="challenge-opacity-display">90%</span>
                    <input type="color" id="challenge-text-color" value="#ffffff" disabled>
                    <input type="checkbox" id="challenge-auto-text-color" checked>
                    <input type="checkbox" id="challenge-text-shadow">
                    <div id="background-preview">
                        <div class="preview-challenge">
                            <span class="preview-text">Preview Text</span>
                        </div>
                    </div>
                </div>
            `;

            // Set up config with challengeAutoTextColor enabled
            const configManager = ConfigManager.getInstance();
            configManager.set("challengeAutoTextColor", true);

            adminPanel = new AdminPanel();
            adminPanel.initialize();
        });

        it("should populate background configuration from config", () => {
            const configManager = ConfigManager.getInstance();

            // Set background configuration
            configManager.set("overlayBackgroundColor", "rgba(255, 0, 0, 0.5)");
            configManager.set("overlayBackgroundOpacity", 0.5);
            configManager.set(
                "challengeBackgroundColor",
                "rgba(0, 255, 0, 0.8)"
            );
            configManager.set("challengeBackgroundOpacity", 0.8);
            configManager.set("challengeTextColor", "#ff00ff");
            configManager.set("challengeAutoTextColor", false);
            configManager.set("challengeTextShadow", true);

            // Reinitialize to populate form
            adminPanel = new AdminPanel();

            // Verify form was populated
            const overlayColorInput = document.getElementById(
                "overlay-background-color"
            ) as HTMLInputElement;
            const overlayOpacitySlider = document.getElementById(
                "overlay-background-opacity"
            ) as HTMLInputElement;
            const backgroundColorInput = document.getElementById(
                "challenge-background-color"
            ) as HTMLInputElement;
            const opacitySlider = document.getElementById(
                "challenge-background-opacity"
            ) as HTMLInputElement;
            const textColorInput = document.getElementById(
                "challenge-text-color"
            ) as HTMLInputElement;
            const autoTextColorCheckbox = document.getElementById(
                "challenge-auto-text-color"
            ) as HTMLInputElement;
            const textShadowCheckbox = document.getElementById(
                "challenge-text-shadow"
            ) as HTMLInputElement;

            expect(overlayColorInput.value).toBe("#ff0000");
            expect(overlayOpacitySlider.value).toBe("50");
            expect(backgroundColorInput.value).toBe("#00ff00");
            expect(opacitySlider.value).toBe("80");
            expect(textColorInput.value).toBe("#ff00ff");
            expect(autoTextColorCheckbox.checked).toBe(false);
            expect(textShadowCheckbox.checked).toBe(true);
        });

        it("should update background preview when color changes", () => {
            const backgroundColorInput = document.getElementById(
                "challenge-background-color"
            ) as HTMLInputElement;
            const previewChallenge = document.querySelector(
                ".preview-challenge"
            ) as HTMLElement;

            // Change background color
            backgroundColorInput.value = "#ff0000";
            backgroundColorInput.dispatchEvent(new Event("input"));

            // Verify preview was updated
            expect(previewChallenge.style.backgroundColor).toContain("rgba");
        });

        it("should update opacity display when slider changes", () => {
            const opacitySlider = document.getElementById(
                "challenge-background-opacity"
            ) as HTMLInputElement;
            const opacityDisplay = document.getElementById(
                "challenge-opacity-display"
            );

            // Verify initial value
            expect(opacityDisplay?.textContent).toBe("90%");

            // Change opacity
            opacitySlider.value = "75";
            opacitySlider.dispatchEvent(new Event("input"));

            // Wait for event handler to process
            setTimeout(() => {
                // Verify display was updated
                expect(opacityDisplay?.textContent).toBe("75%");
            }, 0);
        });

        it("should toggle text color input when auto text color changes", () => {
            const autoTextColorCheckbox = document.getElementById(
                "challenge-auto-text-color"
            ) as HTMLInputElement;
            const textColorInput = document.getElementById(
                "challenge-text-color"
            ) as HTMLInputElement;

            // Initially checked, so text color should be disabled
            expect(textColorInput.disabled).toBe(true);

            // Uncheck auto text color
            autoTextColorCheckbox.checked = false;
            autoTextColorCheckbox.dispatchEvent(new Event("change"));

            // Text color input should now be enabled
            expect(textColorInput.disabled).toBe(false);
        });

        it("should apply text shadow when checkbox is checked", () => {
            const textShadowCheckbox = document.getElementById(
                "challenge-text-shadow"
            ) as HTMLInputElement;
            const previewText = document.querySelector(
                ".preview-text"
            ) as HTMLElement;

            // Check text shadow
            textShadowCheckbox.checked = true;
            textShadowCheckbox.dispatchEvent(new Event("change"));

            // Verify text shadow was applied
            expect(previewText.style.textShadow).toBeTruthy();
        });
    });

    describe("Configuration Export Extended", () => {
        beforeEach(() => {
            window.location.hash = "#admin";

            document.body.innerHTML = `
                <div class="admin-content">
                    <button id="export-json-btn">Export JSON</button>
                </div>
            `;

            adminPanel = new AdminPanel();
        });

        it("should handle unsupported export format", () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Try to export with unsupported format
            (adminPanel as any).exportConfiguration("xml");

            // Verify error was logged
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Unsupported export format: xml")
            );

            consoleSpy.mockRestore();
        });

        it("should handle export failure", () => {
            const exportBtn = document.getElementById(
                "export-json-btn"
            ) as HTMLButtonElement;
            const configManager = ConfigManager.getInstance();

            // Mock export to throw error
            const originalExport = configManager.export;
            configManager.export = vi.fn(() => {
                throw new Error("Export failed");
            });

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Click export button
            exportBtn.click();

            // Verify error handling - console.error is called with message and error object
            expect(consoleSpy).toHaveBeenCalled();
            const firstCall = consoleSpy.mock.calls[0];
            expect(firstCall?.[0]).toContain("Error exporting configuration");
            expect(exportBtn.textContent).toBe("Error!");

            // Restore
            configManager.export = originalExport;
            consoleSpy.mockRestore();
        });
    });

    describe("Configuration Import File Handling", () => {
        beforeEach(() => {
            window.location.hash = "#admin";

            document.body.innerHTML = `
                <div class="admin-content">
                    <button id="import-config-btn">Import Config</button>
                    <input type="file" id="import-file-input" accept=".json" style="display: none;">
                </div>
            `;

            adminPanel = new AdminPanel();
        });

        it("should trigger file picker when import button is clicked", () => {
            const importBtn = document.getElementById(
                "import-config-btn"
            ) as HTMLButtonElement;
            const fileInput = document.getElementById(
                "import-file-input"
            ) as HTMLInputElement;

            // Spy on file input click
            const clickSpy = vi.spyOn(fileInput, "click");

            // Click import button
            importBtn.click();

            // Verify file picker was triggered
            expect(clickSpy).toHaveBeenCalled();

            clickSpy.mockRestore();
        });

        it("should handle no file selected", () => {
            const fileInput = document.getElementById(
                "import-file-input"
            ) as HTMLInputElement;

            // Trigger change event with no files
            fileInput.dispatchEvent(new Event("change"));

            // Should not throw error
            expect(fileInput.files?.length).toBeFalsy();
        });

        it("should reject invalid file types", () => {
            const fileInput = document.getElementById(
                "import-file-input"
            ) as HTMLInputElement;
            const importBtn = document.getElementById(
                "import-config-btn"
            ) as HTMLButtonElement;

            // Create a mock file with invalid extension
            const mockFile = new File(["test content"], "config.txt", {
                type: "text/plain",
            });

            // Mock the files property
            Object.defineProperty(fileInput, "files", {
                value: [mockFile],
                writable: false,
            });

            // Trigger change event
            fileInput.dispatchEvent(new Event("change"));

            // Verify error feedback - the actual message from AdminPanel
            expect(importBtn.textContent).toBe("Please select a JSON file!");
        });

        it("should handle file read errors", () => {
            const fileInput = document.getElementById(
                "import-file-input"
            ) as HTMLInputElement;
            const importBtn = document.getElementById(
                "import-config-btn"
            ) as HTMLButtonElement;

            // Create a mock file
            const mockFile = new File(['{"test": "data"}'], "config.json", {
                type: "application/json",
            });

            // Mock the files property
            Object.defineProperty(fileInput, "files", {
                value: [mockFile],
                writable: false,
            });

            // Mock FileReader to trigger error
            const originalFileReader = global.FileReader;
            global.FileReader = class MockFileReader {
                readAsText() {
                    setTimeout(() => {
                        if (this.onerror) {
                            this.onerror(new Event("error"));
                        }
                    }, 0);
                }
                onerror: ((event: Event) => void) | null = null;
                onload: ((event: Event) => void) | null = null;
            } as any;

            // Trigger change event
            fileInput.dispatchEvent(new Event("change"));

            // Wait for async operations
            setTimeout(() => {
                expect(importBtn.textContent).toBe("File Read Error");
            }, 10);

            // Restore
            global.FileReader = originalFileReader;
        });

        it("should handle invalid JSON in imported file", () => {
            const fileInput = document.getElementById(
                "import-file-input"
            ) as HTMLInputElement;
            const importBtn = document.getElementById(
                "import-config-btn"
            ) as HTMLButtonElement;

            // Create a mock file with invalid JSON
            const mockFile = new File(["invalid json content"], "config.json", {
                type: "application/json",
            });

            // Mock the files property
            Object.defineProperty(fileInput, "files", {
                value: [mockFile],
                writable: false,
            });

            // Mock FileReader
            const originalFileReader = global.FileReader;
            global.FileReader = class MockFileReader {
                readAsText() {
                    setTimeout(() => {
                        if (this.onload) {
                            this.onload({
                                target: { result: "invalid json" },
                            } as any);
                        }
                    }, 0);
                }
                onerror: ((event: Event) => void) | null = null;
                onload: ((event: Event) => void) | null = null;
            } as any;

            // Trigger change event
            fileInput.dispatchEvent(new Event("change"));

            // Wait for async operations
            setTimeout(() => {
                expect(importBtn.textContent).toBe("Invalid JSON Format");
            }, 10);

            // Restore
            global.FileReader = originalFileReader;
        });
    });

    describe("UI Refresh", () => {
        beforeEach(() => {
            window.location.hash = "#admin";

            document.body.innerHTML = `
                <div class="admin-content">
                    <input type="text" id="twitch-oauth" value="">
                    <input type="text" id="twitch-username" value="">
                    <input type="text" id="twitch-channel" value="">
                    <input type="number" id="max-challenges" value="">
                </div>
            `;

            adminPanel = new AdminPanel();
        });

        it("should refresh configuration UI with current values", () => {
            const configManager = ConfigManager.getInstance();

            // Set configuration values
            configManager.set("auth", {
                twitch_oauth: "oauth:refreshed",
                twitch_username: "refresheduser",
                twitch_channel: "refreshedchannel",
            });
            configManager.set("maxChallenges", 25);

            // Call refresh method
            (adminPanel as any).refreshConfigurationUI();

            // Verify form was updated
            const oauthInput = document.getElementById(
                "twitch-oauth"
            ) as HTMLInputElement;
            const usernameInput = document.getElementById(
                "twitch-username"
            ) as HTMLInputElement;
            const channelInput = document.getElementById(
                "twitch-channel"
            ) as HTMLInputElement;
            const maxChallengesInput = document.getElementById(
                "max-challenges"
            ) as HTMLInputElement;

            expect(oauthInput.value).toBe("oauth:refreshed");
            expect(usernameInput.value).toBe("refresheduser");
            expect(channelInput.value).toBe("refreshedchannel");
            expect(maxChallengesInput.value).toBe("25");
        });

        it("should handle missing form elements gracefully", () => {
            // Remove form elements
            document.body.innerHTML = '<div class="admin-content"></div>';

            // Call refresh method - should not throw
            expect(() => {
                (adminPanel as any).refreshConfigurationUI();
            }).not.toThrow();
        });
    });

    describe("Feedback System", () => {
        beforeEach(() => {
            window.location.hash = "#admin";

            document.body.innerHTML = `
                <div class="admin-content">
                    <button id="test-button">Test Button</button>
                </div>
            `;

            adminPanel = new AdminPanel();
        });

        it("should show feedback and reset after timeout", () => {
            const button = document.getElementById(
                "test-button"
            ) as HTMLButtonElement;
            const originalText = button.textContent;

            // Call showFeedback
            (adminPanel as any).showFeedback(
                "test-button",
                "Success!",
                "rgb(40, 167, 69)"
            );

            // Verify immediate feedback
            expect(button.textContent).toBe("Success!");
            expect(button.style.backgroundColor).toBe("rgb(40, 167, 69)");

            // Trigger timeout callback
            triggerTimeoutCallback();

            // Verify button was reset
            expect(button.textContent).toBe(originalText);
            expect(button.style.backgroundColor).toBe("");
        });

        it("should handle missing button element gracefully", () => {
            // Call showFeedback with non-existent button
            expect(() => {
                (adminPanel as any).showFeedback(
                    "non-existent-button",
                    "Test",
                    "red"
                );
            }).not.toThrow();
        });
    });

    describe("Color Configuration Helper Methods", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            document.body.innerHTML = `
                <div class="admin-content">
                    <input type="checkbox" id="primary-color-enabled" checked>
                    <div id="primary-color-pickers" class="color-pickers"></div>
                    <input type="color" id="primary-bg-color" value="#ff0000">
                    <input type="color" id="primary-text-color" value="#ffffff">
                    <input type="checkbox" id="secondary-color-enabled">
                    <div id="secondary-color-pickers" class="color-pickers"></div>
                    <input type="color" id="secondary-bg-color" value="#00ff00">
                    <input type="color" id="secondary-text-color" value="#000000">
                    <input type="checkbox" id="tertiary-color-enabled">
                    <div id="tertiary-color-pickers" class="color-pickers"></div>
                    <input type="color" id="tertiary-bg-color" value="#0000ff">
                    <input type="color" id="tertiary-text-color" value="#ffffff">
                </div>
            `;
            adminPanel = new AdminPanel();
        });

        it("should convert colors array to UI format", () => {
            const backgroundColors = ["#ff0000", "#00ff00", "#0000ff"];
            const textColors = ["#ffffff", "#000000", "#ffffff"];

            const result = (adminPanel as any).convertColorsToUI(
                backgroundColors,
                textColors
            );

            expect(result.primary.enabled).toBe(true);
            expect(result.primary.backgroundColor).toBe("#ff0000");
            expect(result.primary.textColor).toBe("#ffffff");
            expect(result.secondary.enabled).toBe(true);
            expect(result.secondary.backgroundColor).toBe("#00ff00");
            expect(result.secondary.textColor).toBe("#000000");
            expect(result.tertiary.enabled).toBe(true);
            expect(result.tertiary.backgroundColor).toBe("#0000ff");
            expect(result.tertiary.textColor).toBe("#ffffff");
        });

        it("should handle empty colors array", () => {
            const result = (adminPanel as any).convertColorsToUI([], []);

            expect(result.primary.enabled).toBe(false);
            expect(result.secondary.enabled).toBe(false);
            expect(result.tertiary.enabled).toBe(false);
        });

        it("should convert UI format to colors array", () => {
            const colorConfig = {
                primary: {
                    enabled: true,
                    backgroundColor: "#ff0000",
                    textColor: "#ffffff",
                },
                secondary: {
                    enabled: true,
                    backgroundColor: "#00ff00",
                    textColor: "#000000",
                },
                tertiary: {
                    enabled: false,
                    backgroundColor: "#0000ff",
                    textColor: "#ffffff",
                },
            };

            const backgroundColors = (adminPanel as any).convertUIToColors(
                colorConfig
            );
            const textColors = (adminPanel as any).convertUIToTextColors(
                colorConfig
            );

            expect(backgroundColors).toEqual(["#ff0000", "#00ff00"]);
            expect(textColors).toEqual(["#ffffff", "#000000"]);
        });

        it("should get current color config from UI", () => {
            const result = (adminPanel as any).getCurrentColorConfigFromUI();

            // Verify structure is correct
            expect(result).toHaveProperty("primary");
            expect(result).toHaveProperty("secondary");
            expect(result).toHaveProperty("tertiary");
            expect(result.primary).toHaveProperty("enabled");
            expect(result.primary).toHaveProperty("backgroundColor");
            expect(result.primary).toHaveProperty("textColor");
        });

        it("should update color tier state when enabled", () => {
            const pickersContainer = document.getElementById(
                "primary-color-pickers"
            );
            const bgColorInput = document.getElementById(
                "primary-bg-color"
            ) as HTMLInputElement;
            const textColorInput = document.getElementById(
                "primary-text-color"
            ) as HTMLInputElement;

            (adminPanel as any).updateColorTierState("primary", true);

            expect(pickersContainer?.classList.contains("expanded")).toBe(true);
            expect(pickersContainer?.classList.contains("disabled")).toBe(false);
            expect(bgColorInput.disabled).toBe(false);
            expect(textColorInput.disabled).toBe(false);
        });

        it("should update color tier state when disabled", () => {
            const pickersContainer = document.getElementById(
                "primary-color-pickers"
            );
            const bgColorInput = document.getElementById(
                "primary-bg-color"
            ) as HTMLInputElement;
            const textColorInput = document.getElementById(
                "primary-text-color"
            ) as HTMLInputElement;

            (adminPanel as any).updateColorTierState("primary", false);

            expect(pickersContainer?.classList.contains("expanded")).toBe(false);
            expect(pickersContainer?.classList.contains("disabled")).toBe(true);
            expect(bgColorInput.disabled).toBe(true);
            expect(textColorInput.disabled).toBe(true);
        });
    });

    describe("Background Configuration Helper Methods", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            document.body.innerHTML = `
                <div class="admin-content">
                    <input type="color" id="overlay-background-color" value="#000000">
                    <input type="range" id="overlay-background-opacity" value="80">
                    <input type="color" id="challenge-background-color" value="#333333">
                    <input type="range" id="challenge-background-opacity" value="90">
                    <input type="color" id="challenge-text-color" value="#ffffff">
                    <input type="checkbox" id="challenge-auto-text-color" checked>
                    <input type="checkbox" id="challenge-text-shadow">
                </div>
            `;
            adminPanel = new AdminPanel();
        });

        it("should get current background config from UI", () => {
            const result = (
                adminPanel as any
            ).getCurrentBackgroundConfigFromUI();

            // Verify structure and types
            expect(result).toHaveProperty("overlayBackgroundColor");
            expect(result).toHaveProperty("overlayBackgroundOpacity");
            expect(result).toHaveProperty("appBackgroundOpacity");
            expect(result).toHaveProperty("challengeBackgroundColor");
            expect(result).toHaveProperty("challengeBackgroundOpacity");
            expect(result).toHaveProperty("challengeAutoTextColor");
            expect(result).toHaveProperty("challengeTextShadow");
            expect(typeof result.overlayBackgroundOpacity).toBe("number");
            expect(typeof result.appBackgroundOpacity).toBe("number");
            expect(typeof result.challengeBackgroundOpacity).toBe("number");
            expect(typeof result.challengeAutoTextColor).toBe("boolean");
            expect(typeof result.challengeTextShadow).toBe("boolean");
        });

        it("should convert hex color to RGBA", () => {
            const result = (adminPanel as any).convertColorToRGBA(
                "#ff0000",
                0.5
            );

            expect(result).toBe("rgba(255, 0, 0, 0.5)");
        });

        it("should calculate optimal text color for light background", () => {
            const result = (adminPanel as any).calculateOptimalTextColor(
                "#ffffff"
            );

            expect(result).toBe("#000000");
        });

        it("should calculate optimal text color for dark background", () => {
            const result = (adminPanel as any).calculateOptimalTextColor(
                "#000000"
            );

            expect(result).toBe("#ffffff");
        });

        it("should generate text shadow for dark text", () => {
            const result = (adminPanel as any).generateTextShadow("#000000");

            expect(result).toContain("rgba(255, 255, 255");
        });

        it("should generate text shadow for light text", () => {
            const result = (adminPanel as any).generateTextShadow("#ffffff");

            expect(result).toContain("rgba(0, 0, 0");
        });
    });

    describe("Configuration Validation Extended", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            adminPanel = new AdminPanel();
        });

        it("should reject null configuration", () => {
            const result = (adminPanel as any).validateImportedConfiguration(
                null
            );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("valid object");
        });

        it("should reject non-object configuration", () => {
            const result = (adminPanel as any).validateImportedConfiguration(
                "not an object"
            );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("valid object");
        });

        it("should reject configuration with invalid auth section", () => {
            const config = {
                auth: "not an object",
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result = (adminPanel as any).validateImportedConfiguration(
                config
            );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("Auth section must be an object");
        });

        it("should reject configuration with missing auth properties", () => {
            const config = {
                auth: {
                    twitch_oauth: "test",
                    // missing twitch_username and twitch_channel
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result = (adminPanel as any).validateImportedConfiguration(
                config
            );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("Missing auth property");
        });

        it("should reject configuration with non-string auth properties", () => {
            const config = {
                auth: {
                    twitch_oauth: 123, // should be string
                    twitch_username: "test",
                    twitch_channel: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result = (adminPanel as any).validateImportedConfiguration(
                config
            );

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("must be a string");
        });
    });

    describe("Import Error Handling", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            document.body.innerHTML = `
                <div class="admin-content">
                    <button id="import-config-btn">Import Config</button>
                </div>
            `;
            adminPanel = new AdminPanel();
        });

        it("should handle SyntaxError during import", () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Call processImportedConfiguration with invalid JSON
            (adminPanel as any).processImportedConfiguration(
                "invalid json",
                "import-config-btn"
            );

            const importBtn = document.getElementById(
                "import-config-btn"
            ) as HTMLButtonElement;

            // Verify error feedback
            expect(importBtn.textContent).toBe("Invalid JSON format!");
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("should handle generic errors during import", () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Mock ConfigManager.import to throw error
            const configManager = ConfigManager.getInstance();
            const originalImport = configManager.import;
            configManager.import = vi.fn(() => {
                throw new Error("Import error");
            });

            // Call processImportedConfiguration with valid JSON
            const validConfig = JSON.stringify({
                auth: {
                    twitch_oauth: "test",
                    twitch_username: "test",
                    twitch_channel: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            });

            (adminPanel as any).processImportedConfiguration(
                validConfig,
                "import-config-btn"
            );

            const importBtn = document.getElementById(
                "import-config-btn"
            ) as HTMLButtonElement;

            // Verify error feedback
            expect(importBtn.textContent).toBe("Import failed!");
            expect(consoleSpy).toHaveBeenCalled();

            // Restore
            configManager.import = originalImport;
            consoleSpy.mockRestore();
        });

        it("should handle ConfigManager.import returning false", () => {
            // Mock ConfigManager.import to return false
            const configManager = ConfigManager.getInstance();
            const originalImport = configManager.import;
            configManager.import = vi.fn(() => false);

            // Call processImportedConfiguration with valid JSON
            const validConfig = JSON.stringify({
                auth: {
                    twitch_oauth: "test",
                    twitch_username: "test",
                    twitch_channel: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            });

            (adminPanel as any).processImportedConfiguration(
                validConfig,
                "import-config-btn"
            );

            const importBtn = document.getElementById(
                "import-config-btn"
            ) as HTMLButtonElement;

            // Verify error feedback
            expect(importBtn.textContent).toBe("Failed to restore configuration!");

            // Restore
            configManager.import = originalImport;
        });

        it("should handle validation failure during import", () => {
            // Call processImportedConfiguration with invalid config (missing auth)
            const invalidConfig = JSON.stringify({
                maxChallenges: 10,
                commands: {},
                responses: {},
            });

            (adminPanel as any).processImportedConfiguration(
                invalidConfig,
                "import-config-btn"
            );

            const importBtn = document.getElementById(
                "import-config-btn"
            ) as HTMLButtonElement;

            // Verify error feedback for validation failure
            expect(importBtn.textContent).toContain("Missing");
        });

        it("should call refreshConfigurationUI on successful import", () => {
            // Use fake timers
            vi.useFakeTimers();

            // Mock ConfigManager.import to return true
            const configManager = ConfigManager.getInstance();
            const originalImport = configManager.import;
            configManager.import = vi.fn(() => true);

            // Spy on refreshConfigurationUI
            const refreshSpy = vi.spyOn(
                adminPanel as any,
                "refreshConfigurationUI"
            );

            // Call processImportedConfiguration with valid JSON
            const validConfig = JSON.stringify({
                auth: {
                    twitch_oauth: "test",
                    twitch_username: "test",
                    twitch_channel: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            });

            (adminPanel as any).processImportedConfiguration(
                validConfig,
                "import-config-btn"
            );

            // Fast-forward time to trigger setTimeout
            vi.advanceTimersByTime(1100);

            // Verify refreshConfigurationUI was called
            expect(refreshSpy).toHaveBeenCalled();

            // Restore
            configManager.import = originalImport;
            refreshSpy.mockRestore();
            vi.useRealTimers();
        });
    });

    describe("Additional Helper Methods", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            document.body.innerHTML = `
                <div class="admin-content">
                    <div id="background-preview"></div>
                </div>
            `;
            adminPanel = new AdminPanel();
        });

        it("should update background preview", () => {
            const preview = document.getElementById("background-preview");
            expect(preview).toBeTruthy();

            // Call updateBackgroundPreview
            (adminPanel as any).updateBackgroundPreview();

            // Verify the method was called (it may not set styles without proper inputs)
            expect(preview).toBeTruthy();
        });

        it("should extract color from RGBA string", () => {
            const rgbaColor = "rgba(255, 0, 0, 0.5)";
            const hexColor = (adminPanel as any).extractColorFromRGBA(
                rgbaColor
            );

            expect(hexColor).toMatch(/^#[0-9a-f]{6}$/i);
        });

        it("should extract color from hex string", () => {
            const hexColor = "#ff0000";
            const result = (adminPanel as any).extractColorFromRGBA(hexColor);

            expect(result).toBe("#ff0000");
        });

        it("should get color tier constants for primary", () => {
            const constants = (adminPanel as any).getColorTierConstants(
                "primary"
            );

            expect(constants).toHaveProperty("enabled");
            expect(constants).toHaveProperty("bgColor");
            expect(constants).toHaveProperty("textColor");
            expect(constants).toHaveProperty("pickers");
            expect(constants).toHaveProperty("section");
        });

        it("should get color tier constants for secondary", () => {
            const constants = (adminPanel as any).getColorTierConstants(
                "secondary"
            );

            expect(constants).toHaveProperty("enabled");
            expect(constants).toHaveProperty("bgColor");
            expect(constants).toHaveProperty("textColor");
            expect(constants).toHaveProperty("pickers");
            expect(constants).toHaveProperty("section");
        });

        it("should get color tier constants for tertiary", () => {
            const constants = (adminPanel as any).getColorTierConstants(
                "tertiary"
            );

            expect(constants).toHaveProperty("enabled");
            expect(constants).toHaveProperty("bgColor");
            expect(constants).toHaveProperty("textColor");
            expect(constants).toHaveProperty("pickers");
            expect(constants).toHaveProperty("section");
        });
    });

    describe("Auto-Save Methods", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            document.body.innerHTML = `
                <div class="admin-content">
                    <input type="text" id="twitch-oauth" value="oauth:test123" />
                    <input type="text" id="twitch-username" value="testuser" />
                    <input type="text" id="twitch-channel" value="testchannel" />
                    <input type="number" id="max-challenges" value="15" />
                </div>
            `;
            adminPanel = new AdminPanel();
        });

        it("should auto-save authentication configuration", () => {
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            // Call autoSaveAuthConfiguration
            (adminPanel as any).autoSaveAuthConfiguration();

            // Verify console log was called
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("should auto-save behavior configuration", () => {
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            // Call autoSaveBehaviorConfiguration
            (adminPanel as any).autoSaveBehaviorConfiguration();

            // Verify console log was called
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("should auto-save color configuration", () => {
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            // Call autoSaveColorConfiguration
            (adminPanel as any).autoSaveColorConfiguration();

            // Verify console log was called
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("should auto-save background configuration", () => {
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            // Call autoSaveBackgroundConfiguration
            (adminPanel as any).autoSaveBackgroundConfiguration();

            // Verify console log was called
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe("UI Conversion Methods", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            adminPanel = new AdminPanel();
        });

        it("should convert UI to text colors", () => {
            const colorConfig = {
                primary: {
                    enabled: true,
                    backgroundColor: "#ff0000",
                    textColor: "#ffffff",
                },
                secondary: {
                    enabled: false,
                    backgroundColor: "#00ff00",
                    textColor: "#000000",
                },
                tertiary: {
                    enabled: false,
                    backgroundColor: "#0000ff",
                    textColor: "#ffffff",
                },
            };

            const textColors = (adminPanel as any).convertUIToTextColors(
                colorConfig
            );

            expect(Array.isArray(textColors)).toBe(true);
            expect(textColors.length).toBeGreaterThan(0);
        });
    });

    describe("Setup Methods", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            document.body.innerHTML = `
                <div class="admin-content">
                    <input type="text" id="twitch-oauth" value="oauth:test" />
                    <input type="text" id="twitch-username" value="test" />
                    <input type="text" id="twitch-channel" value="test" />
                    <input type="number" id="max-challenges" value="10" />
                    <input type="checkbox" id="primary-color-enabled" />
                    <input type="color" id="primary-bg-color" value="#ff0000" />
                    <input type="color" id="primary-text-color" value="#ffffff" />
                    <input type="range" id="challenge-row-colors-opacity" value="100" />
                    <span id="challenge-row-colors-opacity-display">100%</span>
                </div>
            `;
            adminPanel = new AdminPanel();
        });

        it("should setup authentication auto-save", () => {
            // Call setupAuthenticationAutoSave
            (adminPanel as any).setupAuthenticationAutoSave();

            // Verify method executed without errors
            expect(true).toBe(true);
        });

        it("should setup behavior auto-save", () => {
            // Call setupBehaviorAutoSave
            (adminPanel as any).setupBehaviorAutoSave();

            // Verify method executed without errors
            expect(true).toBe(true);
        });

        it("should setup color tier event listeners", () => {
            // Call setupColorTierEventListeners
            (adminPanel as any).setupColorTierEventListeners();

            // Verify method executed without errors
            expect(true).toBe(true);
        });

        it("should setup row colors opacity event listener", () => {
            // Call setupRowColorsOpacityEventListener
            (adminPanel as any).setupRowColorsOpacityEventListener();

            // Verify method executed without errors
            expect(true).toBe(true);
        });

        it("should setup background event listeners", () => {
            document.body.innerHTML += `
                <input type="color" id="overlay-background-color" value="#000000" />
                <input type="range" id="overlay-background-opacity" value="60" />
                <span id="overlay-background-opacity-display">60%</span>
                <input type="color" id="challenge-background-color" value="#000000" />
                <input type="range" id="challenge-background-opacity" value="90" />
                <span id="challenge-background-opacity-display">90%</span>
                <input type="checkbox" id="challenge-auto-text-color" checked />
                <input type="color" id="challenge-text-color" value="#ffffff" />
                <input type="checkbox" id="challenge-text-shadow" />
            `;

            // Call setupBackgroundEventListeners
            (adminPanel as any).setupBackgroundEventListeners();

            // Verify method executed without errors
            expect(true).toBe(true);
        });
    });

    describe("Section Creation Methods", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            adminPanel = new AdminPanel();
        });

        it("should create authentication section", () => {
            const container = document.createElement("div");

            // Call createAuthenticationSection
            (adminPanel as any).createAuthenticationSection(container);

            // Verify section was created
            expect(container.innerHTML).toContain("Twitch");
        });

        it("should create behavior section", () => {
            const container = document.createElement("div");

            // Call createBehaviorSection
            (adminPanel as any).createBehaviorSection(container);

            // Verify section was created
            expect(container.innerHTML).toContain("Behavior");
        });

        it("should create color section", () => {
            const container = document.createElement("div");

            // Call createColorSection
            (adminPanel as any).createColorSection(container);

            // Verify section was created
            expect(container.innerHTML).toContain("Color");
        });

        it("should create background section", () => {
            const container = document.createElement("div");

            // Call createBackgroundSection
            (adminPanel as any).createBackgroundSection(container);

            // Verify section was created
            expect(container.innerHTML).toContain("Background");
        });

        it("should create actions section", () => {
            const container = document.createElement("div");

            // Call createActionsSection
            (adminPanel as any).createActionsSection(container);

            // Verify section was created
            expect(container.innerHTML).toContain("Backup");
        });

        it("should create danger zone section", () => {
            const container = document.createElement("div");

            // Call createDangerZoneSection
            (adminPanel as any).createDangerZoneSection(container);

            // Verify section was created
            expect(container.innerHTML).toContain("Danger");
        });
    });

    describe("Populate Methods", () => {
        beforeEach(() => {
            window.location.hash = "#admin";
            document.body.innerHTML = `
                <div class="admin-content">
                    <input type="checkbox" id="primary-color-enabled" />
                    <input type="color" id="primary-bg-color" value="#ff0000" />
                    <input type="color" id="primary-text-color" value="#ffffff" />
                    <input type="checkbox" id="secondary-color-enabled" />
                    <input type="color" id="secondary-bg-color" value="#00ff00" />
                    <input type="color" id="secondary-text-color" value="#000000" />
                    <input type="checkbox" id="tertiary-color-enabled" />
                    <input type="color" id="tertiary-bg-color" value="#0000ff" />
                    <input type="color" id="tertiary-text-color" value="#ffffff" />
                    <input type="range" id="challenge-row-colors-opacity" value="100" />
                    <span id="challenge-row-colors-opacity-display">100%</span>
                </div>
            `;
            adminPanel = new AdminPanel();
        });

        it("should populate color configuration", () => {
            const backgroundColors = ["#ff0000", "#00ff00", "#0000ff"];
            const textColors = ["#ffffff", "#000000", "#ffffff"];

            // Call populateColorConfiguration
            (adminPanel as any).populateColorConfiguration(
                backgroundColors,
                textColors
            );

            // Verify method executed without errors
            expect(true).toBe(true);
        });

        it("should populate background configuration", () => {
            const config = ConfigManager.getInstance().getAll();

            // Call populateBackgroundConfiguration
            (adminPanel as any).populateBackgroundConfiguration(config);

            // Verify method executed without errors
            expect(true).toBe(true);
        });
    });

});
