import { STORAGE_KEYS } from "../types/StorageConstants";
import { ErrorHandler } from "../utils/errorHandler";
import { StorageManager } from "../utils/StorageManager";
import { ValidationUtils } from "../utils/ValidationUtils";

/**
 * @class ConfigManager
 * Singleton class for managing application configuration with localStorage persistence
 * and fallback to default configuration values.
 */
export default class ConfigManager {
    private static instance: ConfigManager | null = null;
    private config: Config;
    private defaultConfig: Config;
    private readonly storageKey = STORAGE_KEYS.CONFIG;
    private readonly configVersion = "1.0.0";
    private errorHandler: ErrorHandler;
    private memoryOnlyMode = false;

    /**
     * Private constructor to enforce singleton pattern
     * @param defaultConfig - Default configuration to use as fallback
     */
    private constructor(defaultConfig: Config) {
        this.errorHandler = ErrorHandler.getInstance();
        this.defaultConfig = this.deepClone(defaultConfig);
        this.config = this.loadConfiguration();
    }

    /**
     * Get the singleton instance of ConfigManager
     * @param defaultConfig - Default configuration (required on first call)
     * @returns ConfigManager instance
     */
    public static getInstance(defaultConfig?: Config): ConfigManager {
        if (!ConfigManager.instance) {
            if (!defaultConfig) {
                throw new Error(
                    "ConfigManager requires default configuration on first initialization"
                );
            }
            ConfigManager.instance = new ConfigManager(defaultConfig);
        }
        return ConfigManager.instance;
    }

    /**
     * Load configuration from localStorage with fallback to defaults
     * If no configuration exists in localStorage, saves defaults immediately
     * @returns Complete configuration object
     */
    private loadConfiguration(): Config {
        const result = StorageManager.load(
            this.storageKey,
            this.defaultConfig,
            (data): data is Config => this.isValidConfiguration(data)
        );

        if (result.success && result.data) {
            // Merge with defaults to ensure all properties exist
            return this.deepMerge(this.defaultConfig, result.data);
        }

        // No valid configuration found in localStorage - use defaults and save them
        const defaultConfigClone = this.deepClone(this.defaultConfig);

        // Save defaults to localStorage for first-run initialization
        const saveResult = StorageManager.save(
            this.storageKey,
            defaultConfigClone,
            {
                version: this.configVersion,
                timestamp: true,
                fallbackToMemory: true,
                retryOnQuotaExceeded: true,
            }
        );

        if (saveResult.success && saveResult.fallbackUsed === "memory-only") {
            this.memoryOnlyMode = true;
        }

        return defaultConfigClone;
    }

    /**
     * Save current configuration to localStorage
     * @returns Success status
     */
    private saveConfiguration(): boolean {
        const result = StorageManager.save(this.storageKey, this.config, {
            version: this.configVersion,
            timestamp: true,
            fallbackToMemory: true,
            retryOnQuotaExceeded: true,
        });

        if (result.success) {
            if (result.fallbackUsed === "memory-only") {
                this.memoryOnlyMode = true;
            }
            return true;
        }

        // Use ErrorHandler for consistent error handling
        if (result.error) {
            this.errorHandler.handleStorageError(
                new Error(result.error),
                "save"
            );
        }
        return false;
    }

    /**
     * Get a configuration value by path
     * @param path - Dot-notation path to the configuration value
     * @returns Configuration value
     */
    public get(path: string): any {
        return this.getNestedValue(this.config, path);
    }

    /**
     * Set a configuration value by path and persist to localStorage
     * @param path - Dot-notation path to the configuration value
     * @param value - Value to set
     * @returns Success status
     */
    public set(path: string, value: any): boolean {
        try {
            this.setNestedValue(this.config, path, value);
            return this.saveConfiguration();
        } catch (error) {
            // Use ErrorHandler for consistent error handling
            this.errorHandler.handleStorageError(
                error instanceof Error ? error : new Error(String(error)),
                "set"
            );
            return false;
        }
    }

    /**
     * Get the complete configuration object
     * @returns Complete configuration
     */
    public getAll(): Config {
        return this.deepClone(this.config);
    }

    /**
     * Replace the entire configuration and persist
     * @param newConfig - New configuration object
     * @returns Success status
     */
    public setAll(newConfig: Config): boolean {
        if (!this.isValidConfiguration(newConfig)) {
            // Use ErrorHandler for validation errors
            this.errorHandler.handleConfigValidationError(newConfig, [
                "Invalid configuration structure provided to setAll",
            ]);
            return false;
        }

        this.config = this.deepClone(newConfig);
        return this.saveConfiguration();
    }

