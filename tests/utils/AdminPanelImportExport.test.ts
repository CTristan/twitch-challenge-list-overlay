import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ConfigExporter from "../../src/classes/ConfigExporter";
import ConfigManager from "../../src/classes/ConfigManager";
import { STATUS_COLORS } from "../../src/types/ColorConstants";
import { ELEMENT_IDS } from "../../src/types/DOMConstants";
import { FILE_FORMAT_VALUES } from "../../src/types/FileConstants";
import {
    ADMIN_FEEDBACK_MESSAGES,
    VALIDATION_MESSAGES,
} from "../../src/types/MessageConstants";
import { AdminPanelConfigImporter } from "../../src/utils/AdminPanelConfigImporter";
import { AdminPanelImportExport } from "../../src/utils/AdminPanelImportExport";
import { AdminPanelUIHelper } from "../../src/utils/AdminPanelUIHelper";
import { notifyConfigurationSaved } from "../../src/utils/windowRefresh";

// Mock dependencies
vi.mock("../../src/utils/AdminPanelUIHelper");
vi.mock("../../src/utils/windowRefresh");
vi.mock("../../src/classes/ConfigExporter");

describe("AdminPanelImportExport", () => {
    let configManager: ConfigManager;
    let consoleErrorSpy: any;

    const validConfig = {
        auth: {
            twitch_channel: "testchannel",
            twitch_oauth: "oauth:testtoken",
            twitch_username: "testuser",
        },
        maxChallenges: 10,
        commands: {
            clearAll: ["!ch clearlist", "!ch clearall"],
            clearDone: ["!ch cleardone"],
            addChallenge: ["!ch add"],
            editChallenge: ["!ch edit"],
            finishChallenge: ["!ch done"],
            deleteChallenge: ["!ch delete", "!ch del"],
            incrementChallenge: ["!ch +"],
            decrementChallenge: ["!ch -"],
            setProgress: ["!ch set"],
            failChallenge: ["!ch fail"],
            listChallenges: ["!ch list"],
            showChallenge: ["!ch show"],
            check: ["!ch check"],
            help: ["!ch help"],
        },
        responses: {
            clearAll: "All challenges have been cleared",
            clearDone: "All done challenges have been cleared",
            addChallenge: "Challenge(s) {message} added!",
            editChallenge: "Challenge {message} updated!",
            finishChallenge: "Good job on completing challenge(s) {message}!",
            deleteChallenge: "Challenge(s) {message} has been deleted!",
            deleteAll: "All of your challenges have been deleted!",
            check: "Your current challenge(s) are: {message}",
            help: "Try these commands - !ch add, !ch edit, !ch done, !ch delete, !ch check, !ch clearlist, !ch cleardone, !ch help",
            maxChallengesAdded:
                "Maximum number of challenges reached, try deleting old challenges.",
            noChallengeFound:
                "That challenge doesn't seem to exist, try adding one!",
            invalidCommand: "Invalid command: {message}. Try !help",
        },
    };

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = "";

        // Reset all mocks
        vi.clearAllMocks();

        // Create fresh ConfigManager instance
        (ConfigManager as any).instance = null;
        configManager = ConfigManager.getInstance(validConfig);

        // Spy on console.error
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Setup DOM elements
        document.body.innerHTML = `
            <button id="${ELEMENT_IDS.RESET_CONFIG_BTN}">Reset</button>
            <button id="${ELEMENT_IDS.EXPORT_JSON_BTN}">Export</button>
            <button id="${ELEMENT_IDS.IMPORT_CONFIG_BTN}">Import</button>
            <input type="file" id="file-input" />
        `;
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe("resetConfiguration", () => {
        it("should reset configuration successfully", () => {
            const populateCallback = vi.fn();
            vi.spyOn(configManager, "reset").mockReturnValue(true);

            AdminPanelImportExport.resetConfiguration(
                configManager,
                populateCallback
            );

            expect(configManager.reset).toHaveBeenCalled();
            expect(populateCallback).toHaveBeenCalled();
            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.RESET_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.RESET,
                STATUS_COLORS.SUCCESS
            );
            expect(notifyConfigurationSaved).toHaveBeenCalled();
        });

        it("should handle reset failure", () => {
            const populateCallback = vi.fn();
            vi.spyOn(configManager, "reset").mockReturnValue(false);

            AdminPanelImportExport.resetConfiguration(
                configManager,
                populateCallback
            );

            expect(configManager.reset).toHaveBeenCalled();
            expect(populateCallback).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Configuration reset failed"
            );
            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.RESET_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.RESET_FAILED,
                STATUS_COLORS.ERROR
            );
            expect(notifyConfigurationSaved).not.toHaveBeenCalled();
        });

        it("should handle reset exception", () => {
            const populateCallback = vi.fn();
            const error = new Error("Reset error");
            vi.spyOn(configManager, "reset").mockImplementation(() => {
                throw error;
            });

            AdminPanelImportExport.resetConfiguration(
                configManager,
                populateCallback
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error resetting configuration:",
                error
            );
            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.RESET_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.ERROR,
                STATUS_COLORS.ERROR
            );
        });
    });

    describe("exportConfiguration", () => {
        it("should export configuration as JSON successfully", () => {
            const mockConfig = { ...validConfig };
            vi.spyOn(configManager, "export").mockReturnValue(mockConfig);
            vi.mocked(ConfigExporter).mockImplementation(
                () =>
                    ({
                        downloadAsJSON: vi.fn().mockReturnValue(true),
                    } as any)
            );

            AdminPanelImportExport.exportConfiguration(
                FILE_FORMAT_VALUES.JSON,
                configManager
            );

            expect(configManager.export).toHaveBeenCalled();
            expect(ConfigExporter).toHaveBeenCalledWith(mockConfig);
            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.EXPORT_JSON_BTN,
                ADMIN_FEEDBACK_MESSAGES.EXPORTED,
                STATUS_COLORS.SUCCESS
            );
        });

        it("should handle export failure", () => {
            const mockConfig = { ...validConfig };
            vi.spyOn(configManager, "export").mockReturnValue(mockConfig);
            vi.mocked(ConfigExporter).mockImplementation(
                () =>
                    ({
                        downloadAsJSON: vi.fn().mockReturnValue(false),
                    } as any)
            );

            AdminPanelImportExport.exportConfiguration(
                FILE_FORMAT_VALUES.JSON,
                configManager
            );

            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.EXPORT_JSON_BTN,
                ADMIN_FEEDBACK_MESSAGES.FAILED,
                STATUS_COLORS.ERROR
            );
        });

        it("should reject unsupported export format", () => {
            const exportSpy = vi.spyOn(configManager, "export");

            AdminPanelImportExport.exportConfiguration("xml", configManager);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Unsupported export format: xml. Only JSON export is supported."
            );
            expect(exportSpy).not.toHaveBeenCalled();
        });

        it("should handle export exception", () => {
            const error = new Error("Export error");
            vi.spyOn(configManager, "export").mockImplementation(() => {
                throw error;
            });

            AdminPanelImportExport.exportConfiguration(
                FILE_FORMAT_VALUES.JSON,
                configManager
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error exporting configuration:",
                error
            );
            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.EXPORT_JSON_BTN,
                ADMIN_FEEDBACK_MESSAGES.ERROR,
                STATUS_COLORS.ERROR
            );
        });
    });

    describe("importFromFile", () => {
        it("should handle missing file", () => {
            const fileInput = document.getElementById(
                "file-input"
            ) as HTMLInputElement;
            const refreshCallback = vi.fn();

            AdminPanelImportExport.importFromFile(
                fileInput,
                configManager,
                refreshCallback
            );

            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.NO_FILE_SELECTED,
                STATUS_COLORS.ERROR
            );
        });

        it("should reject non-JSON files", () => {
            const fileInput = document.getElementById(
                "file-input"
            ) as HTMLInputElement;
            const refreshCallback = vi.fn();

            // Create a mock file with wrong extension
            const file = new File(["content"], "config.txt", {
                type: "text/plain",
            });
            Object.defineProperty(fileInput, "files", {
                value: [file],
                writable: false,
            });

            AdminPanelImportExport.importFromFile(
                fileInput,
                configManager,
                refreshCallback
            );

            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.INVALID_FILE_TYPE,
                STATUS_COLORS.ERROR
            );
        });

        it("should process valid JSON file", async () => {
            const fileInput = document.getElementById(
                "file-input"
            ) as HTMLInputElement;
            const refreshCallback = vi.fn();
            const jsonContent = JSON.stringify(validConfig);

            // Create a mock JSON file
            const file = new File([jsonContent], "config.json", {
                type: "application/json",
            });
            Object.defineProperty(fileInput, "files", {
                value: [file],
                writable: false,
            });

            // Mock processImportedConfiguration
            const processSpy = vi
                .spyOn(AdminPanelConfigImporter, "processImportedConfiguration")
                .mockImplementation(() => {});

            AdminPanelImportExport.importFromFile(
                fileInput,
                configManager,
                refreshCallback
            );

            // Wait for FileReader to complete
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(processSpy).toHaveBeenCalledWith(
                jsonContent,
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                configManager,
                refreshCallback
            );
            expect(fileInput.value).toBe("");
        });

        it("should handle file read error", async () => {
            const fileInput = document.getElementById(
                "file-input"
            ) as HTMLInputElement;
            const refreshCallback = vi.fn();

            // Create a mock JSON file
            const file = new File(["content"], "config.json", {
                type: "application/json",
            });
            Object.defineProperty(fileInput, "files", {
                value: [file],
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
                onload: any;
                onerror: any;
                result: any;
            } as any;

            AdminPanelImportExport.importFromFile(
                fileInput,
                configManager,
                refreshCallback
            );

            // Wait for FileReader error to trigger
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.FILE_READ_ERROR,
                STATUS_COLORS.ERROR
            );

            // Restore original FileReader
            global.FileReader = originalFileReader;
        });

        // Note: Invalid JSON handling is tested in processImportedConfiguration tests
        // This test was removed as it tested implementation details that changed
        // when refactoring to AdminPanelConfigImporter
    });

    describe("processImportedConfiguration", () => {
        beforeEach(() => {
            vi.useFakeTimers();
            // Clear any mocks from previous tests
            vi.clearAllMocks();
            // Restore any spies on AdminPanelImportExport
            vi.restoreAllMocks();
            // Recreate console.error spy
            consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
        });

        afterEach(() => {
            vi.useRealTimers();
            consoleErrorSpy.mockRestore();
        });

        it("should process valid direct configuration", () => {
            const jsonContent = JSON.stringify(validConfig);
            const refreshCallback = vi.fn();
            vi.spyOn(configManager, "import").mockReturnValue(true);

            AdminPanelImportExport.processImportedConfiguration(
                jsonContent,
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                configManager,
                refreshCallback
            );

            expect(configManager.import).toHaveBeenCalledWith(validConfig);
            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.CONFIGURATION_IMPORTED,
                STATUS_COLORS.SUCCESS
            );

            // Fast-forward timers to trigger refresh callback
            vi.runAllTimers();
            expect(refreshCallback).toHaveBeenCalled();
            expect(notifyConfigurationSaved).toHaveBeenCalled();
        });

        it("should process metadata-wrapped configuration", () => {
            const wrappedConfig = {
                _metadata: {
                    exportedAt: "2024-01-01T00:00:00.000Z",
                    version: "1.0.0",
                },
                config: validConfig,
            };
            const jsonContent = JSON.stringify(wrappedConfig);
            const refreshCallback = vi.fn();
            const consoleLogSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            vi.spyOn(configManager, "import").mockReturnValue(true);

            AdminPanelImportExport.processImportedConfiguration(
                jsonContent,
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                configManager,
                refreshCallback
            );

            expect(consoleLogSpy).toHaveBeenCalledWith(
                "Importing configuration exported on:",
                "2024-01-01T00:00:00.000Z"
            );
            expect(configManager.import).toHaveBeenCalledWith(validConfig);

            consoleLogSpy.mockRestore();
        });

        it("should handle invalid JSON", () => {
            const invalidJson = "{ invalid json }";
            const refreshCallback = vi.fn();

            AdminPanelImportExport.processImportedConfiguration(
                invalidJson,
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                configManager,
                refreshCallback
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error importing configuration:",
                expect.any(SyntaxError)
            );
            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.INVALID_JSON_FORMAT,
                STATUS_COLORS.ERROR
            );
        });

        it("should handle validation failure", () => {
            const invalidConfig = {
                auth: {
                    twitch_channel: "test",
                    twitch_oauth: "oauth:test",
                    twitch_username: "test",
                },
                maxChallenges: -1, // Invalid
                commands: {},
                responses: {},
            };
            const jsonContent = JSON.stringify(invalidConfig);
            const refreshCallback = vi.fn();

            AdminPanelImportExport.processImportedConfiguration(
                jsonContent,
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                configManager,
                refreshCallback
            );

            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                expect.stringContaining("maxChallenges"),
                STATUS_COLORS.ERROR
            );
        });

        it("should handle import failure", () => {
            const jsonContent = JSON.stringify(validConfig);
            const refreshCallback = vi.fn();
            vi.spyOn(configManager, "import").mockReturnValue(false);

            AdminPanelImportExport.processImportedConfiguration(
                jsonContent,
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                configManager,
                refreshCallback
            );

            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.RESTORE_FAILED,
                STATUS_COLORS.ERROR
            );
            expect(refreshCallback).not.toHaveBeenCalled();
        });

        it("should handle non-SyntaxError exceptions", () => {
            const jsonContent = JSON.stringify(validConfig);
            const refreshCallback = vi.fn();
            const error = new Error("Import error");
            vi.spyOn(configManager, "import").mockImplementation(() => {
                throw error;
            });

            AdminPanelImportExport.processImportedConfiguration(
                jsonContent,
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                configManager,
                refreshCallback
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error importing configuration:",
                error
            );
            expect(AdminPanelUIHelper.showFeedback).toHaveBeenCalledWith(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.IMPORT_FAILED,
                STATUS_COLORS.ERROR
            );
        });
    });

    describe("validateImportedConfiguration", () => {
        it("should validate correct configuration", () => {
            const result =
                AdminPanelImportExport.validateImportedConfiguration(
                    validConfig
                );

            expect(result.isValid).toBe(true);
            expect(result.errorMessage).toBe("");
        });

        it("should reject null configuration", () => {
            const result =
                AdminPanelImportExport.validateImportedConfiguration(null);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe(
                VALIDATION_MESSAGES.CONFIGURATION_INVALID_OBJECT
            );
        });

        it("should reject non-object configuration", () => {
            const result =
                AdminPanelImportExport.validateImportedConfiguration("string");

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe(
                VALIDATION_MESSAGES.CONFIGURATION_INVALID_OBJECT
            );
        });

        it("should reject configuration missing auth property", () => {
            const config = {
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("auth");
        });

        it("should reject configuration missing maxChallenges property", () => {
            const config = {
                auth: validConfig.auth,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("maxChallenges");
        });

        it("should reject configuration missing commands property", () => {
            const config = {
                auth: validConfig.auth,
                maxChallenges: 10,
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("commands");
        });

        it("should reject configuration missing responses property", () => {
            const config = {
                auth: validConfig.auth,
                maxChallenges: 10,
                commands: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("responses");
        });

        it("should reject configuration with non-object auth", () => {
            const config = {
                auth: "invalid",
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain(
                "Auth section must be an object"
            );
        });

        it("should reject auth missing twitch_channel", () => {
            const config = {
                auth: {
                    twitch_oauth: "oauth:test",
                    twitch_username: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("twitch_channel");
        });

        it("should reject auth missing twitch_oauth", () => {
            const config = {
                auth: {
                    twitch_channel: "test",
                    twitch_username: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("twitch_oauth");
        });

        it("should reject auth missing twitch_username", () => {
            const config = {
                auth: {
                    twitch_channel: "test",
                    twitch_oauth: "oauth:test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain("twitch_username");
        });

        it("should reject auth with non-string twitch_channel", () => {
            const config = {
                auth: {
                    twitch_channel: 123,
                    twitch_oauth: "oauth:test",
                    twitch_username: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain(
                "twitch_channel must be a string"
            );
        });

        it("should reject auth with non-string twitch_oauth", () => {
            const config = {
                auth: {
                    twitch_channel: "test",
                    twitch_oauth: 123,
                    twitch_username: "test",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain(
                "twitch_oauth must be a string"
            );
        });

        it("should reject auth with non-string twitch_username", () => {
            const config = {
                auth: {
                    twitch_channel: "test",
                    twitch_oauth: "oauth:test",
                    twitch_username: 123,
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain(
                "twitch_username must be a string"
            );
        });

        it("should reject non-numeric maxChallenges", () => {
            const config = {
                auth: validConfig.auth,
                maxChallenges: "10",
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain(
                "maxChallenges must be a positive number"
            );
        });

        it("should reject negative maxChallenges", () => {
            const config = {
                auth: validConfig.auth,
                maxChallenges: -1,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain(
                "maxChallenges must be a positive number"
            );
        });

        it("should reject zero maxChallenges", () => {
            const config = {
                auth: validConfig.auth,
                maxChallenges: 0,
                commands: {},
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain(
                "maxChallenges must be a positive number"
            );
        });

        it("should reject non-object commands", () => {
            const config = {
                auth: validConfig.auth,
                maxChallenges: 10,
                commands: "invalid",
                responses: {},
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain(
                "Commands section must be an object"
            );
        });

        it("should reject non-object responses", () => {
            const config = {
                auth: validConfig.auth,
                maxChallenges: 10,
                commands: {},
                responses: "invalid",
            };

            const result =
                AdminPanelImportExport.validateImportedConfiguration(config);

            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain(
                "Responses section must be an object"
            );
        });
    });
});
