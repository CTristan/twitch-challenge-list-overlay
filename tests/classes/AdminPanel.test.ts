import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPanel from "../../src/classes/AdminPanel";
import ConfigManager from "../../src/classes/ConfigManager";

// Mock setTimeout to control timing in tests
const mockSetTimeout = vi.fn();
global.setTimeout = mockSetTimeout as any;

describe("AdminPanel", () => {
  let adminPanel: AdminPanel;
  let mockApp: any;
  let clearButton: HTMLButtonElement;

  beforeEach(() => {
    // Set up real DOM elements (jsdom provides real DOM)
    document.body.innerHTML = `
      <button id="clear-localstorage-btn">Clear LocalStorage</button>
    `;

    clearButton = document.getElementById(
      "clear-localstorage-btn"
    ) as HTMLButtonElement;

    // Reset all mocks - do this before creating new instances
    vi.clearAllMocks();
    mockSetTimeout.mockClear();

    // Initialize ConfigManager with test configuration
    const testConfig: Config = {
      auth: {
        twitch_oauth: "test_oauth",
        twitch_username: "test_user",
        twitch_channel: "test_channel",
      },
      maxChallenges: 10,
      challengeRowColors: [],
      commands: {
        clearList: ["!clearlist"],
        clearDone: ["!cleardone"],
        clearUser: ["!clearuser"],
        addChallenge: ["!challenge", "!add"],
        editChallenge: ["!edit"],
        finishChallenge: ["!done"],
        deleteChallenge: ["!delete"],
        check: ["!check"],
        help: ["!help"],
      },
      responses: {
        clearList: "All challenges cleared",
        clearDone: "Done challenges cleared",
        clearUser: "User challenges cleared",
        addChallenge: "Challenge added",
        editChallenge: "Challenge edited",
        finishChallenge: "Challenge completed",
        deleteChallenge: "Challenge deleted",
        deleteAll: "All challenges deleted",
        check: "Current challenges",
        help: "Help message",
        maxChallengesAdded: "Max challenges reached",
        noChallengeFound: "No challenge found",
        invalidCommand: "Invalid command",
      },
    };

    // Reset ConfigManager singleton for testing
    (ConfigManager as any).instance = null;
    ConfigManager.getInstance(testConfig);

    // Create mock app with required methods
    mockApp = {
      clearListFromDOM: vi.fn(),
      renderChallengeCount: vi.fn(),
    };

    // Clear only configuration-related localStorage items
    localStorage.removeItem("overlay_config");

    // Add some test data to localStorage to verify clearing
    localStorage.setItem("testKey", "testValue");
  });

  describe("when in admin mode", () => {
    beforeEach(() => {
      // Set admin mode
      window.location.hash = "#admin";
      adminPanel = new AdminPanel(mockApp);
    });

    it("should initialize and add click listener to clear button", () => {
      // Verify button exists and has expected initial state
      expect(clearButton).toBeTruthy();
      expect(clearButton.textContent).toBe("Clear LocalStorage");

      // Add some configuration data to localStorage
      localStorage.setItem("overlay_config", JSON.stringify({ test: "data" }));
      expect(localStorage.getItem("overlay_config")).toBeTruthy();

      // Click the button to test the actual behavior
      clearButton.click();

      // Check that configuration was cleared (but other localStorage items remain)
      expect(localStorage.getItem("overlay_config")).toBeNull();
      expect(localStorage.getItem("testKey")).toBe("testValue"); // Other items should remain

      // Check visual feedback (real DOM changes)
      expect(clearButton.textContent).toBe("Cleared!");
      expect(clearButton.style.backgroundColor).toBe("rgb(40, 167, 69)");

      // Verify setTimeout was called for the reset
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    });

    it("should handle localStorage errors gracefully", () => {
      // Mock the ConfigManager's clearStorage method to return false (indicating error)
      const configManager = ConfigManager.getInstance();
      const originalClearStorage = configManager.clearStorage;
      configManager.clearStorage = vi.fn(() => false);

      // Mock console.error to verify error logging
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Click the button to trigger the error
      clearButton.click();

      // Check that clearStorage was attempted
      expect(configManager.clearStorage).toHaveBeenCalled();

      // Check visual feedback for error
      expect(clearButton.textContent).toBe("Error!");
      expect(clearButton.style.backgroundColor).toBe("rgb(220, 53, 69)");

      // Restore original method and console
      configManager.clearStorage = originalClearStorage;
      consoleSpy.mockRestore();
    });

    it("should reset button appearance after timeout", () => {
      // Store original text
      const originalText = clearButton.textContent;

      // Click the button
      clearButton.click();

      // Verify initial feedback
      expect(clearButton.textContent).toBe("Cleared!");
      expect(clearButton.style.backgroundColor).toBe("rgb(40, 167, 69)");

      // Get the timeout callback and execute it
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
      const timeoutCallback =
        mockSetTimeout.mock.calls[mockSetTimeout.mock.calls.length - 1][0];
      timeoutCallback();

      // Verify button was reset to original text
      expect(clearButton.textContent).toBe(originalText);
      expect(clearButton.style.backgroundColor).toBe("");
    });
  });

  describe("when not in admin mode", () => {
    beforeEach(() => {
      window.location.hash = "";
      adminPanel = new AdminPanel(mockApp);
    });

    it("should not add click listener when not in admin mode", () => {
      // Verify localStorage still has test data
      expect(localStorage.getItem("testKey")).toBe("testValue");

      // Click the button - should not trigger clear functionality
      clearButton.click();

      // Verify localStorage was NOT cleared
      expect(localStorage.getItem("testKey")).toBe("testValue");
      expect(localStorage.length).toBe(1);

      // Verify button appearance unchanged
      expect(clearButton.textContent).toBe("Clear LocalStorage");
      expect(clearButton.style.backgroundColor).toBe("");

      // Verify setTimeout was not called for the clear functionality
      // (Note: setTimeout might be called by other parts of the system, so we check
      // that it wasn't called with our specific 2000ms timeout)
      const clearTimeoutCalls = mockSetTimeout.mock.calls.filter(
        (call) => call[1] === 2000
      );
      expect(clearTimeoutCalls).toHaveLength(0);
    });
  });

  describe("hash change handling", () => {
    it("should reinitialize when hash changes to admin", () => {
      // Start in non-admin mode
      window.location.hash = "";
      adminPanel = new AdminPanel(mockApp);

      // Verify button doesn't work initially
      clearButton.click();
      expect(localStorage.getItem("testKey")).toBe("testValue");

      // Change to admin mode
      window.location.hash = "#admin";

      // Trigger hashchange event
      const hashChangeEvent = new Event("hashchange");
      window.dispatchEvent(hashChangeEvent);

      // Now button should work
      clearButton.click();
      expect(localStorage.getItem("overlay_config")).toBeNull();
      expect(clearButton.textContent).toBe("Cleared!");
    });
  });

  describe("import/export functionality", () => {
    beforeEach(() => {
      window.location.hash = "#admin";
      adminPanel = new AdminPanel(mockApp);
    });

    it("should validate imported configuration correctly", () => {
      // Test valid configuration
      const validConfig = {
        auth: {
          twitch_oauth: "oauth:test",
          twitch_username: "testuser",
          twitch_channel: "testchannel",
        },
        maxChallenges: 5,
        commands: {
          addChallenge: ["!add"],
          editChallenge: ["!edit"],
          finishChallenge: ["!done"],
          deleteChallenge: ["!delete"],
        },
        responses: {
          addChallenge: "Added",
          editChallenge: "Edited",
          finishChallenge: "Finished",
          deleteChallenge: "Deleted",
        },
      };

      // Access the private method through type assertion
      const result = (adminPanel as any).validateImportedConfiguration(
        validConfig
      );
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBe("");
    });

    it("should reject invalid configuration with helpful error messages", () => {
      // Test missing auth
      const invalidConfig = {
        maxChallenges: 5,
        commands: {},
        responses: {},
      };

      const result = (adminPanel as any).validateImportedConfiguration(
        invalidConfig
      );
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain("Missing required property: auth");
    });

    it("should handle metadata-wrapped configuration", () => {
      const wrappedConfig = {
        _metadata: {
          exportedAt: "2024-01-01T00:00:00.000Z",
          version: "1.0.0",
          source: "Test",
        },
        config: {
          auth: {
            twitch_oauth: "oauth:test",
            twitch_username: "testuser",
            twitch_channel: "testchannel",
          },
          maxChallenges: 5,
          commands: {
            addChallenge: ["!add"],
            editChallenge: ["!edit"],
            finishChallenge: ["!done"],
            deleteChallenge: ["!delete"],
          },
          responses: {
            addChallenge: "Added",
            editChallenge: "Edited",
            finishChallenge: "Finished",
            deleteChallenge: "Deleted",
          },
        },
      };

      // Mock the processImportedConfiguration method to test metadata handling
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      (adminPanel as any).processImportedConfiguration(
        JSON.stringify(wrappedConfig),
        "test-btn"
      );

      // Verify that metadata was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Importing configuration exported on: 2024-01-01T00:00:00.000Z"
        )
      );

      consoleSpy.mockRestore();
    });
  });
});
