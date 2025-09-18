import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import ChallengeList from "../../src/classes/ChallengeList";

describe("Admin Checkbox Persistence Bug Investigation", () => {
    let app: App;
    let challengeList: ChallengeList;

    beforeEach(() => {
        // Clear localStorage to ensure clean state
        localStorage.clear();

        // Set up DOM for admin mode
        document.body.innerHTML = `
            <main id="app">
                <div class="challenge-wrapper">
                    <div class="challenge-container primary"></div>
                    <div class="challenge-container secondary"></div>
                </div>
            </main>
        `;

        // Simulate admin mode
        window.location.hash = "#admin";

        // Create App instance with test store name
        app = new App("test-admin-checkbox-persistence");
        challengeList = app.challengeList;
        challengeList.clearChallengeList();
    });

    describe("Fix Verification: Admin checkbox toggles update counters and persist", () => {
        it("should verify the fix: checkbox toggle updates challengesCompleted counter", () => {
            // Add some challenges
            challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
            app.renderChallengeList();

            // Verify initial state
            expect(challengeList.challengesCompleted).toBe(0);
            expect(challengeList.totalChallenges).toBe(3);

            // Enable admin checkbox interaction
            app.enableAdminCheckboxInteraction();

            // Get the first challenge and simulate admin checkbox click
            const firstChallenge = challengeList.challenges[0];
            if (!firstChallenge) throw new Error("Challenge not found");

            // Find the checkbox element for the first challenge (there should be 2 - primary and secondary)
            const challengeElements = document.querySelectorAll(
                `[data-challenge-id="${firstChallenge.id}"]`
            );
            const challengeElement = challengeElements[0]; // Use the first one (primary container)
            const checkbox = challengeElement?.querySelector(
                ".challenge-checkbox"
            );

            if (!checkbox) throw new Error("Checkbox not found");

            // Directly call the handler method instead of dispatching events
            // This avoids the dual-container issue where both checkboxes would be triggered
            const mockEvent = {
                target: checkbox,
                stopPropagation: () => {},
            } as unknown as Event;
            (app as any).handleCheckboxClick(mockEvent);

            // Verify the challenge object was updated
            expect(firstChallenge.isComplete()).toBe(true);

            // With the fix: The challengesCompleted counter should be updated
            expect(challengeList.challengesCompleted).toBe(1);
        });

        it("should verify the fix: checkbox toggle changes persist to localStorage", () => {
            // Add a challenge
            challengeList.addChallenges("Persistence Test Challenge");
            app.renderChallengeList();
            app.enableAdminCheckboxInteraction();

            // Get the challenge and checkbox
            const challenge = challengeList.challenges[0];
            if (!challenge) throw new Error("Challenge not found");

            const challengeElement = document.querySelector(
                `[data-challenge-id="${challenge.id}"]`
            );
            const checkbox = challengeElement?.querySelector(
                ".challenge-checkbox"
            );
            if (!checkbox) throw new Error("Checkbox not found");

            // Directly call the handler method to complete the challenge
            const mockEvent = {
                target: checkbox,
                stopPropagation: () => {},
            } as unknown as Event;
            (app as any).handleCheckboxClick(mockEvent);

            // Verify the challenge is marked as complete in memory
            expect(challenge.isComplete()).toBe(true);

            // Create a new ChallengeList instance to simulate page reload
            const newChallengeList = new ChallengeList(
                "test-admin-checkbox-persistence"
            );

            // With the fix: The completion status should persist
            const reloadedChallenge = newChallengeList.challenges[0];
            if (!reloadedChallenge)
                throw new Error("Challenge not found after reload");

            expect(reloadedChallenge.isComplete()).toBe(true);
            expect(newChallengeList.challengesCompleted).toBe(1);
        });

        it("should verify the fix: UI count display updates correctly", () => {
            // Add challenges
            challengeList.addChallenges(["UI Test 1", "UI Test 2"]);
            app.renderChallengeList();
            app.enableAdminCheckboxInteraction();

            // Add header element to test UI updates
            const cardElement = document.createElement("div");
            cardElement.className = "card";
            const headerElement = document.createElement("div");
            headerElement.className = "username";
            headerElement.textContent = "Challenges 0/2";
            cardElement.appendChild(headerElement);
            document.body.appendChild(cardElement);

            // Update the challenge count display
            app.updateChallengeCount();

            // Verify initial UI state
            expect(headerElement.textContent).toBe("Challenges 0/2");

            // Toggle first challenge via admin checkbox
            const firstChallenge = challengeList.challenges[0];
            if (!firstChallenge) throw new Error("Challenge not found");

            const challengeElement = document.querySelector(
                `[data-challenge-id="${firstChallenge.id}"]`
            );
            const checkbox = challengeElement?.querySelector(
                ".challenge-checkbox"
            );
            if (!checkbox) throw new Error("Checkbox not found");

            // Directly call the handler method
            const mockEvent = {
                target: checkbox,
                stopPropagation: () => {},
            } as unknown as Event;
            (app as any).handleCheckboxClick(mockEvent);

            // With the fix: At least one header should show "Challenges 1/2"
            const allHeaders = document.querySelectorAll(".card .username");
            const updatedHeaders = Array.from(allHeaders).filter(
                (h) => h.textContent === "Challenges 1/2"
            );
            expect(updatedHeaders.length).toBeGreaterThan(0);
        });
    });
});
