import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import ChallengeList from "../../src/classes/ChallengeList";
import {
    createAdminUser,
    createChatUser,
    createModUser,
    executeCommand,
    expectPermissionError,
    expectSuccessResponse,
    resetIDManager,
    type ChatResponse,
    type TestUser,
} from "./chatHandlerTestUtils";

// ============================================================================
// TEST DATA CONSTANTS
// ============================================================================

const TEST_CHALLENGE_DATA = {
    TITLE_AND_DESC: {
        title: "Testing Descriptions",
        description: "Should see a description for this challenge!",
        command:
            'add t="Testing Descriptions" d="Should see a description for this challenge!"',
    },
    TITLE_ONLY: {
        title: "Title Only Challenge",
        description: "",
        command: 'add title="Title Only Challenge"',
    },
    SHORT_ALIASES: {
        title: "Short Title",
        description: "Short description",
        command: 'add t="Short Title" d="Short description"',
    },
    COMPLEX_QUOTES: {
        title: 'Title with "quotes"',
        description: "Description with special chars: @#$%",
        command:
            'add t="Title with \\"quotes\\"" d="Description with special chars: @#$%"',
    },
} as const;

// ============================================================================
// TEST HELPER FUNCTIONS
// ============================================================================

/**
 * Sets up DOM structure required for challenge rendering tests
 */
function setupTestDOM(): void {
    document.body.innerHTML = `
        <div class="challenge-container primary"></div>
        <div class="challenge-container secondary"></div>
    `;
}

/**
 * Creates a fresh app instance with proper test isolation
 */
function createTestApp(): { app: App; challengeList: ChallengeList } {
    localStorage.clear();
    setupTestDOM();
    resetIDManager();

    const app = new App("TestStore");
    const challengeList = app.challengeList;
    challengeList.clearChallengeList();

    return { app, challengeList };
}

/**
 * Executes a challenge command and returns the response
 */
function executeChallengeCommand(
    app: App,
    user: TestUser,
    commandString: string
): ChatResponse {
    return executeCommand(app, user, "ch", commandString);
}

/**
 * Asserts that DOM contains proper title and description elements
 */
function assertChallengeDOM(
    expectedTitle: string,
    expectedDescription: string
): void {
    const textElements = document.querySelectorAll(".challenge-text");
    expect(textElements.length).toBeGreaterThan(0);

    textElements.forEach((textElement) => {
        // Check title element
        const titleElement = textElement.querySelector(".challenge-title");
        expect(titleElement).toBeTruthy();
        expect(titleElement?.textContent).toBe(expectedTitle);

        // Check description element based on whether description exists
        const descriptionElement = textElement.querySelector(
            ".challenge-description"
        );
        if (expectedDescription) {
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toBe(expectedDescription);
        } else {
            expect(descriptionElement).toBeNull();
        }
    });
}

/**
 * Asserts that a challenge was created with expected properties
 */
function assertChallengeCreated(
    challengeList: ChallengeList,
    expectedTitle: string,
    expectedDescription: string
): void {
    expect(challengeList.challenges.length).toBe(1);

    const challenge = challengeList.challenges[0];
    expect(challenge.title).toBe(expectedTitle);
    expect(challenge.description).toBe(expectedDescription);
}

describe("Command Handler Integration", () => {
    let app: App;
    let challengeList: ChallengeList;
    let adminUser: TestUser;
    let modUser: TestUser;
    let chatUser: TestUser;

    beforeEach(() => {
        ({ app, challengeList } = createTestApp());
        adminUser = createAdminUser();
        modUser = createModUser();
        chatUser = createChatUser();
    });

    describe("Add Command with Title and Description", () => {
        it("should correctly parse and create challenge with separate title and description", () => {
            const testData = TEST_CHALLENGE_DATA.TITLE_AND_DESC;
            const response = executeChallengeCommand(
                app,
                adminUser,
                testData.command
            );

            expectSuccessResponse(response, [testData.title]);
            assertChallengeCreated(
                challengeList,
                testData.title,
                testData.description
            );

            // Verify title and description are different
            expect(challengeList.challenges[0].title).not.toBe(
                challengeList.challenges[0].description
            );
        });

        it("should create proper DOM structure with title and description", () => {
            const testData = TEST_CHALLENGE_DATA.TITLE_AND_DESC;
            executeChallengeCommand(app, adminUser, testData.command);

            assertChallengeDOM(testData.title, testData.description);
        });

        it("should handle title-only challenges correctly", () => {
            const testData = TEST_CHALLENGE_DATA.TITLE_ONLY;
            const response = executeChallengeCommand(
                app,
                adminUser,
                testData.command
            );

            expectSuccessResponse(response);
            assertChallengeCreated(
                challengeList,
                testData.title,
                testData.description
            );
            assertChallengeDOM(testData.title, testData.description);
        });

        it("should handle short aliases correctly", () => {
            const testData = TEST_CHALLENGE_DATA.SHORT_ALIASES;
            const response = executeChallengeCommand(
                app,
                adminUser,
                testData.command
            );

            expectSuccessResponse(response);
            assertChallengeCreated(
                challengeList,
                testData.title,
                testData.description
            );
        });

        it("should handle complex quotes and special characters", () => {
            const testData = TEST_CHALLENGE_DATA.COMPLEX_QUOTES;
            const response = executeChallengeCommand(
                app,
                adminUser,
                testData.command
            );

            expectSuccessResponse(response);
            assertChallengeCreated(
                challengeList,
                testData.title,
                testData.description
            );
        });
    });

    describe("Permission Handling", () => {
        const testCommand = 'add t="Test" d="Test"';

        it("should reject commands from non-moderators", () => {
            const response = executeChallengeCommand(
                app,
                chatUser,
                testCommand
            );

            expectPermissionError(response);
            expect(challengeList.challenges.length).toBe(0);
        });

        it("should allow commands from broadcaster", () => {
            const response = executeChallengeCommand(
                app,
                adminUser,
                testCommand
            );

            expectSuccessResponse(response);
            expect(challengeList.challenges.length).toBe(1);
        });

        it("should allow commands from moderators", () => {
            const response = executeChallengeCommand(app, modUser, testCommand);

            expectSuccessResponse(response);
            expect(challengeList.challenges.length).toBe(1);
        });

        it("should enforce permissions consistently across all command variations", () => {
            // Test multiple command variations to ensure consistent permission handling
            const commandVariations = [
                TEST_CHALLENGE_DATA.TITLE_AND_DESC.command,
                TEST_CHALLENGE_DATA.TITLE_ONLY.command,
                TEST_CHALLENGE_DATA.SHORT_ALIASES.command,
            ];

            commandVariations.forEach((command) => {
                // Reset app for each test
                const { app: testApp } = createTestApp();

                // Test that regular users are consistently rejected
                const userResponse = executeChallengeCommand(
                    testApp,
                    chatUser,
                    command
                );
                expectPermissionError(userResponse);

                // Test that authorized users are consistently accepted
                const authResponse = executeChallengeCommand(
                    testApp,
                    adminUser,
                    command
                );
                expectSuccessResponse(authResponse);
            });
        });
    });
});
