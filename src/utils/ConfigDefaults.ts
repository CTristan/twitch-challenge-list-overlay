/**
 * Configuration Defaults Utility
 *
 * Provides fallback configuration creation for when the main configuration
 * loading fails. This ensures the application can still function with
 * minimal default settings.
 *
 * @module ConfigDefaults
 */

/**
 * Creates a minimal fallback configuration object
 *
 * This function provides a complete, valid Config object with default values
 * that can be used when the main configuration loading fails. The configuration
 * includes all required properties with sensible defaults.
 *
 * @returns {Config} A complete fallback configuration object
 *
 * @example
 * ```typescript
 * import { createFallbackConfig } from "./utils/ConfigDefaults";
 *
 * try {
 *   configManager = ConfigManager.getInstance(userConfig);
 * } catch (error) {
 *   const fallbackConfig = createFallbackConfig();
 *   configManager = ConfigManager.getInstance(fallbackConfig);
 * }
 * ```
 */
export function createFallbackConfig(): Config {
    return {
        auth: {
            twitch_oauth: "",
            twitch_username: "",
            twitch_channel: "",
        },
        maxChallenges: 10,
        adminTextOnlyMode: false,
        commands: {
            // Admin commands (restricted to moderators and broadcaster)
            clearAll: ["!ch clearlist", "!ch clearall"],
            clearDone: ["!ch cleardone"],

            // Challenge management commands (restricted to moderators and broadcaster)
            addChallenge: ["!ch add"],
            editChallenge: ["!ch edit"],
            finishChallenge: ["!ch done"],
            deleteChallenge: ["!ch delete", "!ch del"],

            // Progress commands
            incrementChallenge: ["!ch +"],
            decrementChallenge: ["!ch -"],
            setProgress: ["!ch set"],
            failChallenge: ["!ch fail"],

            // Information commands
            listChallenges: ["!ch list"],
            showChallenge: ["!ch show"],
            check: ["!ch check"],
            help: ["!ch help"],
        },
        responses: {
            // Admin responses
            clearAll: "All challenges have been cleared",
            clearDone: "All done challenges have been cleared",

            // User responses
            addChallenge: "Challenge(s) {message} added!",
            editChallenge: "Challenge {message} updated!",
            finishChallenge: "Good job on completing challenge(s) {message}!",
            deleteChallenge: "Challenge(s) {message} has been deleted!",
            deleteAll: "All of your challenges have been deleted!",
            check: "Your current challenge(s) are: {message}",
            help: "Try these commands - !ch add, !ch edit, !ch done, !ch delete, !ch check, !ch clearlist, !ch cleardone, !ch help",
            maxChallengesAdded:
                "Maximum number of challenges reached, try deleting old challenges.",
            noChallengeFound:
                "That challenge doesn't seem to exist, try adding one!",
            invalidCommand: "Invalid command: {message}. Try !help",
        },
        // Challenge row styling - single black background with white text
        challengeRowColors: ["#000000"],
        challengeRowTextColors: ["#ffffff"],
        challengeRowColorsOpacity: 1.0,
    };
}

/**
 * Validates that a configuration object has all required properties
 *
 * This function performs basic validation to ensure a configuration object
 * contains all the required properties for the application to function.
 *
 * @param {any} config - The configuration object to validate
 * @returns {boolean} True if the configuration is valid, false otherwise
 *
 * @example
 * ```typescript
 * import { isValidFallbackConfig } from "./utils/ConfigDefaults";
 *
 * const config = createFallbackConfig();
 * if (isValidFallbackConfig(config)) {
 *   // Configuration is valid
 * }
 * ```
 */
export function isValidFallbackConfig(config: any): config is Config {
    if (!config || typeof config !== "object") {
        return false;
    }

    // Check required top-level properties
    const requiredProps = ["auth", "maxChallenges", "commands", "responses"];
    for (const prop of requiredProps) {
        if (!(prop in config)) {
            return false;
        }
    }

    // Check auth structure
    if (!config.auth || typeof config.auth !== "object") {
        return false;
    }
    const requiredAuthProps = [
        "twitch_oauth",
        "twitch_username",
        "twitch_channel",
    ];
    for (const prop of requiredAuthProps) {
        if (!(prop in config.auth)) {
            return false;
        }
    }

    // Check maxChallenges is a number
    if (typeof config.maxChallenges !== "number" || config.maxChallenges <= 0) {
        return false;
    }

    // Check commands structure
    if (!config.commands || typeof config.commands !== "object") {
        return false;
    }

    // Check responses structure
    if (!config.responses || typeof config.responses !== "object") {
        return false;
    }

    return true;
}

/**
 * Gets the default maximum challenges value
 *
 * @returns {number} The default maximum challenges value
 */
export function getDefaultMaxChallenges(): number {
    return 10;
}

/**
 * Gets the default auth configuration
 *
 * @returns {TwitchAuthConfig} The default auth configuration with empty values
 */
export function getDefaultAuthConfig(): TwitchAuthConfig {
    return {
        twitch_oauth: "",
        twitch_username: "",
        twitch_channel: "",
    };
}
