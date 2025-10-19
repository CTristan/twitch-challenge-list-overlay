import { ErrorHandler } from "../utils/errorHandler";
import type {
    StorageAdapter,
    StorageOptions,
    StorageResult,
} from "./StorageAdapter";

/**
 * LocalStorage implementation of StorageAdapter
 * Maintains backward compatibility with existing StorageManager
 */
export class LocalStorageAdapter implements StorageAdapter {
    private errorHandler: ErrorHandler = ErrorHandler.getInstance();
    private memoryStorage: Map<string, any> = new Map();
    private memoryOnlyMode: boolean = false;
    private subscribers: Map<string, Set<(data: any) => void>> = new Map();

    async save<T>(
        key: string,
        data: T,
        options: StorageOptions = {}
    ): Promise<StorageResult<T>> {
        const {
            version,
            timestamp = false,
            fallbackToMemory = true,
            retryOnQuotaExceeded = true,
        } = options;

        // If in memory-only mode, use memory storage
        if (this.memoryOnlyMode) {
            this.memoryStorage.set(key, data);
            this.notifySubscribers(key, data);
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
            const serialized = JSON.stringify(dataToStore);
            localStorage.setItem(key, serialized);
            this.notifySubscribers(key, dataToStore);

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
                this.notifySubscribers(key, dataToStore);
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
                    const serialized = JSON.stringify(dataToStore);
                    localStorage.setItem(key, serialized);
                    this.notifySubscribers(key, dataToStore);

                    return {
                        success: true,
                        data: dataToStore,
                        fallbackUsed: "cleanup-and-retry",
                    };
                } catch (retryError) {
                    if (fallbackToMemory) {
                        this.memoryOnlyMode = true;
                        this.memoryStorage.set(key, dataToStore);
                        this.notifySubscribers(key, dataToStore);
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

    async load<T>(
        key: string,
        defaultValue?: T,
        validator?: (data: any) => data is T
    ): Promise<StorageResult<T>> {
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

    async remove(key: string): Promise<StorageResult<void>> {
        // Remove from memory storage if in memory-only mode
        if (this.memoryOnlyMode) {
            this.memoryStorage.delete(key);
            this.notifySubscribers(key, null);
            return {
                success: true,
                fallbackUsed: "memory-only",
            };
        }

        try {
            localStorage.removeItem(key);
            this.notifySubscribers(key, null);
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

    async isAvailable(): Promise<boolean> {
        try {
            const test = "__storage_test__";
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    async clearAll(keysToKeep: string[] = []): Promise<StorageResult<void>> {
        try {
            // Clear memory storage
            if (keysToKeep.length > 0) {
                const keysToDelete = Array.from(
                    this.memoryStorage.keys()
                ).filter((key) => !keysToKeep.includes(key));
                keysToDelete.forEach((key) => {
                    this.memoryStorage.delete(key);
                    this.notifySubscribers(key, null);
                });
            } else {
                this.memoryStorage.forEach((_, key) =>
                    this.notifySubscribers(key, null)
                );
                this.memoryStorage.clear();
            }

            // Clear localStorage
            if (await this.isAvailable()) {
                if (keysToKeep.length > 0) {
                    const keysToDelete: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && !keysToKeep.includes(key)) {
                            keysToDelete.push(key);
                        }
                    }
                    keysToDelete.forEach((key) => {
                        localStorage.removeItem(key);
                        this.notifySubscribers(key, null);
                    });
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

    subscribe<T>(key: string, callback: (data: T | null) => void): () => void {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key)!.add(callback);

        // Return unsubscribe function
        return () => {
            const keySubscribers = this.subscribers.get(key);
            if (keySubscribers) {
                keySubscribers.delete(callback);
                if (keySubscribers.size === 0) {
                    this.subscribers.delete(key);
                }
            }
        };
    }

    async getStatus(): Promise<{
        available: boolean;
        type: string;
        memoryOnlyMode: boolean;
        memoryKeys: string[];
        localStorageKeys: string[];
    }> {
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
            available: await this.isAvailable(),
            type: "localStorage",
            memoryOnlyMode: this.memoryOnlyMode,
            memoryKeys: Array.from(this.memoryStorage.keys()),
            localStorageKeys,
        };
    }

    private notifySubscribers(key: string, data: any): void {
        const keySubscribers = this.subscribers.get(key);
        if (keySubscribers) {
            keySubscribers.forEach((callback) => callback(data));
        }
    }

    private cleanupOldData(): void {
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && this.shouldRemoveKey(key)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    private shouldRemoveKey(key: string): boolean {
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
    resetMemoryOnlyMode(): void {
        this.memoryOnlyMode = false;
        this.memoryStorage.clear();
    }

    /**
     * Force memory-only mode (for testing or when localStorage is unavailable)
     */
    forceMemoryOnlyMode(): void {
        this.memoryOnlyMode = true;
    }
}
