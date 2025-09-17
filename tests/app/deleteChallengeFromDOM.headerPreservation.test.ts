import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import { createTestApp } from "../utils/domTestUtils";

describe("deleteChallengeFromDOM Header Preservation", () => {
    let app: App;

    beforeEach(() => {
        // Use proper test setup
        const testSetup = createTestApp("testStore");
        app = testSetup.app;
    });

    describe("Header preservation when deleting challenges", () => {
        it("should preserve header when deleting the last challenge", () => {
            // Add a single challenge
            app.challengeList.addChallenges(["Only Challenge"]);
            app.renderChallengeList();

            // Verify initial state - header and challenge should exist
            const initialPrimaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const initialSecondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );
            const initialChallenges = document.querySelectorAll(".challenge");

            expect(initialPrimaryCards.length).toBe(1);
            expect(initialSecondaryCards.length).toBe(1);
            expect(initialChallenges.length).toBe(2); // Primary + secondary

            // Verify headers exist (skip text content check for now)
            const initialPrimaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const initialSecondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            expect(initialPrimaryHeaders.length).toBe(1);
            expect(initialSecondaryHeaders.length).toBe(1);

            // Get the challenge ID to delete
            const challengeId = app.challengeList.challenges[0]?.id;
            expect(challengeId).toBeDefined();

            // Delete the challenge using deleteChallengeFromDOM (this should trigger the bug)
            app.deleteChallengeFromDOM(challengeId!);

            // After deleting the last challenge, only the challenge element should be removed
            // The card container and header should remain visible
            const afterDeletePrimaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const afterDeleteSecondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );
            const afterDeleteChallenges =
                document.querySelectorAll(".challenge");

            // Expected behavior: Cards should still exist (length = 1) but be empty
            console.log(
                "Primary cards after delete:",
                afterDeletePrimaryCards.length
            );
            console.log(
                "Secondary cards after delete:",
                afterDeleteSecondaryCards.length
            );
            console.log(
                "Challenges after delete:",
                afterDeleteChallenges.length
            );

            // These should pass with the fix
            expect(afterDeletePrimaryCards.length).toBe(1); // Cards remain
            expect(afterDeleteSecondaryCards.length).toBe(1); // Cards remain
            expect(afterDeleteChallenges.length).toBe(0); // This is correct - no challenges should remain

            // Headers should exist
            const afterDeletePrimaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const afterDeleteSecondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            expect(afterDeletePrimaryHeaders.length).toBe(1); // Headers remain
            expect(afterDeleteSecondaryHeaders.length).toBe(1); // Headers remain
        });

        it("should work correctly when deleting non-last challenges", () => {
            // Add multiple challenges
            app.challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
            app.renderChallengeList();

            // Verify initial state
            const initialChallenges = document.querySelectorAll(".challenge");
            expect(initialChallenges.length).toBe(6); // 3 challenges × 2 containers

            // Delete the first challenge (not the last one)
            const firstChallengeId = app.challengeList.challenges[0]?.id;
            expect(firstChallengeId).toBeDefined();

            app.deleteChallengeFromDOM(firstChallengeId!);

            // This should work correctly - cards should remain, only the challenge element removed
            const afterDeletePrimaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const afterDeleteSecondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );
            const afterDeleteChallenges =
                document.querySelectorAll(".challenge");

            expect(afterDeletePrimaryCards.length).toBe(1); // Cards should remain
            expect(afterDeleteSecondaryCards.length).toBe(1); // Cards should remain
            expect(afterDeleteChallenges.length).toBe(4); // 2 challenges × 2 containers

            // Headers should still exist
            const afterDeletePrimaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const afterDeleteSecondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            expect(afterDeletePrimaryHeaders.length).toBe(1);
            expect(afterDeleteSecondaryHeaders.length).toBe(1);
        });

        it("should preserve header when using clearListFromDOM (clearAll command)", () => {
            // Add multiple challenges
            app.challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
            app.renderChallengeList();

            // Verify initial state
            const initialChallenges = document.querySelectorAll(".challenge");
            expect(initialChallenges.length).toBe(6); // 3 challenges × 2 containers

            // Simulate the clearAll command: first clear the data, then clear the DOM
            app.challengeList.clearChallengeList(); // Clear the data first
            app.clearListFromDOM(); // Then clear and re-render the DOM

            // After clearing, cards and headers should still exist
            const afterClearPrimaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const afterClearSecondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );
            const afterClearChallenges =
                document.querySelectorAll(".challenge");

            expect(afterClearPrimaryCards.length).toBe(1); // Cards should remain
            expect(afterClearSecondaryCards.length).toBe(1); // Cards should remain
            expect(afterClearChallenges.length).toBe(0); // No challenges should remain

            // Headers should still exist
            const afterClearPrimaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const afterClearSecondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            expect(afterClearPrimaryHeaders.length).toBe(1);
            expect(afterClearSecondaryHeaders.length).toBe(1);
        });
    });
});
