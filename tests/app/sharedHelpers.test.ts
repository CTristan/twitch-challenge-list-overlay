import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import Challenge from "../../src/classes/Challenge";
import ConfigManager from "../../src/classes/ConfigManager";

describe("Shared Helper Functions", () => {
    let app: App;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        localStorage.clear();

        // Reset DOM
        document.body.innerHTML = `
            <div class="challenge-container primary"></div>
            <div class="challenge-container secondary"></div>
        `;

        // Get ConfigManager instance and reset colors
        configManager = ConfigManager.getInstance();
        configManager.set("challengeRowColors", []);
        configManager.set("challengeRowTextColors", []);

        app = new App("test-store");
    });

    describe("Row Color Consistency", () => {
        it("should apply identical colors in both full render and incremental add", () => {
            // Configure colors
            configManager.set("challengeRowColors", ["#ff0000", "#00ff00"]);
            configManager.set("challengeRowTextColors", ["#ffffff", "#000000"]);

            // Clear the challenge list first to ensure consistent indexing
            app.challengeList.clearChallengeList();

            // Add first challenge and render full list
            app.challengeList.addChallenges("Challenge 1");
            app.renderChallengeList();

            // Get styling from full render (index 0)
            const fullRenderElement = document.querySelector(
                ".challenge"
            ) as HTMLElement;
            const fullRenderBgColor = fullRenderElement.style.backgroundColor;
            const fullRenderTextElement = fullRenderElement.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            const fullRenderTextColor = fullRenderTextElement.style.color;

            // Clear DOM and challenge list, then add challenge incrementally
            document
                .querySelectorAll(".challenge-container")
                .forEach((container) => {
                    container.innerHTML = "";
                });
            app.challengeList.clearChallengeList();

            // Add challenge using incremental method (will also be at index 0)
            const challenge = new Challenge("Challenge 1");
            app.challengeList.addChallengeObjects(challenge);
            app.addChallengeToDOM(challenge);

            // Get styling from incremental add
            const incrementalElement = document.querySelector(
                ".challenge"
            ) as HTMLElement;
            const incrementalBgColor = incrementalElement.style.backgroundColor;
            const incrementalTextElement = incrementalElement.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            const incrementalTextColor = incrementalTextElement.style.color;

            // Verify colors match between both methods
            expect(incrementalBgColor).toBe(fullRenderBgColor);
            expect(incrementalTextColor).toBe(fullRenderTextColor);

            // Also verify the expected colors are applied (index 0 = first color)
            expect(fullRenderBgColor).toBe("rgb(255, 0, 0)"); // #ff0000
            expect(fullRenderTextColor).toBe("rgb(255, 255, 255)"); // #ffffff
        });

        it("should apply identical checkbox styling in both rendering paths", () => {
            // Configure text colors for checkbox styling
            configManager.set("challengeRowTextColors", ["#ff6b6b"]);

            // Clear the challenge list first to ensure consistent indexing
            app.challengeList.clearChallengeList();

            // Add challenge and render full list
            app.challengeList.addChallenges("Challenge 1");
            app.renderChallengeList();

            // Get checkbox styling from full render
            const fullRenderCheckbox = document.querySelector(
                ".challenge-checkbox"
            ) as HTMLElement;
            const fullRenderBorderColor =
                fullRenderCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-border-color"
                );

            // Clear DOM and challenge list, then add challenge incrementally
            document
                .querySelectorAll(".challenge-container")
                .forEach((container) => {
                    container.innerHTML = "";
                });
            app.challengeList.clearChallengeList();

            // Add challenge using incremental method
            const challenge = new Challenge("Challenge 1");
            app.challengeList.addChallengeObjects(challenge);
            app.addChallengeToDOM(challenge);

            // Get checkbox styling from incremental add
            const incrementalCheckbox = document.querySelector(
                ".challenge-checkbox"
            ) as HTMLElement;
            const incrementalBorderColor =
                incrementalCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-border-color"
                );

            // Verify checkbox colors match between both methods
            expect(incrementalBorderColor).toBe(fullRenderBorderColor);
            // The color should be the hex value as set by the helper function
            expect(fullRenderBorderColor).toBe("#ff6b6b");
        });
    });

    describe("Text Color Application", () => {
        it("should apply text colors to all child elements consistently", () => {
            // Configure text colors
            configManager.set("challengeRowTextColors", ["#00ff00"]);

            // Create challenge with description and progress
            const challenge = new Challenge("Test Challenge", {
                description: "Test Description",
                amount: 5,
            });
            challenge.progress = 2;

            // Test full render path
            app.challengeList.addChallengeObjects(challenge);
            app.renderChallengeList();

            const fullRenderTextElement = document.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            const fullRenderTitle = fullRenderTextElement.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const fullRenderDescription = fullRenderTextElement.querySelector(
                ".challenge-description"
            ) as HTMLElement;
            const fullRenderProgress = fullRenderTextElement.querySelector(
                ".challenge-amount"
            ) as HTMLElement;

            // Verify all elements have the text color applied
            expect(fullRenderTextElement.style.color).toBe("rgb(0, 255, 0)");
            expect(fullRenderTitle.style.color).toBe("rgb(0, 255, 0)");
            expect(fullRenderDescription.style.color).toBe("rgb(0, 255, 0)");
            expect(fullRenderProgress.style.color).toBe("rgb(0, 255, 0)");

            // Clear DOM and test incremental add path
            document
                .querySelectorAll(".challenge-container")
                .forEach((container) => {
                    container.innerHTML = "";
                });

            const newChallenge = new Challenge("Test Challenge 2", {
                description: "Test Description 2",
                amount: 3,
            });
            newChallenge.progress = 1;

            app.challengeList.addChallengeObjects(newChallenge);
            app.addChallengeToDOM(newChallenge);

            const incrementalTextElement = document.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            const incrementalTitle = incrementalTextElement.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const incrementalDescription = incrementalTextElement.querySelector(
                ".challenge-description"
            ) as HTMLElement;
            const incrementalProgress = incrementalTextElement.querySelector(
                ".challenge-amount"
            ) as HTMLElement;

            // Verify all elements have the text color applied consistently
            expect(incrementalTextElement.style.color).toBe("rgb(0, 255, 0)");
            expect(incrementalTitle.style.color).toBe("rgb(0, 255, 0)");
            expect(incrementalDescription.style.color).toBe("rgb(0, 255, 0)");
            expect(incrementalProgress.style.color).toBe("rgb(0, 255, 0)");
        });
    });

    describe("Timer Display Consistency", () => {
        it("should include timer display in both rendering paths when timer is active", () => {
            // Create challenge with timer
            const challenge = new Challenge("Timer Challenge", {
                timer: "5m",
            });
            challenge.startTimer();

            // Test full render path
            app.challengeList.addChallengeObjects(challenge);
            app.renderChallengeList();

            const fullRenderTimer = document.querySelector(".challenge-timer");
            expect(fullRenderTimer).toBeTruthy();
            expect(fullRenderTimer?.textContent).toContain("Timer:");

            // Clear DOM and test incremental add path
            document
                .querySelectorAll(".challenge-container")
                .forEach((container) => {
                    container.innerHTML = "";
                });

            const newChallenge = new Challenge("Timer Challenge 2", {
                timer: "10m",
            });
            newChallenge.startTimer();

            app.challengeList.addChallengeObjects(newChallenge);
            app.addChallengeToDOM(newChallenge);

            const incrementalTimer = document.querySelector(".challenge-timer");
            expect(incrementalTimer).toBeTruthy();
            expect(incrementalTimer?.textContent).toContain("Timer:");
        });
    });

    describe("Helper Function Isolation", () => {
        it("should handle null/undefined colors gracefully", () => {
            // Ensure no colors are configured
            configManager.set("challengeRowColors", []);
            configManager.set("challengeRowTextColors", []);

            // Add challenge and render
            app.challengeList.addChallenges("Test Challenge");
            app.renderChallengeList();

            const challengeElement = document.querySelector(
                ".challenge"
            ) as HTMLElement;
            const textElement = challengeElement.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            const checkbox = challengeElement.querySelector(
                ".challenge-checkbox"
            ) as HTMLElement;

            // Verify no colors are applied
            expect(challengeElement.style.backgroundColor).toBe("");
            expect(textElement.style.color).toBe("");
            expect(
                checkbox.style.getPropertyValue(
                    "--challenge-checkbox-border-color"
                )
            ).toBe("");
        });
    });
});
