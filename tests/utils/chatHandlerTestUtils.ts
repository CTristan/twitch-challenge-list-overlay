import { expect, vi } from "vitest";
import App from "../../src/app";
import { type CommandTypeValue } from "../../src/types/CommandTypes";
import IDManager from "../../src/utils/IDManager";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Test user interface for chat command testing
 */
export interface TestUser {
    username: string;
    flags: {
        broadcaster: boolean;
        mod: boolean;
    };
    extra: {
        userColor: string;
    };
}

/**
 * Chat response interface for command execution results
 */
export interface ChatResponse {
    error: boolean;
    message: string;
}

/**
 * Test case interface for command testing scenarios
 */
export interface CommandTestCase {
    description: string;
    user: TestUser;
    command: CommandTypeValue;
    parameters: string;
    expectedError: boolean;
    expectedMessageContains?: string[];
    expectedMessageEquals?: string;
}

/**
 * User type enumeration for factory function
 */
export enum UserType {
    ADMIN = "admin",
    MODERATOR = "moderator",
    REGULAR = "regular",
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default test challenges for consistent test setup
 */
export const DEFAULT_TEST_CHALLENGES: string[] = [
    "challenge1",
    "challenge2",
    "challenge3",
    "admin challenge1",
    "admin challenge2",
];

/**
 * Permission error message constant
 */
export const PERMISSION_ERROR_MESSAGE =
    "Only moderators and the broadcaster can manage challenges";

/**
 * Bot response prefix (empty for this application)
 */
export const BOT_RESPONSE_PREFIX = "";

// ============================================================================
// USER FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a test user with specified permissions and properties
 * @param userType - Type of user to create (admin, moderator, or regular)
 * @param username - Optional custom username (defaults based on user type)
 * @param userColor - Optional custom user color (defaults based on user type)
 * @returns TestUser object with appropriate permissions
 */
export function createTestUser(
    userType: UserType,
    username?: string,
    userColor?: string
): TestUser {
    const userConfigs = {
        [UserType.ADMIN]: {
            defaultUsername: "bobTheAdmin",
            defaultColor: "#FF0000",
            flags: { broadcaster: true, mod: false },
        },
        [UserType.MODERATOR]: {
            defaultUsername: "modUser",
            defaultColor: "#00FF00",
            flags: { broadcaster: false, mod: true },
        },
        [UserType.REGULAR]: {
            defaultUsername: "joeTheUser",
            defaultColor: "#00FFFF",
            flags: { broadcaster: false, mod: false },
        },
    };

    const config = userConfigs[userType];

    return {
        username: username ?? config.defaultUsername,
        flags: config.flags,
        extra: {
            userColor: userColor ?? config.defaultColor,
        },
    };
}

/**
 * Creates an admin user (broadcaster permissions)
 * @param username - Optional custom username
 * @param userColor - Optional custom user color
 * @returns TestUser with broadcaster permissions
 */
export const createAdminUser = (
    username?: string,
    userColor?: string
): TestUser => createTestUser(UserType.ADMIN, username, userColor);

/**
 * Creates a moderator user
 * @param username - Optional custom username
 * @param userColor - Optional custom user color
 * @returns TestUser with moderator permissions
 */
export const createModUser = (
    username?: string,
    userColor?: string
): TestUser => createTestUser(UserType.MODERATOR, username, userColor);

/**
 * Creates a regular chat user (no special permissions)
 * @param username - Optional custom username
 * @param userColor - Optional custom user color
 * @returns TestUser with no special permissions
 */
export const createChatUser = (
    username?: string,
    userColor?: string
): TestUser => createTestUser(UserType.REGULAR, username, userColor);

// ============================================================================
// MOCK SETUP FUNCTIONS
// ============================================================================

/**
 * Creates a mock App instance for testing with all DOM methods mocked
 * @param storeName - Optional storage name for the app instance
 * @returns Mocked App instance ready for testing
 */
export const createMockApp = (storeName: string = "TestStore"): App => {
    // Clear localStorage to avoid conflicts with existing data
    localStorage.clear();

    const app = new App(storeName);

    // Set up all the mocks for DOM manipulation methods
    app.renderCustomText = vi.fn();
    app.clearListFromDOM = vi.fn();
    app.addChallengeToDOM = vi.fn();
    app.editChallengeFromDOM = vi.fn();
    app.completeChallengeFromDOM = vi.fn();
    app.deleteChallengeFromDOM = vi.fn();

    return app;
};

/**
 * Resets IDManager singleton instance for test isolation
 * This ensures each test gets a fresh IDManager with consistent IDs
 */
export const resetIDManager = (): void => {
    // Reset singleton instance (using type assertion as this is test-only code)
    (IDManager as any).instance = null;
    // Get fresh instance and reset its state
    IDManager.getInstance().reset();
};

// ============================================================================
// TEST SETUP UTILITIES
// ============================================================================

/**
 * Sets up a standard test environment with default challenges
 * @param app - App instance to set up
 */
export const setupTestEnvironment = (app: App): void => {
    const challengeList = app.challengeList;

    // Clear challenges first
    challengeList.clearChallengeList();

    // Reset IDManager singleton to ensure consistent IDs across tests
    resetIDManager();

    // Add challenges after IDManager reset so they get fresh mappings
    challengeList.addChallenges(DEFAULT_TEST_CHALLENGES);
    challengeList.completeChallenges(1); // Complete challenge2
};

// ============================================================================
// COMMAND EXECUTION HELPERS
// ============================================================================

/**
 * Executes a chat command through the app's chatHandler
 * @param app - App instance to execute command on
 * @param user - Test user executing the command
 * @param command - Command string (e.g., "ch" for the unified command prefix)
 * @param parameters - Command parameters string
 * @returns Chat response from the command execution
 */
export const executeCommand = (
    app: App,
    user: TestUser,
    command: string,
    parameters: string
): ChatResponse => {
    return app.chatHandler(
        user.username,
        command,
        parameters,
        user.flags,
        user.extra
    );
};

/**
 * Executes a challenge command using the unified "ch" prefix
 * @param app - App instance to execute command on
 * @param user - Test user executing the command
 * @param commandType - Command type from CommandType constants
 * @param parameters - Command parameters string
 * @returns Chat response from the command execution
 */
export const executeChallengeCommand = (
    app: App,
    user: TestUser,
    commandType: CommandTypeValue,
    parameters: string = ""
): ChatResponse => {
    const fullParameters = parameters
        ? `${commandType} ${parameters}`
        : commandType;
    return executeCommand(app, user, "ch", fullParameters);
};

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Asserts that a command response indicates success
 * @param response - Chat response to check
 * @param expectedMessageContains - Optional array of strings that should be in the message
 */
export const expectSuccessResponse = (
    response: ChatResponse,
    expectedMessageContains?: string[]
): void => {
    expect(response.error).toBe(false);
    if (expectedMessageContains) {
        expectedMessageContains.forEach((text) => {
            expect(response.message).toContain(text);
        });
    }
};

/**
 * Asserts that a command response indicates an error
 * @param response - Chat response to check
 * @param expectedMessage - Optional exact error message to match
 */
export const expectErrorResponse = (
    response: ChatResponse,
    expectedMessage?: string
): void => {
    expect(response.error).toBe(true);
    if (expectedMessage) {
        expect(response.message).toBe(BOT_RESPONSE_PREFIX + expectedMessage);
    }
};

/**
 * Asserts that a command response indicates a permission error
 * @param response - Chat response to check
 */
export const expectPermissionError = (response: ChatResponse): void => {
    expectErrorResponse(response, PERMISSION_ERROR_MESSAGE);
};

/**
 * Asserts that a command response indicates an invalid command error
 * @param response - Chat response to check
 */
export const expectInvalidCommandError = (response: ChatResponse): void => {
    expect(response.error).toBe(true);
    expect(response.message).toContain("Invalid command: command not found");
    expect(response.message).toContain("Try !help");
};

// ============================================================================
// TEST CASE EXECUTION HELPERS
// ============================================================================

/**
 * Executes a command test case and validates the response
 * @param app - App instance to execute command on
 * @param testCase - Test case configuration
 */
export const runCommandTestCase = (
    app: App,
    testCase: CommandTestCase
): void => {
    const response = executeChallengeCommand(
        app,
        testCase.user,
        testCase.command,
        testCase.parameters
    );

    if (testCase.expectedError) {
        expect(response.error).toBe(true);
        if (testCase.expectedMessageEquals) {
            expect(response.message).toBe(
                BOT_RESPONSE_PREFIX + testCase.expectedMessageEquals
            );
        }
        if (testCase.expectedMessageContains) {
            testCase.expectedMessageContains.forEach((text) => {
                expect(response.message).toContain(text);
            });
        }
    } else {
        expectSuccessResponse(response, testCase.expectedMessageContains);
    }
};

/**
 * Tests that a command works for moderators but fails for regular users
 * @param app - App instance to test on
 * @param commandType - Command type to test
 * @param parameters - Command parameters
 * @param modUser - Moderator user for testing
 * @param chatUser - Regular user for testing
 * @param expectedSuccessContains - Optional strings that should be in success message
 */
export const testPermissionCommand = (
    app: App,
    commandType: CommandTypeValue,
    parameters: string,
    modUser: TestUser,
    chatUser: TestUser,
    expectedSuccessContains?: string[]
): void => {
    // Test that moderator can execute command
    const modResponse = executeChallengeCommand(
        app,
        modUser,
        commandType,
        parameters
    );
    expectSuccessResponse(modResponse, expectedSuccessContains);

    // Test that regular user cannot execute command
    const userResponse = executeChallengeCommand(
        app,
        chatUser,
        commandType,
        parameters
    );
    expectPermissionError(userResponse);
};

/**
 * Adds challenges up to the specified limit for testing
 * @param app - App instance to add challenges to
 * @param user - User to execute the add commands
 * @param startIndex - Starting index for challenge names
 * @param maxChallenges - Maximum number of challenges to add
 */
export const addChallengesUpToLimit = (
    app: App,
    user: TestUser,
    startIndex: number = 4,
    maxChallenges: number = 10
): void => {
    for (let i = startIndex; i <= maxChallenges; i++) {
        executeChallengeCommand(
            app,
            user,
            "add" as CommandTypeValue,
            `newChallenge${i}`
        );
    }
};

// ============================================================================
// ENHANCED TEST HELPERS FOR REFACTORED TESTS
// ============================================================================

/**
 * Test constants for consistent expected messages and values
 */
export const TEST_CONSTANTS = {
    EXPECTED_CHALLENGE_COUNT: {
        INITIAL: 5,
        AFTER_CLEAR_DONE: 4,
        AFTER_CLEAR_ALL: 0,
        MAX_LIMIT: 10,
    },
    EXPECTED_MESSAGES: {
        CHALLENGE_ADDED: "added!",
        CHALLENGE_UPDATED: "Updated",
        CHALLENGE_COMPLETED: "Completed",
        CHALLENGE_DELETED: "deleted",
        ALL_CLEARED: "All challenges have been cleared",
        DONE_CLEARED: "All done challenges have been cleared",
        MAX_REACHED: "Maximum number of challenges reached",
        NO_CHALLENGES: "No challenges found",
        HELP_AVAILABLE: "Available commands:",
        CURRENT_CHALLENGES: "Your current challenge(s) are:",
    },
    TEST_CHALLENGE_IDS: {
        FIRST: "1",
        SECOND: "2",
        THIRD: "3",
        MULTIPLE: "1, 3",
    },
    TEST_CHALLENGE_NAMES: {
        NEW: "newChallenge",
        NEW_MULTIPLE: "newChallenge, newChallenge2",
        EDITED: "editedChallenge",
        LIMIT_TEST: "newChallenge11",
    },
} as const;

/**
 * Tests that a command works for authorized users but fails for regular users
 * @param app - App instance to test on
 * @param commandType - Command type to test
 * @param parameters - Command parameters
 * @param authorizedUser - User with permissions (admin/mod)
 * @param regularUser - Regular user without permissions
 * @param expectedSuccessContains - Strings that should be in success message
 */
export const testCommandPermissions = (
    app: App,
    commandType: CommandTypeValue,
    parameters: string,
    authorizedUser: TestUser,
    regularUser: TestUser,
    expectedSuccessContains?: string[]
): void => {
    // Test that authorized user can execute command
    const authorizedResponse = executeChallengeCommand(
        app,
        authorizedUser,
        commandType,
        parameters
    );
    expectSuccessResponse(authorizedResponse, expectedSuccessContains);

    // Test that regular user cannot execute command
    const regularResponse = executeChallengeCommand(
        app,
        regularUser,
        commandType,
        parameters
    );
    expectPermissionError(regularResponse);
};

/**
 * Asserts that the challenge list has the expected number of challenges
 * @param app - App instance to check
 * @param expectedCount - Expected number of challenges
 */
export const expectChallengeCount = (app: App, expectedCount: number): void => {
    expect(app.challengeList.challenges.length).toBe(expectedCount);
};

/**
 * Tests a command that accepts multiple target IDs
 * @param app - App instance to test on
 * @param user - User executing the command
 * @param commandType - Command type to test
 * @param targets - Target IDs (e.g., "1, 3")
 * @param expectedMessageContains - Strings that should be in the response
 */
export const testMultipleTargetCommand = (
    app: App,
    user: TestUser,
    commandType: CommandTypeValue,
    targets: string,
    expectedMessageContains: string[]
): void => {
    const response = executeChallengeCommand(app, user, commandType, targets);
    expectSuccessResponse(response, expectedMessageContains);
};

/**
 * Tests a command that should fail when hitting a limit
 * @param app - App instance to test on
 * @param user - User executing the command
 * @param commandType - Command type to test
 * @param parameters - Command parameters
 * @param setupFn - Function to set up the limit condition
 * @param expectedErrorMessage - Expected error message
 */
export const testCommandLimit = (
    app: App,
    user: TestUser,
    commandType: CommandTypeValue,
    parameters: string,
    setupFn: () => void,
    expectedErrorMessage: string
): void => {
    setupFn();
    const response = executeChallengeCommand(
        app,
        user,
        commandType,
        parameters
    );
    expect(response.error).toBe(true);
    expect(response.message).toContain(expectedErrorMessage);
};

/**
 * Creates a standardized test scenario for command testing
 * @param description - Test description
 * @param commandType - Command type to test
 * @param parameters - Command parameters
 * @param expectedSuccess - Whether the command should succeed
 * @param expectedContains - Strings that should be in the response
 */
export const createTestScenario = (
    description: string,
    commandType: CommandTypeValue,
    parameters: string = "",
    expectedSuccess: boolean = true,
    expectedContains?: string[]
): {
    description: string;
    commandType: CommandTypeValue;
    parameters: string;
    expectedSuccess: boolean;
    expectedContains?: string[];
} => ({
    description,
    commandType,
    parameters,
    expectedSuccess,
    expectedContains,
});
