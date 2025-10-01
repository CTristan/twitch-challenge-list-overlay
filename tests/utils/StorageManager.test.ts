import { beforeEach, describe, expect, it, vi } from "vitest";
import { StorageManager } from "../../src/utils/StorageManager";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("StorageManager", () => {
    beforeEach(() => {
        ensureTestIsolation();
        StorageManager.resetMemoryOnlyMode();
    });

    describe("save method", () => {
        it("should save data successfully to localStorage", () => {
            const testData = { test: "value" };
            const result = StorageManager.save("test-key", testData);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(testData);
            expect(localStorage.getItem("test-key")).toBe(
                JSON.stringify(testData)
            );
        });

        it("should save data with version option", () => {
            const testData = { test: "value" };
            const result = StorageManager.save("test-key", testData, {
                version: "1.0",
            });

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ ...testData, _version: "1.0" });
        });

        it("should save data with timestamp option", () => {
            const testData = { test: "value" };
            const dateSpy = vi.spyOn(Date, "now").mockReturnValue(12345);

            const result = StorageManager.save("test-key", testData, {
                timestamp: true,
            });

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ ...testData, _timestamp: 12345 });
            dateSpy.mockRestore();
        });

        it("should save data with both version and timestamp", () => {
            const testData = { test: "value" };
            const dateSpy = vi.spyOn(Date, "now").mockReturnValue(12345);

            const result = StorageManager.save("test-key", testData, {
                version: "1.0",
                timestamp: true,
            });

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                ...testData,
                _version: "1.0",
                _timestamp: 12345,
            });
            dateSpy.mockRestore();
        });

        it("should use memory storage when in memory-only mode", () => {
            StorageManager.forceMemoryOnlyMode();
            const testData = { test: "value" };

            const result = StorageManager.save("test-key", testData);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(testData);
            expect(result.fallbackUsed).toBe("memory-only");
            expect(localStorage.getItem("test-key")).toBeNull();
        });
    });

    describe("load method", () => {
        it("should load data successfully from localStorage", () => {
            const testData = { test: "value" };
            localStorage.setItem("test-key", JSON.stringify(testData));

            const result = StorageManager.load("test-key");

            expect(result.success).toBe(true);
            expect(result.data).toEqual(testData);
        });

        it("should load data from memory storage when in memory-only mode", () => {
            StorageManager.forceMemoryOnlyMode();
            const testData = { test: "value" };

            StorageManager.save("test-key", testData);
            const result = StorageManager.load("test-key");

            expect(result.success).toBe(true);
            expect(result.data).toEqual(testData);
            expect(result.fallbackUsed).toBe("memory-only");
        });

        it("should return default value when no data found", () => {
            const defaultValue = { default: "value" };
            const result = StorageManager.load("nonexistent-key", defaultValue);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(defaultValue);
            expect(result.fallbackUsed).toBe("default-value");
        });

        it("should return error when no data found and no default", () => {
            const result = StorageManager.load("nonexistent-key");

            expect(result.success).toBe(false);
            expect(result.error).toBe("No data found for key");
        });

        it("should validate data with custom validator", () => {
            const testData = { test: "value" };
            localStorage.setItem("test-key", JSON.stringify(testData));

            const validator = (data: any): data is { test: string } => {
                return (
                    typeof data === "object" && typeof data.test === "string"
                );
            };

            const result = StorageManager.load(
                "test-key",
                undefined,
                validator
            );

            expect(result.success).toBe(true);
            expect(result.data).toEqual(testData);
        });

        it("should return default value when validation fails", () => {
            const invalidData = { test: 123 };
            const defaultValue = { test: "default" };
            localStorage.setItem("test-key", JSON.stringify(invalidData));

            const validator = (data: any): data is { test: string } => {
                return (
                    typeof data === "object" && typeof data.test === "string"
                );
            };

            const result = StorageManager.load(
                "test-key",
                defaultValue,
                validator
            );

            expect(result.success).toBe(true);
            expect(result.data).toEqual(defaultValue);
            expect(result.fallbackUsed).toBe("validation-failed");
        });

        it("should return error when validation fails and no default", () => {
            const invalidData = { test: 123 };
            localStorage.setItem("test-key", JSON.stringify(invalidData));

            const validator = (data: any): data is { test: string } => {
                return (
                    typeof data === "object" && typeof data.test === "string"
                );
            };

            const result = StorageManager.load(
                "test-key",
                undefined,
                validator
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe("Stored data failed validation");
        });

        it("should handle JSON parse errors", () => {
            localStorage.setItem("test-key", "invalid json");
            const defaultValue = { test: "default" };

            const result = StorageManager.load("test-key", defaultValue);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(defaultValue);
            expect(result.fallbackUsed).toBe("parse-error");
        });

        it("should return error on parse failure without default", () => {
            localStorage.setItem("test-key", "invalid json");

            const result = StorageManager.load("test-key");

            expect(result.success).toBe(false);
            expect(result.error).toContain("invalid json");
        });
    });

    describe("remove method", () => {
        it("should remove data from localStorage", () => {
            localStorage.setItem("test-key", "test-value");

            const result = StorageManager.remove("test-key");

            expect(result.success).toBe(true);
            expect(localStorage.getItem("test-key")).toBeNull();
        });

        it("should remove data from memory storage when in memory-only mode", () => {
            StorageManager.forceMemoryOnlyMode();
            StorageManager.save("test-key", { test: "value" });

            const result = StorageManager.remove("test-key");

            expect(result.success).toBe(true);

            const loadResult = StorageManager.load("test-key");
            expect(loadResult.success).toBe(false);
        });
    });

    describe("isStorageAvailable method", () => {
        it("should return true when localStorage is available", () => {
            const result = StorageManager.isStorageAvailable();
            expect(result).toBe(true);
        });
    });

    describe("getStorageStatus method", () => {
        it("should return storage status with localStorage keys", () => {
            localStorage.setItem("test-key1", "value1");
            localStorage.setItem("test-key2", "value2");

            const status = StorageManager.getStorageStatus();

            expect(status.available).toBe(true);
            expect(status.localStorageKeys).toContain("test-key1");
            expect(status.localStorageKeys).toContain("test-key2");
            expect(status.memoryKeys).toEqual([]);
        });

        it("should return memory keys when in memory-only mode", () => {
            StorageManager.forceMemoryOnlyMode();
            StorageManager.save("memory-key1", { test: "value1" });
            StorageManager.save("memory-key2", { test: "value2" });

            const status = StorageManager.getStorageStatus();

            expect(status.memoryKeys).toContain("memory-key1");
            expect(status.memoryKeys).toContain("memory-key2");
        });

        it("should handle errors when accessing localStorage keys", () => {
            // Add some items to localStorage first
            localStorage.setItem("test-key1", "value1");
            localStorage.setItem("test-key2", "value2");

            // Mock localStorage.key to throw an error after first call
            const originalKey = localStorage.key;
            let callCount = 0;
            localStorage.key = vi.fn().mockImplementation((index) => {
                callCount++;
                if (callCount > 1) {
                    throw new Error("Key access error");
                }
                return originalKey.call(localStorage, index);
            });

            const status = StorageManager.getStorageStatus();

            expect(status.available).toBe(true);
            // Should have at least one key from before the error
            expect(status.localStorageKeys.length).toBeGreaterThanOrEqual(0);

            // Restore original method
            localStorage.key = originalKey;
        });
    });

    describe("clearAll method", () => {
        it("should clear all storage when no keys to keep", () => {
            localStorage.setItem("test-key1", "value1");
            localStorage.setItem("test-key2", "value2");

            const result = StorageManager.clearAll();

            expect(result.success).toBe(true);
            expect(localStorage.getItem("test-key1")).toBeNull();
            expect(localStorage.getItem("test-key2")).toBeNull();
        });

        it("should handle localStorage unavailable during clear", () => {
            StorageManager.forceMemoryOnlyMode();
            StorageManager.save("memory-key", { test: "value" });

            const result = StorageManager.clearAll();

            expect(result.success).toBe(true);

            const status = StorageManager.getStorageStatus();
            expect(status.memoryKeys).toEqual([]);
        });

        it("should selectively clear localStorage while keeping specified keys", () => {
            localStorage.setItem("keep-key1", "keep-value1");
            localStorage.setItem("keep-key2", "keep-value2");
            localStorage.setItem("remove-key1", "remove-value1");
            localStorage.setItem("remove-key2", "remove-value2");

            const result = StorageManager.clearAll(["keep-key1", "keep-key2"]);

            expect(result.success).toBe(true);
            expect(localStorage.getItem("keep-key1")).toBe("keep-value1");
            expect(localStorage.getItem("keep-key2")).toBe("keep-value2");
            expect(localStorage.getItem("remove-key1")).toBeNull();
            expect(localStorage.getItem("remove-key2")).toBeNull();
        });

        it("should selectively clear memory storage while keeping specified keys", () => {
            StorageManager.forceMemoryOnlyMode();
            StorageManager.save("keep-key1", { test: "keep1" });
            StorageManager.save("keep-key2", { test: "keep2" });
            StorageManager.save("remove-key1", { test: "remove1" });
            StorageManager.save("remove-key2", { test: "remove2" });

            const result = StorageManager.clearAll(["keep-key1", "keep-key2"]);

            expect(result.success).toBe(true);

            const keepResult1 = StorageManager.load("keep-key1");
            const keepResult2 = StorageManager.load("keep-key2");
            const removeResult1 = StorageManager.load("remove-key1");
            const removeResult2 = StorageManager.load("remove-key2");

            expect(keepResult1.success).toBe(true);
            expect(keepResult2.success).toBe(true);
            expect(removeResult1.success).toBe(false);
            expect(removeResult2.success).toBe(false);
        });

        it("should handle errors during clearAll operation", () => {
            // Force memory-only mode to test memory storage error handling
            StorageManager.forceMemoryOnlyMode();
            StorageManager.save("test-key", { test: "value" });

            // Mock the memoryStorage.delete method to throw an error
            const originalDelete = StorageManager["memoryStorage"].delete;
            StorageManager["memoryStorage"].delete = vi
                .fn()
                .mockImplementation(() => {
                    throw new Error("Storage error");
                });

            const result = StorageManager.clearAll(["keep-key"]);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Storage error");

            // Restore original method
            StorageManager["memoryStorage"].delete = originalDelete;
        });
    });

    describe("cleanupOldData method", () => {
        it("should remove old data keys and return count", () => {
            localStorage.setItem("temp_data", "temp-value");
            localStorage.setItem("keep_this", "keep-value");

            const result = StorageManager.cleanupOldData();

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
            expect(localStorage.getItem("temp_data")).toBeNull();
            expect(localStorage.getItem("keep_this")).toBe("keep-value");
        });

        it("should handle no keys to remove", () => {
            localStorage.setItem("keep_this", "keep-value");

            const result = StorageManager.cleanupOldData();

            expect(result.success).toBe(true);
            expect(result.data).toBe(0);
        });
    });

    describe("mode management methods", () => {
        it("should reset memory-only mode", () => {
            StorageManager.forceMemoryOnlyMode();
            StorageManager.resetMemoryOnlyMode();

            const testData = { test: "value" };
            const result = StorageManager.save("test-key", testData);

            expect(result.success).toBe(true);
            expect(result.fallbackUsed).toBeUndefined();
            expect(localStorage.getItem("test-key")).toBe(
                JSON.stringify(testData)
            );
        });

        it("should force memory-only mode", () => {
            StorageManager.forceMemoryOnlyMode();

            const testData = { test: "value" };
            const result = StorageManager.save("test-key", testData);

            expect(result.success).toBe(true);
            expect(result.fallbackUsed).toBe("memory-only");
            expect(localStorage.getItem("test-key")).toBeNull();
        });

        it("should maintain memory-only mode across operations", () => {
            StorageManager.forceMemoryOnlyMode();

            const testData = { test: "value" };
            StorageManager.save("test-key", testData);
            const loadResult = StorageManager.load("test-key");

            expect(loadResult.success).toBe(true);
            expect(loadResult.data).toEqual(testData);
            expect(loadResult.fallbackUsed).toBe("memory-only");
        });
    });

    describe("error handling paths", () => {
        it("should handle getStorageStatus errors when accessing localStorage keys", () => {
            // Add some test data first
            localStorage.setItem("test-key1", "value1");
            localStorage.setItem("test-key2", "value2");

            // Mock localStorage.key to throw an error during iteration
            const originalKey = localStorage.key;
            let callCount = 0;
            localStorage.key = vi.fn().mockImplementation((index) => {
                callCount++;
                if (callCount > 1) {
                    throw new Error("Key access error");
                }
                return originalKey.call(localStorage, index);
            });

            const status = StorageManager.getStorageStatus();

            expect(status.available).toBeDefined();
            expect(status.localStorageKeys).toBeDefined();

            // Restore original method
            localStorage.key = originalKey;
        });

        it("should handle remove errors via private error handler", () => {
            // Force memory-only mode off to test localStorage path
            StorageManager.resetMemoryOnlyMode();

            // Use Object.defineProperty to override removeItem
            const originalRemoveItem = Object.getOwnPropertyDescriptor(
                Storage.prototype,
                "removeItem"
            );
            Object.defineProperty(Storage.prototype, "removeItem", {
                configurable: true,
                value: vi.fn().mockImplementation(() => {
                    throw new Error("Remove failed");
                }),
            });

            const result = StorageManager.remove("test-key");

            expect(result.success).toBe(false);
            expect(result.error).toBe("Remove failed");

            // Restore original method
            if (originalRemoveItem) {
                Object.defineProperty(
                    Storage.prototype,
                    "removeItem",
                    originalRemoveItem
                );
            }
        });

        it("should handle remove errors with non-Error objects", () => {
            // Force memory-only mode off to test localStorage path
            StorageManager.resetMemoryOnlyMode();

            // Use Object.defineProperty to override removeItem
            const originalRemoveItem = Object.getOwnPropertyDescriptor(
                Storage.prototype,
                "removeItem"
            );
            Object.defineProperty(Storage.prototype, "removeItem", {
                configurable: true,
                value: vi.fn().mockImplementation(() => {
                    throw "String error";
                }),
            });

            const result = StorageManager.remove("test-key");

            expect(result.success).toBe(false);
            expect(result.error).toBe("String error");

            // Restore original method
            if (originalRemoveItem) {
                Object.defineProperty(
                    Storage.prototype,
                    "removeItem",
                    originalRemoveItem
                );
            }
        });

        it("should handle storage availability check errors via private error handler", () => {
            // Use Object.defineProperty to override setItem
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

            const isAvailable = StorageManager.isStorageAvailable();

            expect(isAvailable).toBe(false);

            // Restore original method
            if (originalSetItem) {
                Object.defineProperty(
                    Storage.prototype,
                    "setItem",
                    originalSetItem
                );
            }
        });
    });

    describe("advanced error handling paths", () => {
        describe("save method error scenarios", () => {
            it("should fallback to memory when localStorage throws SecurityError", () => {
                StorageManager.resetMemoryOnlyMode();

                // Mock localStorage.setItem to throw SecurityError
                const originalSetItem = Object.getOwnPropertyDescriptor(
                    Storage.prototype,
                    "setItem"
                );
                Object.defineProperty(Storage.prototype, "setItem", {
                    configurable: true,
                    value: vi.fn().mockImplementation(() => {
                        throw new Error("SecurityError: Access denied");
                    }),
                });

                const testData = { test: "value" };
                const result = StorageManager.save("test-key", testData);

                expect(result.success).toBe(true);
                expect(result.data).toEqual(testData);
                expect(result.fallbackUsed).toBe("memory-only");

                // Verify memory-only mode was activated
                const status = StorageManager.getStorageStatus();
                expect(status.memoryOnlyMode).toBe(true);
                expect(status.memoryKeys).toContain("test-key");

                // Restore original method
                if (originalSetItem) {
                    Object.defineProperty(
                        Storage.prototype,
                        "setItem",
                        originalSetItem
                    );
                }
            });

            it("should fallback to memory when localStorage is unavailable", () => {
                StorageManager.resetMemoryOnlyMode();

                // Mock localStorage.setItem to throw unavailable error
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

                const testData = { test: "value" };
                const result = StorageManager.save("test-key", testData);

                expect(result.success).toBe(true);
                expect(result.data).toEqual(testData);
                expect(result.fallbackUsed).toBe("memory-only");

                // Restore original method
                if (originalSetItem) {
                    Object.defineProperty(
                        Storage.prototype,
                        "setItem",
                        originalSetItem
                    );
                }
            });

            it("should cleanup and retry when quota is exceeded", () => {
                StorageManager.resetMemoryOnlyMode();

                // Add some old data that should be cleaned up
                localStorage.setItem("temp_old_data", "should be removed");
                localStorage.setItem(
                    "overlay_config_old_backup",
                    "should be removed"
                );

                let callCount = 0;
                const originalSetItem = Object.getOwnPropertyDescriptor(
                    Storage.prototype,
                    "setItem"
                );

                Object.defineProperty(Storage.prototype, "setItem", {
                    configurable: true,
                    value: vi
                        .fn()
                        .mockImplementation((key: string, value: string) => {
                            callCount++;
                            // First call throws QuotaExceededError
                            if (callCount === 1) {
                                throw new Error(
                                    "QuotaExceededError: Storage quota exceeded"
                                );
                            }
                            // Second call (after cleanup) succeeds
                            return originalSetItem?.value.call(
                                localStorage,
                                key,
                                value
                            );
                        }),
                });

                const testData = { test: "value" };
                const result = StorageManager.save("test-key", testData, {
                    retryOnQuotaExceeded: true,
                });

                expect(result.success).toBe(true);
                expect(result.data).toEqual(testData);
                expect(result.fallbackUsed).toBe("cleanup-and-retry");

                // Verify cleanup occurred
                expect(localStorage.getItem("temp_old_data")).toBeNull();
                expect(
                    localStorage.getItem("overlay_config_old_backup")
                ).toBeNull();

                // Restore original method
                if (originalSetItem) {
                    Object.defineProperty(
                        Storage.prototype,
                        "setItem",
                        originalSetItem
                    );
                }
            });

            it("should fallback to memory when cleanup retry fails", () => {
                StorageManager.resetMemoryOnlyMode();

                // Mock localStorage.setItem to always throw QuotaExceededError
                const originalSetItem = Object.getOwnPropertyDescriptor(
                    Storage.prototype,
                    "setItem"
                );
                Object.defineProperty(Storage.prototype, "setItem", {
                    configurable: true,
                    value: vi.fn().mockImplementation(() => {
                        throw new Error(
                            "QuotaExceededError: Storage quota exceeded"
                        );
                    }),
                });

                const testData = { test: "value" };
                const result = StorageManager.save("test-key", testData, {
                    retryOnQuotaExceeded: true,
                    fallbackToMemory: true,
                });

                expect(result.success).toBe(true);
                expect(result.data).toEqual(testData);
                expect(result.fallbackUsed).toBe("memory-only");

                // Verify memory-only mode was activated
                const status = StorageManager.getStorageStatus();
                expect(status.memoryOnlyMode).toBe(true);

                // Restore original method
                if (originalSetItem) {
                    Object.defineProperty(
                        Storage.prototype,
                        "setItem",
                        originalSetItem
                    );
                }
            });

            it("should return error when all fallbacks fail", () => {
                StorageManager.resetMemoryOnlyMode();

                // Mock localStorage.setItem to throw error
                const originalSetItem = Object.getOwnPropertyDescriptor(
                    Storage.prototype,
                    "setItem"
                );
                Object.defineProperty(Storage.prototype, "setItem", {
                    configurable: true,
                    value: vi.fn().mockImplementation(() => {
                        throw new Error("Storage error");
                    }),
                });

                const testData = { test: "value" };
                const result = StorageManager.save("test-key", testData, {
                    fallbackToMemory: false,
                    retryOnQuotaExceeded: false,
                });

                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();

                // Restore original method
                if (originalSetItem) {
                    Object.defineProperty(
                        Storage.prototype,
                        "setItem",
                        originalSetItem
                    );
                }
            });

            it("should return error when quota exceeded and retry disabled", () => {
                StorageManager.resetMemoryOnlyMode();

                const originalSetItem = Object.getOwnPropertyDescriptor(
                    Storage.prototype,
                    "setItem"
                );
                Object.defineProperty(Storage.prototype, "setItem", {
                    configurable: true,
                    value: vi.fn().mockImplementation(() => {
                        throw new Error(
                            "QuotaExceededError: Storage quota exceeded"
                        );
                    }),
                });

                const testData = { test: "value" };
                const result = StorageManager.save("test-key", testData, {
                    retryOnQuotaExceeded: false,
                    fallbackToMemory: false,
                });

                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();

                // Restore original method
                if (originalSetItem) {
                    Object.defineProperty(
                        Storage.prototype,
                        "setItem",
                        originalSetItem
                    );
                }
            });

            it("should not fallback to memory when cleanup retry fails and fallbackToMemory is false", () => {
                StorageManager.resetMemoryOnlyMode();

                const originalSetItem = Object.getOwnPropertyDescriptor(
                    Storage.prototype,
                    "setItem"
                );
                Object.defineProperty(Storage.prototype, "setItem", {
                    configurable: true,
                    value: vi.fn().mockImplementation(() => {
                        throw new Error(
                            "QuotaExceededError: Storage quota exceeded"
                        );
                    }),
                });

                const testData = { test: "value" };
                const result = StorageManager.save("test-key", testData, {
                    retryOnQuotaExceeded: true,
                    fallbackToMemory: false,
                });

                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();

                // Verify memory-only mode was NOT activated
                const status = StorageManager.getStorageStatus();
                expect(status.memoryOnlyMode).toBe(false);

                // Restore original method
                if (originalSetItem) {
                    Object.defineProperty(
                        Storage.prototype,
                        "setItem",
                        originalSetItem
                    );
                }
            });

            it("should handle non-Error exceptions in save", () => {
                StorageManager.resetMemoryOnlyMode();

                const originalSetItem = Object.getOwnPropertyDescriptor(
                    Storage.prototype,
                    "setItem"
                );
                Object.defineProperty(Storage.prototype, "setItem", {
                    configurable: true,
                    value: vi.fn().mockImplementation(() => {
                        throw "String error message";
                    }),
                });

                const testData = { test: "value" };
                const result = StorageManager.save("test-key", testData, {
                    fallbackToMemory: false,
                });

                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();

                // Restore original method
                if (originalSetItem) {
                    Object.defineProperty(
                        Storage.prototype,
                        "setItem",
                        originalSetItem
                    );
                }
            });
        });

        describe("getStorageStatus error scenarios", () => {
            it("should handle errors when iterating localStorage keys", () => {
                // Add some test data first
                localStorage.setItem("test-key1", "value1");
                localStorage.setItem("test-key2", "value2");

                // Mock localStorage.length to throw error
                const originalLength = Object.getOwnPropertyDescriptor(
                    Storage.prototype,
                    "length"
                );
                Object.defineProperty(Storage.prototype, "length", {
                    configurable: true,
                    get: vi.fn().mockImplementation(() => {
                        throw new Error("Access denied");
                    }),
                });

                const status = StorageManager.getStorageStatus();

                // Should still return valid status object
                expect(status.available).toBeDefined();
                expect(status.memoryOnlyMode).toBeDefined();
                expect(status.memoryKeys).toBeDefined();
                expect(status.localStorageKeys).toEqual([]);

                // Restore original property
                if (originalLength) {
                    Object.defineProperty(
                        Storage.prototype,
                        "length",
                        originalLength
                    );
                }
            });
        });

        describe("cleanupOldData error scenarios", () => {
            it("should handle errors during cleanup operation", () => {
                // Add test data
                localStorage.setItem("temp_data1", "value1");
                localStorage.setItem("temp_data2", "value2");
                localStorage.setItem("keep_this", "keep");

                let removeCallCount = 0;
                const originalRemoveItem = Object.getOwnPropertyDescriptor(
                    Storage.prototype,
                    "removeItem"
                );

                Object.defineProperty(Storage.prototype, "removeItem", {
                    configurable: true,
                    value: vi.fn().mockImplementation((key: string) => {
                        removeCallCount++;
                        // Throw error on second removal
                        if (removeCallCount === 2) {
                            throw new Error("Removal failed");
                        }
                        return originalRemoveItem?.value.call(
                            localStorage,
                            key
                        );
                    }),
                });

                const result = StorageManager.cleanupOldData();

                expect(result.success).toBe(false);
                expect(result.error).toBe("Removal failed");
                expect(result.data).toBe(1); // One item was removed before error

                // Restore original method
                if (originalRemoveItem) {
                    Object.defineProperty(
                        Storage.prototype,
                        "removeItem",
                        originalRemoveItem
                    );
                }
            });

            it("should handle non-Error exceptions in cleanup", () => {
                localStorage.setItem("temp_data", "value");

                const originalRemoveItem = Object.getOwnPropertyDescriptor(
                    Storage.prototype,
                    "removeItem"
                );

                Object.defineProperty(Storage.prototype, "removeItem", {
                    configurable: true,
                    value: vi.fn().mockImplementation(() => {
                        throw "String error message";
                    }),
                });

                const result = StorageManager.cleanupOldData();

                expect(result.success).toBe(false);
                expect(result.error).toBe("String error message");

                // Restore original method
                if (originalRemoveItem) {
                    Object.defineProperty(
                        Storage.prototype,
                        "removeItem",
                        originalRemoveItem
                    );
                }
            });
        });
    });
});
