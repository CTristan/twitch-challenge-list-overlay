import { ErrorHandler } from "./errorHandler";

/**
 * Storage operation result interface
 */
export interface StorageResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    fallbackUsed?: string;
}

/**
 * Storage options interface
 */
export interface StorageOptions {
    version?: string;
    timestamp?: boolean;
    fallbackToMemory?: boolean;
    retryOnQuotaExceeded?: boolean;
}

/**
 * @class StorageManager
 * Centralized localStorage management utility that consolidates storage operations
 * from ConfigManager, IDManager, and ChallengeList. Provides consistent error handling,
 * fallback strategies, and serialization patterns.
 */
export class StorageManager {
    private static errorHandler: ErrorHandler = ErrorHandler.getInstance();
    private static memoryStorage: Map<string, any> = new Map();
    private static memoryOnlyMode: boolean = false;

    /**
     * Save data to localStorage with error handling and fallback strategies
     * @param key - Storage key
     * @param data - Data to save
     * @param options - Storage options
     * @returns Storage result
     */
    static save<T>(
        key: string,
        data: T,
        options: StorageOptions = {}
    ): StorageResult<T> {
        const {
            version,
            timestamp = false,
            fallbackToMemory = true,
            retryOnQuotaExceeded = true,
        } = options;

        // If in memory-only mode, use memory storage
        if (this.memoryOnlyMode) {
            this.memoryStorage.set(key, data);
            return {
                success: true,
                data,
                fallbackUsed: "memory-only",
            };
        }

        // Prepare data for storage
        let dataToStore: any = data;
        if (version || timestamp) {
            dataToStore = {
                ...data,
                ...(version && { _version: version }),
                ...(timestamp && { _timestamp: Date.now() }),
            };
        }

        try {
            const serialized = JSON.stringify(dataToStore, null, 2);
            localStorage.setItem(key, serialized);

            return {
                success: true,
                data: dataToStore,
            };
        } catch (error) {
            const fallback = this.errorHandler.handleStorageError(
                error as Error,
                "setItem"
            );

            // Try memory fallback if enabled
            if (
                fallback.canFallback &&
                fallback.fallbackStrategy === "memory-only" &&
                fallbackToMemory
            ) {
                this.memoryOnlyMode = true;
                this.memoryStorage.set(key, dataToStore);
                console.warn(fallback.message);

                return {
                    success: true,
                    data: dataToStore,
                    fallbackUsed: "memory-only",
                };
            }

            // Try cleanup and retry if quota exceeded
            if (
                fallback.canFallback &&
                fallback.fallbackStrategy === "cleanup-and-retry" &&
                retryOnQuotaExceeded
            ) {
                try {
                    this.cleanupOldData();
                    const serialized = JSON.stringify(dataToStore, null, 2);
                    localStorage.setItem(key, serialized);

                    return {
                        success: true,
                        data: dataToStore,
                        fallbackUsed: "cleanup-and-retry",
                    };
                } catch (retryError) {
                    if (fallbackToMemory) {
                        this.memoryOnlyMode = true;
                        this.memoryStorage.set(key, dataToStore);
                        console.warn(
                            "Cleanup failed, switching to memory-only mode"
                        );

                        return {
                            success: true,
                            data: dataToStore,
                            fallbackUsed: "memory-only",
                        };
                    }
                }
            }

            return {
                success: false,
                error: fallback.message,
            };
        }
    }

