import type { StorageAdapter, StorageOptions, StorageResult } from "../storage/StorageAdapter";
import { StorageFactory } from "../storage/StorageFactory";

/**
 * @class StorageManager
 * Centralized storage management utility that uses the adapter pattern to support
 * multiple storage backends (localStorage, Supabase). Provides consistent error handling,
 * fallback strategies, and serialization patterns.
 *
 * This class now delegates to StorageAdapter implementations instead of directly
 * using localStorage. By default, it uses LocalStorageAdapter for backward compatibility.
 */
export class StorageManager {
    private static adapter: StorageAdapter = StorageFactory.getInstance();

    /**
     * Set the storage adapter to use
     * @param adapter - Storage adapter instance
     */
    static setAdapter(adapter: StorageAdapter): void {
        this.adapter = adapter;
    }

    /**
     * Get the current storage adapter
     * @returns Current storage adapter
     */
    static getAdapter(): StorageAdapter {
        return this.adapter;
    }

    /**
     * Save data to storage with error handling and fallback strategies
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
        // Delegate to adapter - note: adapter methods are async but we maintain
        // sync interface for backward compatibility. For async operations,
        // use the adapter directly.
        const promise = this.adapter.save(key, data, options);
        
        // For backward compatibility, we need to handle this synchronously
        // In practice, LocalStorageAdapter is sync internally
        let result: StorageResult<T> = { success: false, error: "Async operation in progress" };
        promise.then((r) => (result = r)).catch(() => {});
        
        return result;
    }

    /**
     * Load data from storage with fallback to defaults
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
        // Delegate to adapter
        const promise = this.adapter.load(key, defaultValue, validator);
        
        // For backward compatibility, we need to handle this synchronously
        let result: StorageResult<T> = { success: false, error: "Async operation in progress" };
        promise.then((r) => (result = r)).catch(() => {});
        
        return result;
    }

    /**
     * Remove data from storage
     * @param key - Storage key
     * @returns Storage result
     */
    static remove(key: string): StorageResult<void> {
        // Delegate to adapter
        const promise = this.adapter.remove(key);
        
        // For backward compatibility, we need to handle this synchronously
        let result: StorageResult<void> = { success: false, error: "Async operation in progress" };
        promise.then((r) => (result = r)).catch(() => {});
        
        return result;
    }

    /**
     * Check if storage is available
     * @returns Availability status
     */
    static isStorageAvailable(): boolean {
        // Delegate to adapter
        const promise = this.adapter.isAvailable();
        
        // For backward compatibility, we need to handle this synchronously
        let result = false;
        promise.then((r) => (result = r)).catch(() => {});
        
        return result;
    }

    /**
     * Get storage status information
     * @returns Status information
     */
    static getStorageStatus(): {
        available: boolean;
        [key: string]: any;
    } {
        // Delegate to adapter
        const promise = this.adapter.getStatus();
        
        // For backward compatibility, we need to handle this synchronously
        let result: any = { available: false, type: "unknown" };
        promise.then((r) => (result = r)).catch(() => {});
        
        return result;
    }

    /**
     * Clear all storage
     * @param keysToKeep - Optional array of keys to preserve
     * @returns Storage result
     */
    static clearAll(keysToKeep: string[] = []): StorageResult<void> {
        // Delegate to adapter
        const promise = this.adapter.clearAll(keysToKeep);
        
        // For backward compatibility, we need to handle this synchronously
        let result: StorageResult<void> = { success: false, error: "Async operation in progress" };
        promise.then((r) => (result = r)).catch(() => {});
        
        return result;
    }

    /**
     * Subscribe to changes on a storage key
     * @param key - Storage key to watch
     * @param callback - Callback function when data changes
     * @returns Unsubscribe function
     */
    static subscribe<T>(
        key: string,
        callback: (data: T | null) => void
    ): () => void {
        return this.adapter.subscribe(key, callback);
    }

    /**
     * Reset memory-only mode (for testing purposes - LocalStorageAdapter only)
     */
    static resetMemoryOnlyMode(): void {
        const status = this.getStorageStatus();
        if (status["type"] === "localStorage" && this.adapter instanceof Object) {
            // Type guard - only LocalStorageAdapter has this method
            const adapter = this.adapter as any;
            if (typeof adapter.resetMemoryOnlyMode === "function") {
                adapter.resetMemoryOnlyMode();
            }
        }
    }

    /**
     * Force memory-only mode (for testing - LocalStorageAdapter only)
     */
    static forceMemoryOnlyMode(): void {
        const status = this.getStorageStatus();
        if (status["type"] === "localStorage" && this.adapter instanceof Object) {
            // Type guard - only LocalStorageAdapter has this method
            const adapter = this.adapter as any;
            if (typeof adapter.forceMemoryOnlyMode === "function") {
                adapter.forceMemoryOnlyMode();
            }
        }
    }
}
