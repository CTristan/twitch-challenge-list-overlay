import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("Duplicate Rendering Issue", () => {
    let app: App;

    beforeEach(() => {
        ensureTestIsolation();

        // Set up DOM container as it exists in index.html (single container architecture)
        document.body.innerHTML = `
            <main id="app">
                <div class="challenge-wrapper">
                    <div class="challenge-container"></div>
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

            // Verify initial state - should have exactly 1 card in the single container
            const initialCards = document.querySelectorAll(
                ".challenge-container .card"
            );
            const initialHeaders = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            expect(initialCards.length).toBe(1);
            expect(initialHeaders.length).toBe(1);

            // Step 2: Call clearListFromDOM which previously triggered duplicate rendering
            // Now uses single container architecture, preventing the duplication issue
            app.clearListFromDOM();

            // Check for duplication - should pass after the fix
            const afterClearCards = document.querySelectorAll(
                ".challenge-container .card"
            );
            const afterClearHeaders = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            // These assertions should pass after the fix - only 1 card and 1 header total
            expect(afterClearCards.length).toBe(1);
            expect(afterClearHeaders.length).toBe(1);

            // Verify header content is correct
            expect(afterClearHeaders[0]?.textContent).toBe("Challenges 0/2");
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

            // Should still only have 1 card total
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );
            const headers = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            expect(cards.length).toBe(1);
            expect(headers.length).toBe(1);
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

            // Should still have only 1 card total
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );

            expect(cards.length).toBe(1);

            // Verify the challenge was added correctly
            const challenges = document.querySelectorAll(".challenge");
            expect(challenges.length).toBe(1); // 1 challenge in single container
        });

        it("should handle empty challenge list without duplication", () => {
            // Render empty list
            app.render();

            // Clear (should still show header with 0/0)
            app.clearListFromDOM();

            // Verify single card structure with empty list
            const cards = document.querySelectorAll(
                ".challenge-container .card"
            );
            const headers = document.querySelectorAll(
                ".challenge-container .card .username"
            );

            expect(cards.length).toBe(1);
            expect(headers.length).toBe(1);

            // Verify header shows 0/0 for empty list
            expect(headers[0]?.textContent).toBe("Challenges 0/0");
        });
    });
});