    /**
     * Load data from localStorage with fallback to defaults
     * @param key - Storage key
     * @param defaultValue - Default value if not found or invalid
     * @param validator - Optional validation function
     * @returns Storage result
     */
    static load<T>(
        key: string,
        defaultValue?: T,
        validator?: (data: any) => data is T
    ): StorageResult<T> {
        // Check memory storage first if in memory-only mode
        if (this.memoryOnlyMode && this.memoryStorage.has(key)) {
            const data = this.memoryStorage.get(key);
            return {
                success: true,
                data,
                fallbackUsed: "memory-only",
            };
        }

        try {
            const stored = localStorage.getItem(key);

            if (!stored) {
                if (defaultValue !== undefined) {
                    return {
                        success: true,
                        data: defaultValue,
                        fallbackUsed: "default-value",
                    };
                }
                return {
                    success: false,
                    error: "No data found for key",
                };
            }

            const parsed = JSON.parse(stored);

            // Validate data if validator provided
            if (validator && !validator(parsed)) {
                console.warn(
                    `Invalid stored data for key ${key}, using default`
                );
                if (defaultValue !== undefined) {
                    return {
                        success: true,
                        data: defaultValue,
                        fallbackUsed: "validation-failed",
                    };
                }
                return {
                    success: false,
                    error: "Stored data failed validation",
                };
            }

            return {
                success: true,
                data: parsed,
            };
        } catch (error) {
            console.error(`Error loading data for key ${key}:`, error);

            if (defaultValue !== undefined) {
                return {
                    success: true,
                    data: defaultValue,
                    fallbackUsed: "parse-error",
                };
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Remove data from localStorage
     * @param key - Storage key
     * @returns Storage result
     */
    static remove(key: string): StorageResult<void> {
        // Remove from memory storage if in memory-only mode
        if (this.memoryOnlyMode) {
            this.memoryStorage.delete(key);
            return {
                success: true,
                fallbackUsed: "memory-only",
            };
        }

        try {
            localStorage.removeItem(key);
            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Check if localStorage is available
     * @returns Availability status
     */
    static isStorageAvailable(): boolean {
        try {
            const test = "__storage_test__";
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get storage status information
     * @returns Status information
     */
    static getStorageStatus(): {
        available: boolean;
        memoryOnlyMode: boolean;
        memoryKeys: string[];
        localStorageKeys: string[];
    } {
        const localStorageKeys: string[] = [];

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    localStorageKeys.push(key);
                }
            }
        } catch {
            // Ignore errors when getting keys
        }

        return {
            available: this.isStorageAvailable(),
            memoryOnlyMode: this.memoryOnlyMode,
            memoryKeys: Array.from(this.memoryStorage.keys()),
            localStorageKeys,
        };
    }

    /**
     * Clear all storage (both localStorage and memory)
     * @param keysToKeep - Optional array of keys to preserve
     * @returns Storage result
     */
    static clearAll(keysToKeep: string[] = []): StorageResult<void> {
        try {
            // Clear memory storage
            if (keysToKeep.length > 0) {
                const keysToDelete = Array.from(
                    this.memoryStorage.keys()
                ).filter((key) => !keysToKeep.includes(key));
                keysToDelete.forEach((key) => this.memoryStorage.delete(key));
            } else {
                this.memoryStorage.clear();
            }

            // Clear localStorage
            if (this.isStorageAvailable()) {
                if (keysToKeep.length > 0) {
                    const keysToDelete: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && !keysToKeep.includes(key)) {
                            keysToDelete.push(key);
                        }
                    }
                    keysToDelete.forEach((key) => localStorage.removeItem(key));
                } else {
                    localStorage.clear();
                }
            }

            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Clean up old data to free storage space
     * @returns Cleanup result
     */
    static cleanupOldData(): StorageResult<number> {
        let removedCount = 0;

        try {
            const keysToRemove: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && this.shouldRemoveKey(key)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach((key) => {
                localStorage.removeItem(key);
                removedCount++;
            });

            return {
                success: true,
                data: removedCount,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                data: removedCount,
            };
        }
    }

    /**
     * Determine if a storage key should be removed during cleanup
     * @param key - Storage key to check
     * @returns Whether the key should be removed
     */
    private static shouldRemoveKey(key: string): boolean {
        // Remove old configuration versions or temporary data
        return (
            key.startsWith("overlay_config_old_") ||
            key.startsWith("temp_") ||
            key.includes("backup_") ||
            key.startsWith("__test__")
        );
    }

    /**
     * Reset memory-only mode (for testing purposes)
     */
    static resetMemoryOnlyMode(): void {
        this.memoryOnlyMode = false;
        this.memoryStorage.clear();
    }

    /**
     * Force memory-only mode (for testing or when localStorage is unavailable)
     */
    static forceMemoryOnlyMode(): void {
        this.memoryOnlyMode = true;
    }
}
