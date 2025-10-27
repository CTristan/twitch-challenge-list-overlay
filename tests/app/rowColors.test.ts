import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import ConfigManager from "../../src/classes/ConfigManager";
import { CSS_SELECTORS, URL_HASH } from "../../src/types/DOMConstants";

describe("Challenge Row Colors", () => {
    let app: App;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
      <div class="challenge-container primary"></div>
      <div class="challenge-container secondary"></div>
    `;

        // Get ConfigManager instance and reset challengeRowColors and challengeRowTextColors
        configManager = ConfigManager.getInstance();
        configManager.set("challengeRowColors", []);
        configManager.set("challengeRowTextColors", []);

        app = new App("test-store");
        window.location.hash = URL_HASH.ADMIN;
    });

    describe("No colors configured", () => {
        it("should not apply background colors when challengeRowColors is empty", () => {
            // Add some challenges
            app.challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);

            // Render the list
            app.renderChallengeList();

            // Check that no background colors are applied
            const challengeElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE
            );
            challengeElements.forEach((element) => {
                expect((element as HTMLElement).style.backgroundColor).toBe("");
            });
        });
    });

    describe("Single color configured", () => {
        it("should apply the same color to all rows", () => {
            configManager.set("challengeRowColors", ["#ff0000"]);

            app.challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
            app.renderChallengeList();

            const challengeElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE
            );
            challengeElements.forEach((element) => {
                expect((element as HTMLElement).style.backgroundColor).toBe(
                    "rgb(255, 0, 0)"
                );
            });
        });
    });

    describe("Two colors configured", () => {
        it("should alternate between two colors", () => {
            configManager.set("challengeRowColors", ["#ff0000", "#00ff00"]);

            app.challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
                "Challenge 4",
            ]);
            app.renderChallengeList();

            const challengeElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE
            );
            expect(
                (challengeElements[0] as HTMLElement).style.backgroundColor
            ).toBe("rgb(255, 0, 0)"); // red
            expect(
                (challengeElements[1] as HTMLElement).style.backgroundColor
            ).toBe("rgb(0, 255, 0)"); // green
            expect(
                (challengeElements[2] as HTMLElement).style.backgroundColor
            ).toBe("rgb(255, 0, 0)"); // red
            expect(
                (challengeElements[3] as HTMLElement).style.backgroundColor
            ).toBe("rgb(0, 255, 0)"); // green
        });
    });

    describe("Three colors configured", () => {
        it("should rotate through three colors", () => {
            configManager.set("challengeRowColors", [
                "#ff0000",
                "#00ff00",
                "#0000ff",
            ]);

            app.challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
                "Challenge 4",
                "Challenge 5",
                "Challenge 6",
            ]);
            app.renderChallengeList();

            const challengeElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE
            );
            expect(
                (challengeElements[0] as HTMLElement).style.backgroundColor
            ).toBe("rgb(255, 0, 0)"); // red
            expect(
                (challengeElements[1] as HTMLElement).style.backgroundColor
            ).toBe("rgb(0, 255, 0)"); // green
            expect(
                (challengeElements[2] as HTMLElement).style.backgroundColor
            ).toBe("rgb(0, 0, 255)"); // blue
            expect(
                (challengeElements[3] as HTMLElement).style.backgroundColor
            ).toBe("rgb(255, 0, 0)"); // red
            expect(
                (challengeElements[4] as HTMLElement).style.backgroundColor
            ).toBe("rgb(0, 255, 0)"); // green
            expect(
                (challengeElements[5] as HTMLElement).style.backgroundColor
            ).toBe("rgb(0, 0, 255)"); // blue
        });
    });

    describe("Dynamic challenge addition", () => {
        it("should apply correct colors when adding challenges dynamically", () => {
            configManager.set("challengeRowColors", ["#ff0000", "#00ff00"]);

            // Add initial challenges
            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            app.renderChallengeList();

            // Add a new challenge dynamically
            const newChallenges = app.challengeList.addChallenges([
                "Challenge 3",
            ]);
            const newChallenge = newChallenges[0];
            if (!newChallenge) throw new Error("Challenge not created");
            app.addChallengeToDOM(newChallenge);

            const challengeElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE
            );
            expect(
                (challengeElements[0] as HTMLElement).style.backgroundColor
            ).toBe("rgb(255, 0, 0)"); // red
            expect(
                (challengeElements[1] as HTMLElement).style.backgroundColor
            ).toBe("rgb(0, 255, 0)"); // green
            expect(
                (challengeElements[2] as HTMLElement).style.backgroundColor
            ).toBe("rgb(255, 0, 0)"); // red (3rd challenge, index 2)
        });
    });
});

describe("Challenge Row Text Colors", () => {
    let app: App;
    let configManager: ConfigManager;

    beforeEach(() => {
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

    describe("No text colors configured", () => {
        it("should not apply text colors when challengeRowTextColors is empty", () => {
            // Add some challenges
            app.challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);

            // Render the list
            app.renderChallengeList();

            // Check that no text colors are applied
            const textElements = document.querySelectorAll(".challenge-text");
            textElements.forEach((element) => {
                expect((element as HTMLElement).style.color).toBe("");
            });
        });
    });

    describe("Single text color configured", () => {
        it("should apply the same text color to all rows", () => {
            configManager.set("challengeRowTextColors", ["#ff0000"]);

            app.challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
            ]);
            app.renderChallengeList();

            const textElements = document.querySelectorAll(".challenge-text");
            textElements.forEach((element) => {
                expect((element as HTMLElement).style.color).toBe(
                    "rgb(255, 0, 0)"
                );
            });
        });
    });

    describe("Two text colors configured", () => {
        it("should alternate between two text colors", () => {
            configManager.set("challengeRowTextColors", ["#ff0000", "#00ff00"]);

            app.challengeList.addChallenges([
                "Challenge 1",
                "Challenge 2",
                "Challenge 3",
                "Challenge 4",
            ]);
            app.renderChallengeList();

            const textElements = document.querySelectorAll(".challenge-text");
            expect((textElements[0] as HTMLElement).style.color).toBe(
                "rgb(255, 0, 0)"
            ); // red
            expect((textElements[1] as HTMLElement).style.color).toBe(
                "rgb(0, 255, 0)"
            ); // green
            expect((textElements[2] as HTMLElement).style.color).toBe(
                "rgb(255, 0, 0)"
            ); // red
            expect((textElements[3] as HTMLElement).style.color).toBe(
                "rgb(0, 255, 0)"
            ); // green
        });
    });

    describe("Combined background and text colors", () => {
        it("should apply both background and text colors when both are configured", () => {
            configManager.set("challengeRowColors", ["#000000", "#ffffff"]);
            configManager.set("challengeRowTextColors", ["#ffffff", "#000000"]);

            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            app.renderChallengeList();

            const challengeElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE
            );
            const textElements = document.querySelectorAll(".challenge-text");

            // First challenge: black background, white text
            expect(
                (challengeElements[0] as HTMLElement).style.backgroundColor
            ).toBe("rgb(0, 0, 0)");
            expect((textElements[0] as HTMLElement).style.color).toBe(
                "rgb(255, 255, 255)"
            );

            // Second challenge: white background, black text
            expect(
                (challengeElements[1] as HTMLElement).style.backgroundColor
            ).toBe("rgb(255, 255, 255)");
            expect((textElements[1] as HTMLElement).style.color).toBe(
                "rgb(0, 0, 0)"
            );
        });
    });

    describe("Dynamic challenge addition with text colors", () => {
        it("should apply correct text colors when adding challenges dynamically", () => {
            configManager.set("challengeRowTextColors", ["#ff0000", "#00ff00"]);

            // Add initial challenges
            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            app.renderChallengeList();

            // Add a new challenge dynamically
            const newChallenges = app.challengeList.addChallenges([
                "Challenge 3",
            ]);
            const newChallenge = newChallenges[0];
            if (!newChallenge) throw new Error("Challenge not created");
            app.addChallengeToDOM(newChallenge);

            const textElements = document.querySelectorAll(".challenge-text");
            expect((textElements[2] as HTMLElement).style.color).toBe(
                "rgb(255, 0, 0)"
            ); // red (3rd challenge, index 2)
        });
    });
});

describe("Challenge Checkbox Color Inheritance", () => {
    let app: App;
    let configManager: ConfigManager;

    beforeEach(() => {
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

    describe("No text colors configured", () => {
        it("should not apply custom checkbox colors when challengeRowTextColors is empty", () => {
            // Add some challenges
            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);

            // Render the list
            app.renderChallengeList();

            // Check that no custom checkbox colors are applied
            const checkboxElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            checkboxElements.forEach((element) => {
                const checkbox = element as HTMLElement;
                expect(
                    checkbox.style.getPropertyValue(
                        "--challenge-checkbox-border-color"
                    )
                ).toBe("");
                expect(
                    checkbox.style.getPropertyValue(
                        "--challenge-checkbox-checked-border-color"
                    )
                ).toBe("");
                expect(
                    checkbox.style.getPropertyValue(
                        "--challenge-checkbox-checkmark-color"
                    )
                ).toBe("");
            });
        });
    });

    describe("Text colors configured", () => {
        it("should apply checkbox colors to match text colors", () => {
            configManager.set("challengeRowTextColors", ["#ff0000", "#00ff00"]);

            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            app.renderChallengeList();

            const checkboxElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );

            // First checkbox should have red colors
            const firstCheckbox = checkboxElements[0] as HTMLElement;
            expect(
                firstCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-border-color"
                )
            ).toBe("#ff0000");
            expect(
                firstCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-checked-border-color"
                )
            ).toBe("#ff0000");
            expect(
                firstCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-checkmark-color"
                )
            ).toBe("#ff0000");

            // Second checkbox should have green colors
            const secondCheckbox = checkboxElements[1] as HTMLElement;
            expect(
                secondCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-border-color"
                )
            ).toBe("#00ff00");
            expect(
                secondCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-checked-border-color"
                )
            ).toBe("#00ff00");
            expect(
                secondCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-checkmark-color"
                )
            ).toBe("#00ff00");
        });

        it("should apply checkbox colors when adding challenges dynamically", () => {
            configManager.set("challengeRowTextColors", ["#ff0000", "#00ff00"]);

            // Add initial challenges
            app.challengeList.addChallenges(["Challenge 1", "Challenge 2"]);
            app.renderChallengeList();

            // Add a new challenge dynamically
            const newChallenges = app.challengeList.addChallenges([
                "Challenge 3",
            ]);
            const newChallenge = newChallenges[0];
            if (!newChallenge) throw new Error("Challenge not created");
            app.addChallengeToDOM(newChallenge);

            const checkboxElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );

            // Third challenge should have red color (rotating back to first color)
            const thirdCheckbox = checkboxElements[2] as HTMLElement;
            expect(
                thirdCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-border-color"
                )
            ).toBe("#ff0000");
            expect(
                thirdCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-checked-border-color"
                )
            ).toBe("#ff0000");
            expect(
                thirdCheckbox.style.getPropertyValue(
                    "--challenge-checkbox-checkmark-color"
                )
            ).toBe("#ff0000");
        });

        it("should apply checkbox colors to both primary and secondary containers", () => {
            configManager.set("challengeRowTextColors", ["#ff0000"]);

            const challenges = app.challengeList.addChallenges([
                "Test challenge",
            ]);
            const challenge = challenges[0];
            if (!challenge) throw new Error("Challenge not created");
            app.addChallengeToDOM(challenge);

            const checkboxElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            expect(checkboxElements).toHaveLength(1); // Single container

            // Both checkboxes should have the same red color
            checkboxElements.forEach((element) => {
                const checkbox = element as HTMLElement;
                expect(
                    checkbox.style.getPropertyValue(
                        "--challenge-checkbox-border-color"
                    )
                ).toBe("#ff0000");
                expect(
                    checkbox.style.getPropertyValue(
                        "--challenge-checkbox-checked-border-color"
                    )
                ).toBe("#ff0000");
                expect(
                    checkbox.style.getPropertyValue(
                        "--challenge-checkbox-checkmark-color"
                    )
                ).toBe("#ff0000");
            });
        });

        it("should maintain checkbox colors when challenge is completed", () => {
            configManager.set("challengeRowTextColors", ["#ff0000"]);

            const challenges = app.challengeList.addChallenges(["Complete me"]);
            const challenge = challenges[0];
            if (!challenge) throw new Error("Challenge not created");
            app.renderChallengeList();

            // Complete the challenge
            app.challengeList.completeChallenges(0);
            app.completeChallengeFromDOM(challenge.id);

            const checkboxElements = document.querySelectorAll(
                ".challenge-checkbox.checked"
            );
            expect(checkboxElements).toHaveLength(1); // Single container

            // Completed checkboxes should still have the custom colors
            checkboxElements.forEach((element) => {
                const checkbox = element as HTMLElement;
                expect(
                    checkbox.style.getPropertyValue(
                        "--challenge-checkbox-border-color"
                    )
                ).toBe("#ff0000");
                expect(
                    checkbox.style.getPropertyValue(
                        "--challenge-checkbox-checked-border-color"
                    )
                ).toBe("#ff0000");
                expect(
                    checkbox.style.getPropertyValue(
                        "--challenge-checkbox-checkmark-color"
                    )
                ).toBe("#ff0000");
            });
        });
    });
});
