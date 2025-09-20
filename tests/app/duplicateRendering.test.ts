import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("Duplicate Rendering Issue", () => {
    let app: App;

    beforeEach(() => {
        ensureTestIsolation();

        // Set up DOM containers as they exist in index.html
        document.body.innerHTML = `
            <main id="app">
                <div class="challenge-wrapper">
                    <div class="challenge-container primary"></div>
                    <div class="challenge-container secondary"></div>
                </div>
            </main>
        `;

        app = new App("testChallengeList");
    });

    describe("Challenge header and section duplication", () => {
        it("should reproduce duplicate rendering when render() followed by clearListFromDOM()", () => {
            // Add some challenges to make the test more realistic
            app.challengeList.addChallenges([
                "Test Challenge 1",
                "Test Challenge 2",
            ]);

            // Step 1: Initial render using UIUpdateHandler
            app.render();

            // Verify initial state - should have exactly 1 card in each container
            const initialPrimaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const initialSecondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );
            const initialPrimaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const initialSecondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            expect(initialPrimaryCards.length).toBe(1);
            expect(initialSecondaryCards.length).toBe(1);
            expect(initialPrimaryHeaders.length).toBe(1);
            expect(initialSecondaryHeaders.length).toBe(1);

            // Step 2: Call clearListFromDOM which previously triggered duplicate rendering
            // Now uses UIUpdateHandler consistently, preventing the duplication issue
            app.clearListFromDOM();

            // Check for duplication - should pass after the fix
            const afterClearPrimaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const afterClearSecondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );
            const afterClearPrimaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const afterClearSecondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            // These assertions should pass after the fix - only 1 card and 1 header per container
            expect(afterClearPrimaryCards.length).toBe(1);
            expect(afterClearSecondaryCards.length).toBe(1);
            expect(afterClearPrimaryHeaders.length).toBe(1);
            expect(afterClearSecondaryHeaders.length).toBe(1);

            // Verify header content is correct
            expect(afterClearPrimaryHeaders[0]?.textContent).toBe(
                "Challenges 0/2"
            );
            expect(afterClearSecondaryHeaders[0]?.textContent).toBe(
                "Challenges 0/2"
            );
        });

        it("should not create duplicates when render() is called multiple times", () => {
            // Add challenges
            app.challengeList.addChallenges([
                "Challenge A",
                "Challenge B",
                "Challenge C",
            ]);

            // Call render multiple times
            app.render();
            app.render();
            app.render();

            // Should still only have 1 card per container
            const primaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const secondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );
            const primaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const secondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            expect(primaryCards.length).toBe(1);
            expect(secondaryCards.length).toBe(1);
            expect(primaryHeaders.length).toBe(1);
            expect(secondaryHeaders.length).toBe(1);
        });

        it("should maintain single card structure when adding challenges after clearListFromDOM", () => {
            // Initial render
            app.render();

            // Clear the list
            app.clearListFromDOM();

            // Add a new challenge
            const newChallenges =
                app.challengeList.addChallenges("New Challenge");
            app.addChallengeToDOM(newChallenges[0]!);

            // Should still have only 1 card per container
            const primaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const secondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );

            expect(primaryCards.length).toBe(1);
            expect(secondaryCards.length).toBe(1);

            // Verify the challenge was added correctly
            const challenges = document.querySelectorAll(".challenge");
            expect(challenges.length).toBe(2); // 1 challenge × 2 containers
        });

        it("should handle empty challenge list without duplication", () => {
            // Render empty list
            app.render();

            // Clear (should still show header with 0/0)
            app.clearListFromDOM();

            // Verify single card structure with empty list
            const primaryCards = document.querySelectorAll(
                ".challenge-container.primary .card"
            );
            const secondaryCards = document.querySelectorAll(
                ".challenge-container.secondary .card"
            );
            const primaryHeaders = document.querySelectorAll(
                ".challenge-container.primary .card .username"
            );
            const secondaryHeaders = document.querySelectorAll(
                ".challenge-container.secondary .card .username"
            );

            expect(primaryCards.length).toBe(1);
            expect(secondaryCards.length).toBe(1);
            expect(primaryHeaders.length).toBe(1);
            expect(secondaryHeaders.length).toBe(1);

            // Verify header shows 0/0 for empty list
            expect(primaryHeaders[0]?.textContent).toBe("Challenges 0/0");
            expect(secondaryHeaders[0]?.textContent).toBe("Challenges 0/0");
        });
    });
});
