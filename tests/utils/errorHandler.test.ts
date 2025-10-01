import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_MESSAGES } from "../../src/types/MessageConstants";
import { ErrorHandler } from "../../src/utils/errorHandler";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("ErrorHandler", () => {
    let errorHandler: ErrorHandler;

    beforeEach(() => {
        ensureTestIsolation();
        errorHandler = ErrorHandler.getInstance();
        errorHandler.clearErrorLog();
    });

    describe("getInstance", () => {
        it("should return singleton instance", () => {
            const instance1 = ErrorHandler.getInstance();
            const instance2 = ErrorHandler.getInstance();

            expect(instance1).toBe(instance2);
        });

        it("should return same instance across multiple calls", () => {
            const instances = Array.from({ length: 5 }, () =>
                ErrorHandler.getInstance()
            );

            instances.forEach((instance) => {
                expect(instance).toBe(instances[0]);
            });
        });
    });

    describe("handleStorageError", () => {
        it("should handle localStorage unavailable error", () => {
            // Mock isStorageAvailable to return false
            const originalSetItem = Object.getOwnPropertyDescriptor(
                Storage.prototype,
                "setItem"
            );
            Object.defineProperty(Storage.prototype, "setItem", {
                configurable: true,
                value: vi.fn().mockImplementation(() => {
                    throw new Error("Storage unavailable");
                }),
            });

            const error = new Error("Storage unavailable");
            const result = errorHandler.handleStorageError(error, "setItem");

            expect(result.canFallback).toBe(true);
            expect(result.fallbackStrategy).toBe("memory-only");
            expect(result.message).toBe(
                STORAGE_MESSAGES.LOCALSTORAGE_UNAVAILABLE
            );

            // Restore original method
            if (originalSetItem) {
                Object.defineProperty(
                    Storage.prototype,
                    "setItem",
                    originalSetItem
                );
            }
        });

        it("should handle QuotaExceededError", () => {
            const error = new Error(
                "QuotaExceededError: Storage quota exceeded"
            );
            const result = errorHandler.handleStorageError(error, "setItem");

            expect(result.canFallback).toBe(true);
            expect(result.fallbackStrategy).toBe("cleanup-and-retry");
            expect(result.message).toBe(
                STORAGE_MESSAGES.STORAGE_QUOTA_EXCEEDED
            );
        });

        it("should handle quota error with lowercase message", () => {
            const error = new Error("Storage quota exceeded");
            const result = errorHandler.handleStorageError(error, "setItem");

            expect(result.canFallback).toBe(true);
            expect(result.fallbackStrategy).toBe("cleanup-and-retry");
            expect(result.message).toBe(
                STORAGE_MESSAGES.STORAGE_QUOTA_EXCEEDED
            );
        });

        it("should handle SecurityError", () => {
            const error = new Error("SecurityError: Access denied");
            const result = errorHandler.handleStorageError(error, "getItem");

            expect(result.canFallback).toBe(true);
            expect(result.fallbackStrategy).toBe("memory-only");
            expect(result.message).toBe(STORAGE_MESSAGES.STORAGE_ACCESS_DENIED);
        });

        it("should handle access error with lowercase message", () => {
            const error = new Error("Storage access denied");
            const result = errorHandler.handleStorageError(error, "getItem");

            expect(result.canFallback).toBe(true);
            expect(result.fallbackStrategy).toBe("memory-only");
            expect(result.message).toBe(STORAGE_MESSAGES.STORAGE_ACCESS_DENIED);
        });

        it("should handle unknown storage error", () => {
            const error = new Error("Unknown storage error");
            const result = errorHandler.handleStorageError(error, "setItem");

            expect(result.canFallback).toBe(false);
            expect(result.fallbackStrategy).toBe("none");
            expect(result.message).toBe(
                STORAGE_MESSAGES.STORAGE_OPERATION_FAILED.replace(
                    "{error}",
                    "Unknown storage error"
                )
            );
        });

        it("should log error when handling storage error", () => {
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const error = new Error("Test error");

            errorHandler.handleStorageError(error, "setItem");

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[localStorage.setItem] Test error"
            );

            consoleErrorSpy.mockRestore();
        });
    });

    describe("handleConfigValidationError", () => {
        it("should sanitize valid configuration with errors", () => {
            const config = {
                auth: {
                    twitch_oauth: "oauth:test",
                    twitch_username: "testuser",
                    twitch_channel: "testchannel",
                },
                maxChallenges: 15,
                commands: {},
                responses: {},
            };
            const errors = ["Missing some fields"];

            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.auth).toEqual(config.auth);
            expect(result?.maxChallenges).toBe(15);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Configuration was sanitized due to validation errors:",
                errors
            );

            consoleWarnSpy.mockRestore();
        });

        it("should return null for invalid configuration that cannot be sanitized", () => {
            const config = null;
            const errors = ["Configuration is null"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).toBeNull();
        });

        it("should handle sanitization errors", () => {
            const config = {
                auth: "invalid",
                maxChallenges: "invalid",
            };
            const errors = ["Invalid configuration structure"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.auth).toEqual({
                twitch_oauth: "",
                twitch_username: "",
                twitch_channel: "",
            });
            expect(result?.maxChallenges).toBe(10);
        });

        it("should log validation errors", () => {
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const config = {};
            const errors = ["Error 1", "Error 2"];

            errorHandler.handleConfigValidationError(config, errors);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[config-validation] Configuration validation failed: Error 1, Error 2"
            );

            consoleErrorSpy.mockRestore();
        });
    });

    describe("handleExportError", () => {
        it("should attempt clipboard fallback for download errors", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            } as Config;

            // In jsdom, clipboard operations may not work, so we test that it attempts
            // the fallback and eventually succeeds with console fallback
            const consoleLogSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            const error = new Error("Download failed");
            const result = errorHandler.handleExportError(
                error,
                "json",
                config
            );

            expect(result.success).toBe(true);
            // Either clipboard or console fallback should be used
            expect(["clipboard", "console"]).toContain(result.fallbackUsed);

            consoleLogSpy.mockRestore();
        });

        it("should attempt clipboard fallback for blob errors", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            } as Config;

            const consoleLogSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            const error = new Error("Blob creation failed");
            const result = errorHandler.handleExportError(
                error,
                "json",
                config
            );

            expect(result.success).toBe(true);
            expect(["clipboard", "console"]).toContain(result.fallbackUsed);

            consoleLogSpy.mockRestore();
        });

        it("should fallback to console when clipboard fails", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            } as Config;

            const execCommandMock = vi.fn().mockReturnValue(false);
            (document as any).execCommand = execCommandMock;

            const consoleLogSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            const error = new Error("Download failed");
            const result = errorHandler.handleExportError(
                error,
                "json",
                config
            );

            expect(result.success).toBe(true);
            expect(result.fallbackUsed).toBe("console");
            expect(result.message).toContain("printed to console");
            expect(consoleLogSpy).toHaveBeenCalled();

            consoleLogSpy.mockRestore();
        });

        it("should return failure when all fallbacks fail", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            } as Config;

            const execCommandMock = vi.fn().mockImplementation(() => {
                throw new Error("Clipboard failed");
            });
            (document as any).execCommand = execCommandMock;

            const consoleLogSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {
                    throw new Error("Console failed");
                });

            const error = new Error("Export failed");
            const result = errorHandler.handleExportError(
                error,
                "json",
                config
            );

            expect(result.success).toBe(false);
            expect(result.fallbackUsed).toBeNull();
            expect(result.message).toContain("Export failed");

            consoleLogSpy.mockRestore();
        });

        it("should handle non-download/blob errors with console fallback", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            } as Config;

            const consoleLogSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            const error = new Error("Generic export error");
            const result = errorHandler.handleExportError(
                error,
                "json",
                config
            );

            expect(result.success).toBe(true);
            expect(result.fallbackUsed).toBe("console");
            expect(consoleLogSpy).toHaveBeenCalled();

            consoleLogSpy.mockRestore();
        });
    });

    describe("getErrorLog", () => {
        it("should return empty array initially", () => {
            const log = errorHandler.getErrorLog();

            expect(log).toEqual([]);
        });

        it("should return logged errors", () => {
            const error = new Error("Test error");
            errorHandler.handleStorageError(error, "setItem");

            const log = errorHandler.getErrorLog();

            expect(log.length).toBe(1);
            expect(log[0]?.error).toBe("Test error");
            expect(log[0]?.context).toBe("localStorage.setItem");
            expect(log[0]?.timestamp).toBeInstanceOf(Date);
        });

        it("should return a copy of the error log", () => {
            const error = new Error("Test error");
            errorHandler.handleStorageError(error, "setItem");

            const log1 = errorHandler.getErrorLog();
            const log2 = errorHandler.getErrorLog();

            expect(log1).toEqual(log2);
            expect(log1).not.toBe(log2);
        });

        it("should limit error log to maxLogEntries", () => {
            // Add more than 100 errors
            for (let i = 0; i < 105; i++) {
                const error = new Error(`Error ${i}`);
                errorHandler.handleStorageError(error, "setItem");
            }

            const log = errorHandler.getErrorLog();

            expect(log.length).toBe(100);
            // Should have removed the oldest entries
            expect(log[0]?.error).toBe("Error 5");
            expect(log[99]?.error).toBe("Error 104");
        });
    });

    describe("clearErrorLog", () => {
        it("should clear all logged errors", () => {
            const error = new Error("Test error");
            errorHandler.handleStorageError(error, "setItem");

            expect(errorHandler.getErrorLog().length).toBe(1);

            errorHandler.clearErrorLog();

            expect(errorHandler.getErrorLog().length).toBe(0);
        });

        it("should allow new errors to be logged after clearing", () => {
            const error1 = new Error("Error 1");
            errorHandler.handleStorageError(error1, "setItem");
            errorHandler.clearErrorLog();

            const error2 = new Error("Error 2");
            errorHandler.handleStorageError(error2, "getItem");

            const log = errorHandler.getErrorLog();
            expect(log.length).toBe(1);
            expect(log[0]?.error).toBe("Error 2");
        });
    });

    describe("getSystemHealth", () => {
        it("should return system health status", () => {
            const health = errorHandler.getSystemHealth();

            expect(health).toHaveProperty("storageAvailable");
            expect(health).toHaveProperty("recentErrors");
            expect(health).toHaveProperty("criticalErrors");
            expect(typeof health.storageAvailable).toBe("boolean");
            expect(typeof health.recentErrors).toBe("number");
            expect(Array.isArray(health.criticalErrors)).toBe(true);
        });

        it("should report storage availability", () => {
            const health = errorHandler.getSystemHealth();

            expect(health.storageAvailable).toBe(true);
        });

        it("should count recent errors from last 5 minutes", () => {
            const error = new Error("Recent error");
            errorHandler.handleStorageError(error, "setItem");

            const health = errorHandler.getSystemHealth();

            expect(health.recentErrors).toBe(1);
        });

        it("should identify critical storage errors", () => {
            // Clear the log first to ensure clean state
            errorHandler.clearErrorLog();

            const error = new Error("Storage error");
            errorHandler.handleStorageError(error, "setItem");

            // Verify the error was logged
            const log = errorHandler.getErrorLog();
            expect(log.length).toBe(1);
            expect(log[0]?.context).toBe("localStorage.setItem");

            // Get health immediately after logging the error
            const health = errorHandler.getSystemHealth();

            expect(health.criticalErrors.length).toBe(1);
            expect(health.criticalErrors[0]).toBe("Storage error");
        });

        it("should identify critical config-validation errors", () => {
            const config = {};
            const errors = ["Validation error"];
            errorHandler.handleConfigValidationError(config, errors);

            const health = errorHandler.getSystemHealth();

            expect(health.criticalErrors.length).toBe(1);
            expect(health.criticalErrors[0]).toContain("Validation error");
        });

        it("should not include non-critical errors", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            } as Config;

            const error = new Error("Export error");
            errorHandler.handleExportError(error, "json", config);

            const health = errorHandler.getSystemHealth();

            expect(health.criticalErrors.length).toBe(0);
        });
    });

    describe("sanitizeConfiguration (private method via handleConfigValidationError)", () => {
        it("should sanitize configuration with missing auth", () => {
            const config = {
                maxChallenges: 10,
                commands: {},
                responses: {},
            };
            const errors = ["Missing auth"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.auth).toEqual({
                twitch_oauth: "",
                twitch_username: "",
                twitch_channel: "",
            });
        });

        it("should sanitize configuration with invalid auth types", () => {
            const config = {
                auth: {
                    twitch_oauth: 123,
                    twitch_username: true,
                    twitch_channel: null,
                },
                maxChallenges: 10,
                commands: {},
                responses: {},
            };
            const errors = ["Invalid auth types"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.auth).toEqual({
                twitch_oauth: "",
                twitch_username: "",
                twitch_channel: "",
            });
        });

        it("should sanitize configuration with invalid maxChallenges", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: -5,
                commands: {},
                responses: {},
            };
            const errors = ["Invalid maxChallenges"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.maxChallenges).toBe(10);
        });

        it("should sanitize configuration with string maxChallenges", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: "10",
                commands: {},
                responses: {},
            };
            const errors = ["Invalid maxChallenges type"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.maxChallenges).toBe(10);
        });

        it("should sanitize challengeRowColors array", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                challengeRowColors: ["#ff0000", "", "  ", "#00ff00", 123],
                commands: {},
                responses: {},
            };
            const errors = ["Invalid colors"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.challengeRowColors).toEqual(["#ff0000", "#00ff00"]);
        });

        it("should handle non-array challengeRowColors", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                challengeRowColors: "invalid",
                commands: {},
                responses: {},
            };
            const errors = ["Invalid colors"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.challengeRowColors).toEqual([]);
        });

        it("should use default commands when invalid", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                commands: "invalid",
                responses: {},
            };
            const errors = ["Invalid commands"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.commands).toHaveProperty("clearList");
            expect(result?.commands).toHaveProperty("addChallenge");
        });

        it("should use default responses when invalid", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                commands: {},
                responses: "invalid",
            };
            const errors = ["Invalid responses"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.responses).toHaveProperty("clearList");
            expect(result?.responses).toHaveProperty("addChallenge");
        });

        it("should preserve valid commands and responses", () => {
            const config = {
                auth: {
                    twitch_oauth: "",
                    twitch_username: "",
                    twitch_channel: "",
                },
                maxChallenges: 10,
                commands: { custom: ["!custom"] },
                responses: { custom: "Custom response" },
            };
            const errors = ["Some validation error"];

            const result = errorHandler.handleConfigValidationError(
                config,
                errors
            );

            expect(result).not.toBeNull();
            expect(result?.commands).toEqual({ custom: ["!custom"] });
            expect(result?.responses).toEqual({ custom: "Custom response" });
        });
    });
});
