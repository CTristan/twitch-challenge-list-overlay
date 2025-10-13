import { vi } from "vitest";
import ConfigManager from "../src/classes/ConfigManager";

// ========================================
// Test Configuration Constants
// ========================================

/**
 * Standard test authentication configuration
 * These values are used consistently across all tests
 */
const TEST_AUTH_CONFIG = {
    twitch_oauth: "test_oauth_token",
    twitch_username: "test_user",
    twitch_channel: "test_channel",
} as const;

/**
 * Test configuration limits and behavior settings
 */
const TEST_LIMITS = {
    maxChallenges: 10,
} as const;

/**
 * Standard command prefix used in all test commands
 */
const TEST_COMMAND_PREFIX = "!ch" as const;

/**
 * Common placeholder values used in test response messages
 */
const TEST_RESPONSE_PLACEHOLDERS = {
    message: "{message}",
    user: "{user}",
} as const;

// ========================================
// Configuration Builder Functions
// ========================================

/**
 * Creates a standardized test authentication configuration
 * @returns Test authentication configuration object
 */
const createTestAuthConfig = (): Config["auth"] => ({
    twitch_oauth: TEST_AUTH_CONFIG.twitch_oauth,
    twitch_username: TEST_AUTH_CONFIG.twitch_username,
    twitch_channel: TEST_AUTH_CONFIG.twitch_channel,
});

/**
 * Creates a standardized test commands configuration
 * Uses the unified "!ch" prefix system consistent with the production configuration
 * @returns Test commands configuration object
 */
const createTestCommandsConfig = (): Config["commands"] => ({
    // Admin commands
    clearAll: [
        `${TEST_COMMAND_PREFIX} clearlist`,
        `${TEST_COMMAND_PREFIX} clearall`,
    ],
    clearDone: [`${TEST_COMMAND_PREFIX} cleardone`],

    // Challenge management commands
    addChallenge: [`${TEST_COMMAND_PREFIX} add`],
    editChallenge: [`${TEST_COMMAND_PREFIX} edit`],
    finishChallenge: [`${TEST_COMMAND_PREFIX} done`],
    deleteChallenge: [
        `${TEST_COMMAND_PREFIX} delete`,
        `${TEST_COMMAND_PREFIX} del`,
    ],
    help: [`${TEST_COMMAND_PREFIX} help`],

    // Progress commands
    incrementChallenge: [`${TEST_COMMAND_PREFIX} +`],
    decrementChallenge: [`${TEST_COMMAND_PREFIX} -`],
    setProgress: [`${TEST_COMMAND_PREFIX} set`],
    failChallenge: [`${TEST_COMMAND_PREFIX} fail`],

    // Information commands
    listChallenges: [`${TEST_COMMAND_PREFIX} list`],
    showChallenge: [`${TEST_COMMAND_PREFIX} show`],
    check: [`${TEST_COMMAND_PREFIX} check`],
});

/**
 * Creates a standardized test responses configuration
 * @returns Test responses configuration object
 */
const createTestResponsesConfig = (): Config["responses"] => ({
    // Admin responses
    clearAll: "All challenges have been cleared",
    clearDone: "All done challenges have been cleared",

    // User responses
    addChallenge: `Challenge(s) ${TEST_RESPONSE_PLACEHOLDERS.message} added!`,
    editChallenge: `Challenge ${TEST_RESPONSE_PLACEHOLDERS.message} updated!`,
    finishChallenge: `Good job on completing challenge(s) ${TEST_RESPONSE_PLACEHOLDERS.message}!`,
    deleteChallenge: `Challenge(s) ${TEST_RESPONSE_PLACEHOLDERS.message} has been deleted!`,
    deleteAll: "All of your challenges have been deleted!",
    check: `Your current challenge(s) are: ${TEST_RESPONSE_PLACEHOLDERS.message}`,
    help: "Try these commands - !challenge !edit !done !delete",
    maxChallengesAdded:
        "Maximum number of challenges reached, try deleting old challenges.",
    noChallengeFound: "That challenge doesn't seem to exist, try adding one!",
    invalidCommand: `Invalid command: ${TEST_RESPONSE_PLACEHOLDERS.message}. Try !help`,
});

/**
 * Creates a complete test configuration object
 * Combines all configuration builders into a standardized test configuration
 * that mirrors the production configuration structure
 * @returns Complete test configuration object
 */
const createTestConfig = (): Config => ({
    auth: createTestAuthConfig(),
    maxChallenges: TEST_LIMITS.maxChallenges,
    commands: createTestCommandsConfig(),
    responses: createTestResponsesConfig(),
});

// ========================================
// Global Test Setup
// ========================================

// Mock WebFont for all tests
Object.defineProperty(window, "WebFont", {
    value: {
        load: vi.fn(),
    },
    writable: true,
});

/**
 * Main test configuration object used across all tests
 * Generated using the configuration builders to ensure consistency
 * and maintainability
 */
const testConfig: Config = createTestConfig();

// Initialize ConfigManager with test configuration for all tests
ConfigManager.getInstance(testConfig);

// ========================================
// Exported Test Utilities
// ========================================

/**
 * Export test configuration builders for use in individual test files
 * These can be used to create custom test configurations when needed
 */
export {
    createTestAuthConfig,
    createTestCommandsConfig,
    createTestConfig,
    createTestResponsesConfig,
    TEST_AUTH_CONFIG,
    TEST_COMMAND_PREFIX,
    TEST_LIMITS,
    TEST_RESPONSE_PLACEHOLDERS
};

