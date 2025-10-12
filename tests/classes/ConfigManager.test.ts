import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfigManager from "../../src/classes/ConfigManager";
import { StorageManager } from "../../src/utils/StorageManager";
import { ErrorHandler } from "../../src/utils/errorHandler";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("ConfigManager", () => {
    let configManager: ConfigManager;
    let defaultConfig: Config;

    beforeEach(() => {
        // Ensure test isolation - clear localStorage and reset singleton
        ensureTestIsolation();

        // Reset ConfigManager singleton for each test
        (ConfigManager as any).instance = null;

        // Create a minimal valid test configuration
        defaultConfig = {
            auth: {
                twitch_oauth: "test_oauth",
                twitch_username: "test_user",
                twitch_channel: "test_channel",
            },
            maxChallenges: 10,
            commands: {
                clearAll: ["!ch clearall"],
                clearDone: ["!ch cleardone"],
                addChallenge: ["!ch add"],
                editChallenge: ["!ch edit"],
                finishChallenge: ["!ch done"],
                deleteChallenge: ["!ch delete"],
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
                deleteAll: "All deleted",
                check: "Current challenges",
                help: "Help message",
                maxChallengesAdded: "Max reached",
                noChallengeFound: "Not found",
                invalidCommand: "Invalid command",
            },
        };
    });

    describe("Singleton Pattern", () => {
        it("should throw error when getInstance called without default config on first initialization", () => {
            expect(() => ConfigManager.getInstance()).toThrow(
                "ConfigManager requires default configuration on first initialization"
            );
        });

        it("should create instance with default config on first call", () => {
            configManager = ConfigManager.getInstance(defaultConfig);
            expect(configManager).toBeInstanceOf(ConfigManager);
        });

        it("should return same instance on subsequent calls", () => {
            const instance1 = ConfigManager.getInstance(defaultConfig);
            const instance2 = ConfigManager.getInstance();
            expect(instance1).toBe(instance2);
        });

        it("should not require default config on subsequent calls", () => {
            ConfigManager.getInstance(defaultConfig);
            const instance2 = ConfigManager.getInstance();
            expect(instance2).toBeInstanceOf(ConfigManager);
        });
    });

    describe("Configuration Loading", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should load default configuration when localStorage is empty", () => {
            const config = configManager.getAll();
            expect(config.maxChallenges).toBe(10);
            expect(config.auth.twitch_username).toBe("test_user");
        });

        it("should load configuration from localStorage when available", () => {
            // Save a modified config
            configManager.set("maxChallenges", 15);

            // Reset singleton and create new instance
            (ConfigManager as any).instance = null;
            const newInstance = ConfigManager.getInstance(defaultConfig);

            expect(newInstance.get("maxChallenges")).toBe(15);
        });

        it("should merge loaded config with defaults to ensure all properties exist", () => {
            // Save partial config to localStorage
            const partialConfig = {
                ...defaultConfig,
                maxChallenges: 20,
            };
            localStorage.setItem(
                "twitch-overlay-config",
                JSON.stringify(partialConfig)
            );

            // Reset and reload
            (ConfigManager as any).instance = null;
            const newInstance = ConfigManager.getInstance(defaultConfig);

            const config = newInstance.getAll();
            expect(config.maxChallenges).toBe(20);
            expect(config.auth).toBeDefined();
            expect(config.commands).toBeDefined();
        });

        it("should fall back to defaults when localStorage contains invalid data", () => {
            localStorage.setItem("twitch-overlay-config", "invalid json");

            (ConfigManager as any).instance = null;
            const newInstance = ConfigManager.getInstance(defaultConfig);

            const config = newInstance.getAll();
            expect(config.maxChallenges).toBe(10);
        });
    });

    describe("get() method", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should get top-level configuration value", () => {
            expect(configManager.get("maxChallenges")).toBe(10);
        });

        it("should get nested configuration value using dot notation", () => {
            expect(configManager.get("auth.twitch_username")).toBe("test_user");
        });

        it("should return undefined for non-existent path", () => {
            expect(configManager.get("nonexistent.path")).toBeUndefined();
        });

        it("should handle deep nested paths", () => {
            configManager.set("deep.nested.value", "test");
            expect(configManager.get("deep.nested.value")).toBe("test");
        });
    });

    describe("set() method", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should set top-level configuration value", () => {
            const result = configManager.set("maxChallenges", 15);
            expect(result).toBe(true);
            expect(configManager.get("maxChallenges")).toBe(15);
        });

        it("should set nested configuration value using dot notation", () => {
            const result = configManager.set(
                "auth.twitch_username",
                "new_user"
            );
            expect(result).toBe(true);
            expect(configManager.get("auth.twitch_username")).toBe("new_user");
        });

        it("should persist changes to localStorage", () => {
            configManager.set("maxChallenges", 20);

            const stored = localStorage.getItem("twitch-overlay-config");
            expect(stored).toBeTruthy();
            const parsed = JSON.parse(stored!);
            expect(parsed.maxChallenges).toBe(20);
        });

        it("should create nested objects if they don't exist", () => {
            const result = configManager.set("new.nested.path", "value");
            expect(result).toBe(true);
            expect(configManager.get("new.nested.path")).toBe("value");
        });

        it("should handle errors gracefully and return false", () => {
            // Mock StorageManager.save to fail
            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: false,
                error: "Storage error",
            });

            const result = configManager.set("maxChallenges", 15);
            expect(result).toBe(false);
        });
    });

    describe("getAll() method", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should return complete configuration object", () => {
            const config = configManager.getAll();
            expect(config).toHaveProperty("auth");
            expect(config).toHaveProperty("maxChallenges");
            expect(config).toHaveProperty("commands");
            expect(config).toHaveProperty("responses");
        });

        it("should return a deep clone, not the original config", () => {
            const config1 = configManager.getAll();
            const config2 = configManager.getAll();

            expect(config1).not.toBe(config2);
            config1.maxChallenges = 999;
            expect(config2.maxChallenges).toBe(10);
        });
    });

    describe("setAll() method", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should replace entire configuration with valid config", () => {
            const newConfig: Config = {
                ...defaultConfig,
                maxChallenges: 25,
            };

            // Mock StorageManager.save to succeed
            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: true,
                data: newConfig,
            });

            const result = configManager.setAll(newConfig);
            expect(result).toBe(true);
            expect(configManager.get("maxChallenges")).toBe(25);
        });

        it("should reject invalid configuration", () => {
            const invalidConfig = {
                maxChallenges: 10,
                // Missing required properties
            } as any;

            const result = configManager.setAll(invalidConfig);
            expect(result).toBe(false);
            // Original config should remain unchanged
            expect(configManager.get("maxChallenges")).toBe(10);
        });

        it("should persist valid configuration to localStorage", () => {
            const newConfig: Config = {
                ...defaultConfig,
                maxChallenges: 30,
            };

            // Mock StorageManager.save to succeed and actually save to localStorage
            vi.spyOn(StorageManager, "save").mockImplementation((key, data) => {
                localStorage.setItem(key, JSON.stringify(data));
                return { success: true, data };
            });

            configManager.setAll(newConfig);

            const stored = localStorage.getItem("twitch-overlay-config");
            const parsed = JSON.parse(stored!);
            expect(parsed.maxChallenges).toBe(30);
        });
    });

    describe("reset() method", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should reset configuration to defaults", () => {
            // Mock save to succeed
            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: true,
                data: defaultConfig,
            });

            configManager.set("maxChallenges", 50);
            expect(configManager.get("maxChallenges")).toBe(50);

            const result = configManager.reset();
            expect(result).toBe(true);
            expect(configManager.get("maxChallenges")).toBe(10);
        });

        it("should persist reset configuration to localStorage", () => {
            // Mock save to actually write to localStorage
            vi.spyOn(StorageManager, "save").mockImplementation((key, data) => {
                localStorage.setItem(key, JSON.stringify(data));
                return { success: true, data };
            });

            configManager.set("maxChallenges", 50);
            configManager.reset();

            const stored = localStorage.getItem("twitch-overlay-config");
            const parsed = JSON.parse(stored!);
            expect(parsed.maxChallenges).toBe(10);
        });
    });

    describe("export() method", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should export current configuration", () => {
            configManager.set("maxChallenges", 15);
            const exported = configManager.export();

            expect(exported.maxChallenges).toBe(15);
            expect(exported.auth).toBeDefined();
        });

        it("should return a deep clone for export", () => {
            const exported1 = configManager.export();
            const exported2 = configManager.export();

            expect(exported1).not.toBe(exported2);
            exported1.maxChallenges = 999;
            expect(exported2.maxChallenges).toBe(10);
        });
    });

    describe("import() method", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should import valid configuration", () => {
            const importConfig: Config = {
                ...defaultConfig,
                maxChallenges: 35,
            };

            // Mock save to succeed
            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: true,
                data: importConfig,
            });

            const result = configManager.import(importConfig);
            expect(result).toBe(true);
            expect(configManager.get("maxChallenges")).toBe(35);
        });

        it("should reject invalid configuration", () => {
            const invalidConfig = {
                maxChallenges: "invalid",
            } as any;

            const result = configManager.import(invalidConfig);
            expect(result).toBe(false);
            // Original config should remain unchanged
            expect(configManager.get("maxChallenges")).toBe(10);
        });

        it("should merge imported config with defaults", () => {
            const partialConfig: Config = {
                ...defaultConfig,
                maxChallenges: 40,
            };

            // Mock save to succeed
            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: true,
                data: partialConfig,
            });

            configManager.import(partialConfig);
            const config = configManager.getAll();

            expect(config.maxChallenges).toBe(40);
            expect(config.auth).toBeDefined();
            expect(config.commands).toBeDefined();
        });

        it("should persist imported configuration to localStorage", () => {
            const importConfig: Config = {
                ...defaultConfig,
                maxChallenges: 45,
            };

            // Mock save to actually write to localStorage
            vi.spyOn(StorageManager, "save").mockImplementation((key, data) => {
                localStorage.setItem(key, JSON.stringify(data));
                return { success: true, data };
            });

            configManager.import(importConfig);

            const stored = localStorage.getItem("twitch-overlay-config");
            const parsed = JSON.parse(stored!);
            expect(parsed.maxChallenges).toBe(45);
        });
    });

    describe("clearStorage() method", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should clear stored configuration from localStorage", () => {
            // First mock save to actually write to localStorage
            vi.spyOn(StorageManager, "save").mockImplementation((key, data) => {
                localStorage.setItem(key, JSON.stringify(data));
                return { success: true, data };
            });

            configManager.set("maxChallenges", 50);
            expect(localStorage.getItem("twitch-overlay-config")).toBeTruthy();

            // Now mock remove to actually remove from localStorage
            vi.spyOn(StorageManager, "remove").mockImplementation((key) => {
                localStorage.removeItem(key);
                return { success: true };
            });

            const result = configManager.clearStorage();
            expect(result).toBe(true);
            expect(localStorage.getItem("twitch-overlay-config")).toBeNull();
        });

        it("should reset config to defaults after clearing storage", () => {
            // Mock save and remove
            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: true,
                data: defaultConfig,
            });
            vi.spyOn(StorageManager, "remove").mockReturnValue({
                success: true,
            });

            configManager.set("maxChallenges", 50);
            configManager.clearStorage();

            expect(configManager.get("maxChallenges")).toBe(10);
        });

        it("should handle storage removal errors gracefully", () => {
            vi.spyOn(StorageManager, "remove").mockReturnValue({
                success: false,
                error: "Removal error",
            });

            const result = configManager.clearStorage();
            expect(result).toBe(false);
        });
    });

    describe("isStorageAvailable() method", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should return true when localStorage is available", () => {
            expect(configManager.isStorageAvailable()).toBe(true);
        });

        it("should return false when localStorage is unavailable", () => {
            vi.spyOn(StorageManager, "isStorageAvailable").mockReturnValue(
                false
            );
            expect(configManager.isStorageAvailable()).toBe(false);
        });
    });

    describe("getSystemStatus() method", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should return system status information", () => {
            const status = configManager.getSystemStatus();

            expect(status).toHaveProperty("memoryOnlyMode");
            expect(status).toHaveProperty("storageAvailable");
            expect(status).toHaveProperty("configVersion");
            expect(status).toHaveProperty("lastSaved");
        });

        it("should report correct storage availability", () => {
            // Mock StorageManager.getStorageStatus to return available
            vi.spyOn(StorageManager, "getStorageStatus").mockReturnValue({
                available: true,
                memoryOnlyMode: false,
                memoryKeys: [],
                localStorageKeys: [],
            });

            const status = configManager.getSystemStatus();
            expect(status.storageAvailable).toBe(true);
        });

        it("should report correct config version", () => {
            const status = configManager.getSystemStatus();
            expect(status.configVersion).toBe("1.0.0");
        });

        it("should report memory-only mode when storage fails", () => {
            // Force memory-only mode by making save fail and fallback to memory
            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: true,
                data: defaultConfig,
                fallbackUsed: "memory-only",
            });

            configManager.set("maxChallenges", 15);
            const status = configManager.getSystemStatus();

            expect(status.memoryOnlyMode).toBe(true);
        });

        it("should include lastSaved timestamp when available", () => {
            // Mock save to write to localStorage with timestamp
            vi.spyOn(StorageManager, "save").mockImplementation((key, data) => {
                // Type assertion needed for complex mock with timestamp metadata
                const dataWithTimestamp = {
                    ...(data as object),
                    _timestamp: Date.now(),
                };
                localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
                return { success: true, data: dataWithTimestamp };
            });

            // Mock load to return data with timestamp
            vi.spyOn(StorageManager, "load").mockReturnValue({
                success: true,
                data: { _timestamp: Date.now() },
            });

            configManager.set("maxChallenges", 15);

            const status = configManager.getSystemStatus();
            expect(status.lastSaved).toBeTruthy();
            expect(typeof status.lastSaved).toBe("number");
        });

        it("should return null for lastSaved when no timestamp available", () => {
            // Mock load to return no data
            vi.spyOn(StorageManager, "load").mockReturnValue({
                success: false,
            });

            const status = configManager.getSystemStatus();
            expect(status.lastSaved).toBeNull();
        });
    });

    describe("Deep Clone Functionality", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should deep clone objects correctly", () => {
            const config1 = configManager.getAll();
            const config2 = configManager.getAll();

            config1.auth.twitch_username = "modified";
            expect(config2.auth.twitch_username).toBe("test_user");
        });

        it("should handle Date objects in deep clone", () => {
            // Extended config type for testing Date object cloning
            const configWithDate = {
                ...defaultConfig,
                customDate: new Date("2024-01-01"),
            } as Config & { customDate: Date };

            configManager.setAll(configWithDate);
            const exported = configManager.export() as Config & {
                customDate: Date;
            };

            expect(exported.customDate).toBeInstanceOf(Date);
            expect(exported.customDate).not.toBe(configWithDate.customDate);
        });

        it("should handle arrays in deep clone", () => {
            const config = configManager.getAll();
            const exported = configManager.export();

            expect(exported.commands.clearAll).toEqual(
                config.commands.clearAll
            );
            expect(exported.commands.clearAll).not.toBe(
                config.commands.clearAll
            );
        });
    });

    describe("Deep Merge Functionality", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should merge nested objects correctly", () => {
            const partialConfig: Config = {
                ...defaultConfig,
                auth: {
                    twitch_oauth: "test_oauth",
                    twitch_username: "merged_user",
                    twitch_channel: "test_channel",
                },
            };

            // Mock save to succeed
            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: true,
                data: partialConfig,
            });

            configManager.import(partialConfig);

            expect(configManager.get("auth.twitch_username")).toBe(
                "merged_user"
            );
            expect(configManager.get("auth.twitch_oauth")).toBe("test_oauth");
        });

        it("should replace arrays instead of merging them", () => {
            const newConfig: Config = {
                ...defaultConfig,
                commands: {
                    ...defaultConfig.commands,
                    clearAll: ["!new clearall"],
                },
            };

            // Mock save to succeed
            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: true,
                data: newConfig,
            });

            configManager.import(newConfig);

            const commands = configManager.get("commands.clearAll");
            expect(commands).toEqual(["!new clearall"]);
            expect(commands.length).toBe(1);
        });

        it("should handle primitive value replacement", () => {
            const newConfig: Config = {
                ...defaultConfig,
                maxChallenges: 100,
            };

            // Mock save to succeed
            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: true,
                data: newConfig,
            });

            configManager.import(newConfig);
            expect(configManager.get("maxChallenges")).toBe(100);
        });
    });

    describe("Error Handling", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should handle validation errors in setAll", () => {
            const errorHandlerSpy = vi.spyOn(
                ErrorHandler.getInstance(),
                "handleConfigValidationError"
            );

            const invalidConfig = { invalid: true } as any;
            configManager.setAll(invalidConfig);

            expect(errorHandlerSpy).toHaveBeenCalled();
        });

        it("should handle validation errors in import", () => {
            const errorHandlerSpy = vi.spyOn(
                ErrorHandler.getInstance(),
                "handleConfigValidationError"
            );

            const invalidConfig = { invalid: true } as any;
            configManager.import(invalidConfig);

            expect(errorHandlerSpy).toHaveBeenCalled();
        });

        it("should handle storage errors in set", () => {
            const errorHandlerSpy = vi.spyOn(
                ErrorHandler.getInstance(),
                "handleStorageError"
            );

            vi.spyOn(StorageManager, "save").mockReturnValue({
                success: false,
                error: "Storage error",
            });

            configManager.set("maxChallenges", 15);
            expect(errorHandlerSpy).toHaveBeenCalled();
        });

        it("should handle storage errors in clearStorage", () => {
            const errorHandlerSpy = vi.spyOn(
                ErrorHandler.getInstance(),
                "handleStorageError"
            );

            vi.spyOn(StorageManager, "remove").mockReturnValue({
                success: false,
                error: "Removal error",
            });

            configManager.clearStorage();
            expect(errorHandlerSpy).toHaveBeenCalled();
        });

        it("should handle non-Error exceptions in set", () => {
            const errorHandlerSpy = vi.spyOn(
                ErrorHandler.getInstance(),
                "handleStorageError"
            );

            // Mock setNestedValue to throw a string instead of Error
            vi.spyOn(configManager as any, "setNestedValue").mockImplementation(
                () => {
                    throw "String error";
                }
            );

            configManager.set("test", "value");
            expect(errorHandlerSpy).toHaveBeenCalledWith(
                expect.any(Error),
                "set"
            );
        });
    });

    describe("Edge Cases", () => {
        beforeEach(() => {
            configManager = ConfigManager.getInstance(defaultConfig);
        });

        it("should handle empty path in get", () => {
            const result = configManager.get("");
            // Empty path returns undefined due to how split works
            expect(result).toBeUndefined();
        });

        it("should handle null values in configuration", () => {
            configManager.set("nullValue", null);
            expect(configManager.get("nullValue")).toBeNull();
        });

        it("should handle undefined values in configuration", () => {
            configManager.set("undefinedValue", undefined);
            expect(configManager.get("undefinedValue")).toBeUndefined();
        });

        it("should handle very deep nested paths", () => {
            const deepPath = "level1.level2.level3.level4.level5";
            configManager.set(deepPath, "deep_value");
            expect(configManager.get(deepPath)).toBe("deep_value");
        });

        it("should handle special characters in values", () => {
            const specialValue = '!@#$%^&*()_+-={}[]|\\:";<>?,./';
            configManager.set("specialChars", specialValue);
            expect(configManager.get("specialChars")).toBe(specialValue);
        });
    });
});
