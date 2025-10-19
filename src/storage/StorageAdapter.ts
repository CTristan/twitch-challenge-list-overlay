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
 * Storage adapter interface for abstracting different storage backends
 * Implementations: LocalStorageAdapter, SupabaseStorageAdapter
 */
export interface StorageAdapter {
    /**
     * Save data to storage
     * @param key - Storage key
     * @param data - Data to save
     * @param options - Storage options
     * @returns Storage result
     */
    save<T>(
        key: string,
        data: T,
        options?: StorageOptions
    ): Promise<StorageResult<T>>;

    /**
     * Load data from storage
     * @param key - Storage key
     * @param defaultValue - Default value if not found
     * @param validator - Optional validation function
     * @returns Storage result
     */
    load<T>(
        key: string,
        defaultValue?: T,
        validator?: (data: any) => data is T
    ): Promise<StorageResult<T>>;

    /**
     * Remove data from storage
     * @param key - Storage key
     * @returns Storage result
     */
    remove(key: string): Promise<StorageResult<void>>;

    /**
     * Check if storage is available
     * @returns Availability status
     */
    isAvailable(): Promise<boolean>;

    /**
     * Clear all storage (with optional key filtering)
     * @param keysToKeep - Optional array of keys to preserve
     * @returns Storage result
     */
    clearAll(keysToKeep?: string[]): Promise<StorageResult<void>>;

    /**
     * Subscribe to changes on a specific key
     * @param key - Storage key to watch
     * @param callback - Callback function when data changes
     * @returns Unsubscribe function
     */
    subscribe<T>(
        key: string,
        callback: (data: T | null) => void
    ): () => void;

    /**
     * Get storage status information
     * @returns Status information
     */
    getStatus(): Promise<{
        available: boolean;
        type: string;
        [key: string]: any;
    }>;
}
