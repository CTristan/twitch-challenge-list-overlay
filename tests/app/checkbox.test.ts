import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import ChallengeList from "../../src/classes/ChallengeList";

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
  });

  describe("Checkbox Creation and Display", () => {
    it("should create checkboxes for challenges when rendering challenge list", () => {
      // Add a challenge
      const challenge = challengeList.addChallenges("Test challenge")[0];

      // Render the challenge list
      app.renderChallengeList();

      // Check that checkbox elements are created
      const checkboxes = document.querySelectorAll(".challenge-checkbox");
      expect(checkboxes).toHaveLength(2); // Primary and secondary containers

      // Check that checkboxes are not checked initially
      checkboxes.forEach((checkbox) => {
        expect(checkbox.classList.contains("checked")).toBe(false);
      });
    });

    it("should create checkboxes when adding challenges to DOM", () => {
      const challenge = challengeList.addChallenges("New challenge")[0];

      // Add challenge to DOM
      app.addChallengeToDOM(challenge);

      // Check that checkbox elements are created
      const checkboxes = document.querySelectorAll(".challenge-checkbox");
      expect(checkboxes).toHaveLength(2); // Primary and secondary containers

      // Check that checkboxes are not checked initially
      checkboxes.forEach((checkbox) => {
        expect(checkbox.classList.contains("checked")).toBe(false);
      });
    });

    it("should display challenge text in separate container with title and description elements", () => {
      const challenge = challengeList.addChallenges("Test challenge text")[0];
      app.renderChallengeList();

      const textElements = document.querySelectorAll(".challenge-text");
      expect(textElements).toHaveLength(2); // Primary and secondary containers

      textElements.forEach((textElement) => {
        expect(textElement.textContent).toBe("Test challenge text");

        // Verify the structure contains title element
        const titleElement = textElement.querySelector(".challenge-title");
        expect(titleElement).toBeTruthy();
        expect(titleElement?.textContent).toBe("Test challenge text");

        // For legacy challenges, there should be no description element
        const descriptionElement = textElement.querySelector(".challenge-description");
        expect(descriptionElement).toBeNull();
      });
    });
  });

  describe("Checkbox State Updates", () => {
    it("should check checkbox when challenge is completed", () => {
      const challenge = challengeList.addChallenges("Complete me")[0];
      app.renderChallengeList();

      // Complete the challenge
      challengeList.completeChallenges(0);
      app.completeChallengeFromDOM(challenge.id);

      // Check that checkboxes are now checked
      const checkboxes = document.querySelectorAll(".challenge-checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox.classList.contains("checked")).toBe(true);
      });
    });

    it("should render completed challenges with checked checkboxes", () => {
      const challenge = challengeList.addChallenges("Already complete")[0];
      challengeList.completeChallenges(0);

      // Render the challenge list (should show as completed)
      app.renderChallengeList();

      // Check that checkboxes are checked
      const checkboxes = document.querySelectorAll(".challenge-checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox.classList.contains("checked")).toBe(true);
      });
    });

    it("should maintain done class along with checkbox state", () => {
      const challenge = challengeList.addChallenges("Test done styling")[0];
      app.renderChallengeList();

      // Complete the challenge
      challengeList.completeChallenges(0);
      app.completeChallengeFromDOM(challenge.id);

      // Check that both done class and checked checkbox are present
      const challengeElements = document.querySelectorAll(".challenge");
      challengeElements.forEach((challengeElement) => {
        expect(challengeElement.classList.contains("done")).toBe(true);

        const checkbox = challengeElement.querySelector(".challenge-checkbox");
        expect(checkbox?.classList.contains("checked")).toBe(true);
      });
    });

    it("should apply strikethrough styling only to text, not checkbox", () => {
      const challenge = challengeList.addChallenges("Test strikethrough")[0];
      app.renderChallengeList();

      // Complete the challenge
      challengeList.completeChallenges(0);
      app.completeChallengeFromDOM(challenge.id);

      // Check that the challenge element has the done class
      const challengeElements = document.querySelectorAll(".challenge.done");
      expect(challengeElements).toHaveLength(2);

      // Check that text elements exist within done challenges
      const textElements = document.querySelectorAll(
        ".challenge.done .challenge-text"
      );
      expect(textElements).toHaveLength(2);

      // Verify that checkboxes exist but are separate from text styling
      const checkboxes = document.querySelectorAll(
        ".challenge.done .challenge-checkbox"
      );
      expect(checkboxes).toHaveLength(2);

      // The CSS selector ".challenge.done .challenge-text" should target only text
      // This test verifies the DOM structure supports the CSS fix
      textElements.forEach((textElement) => {
        expect(textElement.textContent).toBe("Test strikethrough");
      });
    });
  });

  describe("Challenge Text Editing", () => {
    it("should update challenge text without affecting checkbox", () => {
      const challenge = challengeList.addChallenges("Original text")[0];
      app.renderChallengeList();

      // Edit the challenge
      const updatedChallenge = challengeList.editChallenge(0, "Updated text");
      app.editChallengeFromDOM(updatedChallenge);

      // Check that text is updated (new DOM structure shows title and description separately)
      const textElements = document.querySelectorAll(".challenge-text");
      textElements.forEach((textElement) => {
        // With the new DOM structure, textContent concatenates title + description
        expect(textElement.textContent).toBe("Original textUpdated text");

        // Also verify the individual elements exist
        const titleElement = textElement.querySelector(".challenge-title");
        const descriptionElement = textElement.querySelector(".challenge-description");
        expect(titleElement?.textContent).toBe("Original text");
        expect(descriptionElement?.textContent).toBe("Updated text");
      });

      // Check that checkbox is still present and unchecked
      const checkboxes = document.querySelectorAll(".challenge-checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox.classList.contains("checked")).toBe(false);
      });
    });
  });
});
