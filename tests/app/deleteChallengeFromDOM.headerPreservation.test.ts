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
            const initialCards = document.querySelectorAll(
                ".challenge-container .card"
            );
            const initialChallenges = document.querySelectorAll(".challenge");

            expect(initialCards.length).toBe(1);
            expect(initialChallenges.length).toBe(1); // Single container

            // Verify headers exist (skip text content check for now)
            const initialHeaders = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            expect(initialHeaders.length).toBe(1);

            // Get the challenge ID to delete
            const challengeId = app.challengeList.challenges[0]?.id;
            expect(challengeId).toBeDefined();

            // Delete the challenge using deleteChallengeFromDOM (this should trigger the bug)
            app.deleteChallengeFromDOM(challengeId!);

            // After deleting the last challenge, only the challenge element should be removed
            // The card container and header should remain visible
            const afterDeleteCards = document.querySelectorAll(
                ".challenge-container .card"
            );
            const afterDeleteChallenges =
                document.querySelectorAll(".challenge");

            // Expected behavior: Cards should still exist (length = 1) but be empty
            console.log("Cards after delete:", afterDeleteCards.length);
            console.log(
                "Challenges after delete:",
                afterDeleteChallenges.length
            );

            // These should pass with the fix
            expect(afterDeleteCards.length).toBe(1); // Cards remain
            expect(afterDeleteChallenges.length).toBe(0); // This is correct - no challenges should remain

            // Headers should exist
            const afterDeleteHeaders = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            expect(afterDeleteHeaders.length).toBe(1); // Headers remain
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
            expect(initialChallenges.length).toBe(3); // 3 challenges in single container

            // Delete the first challenge (not the last one)
            const firstChallengeId = app.challengeList.challenges[0]?.id;
            expect(firstChallengeId).toBeDefined();

            app.deleteChallengeFromDOM(firstChallengeId!);

            // This should work correctly - cards should remain, only the challenge element removed
            const afterDeleteCards = document.querySelectorAll(
                ".challenge-container .card"
            );
            const afterDeleteChallenges =
                document.querySelectorAll(".challenge");

            expect(afterDeleteCards.length).toBe(1); // Cards should remain
            expect(afterDeleteChallenges.length).toBe(2); // 2 challenges remaining

            // Headers should still exist
            const afterDeleteHeaders = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            expect(afterDeleteHeaders.length).toBe(1);
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
            expect(initialChallenges.length).toBe(3); // 3 challenges in single container

            // Simulate the clearAll command: first clear the data, then clear the DOM
            app.challengeList.clearChallengeList(); // Clear the data first
            app.clearListFromDOM(); // Then clear and re-render the DOM

            // After clearing, cards and headers should still exist
            const afterClearCards = document.querySelectorAll(
                ".challenge-container .card"
            );
            const afterClearChallenges =
                document.querySelectorAll(".challenge");

            expect(afterClearCards.length).toBe(1); // Cards should remain
            expect(afterClearChallenges.length).toBe(0); // No challenges should remain

            // Headers should still exist
            const afterClearHeaders = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            expect(afterClearHeaders.length).toBe(1);
        });
    });
});
