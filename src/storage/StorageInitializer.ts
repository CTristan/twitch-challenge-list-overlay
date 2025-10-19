import ConfigManager from "../classes/ConfigManager";
import { NETWORK_URLS, STORAGE_CONFIG } from "../types/ConfigConstants";
import { StorageManager } from "../utils/StorageManager";
import type { StorageAdapter } from "./StorageAdapter";
import type { StorageMode } from "./StorageFactory";
import { StorageFactory } from "./StorageFactory";

/**
 * Initializes storage adapter based on configuration
 */
export class StorageInitializer {
    /**
     * Initialize storage adapter from configuration
     * @param configManager - Configuration manager instance
     * @returns Initialized storage adapter
     */
    static initializeFromConfig(
        configManager: ConfigManager
    ): StorageAdapter {
        const mode = configManager.get(STORAGE_CONFIG.MODE) as StorageMode || "local";
        
        if (mode === "supabase") {
            const roomCode = configManager.get(STORAGE_CONFIG.SUPABASE_ROOM_CODE) as string;
            
            if (!roomCode) {
                console.warn("Supabase mode selected but no room code provided, falling back to local storage");
                return StorageFactory.createAdapter("local");
            }
            
            const adapter = StorageFactory.createAdapter("supabase", {
                url: NETWORK_URLS.SUPABASE_URL,
                anonKey: NETWORK_URLS.SUPABASE_ANON_KEY,
                roomCode,
            });
            
            StorageManager.setAdapter(adapter);
            return adapter;
        }
        
        const adapter = StorageFactory.createAdapter("local");
        StorageManager.setAdapter(adapter);
        return adapter;
    }
    
    /**
     * Switch storage mode
     * @param mode - New storage mode
     * @param roomCode - Room code (required for Supabase)
     * @param configManager - Configuration manager instance
     * @returns New storage adapter
     */
    static async switchMode(
        mode: StorageMode,
        roomCode: string | undefined,
        configManager: ConfigManager
    ): Promise<StorageAdapter> {
        // Save mode to configuration
        configManager.set(STORAGE_CONFIG.MODE, mode);
        
        if (mode === "supabase") {
            if (!roomCode) {
                throw new Error("Room code required for Supabase mode");
            }
            configManager.set(STORAGE_CONFIG.SUPABASE_ROOM_CODE, roomCode);
        }
        
        // Initialize new adapter
        return this.initializeFromConfig(configManager);
    }
    
    /**
     * Get current storage mode from configuration
     * @param configManager - Configuration manager instance
     * @returns Current storage mode
     */
    static getCurrentMode(configManager: ConfigManager): StorageMode {
        return (configManager.get(STORAGE_CONFIG.MODE) as StorageMode) || "local";
    }
    
    /**
     * Get current room code from configuration
     * @param configManager - Configuration manager instance
     * @returns Current room code or empty string
     */
    static getRoomCode(configManager: ConfigManager): string {
        return (configManager.get(STORAGE_CONFIG.SUPABASE_ROOM_CODE) as string) || "";
    }
}
