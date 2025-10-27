import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import ChallengeList from "../../src/classes/ChallengeList";
import {
    CSS_CLASSES,
    CSS_SELECTORS,
    URL_HASH,
} from "../../src/types/DOMConstants";

describe("Challenge Checkbox Functionality", () => {
    let app: App;
    let challengeList: ChallengeList;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = `
      <main id="app">
        <div class="challenge-wrapper">
          <div class="challenge-container primary"></div>
          <div class="challenge-container secondary"></div>
        </div>
      </main>
    `;

        // Create App instance with test store name
        app = new App("test-checkbox");
        challengeList = app.challengeList;
        challengeList.clearChallengeList();
        window.location.hash = URL_HASH.ADMIN;
    });

    describe("Checkbox Creation and Display", () => {
        it("should create checkboxes for challenges when rendering challenge list", () => {
            // Add a challenge
            challengeList.addChallenges("Test challenge");

            // Render the challenge list
            app.renderChallengeList();

            // Check that checkbox elements are created
            const checkboxes = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            expect(checkboxes).toHaveLength(1); // Single container

            // Check that checkboxes are not checked initially
            checkboxes.forEach((checkbox) => {
                expect(checkbox.classList.contains(CSS_CLASSES.CHECKED)).toBe(
                    false
                );
            });
        });

        it("should create checkboxes when adding challenges to DOM", () => {
            const challenges = challengeList.addChallenges("New challenge");
            const challenge = challenges[0];
            if (!challenge) throw new Error("Challenge not created");

            // Add challenge to DOM
            app.addChallengeToDOM(challenge);

            // Check that checkbox elements are created
            const checkboxes = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            expect(checkboxes).toHaveLength(1); // Single container

            // Check that checkboxes are not checked initially
            checkboxes.forEach((checkbox) => {
                expect(checkbox.classList.contains(CSS_CLASSES.CHECKED)).toBe(
                    false
                );
            });
        });

        it("should display challenge text in separate container with title and description elements", () => {
            challengeList.addChallenges("Test challenge text");
            app.renderChallengeList();

            const textElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_TEXT
            );
            expect(textElements).toHaveLength(1); // Single container

            textElements.forEach((textElement) => {
                expect(textElement.textContent).toBe("1. Test challenge text");

                // Verify the structure contains title element with ID prefix
                const titleElement = textElement.querySelector(
                    CSS_SELECTORS.CHALLENGE_TITLE
                );
                expect(titleElement).toBeTruthy();
                expect(titleElement?.textContent).toBe(
                    "1. Test challenge text"
                );

                // For legacy challenges, there should be no description element
                const descriptionElement = textElement.querySelector(
                    CSS_SELECTORS.CHALLENGE_DESCRIPTION
                );
                expect(descriptionElement).toBeNull();
            });
        });
    });

    describe("Checkbox State Updates", () => {
        it("should check checkbox when challenge is completed", () => {
            const challenges = challengeList.addChallenges("Complete me");
            const challenge = challenges[0];
            if (!challenge) throw new Error("Challenge not created");
            app.renderChallengeList();

            // Complete the challenge
            challengeList.completeChallenges(0);
            app.completeChallengeFromDOM(challenge.id);

            // Check that checkboxes are now checked
            const checkboxes = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            checkboxes.forEach((checkbox) => {
                expect(checkbox.classList.contains(CSS_CLASSES.CHECKED)).toBe(
                    true
                );
            });
        });

        it("should render completed challenges with checked checkboxes", () => {
            challengeList.addChallenges("Already complete");
            challengeList.completeChallenges(0);

            // Render the challenge list (should show as completed)
            app.renderChallengeList();

            // Check that checkboxes are checked
            const checkboxes = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            checkboxes.forEach((checkbox) => {
                expect(checkbox.classList.contains(CSS_CLASSES.CHECKED)).toBe(
                    true
                );
            });
        });

        it("should maintain done class along with checkbox state", () => {
            const challenges = challengeList.addChallenges("Test done styling");
            const challenge = challenges[0];
            if (!challenge) throw new Error("Challenge not created");
            app.renderChallengeList();

            // Complete the challenge
            challengeList.completeChallenges(0);
            app.completeChallengeFromDOM(challenge.id);

            // Check that both done class and checked checkbox are present
            const challengeElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE
            );
            challengeElements.forEach((challengeElement) => {
                expect(
                    challengeElement.classList.contains(CSS_CLASSES.DONE)
                ).toBe(true);

                const checkbox = challengeElement.querySelector(
                    CSS_SELECTORS.CHALLENGE_CHECKBOX
                );
                expect(checkbox?.classList.contains(CSS_CLASSES.CHECKED)).toBe(
                    true
                );
            });
        });

        it("should apply strikethrough styling only to text, not checkbox", () => {
            const challenges =
                challengeList.addChallenges("Test strikethrough");
            const challenge = challenges[0];
            if (!challenge) throw new Error("Challenge not created");
            app.renderChallengeList();

            // Complete the challenge
            challengeList.completeChallenges(0);
            app.completeChallengeFromDOM(challenge.id);

            // Check that the challenge element has the done class
            const challengeElements = document.querySelectorAll(
                `${CSS_SELECTORS.CHALLENGE}.${CSS_CLASSES.DONE}`
            );
            expect(challengeElements).toHaveLength(1);

            // Check that text elements exist within done challenges
            const textElements = document.querySelectorAll(
                `${CSS_SELECTORS.CHALLENGE}.${CSS_CLASSES.DONE} ${CSS_SELECTORS.CHALLENGE_TEXT}`
            );
            expect(textElements).toHaveLength(1);

            // Verify that checkboxes exist but are separate from text styling
            const checkboxes = document.querySelectorAll(
                `${CSS_SELECTORS.CHALLENGE}.${CSS_CLASSES.DONE} ${CSS_SELECTORS.CHALLENGE_CHECKBOX}`
            );
            expect(checkboxes).toHaveLength(1);

            // The CSS selector ".challenge.done .challenge-text" should target only text
            // This test verifies the DOM structure supports the CSS fix
            textElements.forEach((textElement) => {
                expect(textElement.textContent).toBe("1. Test strikethrough");
            });
        });
    });

    describe("Challenge Text Editing", () => {
        it("should update challenge text without affecting checkbox", () => {
            challengeList.addChallenges("Original text");
            app.renderChallengeList();

            // Edit the challenge
            const updatedChallenge = challengeList.editChallenge(
                0,
                "Updated text"
            );
            app.editChallengeFromDOM(updatedChallenge);

            // Check that text is updated (new DOM structure shows title and description separately)
            const textElements = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_TEXT
            );
            textElements.forEach((textElement) => {
                // With the new DOM structure, textContent concatenates title + description
                expect(textElement.textContent).toBe(
                    "Original textUpdated text"
                );

                // Also verify the individual elements exist
                const titleElement = textElement.querySelector(
                    CSS_SELECTORS.CHALLENGE_TITLE
                );
                const descriptionElement = textElement.querySelector(
                    CSS_SELECTORS.CHALLENGE_DESCRIPTION
                );
                expect(titleElement?.textContent).toBe("Original text");
                expect(descriptionElement?.textContent).toBe("Updated text");
            });

            // Check that checkbox is still present and unchecked
            const checkboxes = document.querySelectorAll(
                CSS_SELECTORS.CHALLENGE_CHECKBOX
            );
            checkboxes.forEach((checkbox) => {
                expect(checkbox.classList.contains(CSS_CLASSES.CHECKED)).toBe(
                    false
                );
            });
        });
    });
});
