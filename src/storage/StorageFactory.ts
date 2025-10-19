import { LocalStorageAdapter } from "./LocalStorageAdapter";
import type { StorageAdapter } from "./StorageAdapter";
import { SupabaseStorageAdapter } from "./SupabaseStorageAdapter";

/**
 * Storage mode types
 */
export type StorageMode = "local" | "supabase";

/**
 * Supabase configuration
 */
export interface SupabaseConfig {
    url: string;
    anonKey: string;
    roomCode: string;
}

/**
 * Storage factory for creating storage adapters
 */
export class StorageFactory {
    private static instance: StorageAdapter | null = null;
    private static currentMode: StorageMode = "local";

    /**
     * Create a storage adapter
     * @param mode - Storage mode ("local" or "supabase")
     * @param config - Optional Supabase configuration
     * @returns Storage adapter instance
     */
    static createAdapter(
        mode: StorageMode = "local",
        config?: SupabaseConfig
    ): StorageAdapter {
        if (mode === "supabase") {
            if (!config) {
                throw new Error(
                    "Supabase configuration required for supabase mode"
                );
            }
            return new SupabaseStorageAdapter(
                config.url,
                config.anonKey,
                config.roomCode
            );
        }

        return new LocalStorageAdapter();
    }

    /**
     * Get or create the singleton storage adapter instance
     * @param mode - Storage mode
     * @param config - Optional Supabase configuration
     * @returns Storage adapter instance
     */
    static getInstance(
        mode?: StorageMode,
        config?: SupabaseConfig
    ): StorageAdapter {
        // If mode is provided and different from current, recreate instance
        if (mode && mode !== this.currentMode) {
            this.instance = null;
            this.currentMode = mode;
        }

        if (!this.instance) {
            this.instance = this.createAdapter(
                mode || this.currentMode,
                config
            );
        }

        return this.instance;
    }

    /**
     * Reset the singleton instance (for testing)
     */
    static reset(): void {
        this.instance = null;
        this.currentMode = "local";
    }

    /**
     * Get current storage mode
     */
    static getCurrentMode(): StorageMode {
        return this.currentMode;
    }
}
