import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";
import { setupChallengeTestDOM } from "../utils/domTestUtils";

describe("Challenge Progress Display", () => {
    let app: App;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Ensure test isolation
        ensureTestIsolation();

        // Setup DOM
        setupChallengeTestDOM();

        // Initialize components
        configManager = ConfigManager.getInstance();
        app = new App("TestStore");
        challengeList = app.challengeList;
        challengeList.clearChallengeList();
    });

    describe("Progress Display Logic", () => {
        it("should display progress when challenge amount is greater than 1", () => {
            const challenge = new Challenge("Collect Items", {
                description: "Collect various items",
                amount: 5,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const progressElements =
                document.querySelectorAll(".challenge-amount");
            expect(progressElements).toHaveLength(1); // Single container

            progressElements.forEach((progressElement) => {
                expect(progressElement.textContent).toBe("0/5");
                expect(
                    progressElement.classList.contains("challenge-amount")
                ).toBe(true);
            });
        });

        it("should not display progress when challenge amount is 1", () => {
            const challenge = new Challenge("Single Task", {
                description: "Complete this once",
                amount: 1,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const amountElements =
                document.querySelectorAll(".challenge-amount");
            expect(amountElements).toHaveLength(0);
        });

        it("should not display progress when challenge amount equals 1", () => {
            const challenge = new Challenge("Single Task Again", {
                description: "This should not show progress either",
                amount: 1,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const amountElements =
                document.querySelectorAll(".challenge-amount");
            expect(amountElements).toHaveLength(0);
        });

        it("should display progress for title-only challenges when amount > 1", () => {
            const challenge = new Challenge("Repeat Task", { amount: 3 });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const textElements = document.querySelectorAll(".challenge-text");
            textElements.forEach((textElement) => {
                // Should have title element with ID prefix
                const titleElement =
                    textElement.querySelector(".challenge-title");
                expect(titleElement?.textContent).toBe("1. Repeat Task");

                // Should NOT have description element (empty description)
                const descriptionElement = textElement.querySelector(
                    ".challenge-description"
                );
                expect(descriptionElement).toBeNull();

                // Should have progress element
                const progressElement =
                    textElement.querySelector(".challenge-amount");
                expect(progressElement?.textContent).toBe("0/3");
            });
        });
    });

    describe("DOM Structure and CSS Classes", () => {
        it("should create proper DOM structure for progress element", () => {
            const challenge = new Challenge("Multi Task", {
                description: "Do this multiple times",
                amount: 10,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const textElements = document.querySelectorAll(".challenge-text");
            textElements.forEach((textElement) => {
                // Validate container structure
                expect(textElement.tagName).toBe("DIV");
                expect(textElement.classList.contains("challenge-text")).toBe(
                    true
                );

                // Validate title element
                const titleElement = textElement.querySelector(
                    ".challenge-title"
                ) as HTMLElement;
                expect(titleElement).toBeTruthy();
                expect(titleElement.tagName).toBe("DIV");

                // Validate description element
                const descriptionElement = textElement.querySelector(
                    ".challenge-description"
                ) as HTMLElement;
                expect(descriptionElement).toBeTruthy();
                expect(descriptionElement.tagName).toBe("DIV");

                // Validate progress element
                const progressElement = textElement.querySelector(
                    ".challenge-amount"
                ) as HTMLElement;
                expect(progressElement).toBeTruthy();
                expect(progressElement.tagName).toBe("DIV");
                expect(
                    progressElement.classList.contains("challenge-amount")
                ).toBe(true);

                // Validate element order (title, description, progress)
                const children = Array.from(textElement.children);
                expect(children[0]).toBe(titleElement);
                expect(children[1]).toBe(descriptionElement);
                expect(children[2]).toBe(progressElement);
            });
        });

        it("should apply proper CSS classes and structure", () => {
            const challenge = new Challenge("Styled Challenge", {
                description: "With progress styling",
                amount: 7,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const progressElement = document.querySelector(
                ".challenge-amount"
            ) as HTMLElement;
            expect(progressElement).toBeTruthy();
            expect(progressElement.classList.contains("challenge-amount")).toBe(
                true
            );
            expect(progressElement.textContent).toBe("0/7");
        });
    });

    describe("Color Inheritance", () => {
        it("should apply row text colors to progress element", () => {
            configManager.set("challengeRowTextColors", ["#ff0000"]);

            const challenge = new Challenge("Colored Challenge", {
                description: "With colored progress",
                amount: 4,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const progressElements =
                document.querySelectorAll(".challenge-amount");
            progressElements.forEach((progressElement) => {
                expect((progressElement as HTMLElement).style.color).toBe(
                    "rgb(255, 0, 0)"
                ); // red
            });
        });

        it("should preserve color styling when editing challenges", () => {
            configManager.set("challengeRowTextColors", ["#00ff00"]);

            const challenge = new Challenge("Original Title", {
                description: "Original description",
                amount: 2,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            // Edit the challenge
            challenge.setTitle("Updated Title");
            challenge.setDescription("Updated description");
            challenge.setAmount(6);
            app.editChallengeFromDOM(challenge);

            const progressElements =
                document.querySelectorAll(".challenge-amount");
            progressElements.forEach((progressElement) => {
                expect((progressElement as HTMLElement).style.color).toBe(
                    "rgb(0, 255, 0)"
                ); // green
                expect(progressElement.textContent).toBe("0/6");
            });
        });
    });

    describe("Dynamic Challenge Operations", () => {
        it("should display progress when adding challenges dynamically", () => {
            const challenge = new Challenge("Dynamic Challenge", {
                description: "Added dynamically",
                amount: 8,
            });
            challengeList.addChallengeForTesting(challenge);

            app.addChallengeToDOM(challenge);

            const progressElements =
                document.querySelectorAll(".challenge-amount");
            expect(progressElements.length).toBeGreaterThan(0);

            progressElements.forEach((progressElement) => {
                expect(progressElement.textContent).toBe("0/8");
            });
        });

        it("should update progress display when editing challenge amount", () => {
            const challenge = new Challenge("Editable Challenge", {
                description: "Will be edited",
                amount: 3,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            // Verify initial progress
            let progressElements =
                document.querySelectorAll(".challenge-amount");
            progressElements.forEach((progressElement) => {
                expect(progressElement.textContent).toBe("0/3");
            });

            // Edit the amount
            challenge.setAmount(12);
            app.editChallengeFromDOM(challenge);

            // Verify updated progress
            progressElements = document.querySelectorAll(".challenge-amount");
            progressElements.forEach((progressElement) => {
                expect(progressElement.textContent).toBe("0/12");
            });
        });

        it("should remove progress display when editing amount to 1", () => {
            const challenge = new Challenge("Progress Removal Test", {
                description: "Progress will be removed",
                amount: 5,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            // Verify initial progress display
            let progressElements =
                document.querySelectorAll(".challenge-amount");
            expect(progressElements.length).toBeGreaterThan(0);
            expect(progressElements[0]?.textContent).toBe("0/5");

            // Edit the amount to 1
            challenge.setAmount(1);
            app.editChallengeFromDOM(challenge);

            // Verify progress display is removed
            progressElements = document.querySelectorAll(".challenge-amount");
            expect(progressElements).toHaveLength(0);
        });
    });

    describe("Completed Challenge Styling", () => {
        it("should apply done styling to progress element when challenge is completed", () => {
            const challenge = new Challenge("Completable Challenge", {
                description: "Will be completed",
                amount: 3,
            });
            challengeList.addChallengeForTesting(challenge);

            // Complete the challenge
            challenge.setCompletionStatus(true);

            app.renderChallengeList();

            const challengeElements =
                document.querySelectorAll(".challenge.done");
            expect(challengeElements.length).toBeGreaterThan(0);

            const progressElements = document.querySelectorAll(
                ".challenge.done .challenge-amount"
            );
            expect(progressElements.length).toBeGreaterThan(0);

            progressElements.forEach((progressElement) => {
                expect(progressElement.textContent).toBe("0/3");
            });
        });
    });

    describe("Progress Updates", () => {
        it("should update progress display when challenge progress changes", () => {
            const challenge = new Challenge("Progress Challenge", {
                description: "Progress will be updated",
                amount: 10,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            // Verify initial progress
            let progressElements =
                document.querySelectorAll(".challenge-amount");
            progressElements.forEach((progressElement) => {
                expect(progressElement.textContent).toBe("0/10");
            });

            // Update progress
            challenge.setProgress(3);
            app.editChallengeFromDOM(challenge);

            // Verify updated progress
            progressElements = document.querySelectorAll(".challenge-amount");
            progressElements.forEach((progressElement) => {
                expect(progressElement.textContent).toBe("3/10");
            });

            // Update progress again
            challenge.setProgress(7);
            app.editChallengeFromDOM(challenge);

            // Verify final progress
            progressElements = document.querySelectorAll(".challenge-amount");
            progressElements.forEach((progressElement) => {
                expect(progressElement.textContent).toBe("7/10");
            });
        });
    });
});