    /**
     * Reload configuration from persistent storage and replace in-memory state.
     * This is used when other browser contexts update the configuration.
     * @returns Fresh configuration snapshot
     */
    public reloadFromStorage(): Config {
        const reloaded = this.loadConfiguration();
        this.config = this.deepClone(reloaded);
        return this.deepClone(this.config);
    }

    /**
     * Reset configuration to defaults
     * @returns Success status
     */
    public reset(): boolean {
        this.config = this.deepClone(this.defaultConfig);
        return this.saveConfiguration();
    }

    /**
     * Backup configuration for external use
     * @returns Exportable configuration object
     */
    public export(): Config {
        return this.deepClone(this.config);
    }

    /**
     * Restore configuration from external source
     * @param importedConfig - Configuration to import
     * @returns Success status
     */
    public import(importedConfig: Config): boolean {
        if (!this.isValidConfiguration(importedConfig)) {
            // Use ErrorHandler for validation errors
            this.errorHandler.handleConfigValidationError(importedConfig, [
                "Invalid configuration structure provided for import",
            ]);
            return false;
        }

        // Merge imported config with defaults to ensure completeness
        this.config = this.deepMerge(this.defaultConfig, importedConfig);
        return this.saveConfiguration();
    }

    /**
     * Validate configuration object structure
     * @param config - Configuration to validate
     * @returns Validation result
     */
    private isValidConfiguration(config: any): config is Config {
        const validation = ValidationUtils.validateConfiguration(config);
        if (!validation.isValid) {
            // Use ErrorHandler for validation warnings
            this.errorHandler.handleConfigValidationError(
                config,
                validation.errors
            );
        }
        return validation.isValid;
    }

    /**
     * Get nested value from object using dot notation
     * @param obj - Object to search
     * @param path - Dot-notation path
     * @returns Value at path
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    }

    /**
     * Set nested value in object using dot notation
     * @param obj - Object to modify
     * @param path - Dot-notation path
     * @param value - Value to set
     */
    private setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split(".");
        const lastKey = keys.pop()!;
        const target = keys.reduce((current, key) => {
            if (!(key in current)) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    /**
     * Deep clone an object
     * @param obj - Object to clone
     * @returns Cloned object
     */
    private deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
        if (obj instanceof Array)
            return obj.map((item) => this.deepClone(item)) as unknown as T;

        const cloned = {} as T;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    /**
     * Deep merge two objects
     * @param target - Target object
     * @param source - Source object
     * @returns Merged object
     */
    private deepMerge<T>(target: T, source: Partial<T>): T {
        const result = this.deepClone(target);

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                const sourceValue = source[key];
                const targetValue = (result as any)[key];

                if (
                    sourceValue &&
                    typeof sourceValue === "object" &&
                    !Array.isArray(sourceValue) &&
                    targetValue &&
                    typeof targetValue === "object" &&
                    !Array.isArray(targetValue)
                ) {
                    (result as any)[key] = this.deepMerge(
                        targetValue,
                        sourceValue
                    );
                } else {
                    (result as any)[key] = this.deepClone(sourceValue);
                }
            }
        }

        return result;
    }

    /**
     * Clear all stored configuration data
     * @returns Success status
     */
    public clearStorage(): boolean {
        const result = StorageManager.remove(this.storageKey);
        if (result.success) {
            this.config = this.deepClone(this.defaultConfig);
            return true;
        }

        // Use ErrorHandler for consistent error handling
        if (result.error) {
            this.errorHandler.handleStorageError(
                new Error(result.error),
                "remove"
            );
        }
        return false;
    }

    /**
     * Check if localStorage is available
     * @returns Availability status
     */
    public isStorageAvailable(): boolean {
        return StorageManager.isStorageAvailable();
    }

    /**
     * Get system status information
     * @returns Status information
     */
    public getSystemStatus(): {
        memoryOnlyMode: boolean;
        storageAvailable: boolean;
        configVersion: string;
        lastSaved: number | null;
    } {
        const storageStatus = StorageManager.getStorageStatus();
        let lastSaved = null;

        // Try to get timestamp from stored config
        const result = StorageManager.load(this.storageKey);
        if (
            result.success &&
            result.data &&
            typeof result.data === "object" &&
            "_timestamp" in result.data
        ) {
            lastSaved = (result.data as any)._timestamp || null;
        }

        return {
            memoryOnlyMode: this.memoryOnlyMode || storageStatus.memoryOnlyMode,
            storageAvailable: storageStatus.available,
            configVersion: this.configVersion,
            lastSaved,
        };
    }
}
