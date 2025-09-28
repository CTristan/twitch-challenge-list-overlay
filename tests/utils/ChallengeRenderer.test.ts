import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeRenderer from "../../src/utils/ChallengeRenderer";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("ChallengeRenderer", () => {
    beforeEach(() => {
        ensureTestIsolation();
    });

    describe("createChallengeTextElement", () => {
        it("should create proper DOM structure for challenge with title only", () => {
            const challenge = new Challenge("Test Title");
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            // Should not have description or progress elements
            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeNull();

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeNull();
        });

        it("should create proper DOM structure for challenge with title and description", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
            });
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toBe("Test Description");

            // Should not have progress element for amount=1
            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeNull();
        });

        it("should create proper DOM structure for challenge with progress", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
                amount: 5,
            });
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toBe("Test Description");

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeTruthy();
            expect(progressElement?.textContent).toBe("0/5");
        });

        it("should not include timer in text element", () => {
            const challenge = new Challenge("Test Title", {
                timer: "10s",
            });
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            // Timer should NOT be included in text element (it's added separately)
            const timerElement = textElement.querySelector(".challenge-timer");
            expect(timerElement).toBeNull();
        });
    });

    describe("createChallengeCheckbox", () => {
        it("should create unchecked checkbox by default", () => {
            const checkbox = ChallengeRenderer.createChallengeCheckbox();

            expect(checkbox.classList.contains("challenge-checkbox")).toBe(
                true
            );
            expect(checkbox.classList.contains("checked")).toBe(false);
        });

        it("should create checked checkbox when specified", () => {
            const checkbox = ChallengeRenderer.createChallengeCheckbox(true);

            expect(checkbox.classList.contains("challenge-checkbox")).toBe(
                true
            );
            expect(checkbox.classList.contains("checked")).toBe(true);
        });

        it("should create unchecked checkbox when explicitly false", () => {
            const checkbox = ChallengeRenderer.createChallengeCheckbox(false);

            expect(checkbox.classList.contains("challenge-checkbox")).toBe(
                true
            );
            expect(checkbox.classList.contains("checked")).toBe(false);
        });
    });

    describe("createChallengeElement", () => {
        it("should create complete challenge element with all components", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
                amount: 3,
            });

            const challengeElement =
                ChallengeRenderer.createChallengeElement(challenge);

            expect(challengeElement.tagName).toBe("LI");
            expect(challengeElement.classList.contains("challenge")).toBe(true);
            expect(challengeElement.dataset["challengeId"]).toBe(challenge.id);

            // Should have checkbox
            const checkbox = challengeElement.querySelector(
                ".challenge-checkbox"
            );
            expect(checkbox).toBeTruthy();

            // Should have text element
            const textElement =
                challengeElement.querySelector(".challenge-text");
            expect(textElement).toBeTruthy();

            // Should have title, description, and progress
            const titleElement =
                challengeElement.querySelector(".challenge-title");
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = challengeElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement?.textContent).toBe("Test Description");

            const progressElement =
                challengeElement.querySelector(".challenge-amount");
            expect(progressElement?.textContent).toBe("0/3");
        });

        it("should mark completed challenges with done class", () => {
            const challenge = new Challenge("Test Title");
            challenge.setCompletionStatus(true);

            const challengeElement =
                ChallengeRenderer.createChallengeElement(challenge);

            expect(challengeElement.classList.contains("done")).toBe(true);

            const checkbox = challengeElement.querySelector(
                ".challenge-checkbox"
            );
            expect(checkbox?.classList.contains("checked")).toBe(true);
        });
    });
});
