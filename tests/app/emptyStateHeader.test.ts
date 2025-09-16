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
            const primaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const secondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );

            expect(primaryCards.length).toBe(1);
            expect(secondaryCards.length).toBe(1);

            // Check that the header elements exist in both containers
            const primaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const secondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            expect(primaryHeaders.length).toBe(1);
            expect(secondaryHeaders.length).toBe(1);

            // Check that challenge lists exist but are empty
            const primaryLists = document.querySelectorAll(
                ".challenge-container.primary .card ol.challenges"
            );
            const secondaryLists = document.querySelectorAll(
                ".challenge-container.secondary .card ol.challenges"
            );

            expect(primaryLists.length).toBe(1);
            expect(secondaryLists.length).toBe(1);

            // Lists should be empty (no challenge items)
            expect(primaryLists[0]?.children.length).toBe(0);
            expect(secondaryLists[0]?.children.length).toBe(0);
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
            const primaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const secondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );

            expect(primaryCards.length).toBe(1);
            expect(secondaryCards.length).toBe(1);

            // Check that the header elements exist
            const primaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const secondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            expect(primaryHeaders.length).toBe(1);
            expect(secondaryHeaders.length).toBe(1);

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
            const primaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const secondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );

            expect(primaryCards.length).toBe(1);
            expect(secondaryCards.length).toBe(1);

            // Check that the header elements exist
            const primaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const secondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            expect(primaryHeaders.length).toBe(1);
            expect(secondaryHeaders.length).toBe(1);
        });

        it("should maintain header visibility when transitioning from empty to populated", () => {
            // Start with empty state
            app.renderChallengeList();

            // Verify header exists in empty state
            let primaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            expect(primaryCards.length).toBe(1);

            // Add a challenge
            app.challengeList.addChallenges(["New Challenge"]);
            app.renderChallengeList();

            // Verify header still exists
            primaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            expect(primaryCards.length).toBe(1);

            // Verify challenge item is present
            expect(document.querySelectorAll(".challenge").length).toBe(2); // Primary + secondary containers
        });
    });

    describe("DOM structure consistency", () => {
        it("should maintain consistent DOM structure between empty and populated states", () => {
            // Test empty state structure
            app.renderChallengeList();

            const emptyPrimaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const emptySecondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );

            expect(emptyPrimaryCards.length).toBe(1);
            expect(emptySecondaryCards.length).toBe(1);

            // Each card should have a header and an empty list
            emptyPrimaryCards.forEach((card) => {
                expect(card.querySelector(".username")).toBeTruthy();
                expect(card.querySelector("ol.challenges")).toBeTruthy();
            });

            // Add challenges and test populated state structure
            app.challengeList.addChallenges(["Challenge 1"]);
            app.renderChallengeList();

            const populatedPrimaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const populatedSecondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );

            expect(populatedPrimaryCards.length).toBe(1);
            expect(populatedSecondaryCards.length).toBe(1);

            // Structure should be the same, just with content in the list
            populatedPrimaryCards.forEach((card) => {
                expect(card.querySelector(".username")).toBeTruthy();
                expect(card.querySelector("ol.challenges")).toBeTruthy();
            });
        });
    });
});
