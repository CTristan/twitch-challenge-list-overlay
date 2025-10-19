/**
 * Deployment Configuration Loader
 * 
 * Loads and merges deployment configuration from config.js (if present)
 * with the default application configuration.
 */

import { createFallbackConfig } from "./ConfigDefaults";

/**
 * Deployment configuration interface
 */
export interface DeploymentConfig {
    storage?: {
        mode?: "local" | "supabase";
        supabaseRoomCode?: string;
    };
    maxChallenges?: number;
    auth?: {
        twitch_oauth?: string;
        twitch_username?: string;
        twitch_channel?: string;
    };
    appearance?: {
        challengeRowColors?: string[];
        challengeRowTextColors?: string[];
        challengeRowColorsOpacity?: number;
        overlayBackgroundColor?: string;
        overlayBackgroundOpacity?: number;
    };
}

/**
 * Load deployment configuration from window.OVERLAY_CONFIG
 * This is set by config.js if it exists
 */
export function loadDeploymentConfig(): DeploymentConfig | null {
    if (typeof window !== "undefined" && (window as any).OVERLAY_CONFIG) {
        const config = (window as any).OVERLAY_CONFIG;
        console.log("📦 Deployment configuration loaded:", config);
        return config;
    }
    return null;
}

/**
 * Merge deployment configuration with default configuration
 * @param defaultConfig - Default application configuration
 * @param deploymentConfig - Optional deployment configuration from config.js
 * @returns Merged configuration
 */
export function mergeWithDeploymentConfig(
    defaultConfig: Config,
    deploymentConfig: DeploymentConfig | null
): Config {
    if (!deploymentConfig) {
        return defaultConfig;
    }

    const merged: Config = { ...defaultConfig };

    // Merge storage configuration
    if (deploymentConfig.storage) {
        merged.storage = {
            mode: deploymentConfig.storage.mode || "local",
            supabaseRoomCode: deploymentConfig.storage.supabaseRoomCode || "",
        };
    }

    // Merge maxChallenges
    if (typeof deploymentConfig.maxChallenges === "number") {
        merged.maxChallenges = deploymentConfig.maxChallenges;
    }

    // Merge auth configuration
    if (deploymentConfig.auth) {
        merged.auth = {
            twitch_oauth: deploymentConfig.auth.twitch_oauth || merged.auth.twitch_oauth,
            twitch_username: deploymentConfig.auth.twitch_username || merged.auth.twitch_username,
            twitch_channel: deploymentConfig.auth.twitch_channel || merged.auth.twitch_channel,
        };
    }

    // Merge appearance configuration
    if (deploymentConfig.appearance) {
        if (deploymentConfig.appearance.challengeRowColors) {
            merged.challengeRowColors = deploymentConfig.appearance.challengeRowColors;
        }
        if (deploymentConfig.appearance.challengeRowTextColors) {
            merged.challengeRowTextColors = deploymentConfig.appearance.challengeRowTextColors;
        }
        if (typeof deploymentConfig.appearance.challengeRowColorsOpacity === "number") {
            merged.challengeRowColorsOpacity = deploymentConfig.appearance.challengeRowColorsOpacity;
        }
        if (deploymentConfig.appearance.overlayBackgroundColor) {
            merged.overlayBackgroundColor = deploymentConfig.appearance.overlayBackgroundColor;
        }
        if (typeof deploymentConfig.appearance.overlayBackgroundOpacity === "number") {
            merged.overlayBackgroundOpacity = deploymentConfig.appearance.overlayBackgroundOpacity;
        }
    }

    console.log("✅ Configuration merged with deployment config");
    return merged;
}

/**
 * Create configuration with deployment config merged in
 * This should be used instead of createFallbackConfig() when initializing
 * @returns Configuration with deployment settings applied
 */
export function createConfigWithDeploymentSettings(): Config {
    const defaultConfig = createFallbackConfig();
    const deploymentConfig = loadDeploymentConfig();
    return mergeWithDeploymentConfig(defaultConfig, deploymentConfig);
}
