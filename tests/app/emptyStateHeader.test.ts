import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import { CSS_CLASSES, CSS_SELECTORS } from "../../src/types/DOMConstants";
import { setupChallengeTestDOM } from "../utils/domTestUtils";

describe("Empty State Header Visibility", () => {
    let app: App;

    beforeEach(() => {
        // Clear localStorage to avoid conflicts
        localStorage.clear();
        
        // Clear hash to ensure we're in viewer mode by default
        window.location.hash = "";

        // Setup DOM environment
        setupChallengeTestDOM();

        // Create app instance
        app = new App("testStore");
    });

    describe("Header visibility in empty state - Viewer Mode", () => {
        it("should hide card when no challenges exist in viewer mode", () => {
            // Ensure we're in viewer mode
            window.location.hash = "";
            
            // Ensure we start with no challenges
            expect(app.challengeList.challenges.length).toBe(0);
            expect(app.challengeList.totalChallenges).toBe(0);
            expect(app.challengeList.challengesCompleted).toBe(0);

            // Render the challenge list
            app.renderChallengeList();

            // Check that card is created but hidden
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(cards.length).toBe(1);
            expect(cards[0]?.classList.contains(CSS_CLASSES.HIDDEN)).toBe(true);
        });
        
        it("should show card when challenges are added in viewer mode", () => {
            // Ensure we're in viewer mode
            window.location.hash = "";
            
            // Add a challenge
            app.challengeList.addChallenges(["Challenge 1"]);
            app.renderChallengeList();

            // Card should be visible
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(cards.length).toBe(1);
            expect(cards[0]?.classList.contains(CSS_CLASSES.HIDDEN)).toBe(false);
        });

        it("should hide card after clearing all challenges in viewer mode", () => {
            // Ensure we're in viewer mode
            window.location.hash = "";
            
            // Add some challenges first
            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            app.renderChallengeList();

            // Verify challenges are rendered and card is visible
            expect(
                document.querySelectorAll(".challenge").length
            ).toBeGreaterThan(0);
            
            let cards = document.querySelectorAll(
                ".challenge-container .card"
            );
            expect(cards[0]?.classList.contains(CSS_CLASSES.HIDDEN)).toBe(false);

            // Clear all challenges
            app.challengeList.clearChallengeList();
            app.renderChallengeList();

            // Check that the card exists but is hidden
            cards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(cards.length).toBe(1);
            expect(cards[0]?.classList.contains(CSS_CLASSES.HIDDEN)).toBe(true);

            // Verify no challenge items are present
            expect(document.querySelectorAll(".challenge").length).toBe(0);
        });

        it("should hide card after clearing done challenges when all are completed in viewer mode", () => {
            // Ensure we're in viewer mode
            window.location.hash = "";
            
            // Add and complete some challenges
            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            app.challengeList.completeChallenges([0, 1]);
            app.renderChallengeList();

            // Clear done challenges (should clear all since all are completed)
            app.challengeList.clearDoneChallenges();
            app.renderChallengeList();

            // Check that the card exists but is hidden
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(cards.length).toBe(1);
            expect(cards[0]?.classList.contains(CSS_CLASSES.HIDDEN)).toBe(true);
        });

        it("should transition card visibility from hidden to visible when adding challenges in viewer mode", () => {
            // Ensure we're in viewer mode
            window.location.hash = "";
            
            // Start with empty state
            app.renderChallengeList();

            // Verify card is hidden in empty state
            let cards = document.querySelectorAll(".challenge-container .card");
            expect(cards.length).toBe(1);
            expect(cards[0]?.classList.contains(CSS_CLASSES.HIDDEN)).toBe(true);

            // Add a challenge
            app.challengeList.addChallenges(["New Challenge"]);
            app.renderChallengeList();

            // Verify card is now visible
            cards = document.querySelectorAll(".challenge-container .card");
            expect(cards.length).toBe(1);
            expect(cards[0]?.classList.contains(CSS_CLASSES.HIDDEN)).toBe(false);

            // Verify challenge item is present
            expect(document.querySelectorAll(".challenge").length).toBe(1);
        });
    });

    describe("Header visibility in empty state - Admin Mode", () => {
        it("should show card when no challenges exist in admin mode", () => {
            // Ensure we're in admin mode
            window.location.hash = "#admin";
            
            // Ensure we start with no challenges
            expect(app.challengeList.challenges.length).toBe(0);

            // Render the challenge list
            app.renderChallengeList();

            // Card should be visible in admin mode even when empty
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(cards.length).toBe(1);
            expect(cards[0]?.classList.contains(CSS_CLASSES.HIDDEN)).toBe(false);
        });

        it("should keep card visible after clearing all challenges in admin mode", () => {
            // Ensure we're in admin mode
            window.location.hash = "#admin";
            
            // Add some challenges first
            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            app.renderChallengeList();

            // Clear all challenges
            app.challengeList.clearChallengeList();
            app.renderChallengeList();

            // Card should remain visible in admin mode
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(cards.length).toBe(1);
            expect(cards[0]?.classList.contains(CSS_CLASSES.HIDDEN)).toBe(false);
        });
    });

    describe("DOM structure consistency", () => {
        it("should maintain consistent DOM structure between empty and populated states", () => {
            // Ensure we're in viewer mode
            window.location.hash = "";
            
            // Test empty state structure
            app.renderChallengeList();

            const emptyCards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(emptyCards.length).toBe(1);

            // Each card should have a header and an empty list (even if hidden)
            emptyCards.forEach((card) => {
                expect(card.querySelector(".username")).toBeTruthy();
                expect(
                    card.querySelector(CSS_SELECTORS.CHALLENGES_ORDERED_LIST)
                ).toBeTruthy();
            });

            // Add challenges and test populated state structure
            app.challengeList.addChallenges(["Challenge 1"]);
            app.renderChallengeList();

            const populatedCards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(populatedCards.length).toBe(1);

            // Structure should be the same, just with content in the list and visible
            populatedCards.forEach((card) => {
                expect(card.querySelector(".username")).toBeTruthy();
                expect(
                    card.querySelector(CSS_SELECTORS.CHALLENGES_ORDERED_LIST)
                ).toBeTruthy();
                expect(card.classList.contains(CSS_CLASSES.HIDDEN)).toBe(false);
            });
        });
    });
});
