import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import ChallengeList from "../../src/classes/ChallengeList";
import { URL_HASH } from "../../src/types/DOMConstants";
import {
    createAdminUser,
    createMockApp,
    executeCommand,
    expectSuccessResponse,
} from "../utils/chatHandlerTestUtils";
import { setupChallengeTestDOM } from "../utils/domTestUtils";

/**
 * Integration tests for increment-to-completion DOM update flow
 * Tests the specific scenario where incrementing a challenge triggers completion
 * and verifies that DOM updates happen automatically without manual refresh
 */
describe("Increment to Completion DOM Updates", () => {
    let app: App;
    let challengeList: ChallengeList;
    const adminUser = createAdminUser();

    beforeEach(() => {
        setupChallengeTestDOM();
        window.location.hash = URL_HASH.ADMIN;

        app = createMockApp();
        challengeList = app.challengeList;

        // Clear challenges to start with clean state
        challengeList.clearChallengeList();
    });

    describe("Multi-step Challenge Completion Flow", () => {
        it("should automatically update DOM when increment triggers completion", () => {
            // Step 1: Add a multi-step challenge (amount=5)
            const addResponse = executeCommand(
                app,
                adminUser,
                "ch",
                'add "Collect Items" d="Collect 5 special items" a=5'
            );
            expectSuccessResponse(addResponse);

            // Verify challenge was created
            expect(challengeList.challenges.length).toBe(1);
            const challenge = challengeList.challenges[0];
            if (!challenge) throw new Error("Challenge not found");
            expect(challenge.amount).toBe(5);
            expect(challenge.progress).toBe(0);
            expect(challenge.isComplete()).toBe(false);

            // Verify initial DOM state - challenge should not have completion styling
            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(challengeElement).toBeTruthy();
            expect(challengeElement?.classList.contains("done")).toBe(false);

            const checkbox = challengeElement?.querySelector(
                ".challenge-checkbox"
            );
            expect(checkbox?.classList.contains("checked")).toBe(false);

            // Step 2: Increment to near completion (4/5)
            const increment1Response = executeCommand(
                app,
                adminUser,
                "ch",
                "+ 1 4" // Increment by 4 to reach 4/5
            );
            expectSuccessResponse(increment1Response);

            // Verify backend state
            expect(challenge.progress).toBe(4);
            expect(challenge.isComplete()).toBe(false);

            // Verify DOM still shows incomplete state
            expect(challengeElement?.classList.contains("done")).toBe(false);
            expect(checkbox?.classList.contains("checked")).toBe(false);

            // Step 3: Increment once more to trigger completion (5/5)
            const increment2Response = executeCommand(
                app,
                adminUser,
                "ch",
                "+ 1" // Increment by 1 to reach 5/5 and trigger completion
            );
            expectSuccessResponse(increment2Response);

            // Verify backend state - challenge should be complete
            expect(challenge.progress).toBe(5);
            expect(challenge.isComplete()).toBe(true);

            // Step 4: Verify DOM automatically updated to show completion state
            // This is the critical test - DOM should update without manual refresh
            expect(challengeElement?.classList.contains("done")).toBe(true);
            expect(checkbox?.classList.contains("checked")).toBe(true);
        });

        it("should handle single increment to completion", () => {
            // Add challenge with amount=1 (single-step)
            const addResponse = executeCommand(
                app,
                adminUser,
                "ch",
                'add "Quick Task" a=1'
            );
            expectSuccessResponse(addResponse);

            const challenge = challengeList.challenges[0];
            if (!challenge) throw new Error("Challenge not found");

            // Increment to complete immediately
            const incrementResponse = executeCommand(
                app,
                adminUser,
                "ch",
                "+ 1"
            );
            expectSuccessResponse(incrementResponse);

            // Verify completion
            expect(challenge.progress).toBe(1);
            expect(challenge.isComplete()).toBe(true);

            // Verify DOM completion styling
            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(challengeElement?.classList.contains("done")).toBe(true);

            const checkbox = challengeElement?.querySelector(
                ".challenge-checkbox"
            );
            expect(checkbox?.classList.contains("checked")).toBe(true);
        });

        it("should handle large increment that triggers completion", () => {
            // Add challenge with amount=10
            const addResponse = executeCommand(
                app,
                adminUser,
                "ch",
                'add "Big Task" a=10'
            );
            expectSuccessResponse(addResponse);

            const challenge = challengeList.challenges[0];
            if (!challenge) throw new Error("Challenge not found");

            // Set progress to 3 first
            executeCommand(app, adminUser, "ch", "set 1 3");
            expect(challenge.progress).toBe(3);

            // Increment by 15 (should cap at 10 and trigger completion)
            const incrementResponse = executeCommand(
                app,
                adminUser,
                "ch",
                "+ 1 15"
            );
            expectSuccessResponse(incrementResponse);

            // Verify completion
            expect(challenge.progress).toBe(10); // Should be capped at amount
            expect(challenge.isComplete()).toBe(true);

            // Verify DOM completion styling
            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(challengeElement?.classList.contains("done")).toBe(true);

            const checkbox = challengeElement?.querySelector(
                ".challenge-checkbox"
            );
            expect(checkbox?.classList.contains("checked")).toBe(true);
        });
    });

    describe("Decrement from Completion Flow", () => {
        it("should automatically update DOM when decrement reverts completion", () => {
            // Add a challenge and set its progress to completion
            executeCommand(app, adminUser, "ch", 'add "Test Task" a=3');
            const challenge = challengeList.challenges[0];
            if (!challenge) throw new Error("Challenge not found");

            // Set progress to completion (this will auto-complete the challenge)
            executeCommand(app, adminUser, "ch", "set 1 3");
            expect(challenge.progress).toBe(3);
            expect(challenge.isComplete()).toBe(true);

            // Verify DOM shows completion
            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(challengeElement?.classList.contains("done")).toBe(true);

            // Decrement to revert completion
            const decrementResponse = executeCommand(
                app,
                adminUser,
                "ch",
                "- 1" // Decrement by 1 to go from 3/3 to 2/3
            );
            expectSuccessResponse(decrementResponse);

            // Verify backend state
            expect(challenge.progress).toBe(2);
            expect(challenge.isComplete()).toBe(false);

            // Verify DOM automatically updated to remove completion styling
            expect(challengeElement?.classList.contains("done")).toBe(false);

            const checkbox = challengeElement?.querySelector(
                ".challenge-checkbox"
            );
            expect(checkbox?.classList.contains("checked")).toBe(false);
        });
    });

    describe("Set Progress to Completion Flow", () => {
        it("should automatically update DOM when set command triggers completion", () => {
            // Add challenge
            executeCommand(app, adminUser, "ch", 'add "Set Task" a=7');
            const challenge = challengeList.challenges[0];
            if (!challenge) throw new Error("Challenge not found");

            // Set progress to completion
            const setResponse = executeCommand(app, adminUser, "ch", "set 1 7");
            expectSuccessResponse(setResponse);

            // Verify completion
            expect(challenge.progress).toBe(7);
            expect(challenge.isComplete()).toBe(true);

            // Verify DOM completion styling
            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            expect(challengeElement?.classList.contains("done")).toBe(true);

            const checkbox = challengeElement?.querySelector(
                ".challenge-checkbox"
            );
            expect(checkbox?.classList.contains("checked")).toBe(true);
        });
    });
});
