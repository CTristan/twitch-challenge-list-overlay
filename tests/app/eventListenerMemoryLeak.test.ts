import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/app";

describe("Event Listener Memory Leak Prevention", () => {
    let app: App;

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

        app = new App("test-event-listener-memory-leak");
        app.challengeList.clearChallengeList();
    });

    it("should not accumulate duplicate event listeners when enableAdminCheckboxInteraction is called multiple times", () => {
        // Add some test challenges
        app.challengeList.addChallenges([
            "Test Challenge 1",
            "Test Challenge 2",
        ]);
        app.renderChallengeList();

        // Spy on the handleCheckboxClick method to count calls
        const handleCheckboxClickSpy = vi.spyOn(
            app as any,
            "handleCheckboxClick"
        );

        // Call enableAdminCheckboxInteraction multiple times (simulating re-renders)
        app.enableAdminCheckboxInteraction();
        app.enableAdminCheckboxInteraction();
        app.enableAdminCheckboxInteraction();

        // Get the first checkbox
        const firstCheckbox = document.querySelector(".challenge-checkbox");
        expect(firstCheckbox).toBeTruthy();

        // Simulate a click event
        const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });

        firstCheckbox!.dispatchEvent(clickEvent);

        // The handler should only be called once, not multiple times
        expect(handleCheckboxClickSpy).toHaveBeenCalledTimes(1);
    });

    it("should not add event listeners when not in admin mode", () => {
        // Switch out of admin mode first
        window.location.hash = "";

        // Add a test challenge
        app.challengeList.addChallenges("Test Challenge");
        app.renderChallengeList();

        // Get the checkbox
        const checkbox = document.querySelector(".challenge-checkbox");
        expect(checkbox).toBeTruthy();

        // Spy on addEventListener to verify no listeners are added
        const addEventListenerSpy = vi.spyOn(checkbox!, "addEventListener");

        // Try to enable admin checkbox interaction (should return early)
        app.enableAdminCheckboxInteraction();

        // Verify that no event listeners were added
        expect(addEventListenerSpy).not.toHaveBeenCalled();

        // Verify that the checkbox doesn't have the admin-interactive class
        expect(checkbox!.classList.contains("admin-interactive")).toBe(false);
    });

    it("should use event delegation with consistent function references", () => {
        // Add a test challenge
        app.challengeList.addChallenges("Test Challenge");
        app.renderChallengeList();

        // Get the challenge containers for event delegation
        const containers = document.querySelectorAll(".challenge-container");
        expect(containers.length).toBeGreaterThan(0);

        // Spy on addEventListener and removeEventListener for containers
        const addEventListenerSpies = Array.from(containers).map((container) =>
            vi.spyOn(container, "addEventListener")
        );
        const removeEventListenerSpies = Array.from(containers).map(
            (container) => vi.spyOn(container, "removeEventListener")
        );

        // Call enableAdminCheckboxInteraction
        app.enableAdminCheckboxInteraction();

        // Verify that event delegation is set up on containers
        addEventListenerSpies.forEach((spy) => {
            expect(spy).toHaveBeenCalledWith(
                "click",
                (app as any).handleDelegatedCheckboxClick
            );
        });

        removeEventListenerSpies.forEach((spy) => {
            expect(spy).toHaveBeenCalledWith(
                "click",
                (app as any).handleDelegatedCheckboxClick
            );
        });

        // Verify they use the exact same function reference
        addEventListenerSpies.forEach((addSpy, index) => {
            const removeSpy = removeEventListenerSpies[index];
            expect(removeSpy).toBeDefined(); // Ensure removeSpy exists
            const removeCall = removeSpy!.mock.calls[0];
            const addCall = addSpy.mock.calls[0];
            expect(removeCall).toBeDefined();
            expect(addCall).toBeDefined();
            expect(removeCall![1]).toBe(addCall![1]); // Same function reference
        });
    });

    it("should properly handle checkbox clicks in admin mode after multiple re-enables", () => {
        // Add a test challenge
        app.challengeList.addChallenges("Test Challenge");
        app.renderChallengeList();

        // Call enableAdminCheckboxInteraction multiple times
        app.enableAdminCheckboxInteraction();
        app.enableAdminCheckboxInteraction();
        app.enableAdminCheckboxInteraction();

        // Get the first challenge and checkbox
        const challenge = app.challengeList.challenges[0];
        const checkbox = document.querySelector(".challenge-checkbox");
        expect(challenge).toBeTruthy();
        expect(checkbox).toBeTruthy();

        // Verify initial state
        expect(challenge!.isComplete()).toBe(false);

        // Simulate checkbox click
        const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });

        checkbox!.dispatchEvent(clickEvent);

        // Verify the challenge was completed
        expect(challenge!.isComplete()).toBe(true);

        // Click again to toggle back
        checkbox!.dispatchEvent(clickEvent);

        // Verify the challenge was reverted
        expect(challenge!.isComplete()).toBe(false);
    });
});
