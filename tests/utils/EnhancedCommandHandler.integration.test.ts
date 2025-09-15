import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import ChallengeList from "../../src/classes/ChallengeList";

describe("Enhanced Command Handler Integration", () => {
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

  describe("Enhanced Add Command with Title and Description", () => {
    it("should correctly parse and create challenge with separate title and description", () => {
      // Simulate the enhanced command: !ch add t="Testing Descriptions" d="Should see a description for this challenge!"
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
    });

    it("should create proper DOM structure with title and description", () => {
      // Add challenge via enhanced command
      app.chatHandler(
        "testuser",
        "ch",
        'add t="Testing Descriptions" d="Should see a description for this challenge!"',
        { broadcaster: true },
        { messageId: "test123" }
      );

      // Check DOM structure
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
    });

    it("should handle title-only challenges correctly", () => {
      // Add challenge with only title
      const response = app.chatHandler(
        "testuser",
        "ch",
        'add title="Title Only Challenge"',
        { broadcaster: true },
        { messageId: "test123" }
      );

      expect(response.error).toBe(false);
      
      const challenge = challengeList.challenges[0];
      expect(challenge.title).toBe("Title Only Challenge");
      expect(challenge.description).toBe(""); // Empty description

      // Check DOM - should only show title, no description element
      const textElements = document.querySelectorAll(".challenge-text");
      textElements.forEach((textElement) => {
        const titleElement = textElement.querySelector(".challenge-title");
        expect(titleElement?.textContent).toBe("Title Only Challenge");

        // Should NOT contain description element (empty description)
        const descriptionElement = textElement.querySelector(".challenge-description");
        expect(descriptionElement).toBeNull();
      });
    });

    it("should handle short aliases correctly", () => {
      // Test with short aliases: t= and d=
      const response = app.chatHandler(
        "testuser",
        "ch",
        'add t="Short Title" d="Short description"',
        { broadcaster: true },
        { messageId: "test123" }
      );

      expect(response.error).toBe(false);
      
      const challenge = challengeList.challenges[0];
      expect(challenge.title).toBe("Short Title");
      expect(challenge.description).toBe("Short description");
    });

    it("should handle complex quotes and special characters", () => {
      const response = app.chatHandler(
        "testuser",
        "ch",
        'add t="Title with \\"quotes\\"" d="Description with special chars: @#$%"',
        { broadcaster: true },
        { messageId: "test123" }
      );

      expect(response.error).toBe(false);
      
      const challenge = challengeList.challenges[0];
      expect(challenge.title).toBe('Title with "quotes"');
      expect(challenge.description).toBe("Description with special chars: @#$%");
    });
  });

  describe("Permission Handling", () => {
    it("should reject commands from non-moderators", () => {
      const response = app.chatHandler(
        "regularuser",
        "ch",
        'add t="Test" d="Test"',
        {}, // No mod permissions
        { messageId: "test123" }
      );

      expect(response.error).toBe(true);
      expect(response.message).toContain("Only moderators");
      expect(challengeList.challenges.length).toBe(0);
    });

    it("should allow commands from broadcaster", () => {
      const response = app.chatHandler(
        "broadcaster",
        "ch",
        'add t="Test" d="Test"',
        { broadcaster: true },
        { messageId: "test123" }
      );

      expect(response.error).toBe(false);
      expect(challengeList.challenges.length).toBe(1);
    });

    it("should allow commands from moderators", () => {
      const response = app.chatHandler(
        "moderator",
        "ch",
        'add t="Test" d="Test"',
        { mod: true },
        { messageId: "test123" }
      );

      expect(response.error).toBe(false);
      expect(challengeList.challenges.length).toBe(1);
    });
  });
});
