import { beforeEach, describe, it } from "vitest";
import App from "../../src/app";
import { CommandType } from "../../src/types/CommandTypes";
import {
    addChallengesUpToLimit,
    createAdminUser,
    createChatUser,
    createMockApp,
    createModUser,
    executeChallengeCommand,
    executeCommand,
    expectChallengeCount,
    expectInvalidCommandError,
    expectSilentIgnore,
    expectSuccessResponse,
    setupTestEnvironment,
    TEST_CONSTANTS,
    testCommandLimit,
    testCommandPermissions,
    testMultipleTargetCommand
} from "../utils/chatHandlerTestUtils";

// ============================================================================
// TEST CONSTANTS AND SHARED DATA
// ============================================================================

const {
    EXPECTED_CHALLENGE_COUNT,
    EXPECTED_MESSAGES,
    TEST_CHALLENGE_IDS,
    TEST_CHALLENGE_NAMES,
} = TEST_CONSTANTS;

// Create shared user instances (immutable, can be reused across tests)
const SHARED_USERS = {
    admin: createAdminUser(),
    moderator: createModUser(),
    regular: createChatUser(),
} as const;

describe("App.chatHandler", () => {
    let app: App;

    beforeEach(() => {
        // Create fresh app instance for each test
        app = createMockApp("TestStore");

        // Set up test environment with standard challenges
        setupTestEnvironment(app);
    });

    describe("Command Validation", () => {
        it("should error if the command is empty", () => {
            const response = executeCommand(app, SHARED_USERS.regular, "", "");
            expectInvalidCommandError(response);
        });

        it("should error if the command is not found", () => {
            const response = executeCommand(
                app,
                SHARED_USERS.regular,
                "invalidCommand",
                ""
            );
            expectInvalidCommandError(response);
        });
    });

    describe("Administrative Commands", () => {
        describe("Clear All Commands", () => {
            it("should clear all challenges when admin uses clearall command", () => {
                testCommandPermissions(
                    app,
                    CommandType.CLEAR_ALL,
                    "",
                    SHARED_USERS.admin,
                    SHARED_USERS.regular,
                    [EXPECTED_MESSAGES.ALL_CLEARED]
                );
                expectChallengeCount(
                    app,
                    EXPECTED_CHALLENGE_COUNT.AFTER_CLEAR_ALL
                );
            });

            it("should clear all challenges when moderator uses clearall command", () => {
                const response = executeChallengeCommand(
                    app,
                    SHARED_USERS.moderator,
                    CommandType.CLEAR_ALL
                );
                expectSuccessResponse(response, [
                    EXPECTED_MESSAGES.ALL_CLEARED,
                ]);
                expectChallengeCount(
                    app,
                    EXPECTED_CHALLENGE_COUNT.AFTER_CLEAR_ALL
                );
            });
        });

        describe("Clear Done Commands", () => {
            it("should clear completed challenges when admin uses cleardone command", () => {
                const response = executeChallengeCommand(
                    app,
                    SHARED_USERS.admin,
                    CommandType.CLEAR_DONE
                );
                expectSuccessResponse(response, [
                    EXPECTED_MESSAGES.DONE_CLEARED,
                ]);
                expectChallengeCount(
                    app,
                    EXPECTED_CHALLENGE_COUNT.AFTER_CLEAR_DONE
                );
            });

            it("should silently ignore cleardone command from regular users", () => {
                const response = executeChallengeCommand(
                    app,
                    SHARED_USERS.regular,
                    CommandType.CLEAR_DONE
                );
                expectSilentIgnore(response);
                expectChallengeCount(app, EXPECTED_CHALLENGE_COUNT.INITIAL); // Should remain unchanged
            });
        });
    });

    describe("Challenge Management Commands", () => {
        describe("Add Challenge Command", () => {
            it("should add single challenge when moderator uses command", () => {
                testCommandPermissions(
                    app,
                    CommandType.ADD,
                    TEST_CHALLENGE_NAMES.NEW,
                    SHARED_USERS.moderator,
                    SHARED_USERS.regular,
                    [
                        TEST_CHALLENGE_NAMES.NEW,
                        EXPECTED_MESSAGES.CHALLENGE_ADDED,
                    ]
                );
            });

            it("should accept multiple comma-separated challenges", () => {
                const response = executeChallengeCommand(
                    app,
                    SHARED_USERS.moderator,
                    CommandType.ADD,
                    TEST_CHALLENGE_NAMES.NEW_MULTIPLE
                );
                expectSuccessResponse(response, [
                    "newChallenge",
                    "newChallenge2",
                    EXPECTED_MESSAGES.CHALLENGE_ADDED,
                ]);
            });

            it("should notify user when max challenge limit is reached", () => {
                testCommandLimit(
                    app,
                    SHARED_USERS.moderator,
                    CommandType.ADD,
                    TEST_CHALLENGE_NAMES.LIMIT_TEST,
                    () => addChallengesUpToLimit(app, SHARED_USERS.moderator),
                    EXPECTED_MESSAGES.MAX_REACHED
                );
            });
        });

        describe("Edit Challenge Command", () => {
            it("should edit challenge when moderator uses command", () => {
                testCommandPermissions(
                    app,
                    CommandType.EDIT,
                    `${TEST_CHALLENGE_IDS.SECOND} title="${TEST_CHALLENGE_NAMES.EDITED}"`,
                    SHARED_USERS.moderator,
                    SHARED_USERS.regular,
                    [
                        EXPECTED_MESSAGES.CHALLENGE_UPDATED,
                        TEST_CHALLENGE_IDS.SECOND,
                    ]
                );
            });
        });

        describe("Complete Challenge Command", () => {
            it("should complete single challenge when moderator uses command", () => {
                testCommandPermissions(
                    app,
                    CommandType.DONE,
                    TEST_CHALLENGE_IDS.FIRST,
                    SHARED_USERS.moderator,
                    SHARED_USERS.regular,
                    [
                        EXPECTED_MESSAGES.CHALLENGE_COMPLETED,
                        TEST_CHALLENGE_IDS.FIRST,
                    ]
                );
            });

            it("should complete multiple challenges when moderator uses command", () => {
                testMultipleTargetCommand(
                    app,
                    SHARED_USERS.moderator,
                    CommandType.DONE,
                    TEST_CHALLENGE_IDS.MULTIPLE,
                    [EXPECTED_MESSAGES.CHALLENGE_COMPLETED, "1", "3"]
                );
            });
        });

        describe("Delete Challenge Command", () => {
            it("should delete single challenge when moderator uses command", () => {
                testCommandPermissions(
                    app,
                    CommandType.DELETE,
                    TEST_CHALLENGE_IDS.FIRST,
                    SHARED_USERS.moderator,
                    SHARED_USERS.regular,
                    [
                        EXPECTED_MESSAGES.CHALLENGE_DELETED,
                        TEST_CHALLENGE_IDS.FIRST,
                    ]
                );
            });
        });
    });

    describe("Information Commands", () => {
        describe("Check Command", () => {
            it("should list uncompleted challenges for moderators", () => {
                testCommandPermissions(
                    app,
                    CommandType.CHECK,
                    "",
                    SHARED_USERS.moderator,
                    SHARED_USERS.regular,
                    [EXPECTED_MESSAGES.CURRENT_CHALLENGES]
                );
            });

            it("should return no challenges message when all completed", () => {
                // Complete all remaining challenges
                app.challengeList.completeChallenges([0, 2, 3, 4]);
                const response = executeChallengeCommand(
                    app,
                    SHARED_USERS.moderator,
                    CommandType.CHECK
                );
                expectSuccessResponse(response, [
                    EXPECTED_MESSAGES.NO_CHALLENGES,
                ]);
            });
        });

        describe("Help Command", () => {
            it("should provide help information for moderators", () => {
                testCommandPermissions(
                    app,
                    CommandType.HELP,
                    "",
                    SHARED_USERS.moderator,
                    SHARED_USERS.regular,
                    [
                        EXPECTED_MESSAGES.HELP_AVAILABLE,
                        "!ch add",
                        "!ch edit",
                        "!ch done",
                    ]
                );
            });
        });
    });
});
