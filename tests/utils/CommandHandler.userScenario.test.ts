import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import ChallengeList from "../../src/classes/ChallengeList";
import {
    createAdminUser,
    executeCommand,
    expectSuccessResponse,
    type TestUser,
} from "./chatHandlerTestUtils";
import {
    assertChallengeCreated,
    assertChallengeDOMStructure,
    assertChallengeLayoutStructure,
    createTestApp,
    TEST_CHALLENGE_DATA,
    validateCompleteChallengFlow,
    type ChallengeTestData,
} from "./domTestUtils";

// ============================================================================
// TEST DATA CONSTANTS
// ============================================================================

/**
 * Specific test scenario data for the user's exact request
 */
const USER_SCENARIO_DATA: ChallengeTestData = TEST_CHALLENGE_DATA.TITLE_AND_DESC;

// ============================================================================
// TEST SUITE
// ============================================================================

describe("Command Handler - User Scenario", () => {
    let app: App;
    let challengeList: ChallengeList;
    let adminUser: TestUser;

    beforeEach(() => {
        // Create fresh test environment with proper isolation
        ({ app, challengeList } = createTestApp("UserScenarioTestStore"));
        adminUser = createAdminUser();
    });

    describe("Exact User Command Execution", () => {
        it('should handle the exact user scenario: !ch add t="Testing Descriptions" d="Should see a description for this challenge!"', () => {
            // Execute the exact command from the user's request
            const response = executeCommand(
                app,
                adminUser,
                "ch",
                USER_SCENARIO_DATA.command // Use the full command as stored
            );

            // Validate complete challenge creation flow
            validateCompleteChallengFlow(app, challengeList, USER_SCENARIO_DATA, response);
        });
    });

    describe("Challenge Data Validation", () => {
        it("should create challenge with correct title and description properties", () => {
            executeCommand(app, adminUser, "ch", USER_SCENARIO_DATA.command);

            // Validate challenge properties
            assertChallengeCreated(
                challengeList,
                USER_SCENARIO_DATA.title,
                USER_SCENARIO_DATA.description
            );

            // Ensure title and description are different (not legacy behavior)
            const challenge = challengeList.challenges[0];
            expect(challenge.title).not.toBe(challenge.description);
        });
    });

    describe("DOM Structure Validation", () => {
        it("should create proper two-line DOM structure with title and description elements", () => {
            executeCommand(app, adminUser, "ch", USER_SCENARIO_DATA.command);

            // Validate DOM structure with comprehensive assertions
            assertChallengeDOMStructure(
                USER_SCENARIO_DATA.title,
                USER_SCENARIO_DATA.description,
                {
                    expectDescription: true,
                    validateSeparateElements: true,
                    validateCSSClasses: true,
                }
            );
        });

        it("should apply proper CSS classes and layout structure", () => {
            executeCommand(app, adminUser, "ch", USER_SCENARIO_DATA.command);

            // Validate layout structure for two-line display
            assertChallengeLayoutStructure(true);
        });
    });

    describe("Command Response Validation", () => {
        it("should return success response with challenge title", () => {
            const response = executeCommand(
                app,
                adminUser,
                "ch",
                USER_SCENARIO_DATA.command
            );

            // Validate response using existing utility
            expectSuccessResponse(response, [USER_SCENARIO_DATA.title]);
        });
    });
});
