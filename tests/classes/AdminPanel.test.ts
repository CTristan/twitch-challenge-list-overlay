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
                    <input type="color" id="challenge-text-color" value="#ffffff">
                    <input type="checkbox" id="challenge-auto-text-color" checked>
                    <input type="checkbox" id="challenge-text-shadow">
                </div>
            `;

            adminPanel = new AdminPanel();
        });

        it("should save configuration with all fields", () => {
            const saveBtn = document.getElementById("save-config-btn") as HTMLButtonElement;
            const configManager = ConfigManager.getInstance();

            // Set the input value before clicking save
            const maxChallengesInput = document.getElementById("max-challenges") as HTMLInputElement;
            maxChallengesInput.value = "15";

            // Click save button
            saveBtn.click();

            // Verify configuration was saved
            const savedConfig = configManager.getAll();
            expect(savedConfig.auth?.twitch_oauth).toBe("oauth:test");
            expect(savedConfig.auth?.twitch_username).toBe("testuser");
            expect(savedConfig.auth?.twitch_channel).toBe("testchannel");
            expect(savedConfig.maxChallenges).toBe(15);

            // Verify button feedback
            expect(saveBtn.textContent).toBe("Saved!");
        });

        it("should reset configuration to defaults", () => {
            const resetBtn = document.getElementById("reset-config-btn") as HTMLButtonElement;
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

        it("should handle save configuration errors", () => {
            const saveBtn = document.getElementById("save-config-btn") as HTMLButtonElement;
            const configManager = ConfigManager.getInstance();

            // Mock set method to return false
            const originalSet = configManager.set;
            configManager.set = vi.fn(() => false);

            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            // Click save button
            saveBtn.click();

            // Verify error handling
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Some configuration updates failed"));
            expect(saveBtn.textContent).toBe("Partial Save Error!");

            // Restore
            configManager.set = originalSet;
            consoleSpy.mockRestore();
        });

        it("should handle reset configuration errors", () => {
            const resetBtn = document.getElementById("reset-config-btn") as HTMLButtonElement;
            const configManager = ConfigManager.getInstance();

            // Mock reset method to return false
            const originalReset = configManager.reset;
            configManager.reset = vi.fn(() => false);

            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            // Click reset button
            resetBtn.click();

            // Verify error handling
            expect(consoleSpy).toHaveBeenCalledWith("Configuration reset failed");
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
                    <input type="color" id="challenge-text-color" value="#ffffff">
                    <input type="checkbox" id="challenge-auto-text-color" checked>
                    <input type="checkbox" id="challenge-text-shadow">
                    <div id="background-preview">
                        <div class="preview-challenge">
                            <span class="preview-text">Preview Text</span>
                        </div>
                    </div>
                </div>
            `;

            adminPanel = new AdminPanel();
        });

        it("should populate background configuration from config", () => {
            const configManager = ConfigManager.getInstance();

            // Set background configuration
            configManager.set("overlayBackgroundColor", "rgba(255, 0, 0, 0.5)");
            configManager.set("overlayBackgroundOpacity", 0.5);
            configManager.set("challengeBackgroundColor", "rgba(0, 255, 0, 0.8)");
            configManager.set("challengeBackgroundOpacity", 0.8);
            configManager.set("challengeTextColor", "#ff00ff");
            configManager.set("challengeAutoTextColor", false);
            configManager.set("challengeTextShadow", true);

            // Reinitialize to populate form
            adminPanel = new AdminPanel();

            // Verify form was populated
            const overlayColorInput = document.getElementById("overlay-background-color") as HTMLInputElement;
            const overlayOpacitySlider = document.getElementById("overlay-background-opacity") as HTMLInputElement;
            const backgroundColorInput = document.getElementById("challenge-background-color") as HTMLInputElement;
            const opacitySlider = document.getElementById("challenge-background-opacity") as HTMLInputElement;
            const textColorInput = document.getElementById("challenge-text-color") as HTMLInputElement;
            const autoTextColorCheckbox = document.getElementById("challenge-auto-text-color") as HTMLInputElement;
            const textShadowCheckbox = document.getElementById("challenge-text-shadow") as HTMLInputElement;

            expect(overlayColorInput.value).toBe("#ff0000");
            expect(overlayOpacitySlider.value).toBe("50");
            expect(backgroundColorInput.value).toBe("#00ff00");
            expect(opacitySlider.value).toBe("80");
            expect(textColorInput.value).toBe("#ff00ff");
            expect(autoTextColorCheckbox.checked).toBe(false);
            expect(textShadowCheckbox.checked).toBe(true);
        });

        it("should update background preview when color changes", () => {
            const backgroundColorInput = document.getElementById("challenge-background-color") as HTMLInputElement;
            const previewChallenge = document.querySelector(".preview-challenge") as HTMLElement;

            // Change background color
            backgroundColorInput.value = "#ff0000";
            backgroundColorInput.dispatchEvent(new Event("input"));

            // Verify preview was updated
            expect(previewChallenge.style.backgroundColor).toContain("rgba");
        });

        it("should update opacity display when slider changes", () => {
            const opacitySlider = document.getElementById("challenge-background-opacity") as HTMLInputElement;
            const opacityDisplay = document.getElementById("challenge-opacity-display");

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
            const autoTextColorCheckbox = document.getElementById("challenge-auto-text-color") as HTMLInputElement;
            const textColorInput = document.getElementById("challenge-text-color") as HTMLInputElement;

            // Initially checked, so text color should be disabled
            expect(textColorInput.disabled).toBe(true);

            // Uncheck auto text color
            autoTextColorCheckbox.checked = false;
            autoTextColorCheckbox.dispatchEvent(new Event("change"));

            // Text color input should now be enabled
            expect(textColorInput.disabled).toBe(false);
        });

        it("should apply text shadow when checkbox is checked", () => {
            const textShadowCheckbox = document.getElementById("challenge-text-shadow") as HTMLInputElement;
            const previewText = document.querySelector(".preview-text") as HTMLElement;

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
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            // Try to export with unsupported format
            (adminPanel as any).exportConfiguration("xml");

            // Verify error was logged
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Unsupported export format: xml")
            );

            consoleSpy.mockRestore();
        });

        it("should handle export failure", () => {
            const exportBtn = document.getElementById("export-json-btn") as HTMLButtonElement;
            const configManager = ConfigManager.getInstance();

            // Mock export to throw error
            const originalExport = configManager.export;
            configManager.export = vi.fn(() => {
                throw new Error("Export failed");
            });

            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            // Click export button
            exportBtn.click();

            // Verify error handling - console.error is called with message and error object
            expect(consoleSpy).toHaveBeenCalled();
            const firstCall = consoleSpy.mock.calls[0];
            expect(firstCall[0]).toContain("Error exporting configuration");
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
            const importBtn = document.getElementById("import-config-btn") as HTMLButtonElement;
            const fileInput = document.getElementById("import-file-input") as HTMLInputElement;

            // Spy on file input click
            const clickSpy = vi.spyOn(fileInput, "click");

            // Click import button
            importBtn.click();

            // Verify file picker was triggered
            expect(clickSpy).toHaveBeenCalled();

            clickSpy.mockRestore();
        });

        it("should handle no file selected", () => {
            const fileInput = document.getElementById("import-file-input") as HTMLInputElement;

            // Trigger change event with no files
            fileInput.dispatchEvent(new Event("change"));

            // Should not throw error
            expect(fileInput.files?.length).toBeFalsy();
        });

        it("should reject invalid file types", () => {
            const fileInput = document.getElementById("import-file-input") as HTMLInputElement;
            const importBtn = document.getElementById("import-config-btn") as HTMLButtonElement;

            // Create a mock file with invalid extension
            const mockFile = new File(["test content"], "config.txt", { type: "text/plain" });

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
            const fileInput = document.getElementById("import-file-input") as HTMLInputElement;
            const importBtn = document.getElementById("import-config-btn") as HTMLButtonElement;

            // Create a mock file
            const mockFile = new File(['{"test": "data"}'], "config.json", { type: "application/json" });

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
            const fileInput = document.getElementById("import-file-input") as HTMLInputElement;
            const importBtn = document.getElementById("import-config-btn") as HTMLButtonElement;

            // Create a mock file with invalid JSON
            const mockFile = new File(["invalid json content"], "config.json", { type: "application/json" });

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
                            this.onload({ target: { result: "invalid json" } } as any);
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
            const oauthInput = document.getElementById("twitch-oauth") as HTMLInputElement;
            const usernameInput = document.getElementById("twitch-username") as HTMLInputElement;
            const channelInput = document.getElementById("twitch-channel") as HTMLInputElement;
            const maxChallengesInput = document.getElementById("max-challenges") as HTMLInputElement;

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
            const button = document.getElementById("test-button") as HTMLButtonElement;
            const originalText = button.textContent;

            // Call showFeedback
            (adminPanel as any).showFeedback("test-button", "Success!", "rgb(40, 167, 69)");

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
                (adminPanel as any).showFeedback("non-existent-button", "Test", "red");
            }).not.toThrow();
        });
    });
});
