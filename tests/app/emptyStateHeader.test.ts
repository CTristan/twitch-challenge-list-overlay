import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import { setupChallengeTestDOM } from "../utils/domTestUtils";

describe("Empty State Header Visibility", () => {
    let app: App;

    beforeEach(() => {
        // Clear localStorage to avoid conflicts
        localStorage.clear();

        // Setup DOM environment
        setupChallengeTestDOM();

        // Create app instance
        app = new App("testStore");
    });

    describe("Header visibility in empty state", () => {
        it("should render header card when no challenges exist", () => {
            // Ensure we start with no challenges
            expect(app.challengeList.challenges.length).toBe(0);
            expect(app.challengeList.totalChallenges).toBe(0);
            expect(app.challengeList.challengesCompleted).toBe(0);

            // Render the challenge list (should now show header even when empty)
            app.renderChallengeList();

            // Check that cards are created (this is the main fix - cards should exist even when empty)
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(cards.length).toBe(1);

            // Check that the header elements exist in the container
            const headers = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            expect(headers.length).toBe(1);

            // Check that challenge lists exist but are empty
            const challengeLists = document.querySelectorAll(
                ".challenge-container .card ol.challenges"
            );

            expect(challengeLists.length).toBe(1);

            // Lists should be empty (no challenge items)
            expect(challengeLists[0]?.children.length).toBe(0);
        });

        it("should render header after clearing all challenges", () => {
            // Add some challenges first
            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            app.renderChallengeList();

            // Verify challenges are rendered
            expect(
                document.querySelectorAll(".challenge").length
            ).toBeGreaterThan(0);

            // Clear all challenges
            app.challengeList.clearChallengeList();
            app.renderChallengeList();

            // Check that the header cards still exist after clearing
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(cards.length).toBe(1);

            // Check that the header elements exist
            const headers = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            expect(headers.length).toBe(1);

            // Verify no challenge items are present
            expect(document.querySelectorAll(".challenge").length).toBe(0);
        });

        it("should render header after clearing done challenges when all are completed", () => {
            // Add and complete some challenges
            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            app.challengeList.completeChallenges([0, 1]);
            app.renderChallengeList();

            // Clear done challenges (should clear all since all are completed)
            app.challengeList.clearDoneChallenges();
            app.renderChallengeList();

            // Check that the header cards still exist
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(cards.length).toBe(1);

            // Check that the header elements exist
            const headers = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            expect(headers.length).toBe(1);
        });

        it("should maintain header visibility when transitioning from empty to populated", () => {
            // Start with empty state
            app.renderChallengeList();

            // Verify header exists in empty state
            let cards = document.querySelectorAll(".challenge-container .card");
            expect(cards.length).toBe(1);

            // Add a challenge
            app.challengeList.addChallenges(["New Challenge"]);
            app.renderChallengeList();

            // Verify header still exists
            cards = document.querySelectorAll(".challenge-container .card");
            expect(cards.length).toBe(1);

            // Verify challenge item is present
            expect(document.querySelectorAll(".challenge").length).toBe(1); // Single container
        });
    });

    describe("DOM structure consistency", () => {
        it("should maintain consistent DOM structure between empty and populated states", () => {
            // Test empty state structure
            app.renderChallengeList();

            const emptyCards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(emptyCards.length).toBe(1);

            // Each card should have a header and an empty list
            emptyCards.forEach((card) => {
                expect(card.querySelector(".username")).toBeTruthy();
                expect(card.querySelector("ol.challenges")).toBeTruthy();
            });

            // Add challenges and test populated state structure
            app.challengeList.addChallenges(["Challenge 1"]);
            app.renderChallengeList();

            const populatedCards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(populatedCards.length).toBe(1);

            // Structure should be the same, just with content in the list
            populatedCards.forEach((card) => {
                expect(card.querySelector(".username")).toBeTruthy();
                expect(card.querySelector("ol.challenges")).toBeTruthy();
            });
        });
    });
});
