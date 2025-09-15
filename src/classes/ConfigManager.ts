import { ErrorHandler } from "../utils/errorHandler";

/**
 * @class ConfigManager
 * Singleton class for managing application configuration with localStorage persistence
 * and fallback to default configuration values.
 */
export default class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: Config;
  private defaultConfig: Config;
  private readonly storageKey = "overlay_config";
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
   * @returns Complete configuration object
   */
  private loadConfiguration(): Config {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedConfig = JSON.parse(stored);

        // Validate stored configuration
        if (this.isValidConfiguration(parsedConfig)) {
          // Merge with defaults to ensure all properties exist
          return this.deepMerge(this.defaultConfig, parsedConfig);
        } else {
          console.warn("Invalid stored configuration, using defaults");
        }
      }
    } catch (error) {
      console.error("Error loading configuration from localStorage:", error);
    }

    // Return defaults if localStorage fails or is invalid
    return this.deepClone(this.defaultConfig);
  }

  /**
   * Save current configuration to localStorage
   * @returns Success status
   */
  private saveConfiguration(): boolean {
    if (this.memoryOnlyMode) {
      console.warn(
        "Running in memory-only mode, configuration will not persist"
      );
      return true;
    }

    const configToStore = {
      ...this.config,
      _version: this.configVersion,
      _timestamp: Date.now(),
    };

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(configToStore, null, 2)
      );
      return true;
    } catch (error) {
      const fallback = this.errorHandler.handleStorageError(
        error as Error,
        "setItem"
      );

      if (fallback.canFallback && fallback.fallbackStrategy === "memory-only") {
        this.memoryOnlyMode = true;
        console.warn(fallback.message);
        return true;
      }

      if (
        fallback.canFallback &&
        fallback.fallbackStrategy === "cleanup-and-retry"
      ) {
        try {
          // Try to clean up old data and retry
          this.cleanupOldData();
          localStorage.setItem(
            this.storageKey,
            JSON.stringify(configToStore, null, 2)
          );
          return true;
        } catch (retryError) {
          this.memoryOnlyMode = true;
          console.warn("Cleanup failed, switching to memory-only mode");
          return true;
        }
      }

      console.error("Failed to save configuration:", fallback.message);
      return false;
    }
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
      console.error("Error setting configuration value:", error);
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
      console.error("Invalid configuration provided to setAll");
      return false;
    }

    this.config = this.deepClone(newConfig);
    return this.saveConfiguration();
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
      console.error("Invalid configuration provided for import");
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
    if (!config || typeof config !== "object") return false;

    // Check required top-level properties
    const requiredProps = ["auth", "maxChallenges", "commands", "responses"];
    for (const prop of requiredProps) {
      if (!(prop in config)) return false;
    }

    // Validate auth object
    if (!config.auth || typeof config.auth !== "object") return false;
    const authProps = ["twitch_oauth", "twitch_username", "twitch_channel"];
    for (const prop of authProps) {
      if (typeof config.auth[prop] !== "string") return false;
    }

    // Validate maxChallenges
    if (typeof config.maxChallenges !== "number" || config.maxChallenges < 1)
      return false;

    return true;
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
          (result as any)[key] = this.deepMerge(targetValue, sourceValue);
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
    try {
      localStorage.removeItem(this.storageKey);
      this.config = this.deepClone(this.defaultConfig);
      return true;
    } catch (error) {
      console.error("Error clearing configuration storage:", error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   * @returns Availability status
   */
  public isStorageAvailable(): boolean {
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
   * Clean up old data to free storage space
   * @returns {void}
   */
  private cleanupOldData(): void {
    try {
      // Remove any old configuration versions or temporary data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("overlay_config_old_") ||
            key.startsWith("temp_") ||
            key.includes("backup_"))
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn("Failed to cleanup old data:", error);
    }
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
    let lastSaved = null;
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        lastSaved = parsed._timestamp || null;
      }
    } catch {
      // Ignore errors when getting status
    }

    return {
      memoryOnlyMode: this.memoryOnlyMode,
      storageAvailable: this.isStorageAvailable(),
      configVersion: this.configVersion,
      lastSaved,
    };
  }
}
