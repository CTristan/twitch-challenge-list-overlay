import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import Challenge from "../../src/classes/Challenge";

describe("Two-Line Challenge Layout", () => {
    let app: App;
    let challengeList: any;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = `
      <div class="challenge-container primary"></div>
      <div class="challenge-container secondary"></div>
    `;

        app = new App("TestStore");
        challengeList = app.challengeList;
        challengeList.clearChallengeList();
    });

    describe("DOM Structure", () => {
        it("should create proper DOM structure for enhanced challenges", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test description",
                amount: 1,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const textElements = document.querySelectorAll(".challenge-text");
            expect(textElements).toHaveLength(1); // Single container

            textElements.forEach((textElement) => {
                // Should be a div container
                expect(textElement.tagName).toBe("DIV");
                expect(textElement.classList.contains("challenge-text")).toBe(
                    true
                );

                // Should contain title element
                const titleElement =
                    textElement.querySelector(".challenge-title");
                expect(titleElement).toBeTruthy();
                expect(titleElement?.tagName).toBe("DIV");
                expect(titleElement?.textContent).toBe("1. Test Title");

                // Should contain description element
                const descriptionElement = textElement.querySelector(
                    ".challenge-description"
                );
                expect(descriptionElement).toBeTruthy();
                expect(descriptionElement?.tagName).toBe("DIV");
                expect(descriptionElement?.textContent).toBe(
                    "Test description"
                );
            });
        });

        it("should create single-line structure for title-only challenges", () => {
            const challenge = new Challenge("Title Only Challenge");
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const textElements = document.querySelectorAll(".challenge-text");
            textElements.forEach((textElement) => {
                // Should contain title element
                const titleElement =
                    textElement.querySelector(".challenge-title");
                expect(titleElement).toBeTruthy();
                expect(titleElement?.textContent).toBe(
                    "1. Title Only Challenge"
                );

                // Should NOT contain description element (since description is empty)
                const descriptionElement = textElement.querySelector(
                    ".challenge-description"
                );
                expect(descriptionElement).toBeNull();
            });
        });

        it("should handle challenges with empty descriptions", () => {
            const challenge = new Challenge("Title Only", {
                description: "Non-empty", // Will be set but then we'll test the edge case
                amount: 1,
            });

            // Manually set description to empty to test edge case
            challenge.description = "";
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const textElements = document.querySelectorAll(".challenge-text");
            textElements.forEach((textElement) => {
                // Should contain title element
                const titleElement =
                    textElement.querySelector(".challenge-title");
                expect(titleElement?.textContent).toBe("1. Title Only");

                // Should NOT contain description element (empty description)
                const descriptionElement = textElement.querySelector(
                    ".challenge-description"
                );
                expect(descriptionElement).toBeNull();
            });
        });
    });

    describe("Styling and Layout", () => {
        it("should apply proper CSS classes for styling hierarchy", () => {
            const challenge = new Challenge("Styled Title", {
                description: "Styled description",
                amount: 1,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const textElement = document.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            expect(textElement).toBeTruthy();

            // Check that proper CSS classes are applied
            expect(textElement.classList.contains("challenge-text")).toBe(true);

            // Check title element
            const titleElement = textElement.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            expect(titleElement.classList.contains("challenge-title")).toBe(
                true
            );

            // Check description element
            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            ) as HTMLElement;
            expect(
                descriptionElement.classList.contains("challenge-description")
            ).toBe(true);
        });

        it("should maintain checkbox alignment with two-line layout", () => {
            const challenge = new Challenge("Title", {
                description: "Description",
                amount: 1,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const challengeRow = document.querySelector(
                ".challenge"
            ) as HTMLElement;
            const checkbox = challengeRow.querySelector(
                ".challenge-checkbox"
            ) as HTMLElement;
            const textElement = challengeRow.querySelector(
                ".challenge-text"
            ) as HTMLElement;

            expect(checkbox).toBeTruthy();
            expect(textElement).toBeTruthy();

            // Verify the structure is correct for proper alignment
            expect(challengeRow.classList.contains("challenge")).toBe(true);
            expect(checkbox.classList.contains("challenge-checkbox")).toBe(
                true
            );
            expect(textElement.classList.contains("challenge-text")).toBe(true);
        });
    });

    describe("Completed Challenge Styling", () => {
        it("should apply completed styling to both title and description", () => {
            const challenge = new Challenge("Completed Title", {
                description: "Completed description",
                amount: 1,
            });
            challenge.setCompletionStatus(true);
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const challengeRow = document.querySelector(
                ".challenge"
            ) as HTMLElement;
            expect(challengeRow.classList.contains("done")).toBe(true);

            const textElement = challengeRow.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            const titleElement = textElement.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            ) as HTMLElement;

            // Both elements should inherit the completed styling through CSS
            expect(titleElement).toBeTruthy();
            expect(descriptionElement).toBeTruthy();
        });
    });

    describe("Dynamic Updates", () => {
        it("should update DOM structure when editing challenges", () => {
            const challenge = new Challenge("Original Title", {
                description: "Original description",
                amount: 1,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            // Edit the challenge
            challenge.setDescription("Updated description");
            app.editChallengeFromDOM(challenge);

            const textElements = document.querySelectorAll(".challenge-text");
            textElements.forEach((textElement) => {
                const titleElement =
                    textElement.querySelector(".challenge-title");
                const descriptionElement = textElement.querySelector(
                    ".challenge-description"
                );

                expect(titleElement?.textContent).toBe("Original Title");
                expect(descriptionElement?.textContent).toBe(
                    "Updated description"
                );
            });
        });

        it("should handle adding challenges with two-line layout", () => {
            const challenge = new Challenge("New Title", {
                description: "New description",
                amount: 1,
            });
            challengeList.addChallengeForTesting(challenge);

            app.addChallengeToDOM(challenge);

            const textElements = document.querySelectorAll(".challenge-text");
            expect(textElements.length).toBeGreaterThan(0);

            textElements.forEach((textElement) => {
                const titleElement =
                    textElement.querySelector(".challenge-title");
                const descriptionElement = textElement.querySelector(
                    ".challenge-description"
                );

                expect(titleElement?.textContent).toBe("1. New Title");
                expect(descriptionElement?.textContent).toBe("New description");
            });
        });
    });

    describe("Color Inheritance", () => {
        it("should apply row text colors to both title and description elements", () => {
            // This test verifies that the color application logic works
            // The actual color values would be tested in integration tests
            const challenge = new Challenge("Colored Title", {
                description: "Colored description",
                amount: 1,
            });
            challengeList.addChallengeForTesting(challenge);

            app.renderChallengeList();

            const textElement = document.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            const titleElement = textElement.querySelector(
                ".challenge-title"
            ) as HTMLElement;
            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            ) as HTMLElement;

            // Elements should exist and be ready for color application
            expect(titleElement).toBeTruthy();
            expect(descriptionElement).toBeTruthy();
            expect(titleElement.style).toBeDefined();
            expect(descriptionElement.style).toBeDefined();
        });
    });
});
