import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import ChallengeList from "../../src/classes/ChallengeList";
import {
    createAdminUser,
    createChatUser,
    createModUser,
    executeCommand,
    expectSilentIgnore,
    expectSuccessResponse,
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
            'add "Testing Descriptions" d="Should see a description for this challenge!"',
    },
    TITLE_ONLY: {
        title: "Title Only Challenge",
        description: "",
        command: 'add "Title Only Challenge"',
    },
    SHORT_ALIASES: {
        title: "Short Title",
        description: "Short description",
        command: 'add "Short Title" d="Short description"',
    },
    FULL_PARAMETER_NAMES: {
        title: "Full Parameters",
        description: "Testing full parameter names",
        command:
            'add "Full Parameters" desc="Testing full parameter names" amount=3 timer=5m',
    },
    MIXED_PARAMETER_NAMES: {
        title: "Mixed Parameters",
        description: "Testing mixed parameter formats",
        command:
            'add "Mixed Parameters" d="Testing mixed parameter formats" amount=2 t=10s',
    },
    COMPLEX_QUOTES: {
        title: 'Title with "quotes"',
        description: "Description with special chars: @#$%",
        command:
            'add "Title with \\"quotes\\"" d="Description with special chars: @#$%"',
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
        <div class="challenge-wrapper">
            <div class="challenge-container primary">
                <div class="card">
                    <div class="username">Challenges 0/0</div>
                    <ol class="challenges"></ol>
                </div>
            </div>
            <div class="challenge-container secondary">
                <div class="card">
                    <div class="username">Challenges 0/0</div>
                    <ol class="challenges"></ol>
                </div>
            </div>
        </div>
    `;
}

/**
 * Creates a fresh app instance with proper test isolation
 */
function createTestApp(): { app: App; challengeList: ChallengeList } {
    localStorage.clear();
    setupTestDOM();
    // Note: PositionManager is stateless, no reset needed

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

    textElements.forEach((textElement, index) => {
        // Check title element with ID prefix (1-based position)
        const titleElement = textElement.querySelector(".challenge-title");
        expect(titleElement).toBeTruthy();
        const expectedTitleWithId = `${index + 1}. ${expectedTitle}`;
        expect(titleElement?.textContent).toBe(expectedTitleWithId);

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
    if (!challenge) throw new Error("Challenge not found");
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
            const challenge = challengeList.challenges[0];
            if (!challenge) throw new Error("Challenge not found");
            expect(challenge.title).not.toBe(challenge.description);
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
        const testCommand = 'add "Test" d="Test"';

        it("should silently ignore commands from non-moderators", () => {
            const response = executeChallengeCommand(
                app,
                chatUser,
                testCommand
            );

            expectSilentIgnore(response);
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

                // Test that regular users are consistently silently ignored
                const userResponse = executeChallengeCommand(
                    testApp,
                    chatUser,
                    command
                );
                expectSilentIgnore(userResponse);

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

    describe("Parameter Format Support", () => {
        describe("Full Parameter Names", () => {
            it("should correctly parse and create challenge using full parameter names", () => {
                const testData = TEST_CHALLENGE_DATA.FULL_PARAMETER_NAMES;
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

                // Verify challenge properties
                const challenge = challengeList.challenges[0];
                if (!challenge) throw new Error("Challenge not found");
                expect(challenge.title).toBe(testData.title);
                expect(challenge.description).toBe(testData.description);
                expect(challenge.amount).toBe(3);
                expect(challenge.timer).toBeDefined();
            });
        });

        describe("Mixed Parameter Names", () => {
            it("should correctly parse and create challenge using mixed abbreviated and full parameter names", () => {
                const testData = TEST_CHALLENGE_DATA.MIXED_PARAMETER_NAMES;
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

                // Verify challenge properties
                const challenge = challengeList.challenges[0];
                if (!challenge) throw new Error("Challenge not found");
                expect(challenge.title).toBe(testData.title);
                expect(challenge.description).toBe(testData.description);
                expect(challenge.amount).toBe(2);
                expect(challenge.timer).toBeDefined();
            });
        });

        describe("Parameter Format Equivalence", () => {
            it("should produce identical results for abbreviated vs full parameter names", () => {
                // Test abbreviated format
                const { app: app1, challengeList: list1 } = createTestApp();
                const response1 = executeChallengeCommand(
                    app1,
                    adminUser,
                    'add "Test Challenge" d="Test Description" a=5 t=10m'
                );

                // Test full format
                const { app: app2, challengeList: list2 } = createTestApp();
                const response2 = executeChallengeCommand(
                    app2,
                    adminUser,
                    'add "Test Challenge" desc="Test Description" amount=5 timer=10m'
                );

                // Both should succeed
                expectSuccessResponse(response1, ["Test Challenge"]);
                expectSuccessResponse(response2, ["Test Challenge"]);

                // Both should create identical challenges
                const challenge1 = list1.challenges[0];
                const challenge2 = list2.challenges[0];

                if (!challenge1 || !challenge2) {
                    throw new Error("Challenges not created");
                }

                expect(challenge1.title).toBe(challenge2.title);
                expect(challenge1.description).toBe(challenge2.description);
                expect(challenge1.amount).toBe(challenge2.amount);
                expect(challenge1.timer?.duration).toBe(
                    challenge2.timer?.duration
                );
            });
        });
    });
});
