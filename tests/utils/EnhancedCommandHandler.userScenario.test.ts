import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import ChallengeList from "../../src/classes/ChallengeList";

describe("Enhanced Command Handler - User Scenario", () => {
  let app: App;
  let challengeList: ChallengeList;

  beforeEach(() => {
    // Clear localStorage to avoid conflicts with existing data
    localStorage.clear();
    
    // Clear DOM
    document.body.innerHTML = `
      <div class="challenge-container primary"></div>
      <div class="challenge-container secondary"></div>
    `;

    app = new App("TestStore");
    challengeList = app.challengeList;
    challengeList.clearChallengeList();
  });

  it('should handle the exact user scenario: !ch add t="Testing Descriptions" d="Should see a description for this challenge!"', () => {
    // Simulate the exact command from the user's request
    const response = app.chatHandler(
      "testuser",
      "ch",
      'add t="Testing Descriptions" d="Should see a description for this challenge!"',
      { broadcaster: true }, // Mod permissions
      { messageId: "test123" }
    );

    // Command should succeed
    expect(response.error).toBe(false);
    expect(response.message).toContain("Testing Descriptions");

    // Challenge should be added to the list
    expect(challengeList.challenges.length).toBe(1);
    
    const challenge = challengeList.challenges[0];
    expect(challenge.title).toBe("Testing Descriptions");
    expect(challenge.description).toBe("Should see a description for this challenge!");
    expect(challenge.title).not.toBe(challenge.description); // Should be different

    // Check DOM structure - should display both title and description
    const textElements = document.querySelectorAll(".challenge-text");
    expect(textElements.length).toBeGreaterThan(0);

    textElements.forEach((textElement) => {
      // Should contain title element
      const titleElement = textElement.querySelector(".challenge-title");
      expect(titleElement).toBeTruthy();
      expect(titleElement?.textContent).toBe("Testing Descriptions");

      // Should contain description element (since title !== description)
      const descriptionElement = textElement.querySelector(".challenge-description");
      expect(descriptionElement).toBeTruthy();
      expect(descriptionElement?.textContent).toBe("Should see a description for this challenge!");
    });

    // Verify the expected two-line layout structure
    textElements.forEach((textElement) => {
      const titleElement = textElement.querySelector(".challenge-title") as HTMLElement;
      const descriptionElement = textElement.querySelector(".challenge-description") as HTMLElement;
      
      // Title should be first line (normal font size/weight)
      expect(titleElement.textContent).toBe("Testing Descriptions");
      
      // Description should be second line (smaller font size with reduced opacity)
      expect(descriptionElement.textContent).toBe("Should see a description for this challenge!");
      expect(descriptionElement.classList.contains("challenge-description")).toBe(true);
    });
  });
});
