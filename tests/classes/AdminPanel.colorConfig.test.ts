import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/app";
import AdminPanel from "../../src/classes/AdminPanel";
import ConfigManager from "../../src/classes/ConfigManager";

// Mock the App class
vi.mock("../../src/app", () => ({
  default: vi.fn().mockImplementation(() => ({
    // Mock any required App methods
  })),
}));

describe("AdminPanel Color Configuration", () => {
  let adminPanel: AdminPanel;
  let configManager: ConfigManager;
  let mockApp: App;

  beforeEach(() => {
    // Setup DOM with admin panel structure
    document.body.innerHTML = `
      <div id="app">
        <div class="admin-panel">
          <div class="admin-content"></div>
        </div>
      </div>
    `;

    // Set admin mode
    window.location.hash = "#admin";

    // Create mock config
    const mockConfig = {
      auth: {
        twitch_oauth: "",
        twitch_username: "",
        twitch_channel: "",
      },
      maxChallenges: 10,
      challengeRowColors: [],
      commands: {
        clearList: ["!clearlist"],
        clearDone: ["!cleardone"],
        clearUser: ["!clearuser"],
        addChallenge: ["!add"],
        editChallenge: ["!edit"],
        finishChallenge: ["!done"],
        deleteChallenge: ["!delete"],
        check: ["!check"],
        help: ["!help"],
      },
      responses: {
        clearList: "List cleared!",
        clearDone: "Done challenges cleared!",
        clearUser: "User cleared!",
        addChallenge: "Challenge added!",
        editChallenge: "Challenge edited!",
        finishChallenge: "Challenge completed!",
        deleteChallenge: "Challenge deleted!",
        deleteAll: "All challenges deleted!",
        check: "Current challenges:",
        help: "Available commands:",
        maxChallengesAdded: "Maximum challenges reached!",
        noChallengeFound: "No challenge found!",
        invalidCommand: "Invalid command!",
      },
    };

    configManager = ConfigManager.getInstance(mockConfig);
    mockApp = new App("testChallengeList");
    adminPanel = new AdminPanel(mockApp);
  });

  describe("Color Configuration UI", () => {
    it("should render color tier sections with checkboxes and color pickers", () => {
      // Check that all three color tier sections exist
      expect(document.getElementById("primary-color-section")).toBeTruthy();
      expect(document.getElementById("secondary-color-section")).toBeTruthy();
      expect(document.getElementById("tertiary-color-section")).toBeTruthy();

      // Check that checkboxes exist
      expect(document.getElementById("primary-color-enabled")).toBeTruthy();
      expect(document.getElementById("secondary-color-enabled")).toBeTruthy();
      expect(document.getElementById("tertiary-color-enabled")).toBeTruthy();

      // Check that color pickers exist
      expect(document.getElementById("primary-bg-color")).toBeTruthy();
      expect(document.getElementById("primary-text-color")).toBeTruthy();
      expect(document.getElementById("secondary-bg-color")).toBeTruthy();
      expect(document.getElementById("secondary-text-color")).toBeTruthy();
      expect(document.getElementById("tertiary-bg-color")).toBeTruthy();
      expect(document.getElementById("tertiary-text-color")).toBeTruthy();
    });

    it("should populate color configuration from existing challengeRowColors", () => {
      // Set some existing colors
      configManager.set("challengeRowColors", ["#ff0000", "#00ff00"]);

      // Create a new AdminPanel to test population
      const newAdminPanel = new AdminPanel(mockApp);

      const primaryCheckbox = document.getElementById("primary-color-enabled") as HTMLInputElement;
      const primaryBgColor = document.getElementById("primary-bg-color") as HTMLInputElement;
      const secondaryCheckbox = document.getElementById("secondary-color-enabled") as HTMLInputElement;
      const secondaryBgColor = document.getElementById("secondary-bg-color") as HTMLInputElement;
      const tertiaryCheckbox = document.getElementById("tertiary-color-enabled") as HTMLInputElement;

      // Primary should be enabled with red color
      expect(primaryCheckbox.checked).toBe(true);
      expect(primaryBgColor.value).toBe("#ff0000");

      // Secondary should be enabled with green color
      expect(secondaryCheckbox.checked).toBe(true);
      expect(secondaryBgColor.value).toBe("#00ff00");

      // Tertiary should be disabled (no third color provided)
      expect(tertiaryCheckbox.checked).toBe(false);
    });

    it("should disable color pickers when checkbox is unchecked", () => {
      // Reset configuration to ensure clean state
      configManager.set("challengeRowColors", []);

      // Create a fresh AdminPanel to test initial state
      const freshAdminPanel = new AdminPanel(mockApp);

      const primaryCheckbox = document.getElementById("primary-color-enabled") as HTMLInputElement;
      const primaryBgColor = document.getElementById("primary-bg-color") as HTMLInputElement;
      const primaryTextColor = document.getElementById("primary-text-color") as HTMLInputElement;
      const primaryPickersContainer = document.getElementById("primary-color-pickers");

      // Initially unchecked, so pickers should be disabled and collapsed
      expect(primaryCheckbox.checked).toBe(false);
      expect(primaryBgColor.disabled).toBe(true);
      expect(primaryTextColor.disabled).toBe(true);
      expect(primaryPickersContainer?.classList.contains("disabled")).toBe(true);
      expect(primaryPickersContainer?.classList.contains("expanded")).toBe(false);

      // Check the checkbox
      primaryCheckbox.checked = true;
      primaryCheckbox.dispatchEvent(new Event("change"));

      // Pickers should now be enabled and expanded
      expect(primaryBgColor.disabled).toBe(false);
      expect(primaryTextColor.disabled).toBe(false);
      expect(primaryPickersContainer?.classList.contains("disabled")).toBe(false);
      expect(primaryPickersContainer?.classList.contains("expanded")).toBe(true);
    });

    it("should show collapsible behavior with smooth transitions", () => {
      // Reset configuration to ensure clean state
      configManager.set("challengeRowColors", []);

      // Create a fresh AdminPanel to test collapsible behavior
      const freshAdminPanel = new AdminPanel(mockApp);

      const secondaryCheckbox = document.getElementById("secondary-color-enabled") as HTMLInputElement;
      const secondaryPickersContainer = document.getElementById("secondary-color-pickers");

      // Initially collapsed
      expect(secondaryCheckbox.checked).toBe(false);
      expect(secondaryPickersContainer?.classList.contains("expanded")).toBe(false);

      // Expand by checking
      secondaryCheckbox.checked = true;
      secondaryCheckbox.dispatchEvent(new Event("change"));
      expect(secondaryPickersContainer?.classList.contains("expanded")).toBe(true);

      // Collapse by unchecking
      secondaryCheckbox.checked = false;
      secondaryCheckbox.dispatchEvent(new Event("change"));
      expect(secondaryPickersContainer?.classList.contains("expanded")).toBe(false);
    });

    it("should convert UI configuration to challengeRowColors array when saving", () => {
      // Enable primary and secondary colors
      const primaryCheckbox = document.getElementById("primary-color-enabled") as HTMLInputElement;
      const primaryBgColor = document.getElementById("primary-bg-color") as HTMLInputElement;
      const secondaryCheckbox = document.getElementById("secondary-color-enabled") as HTMLInputElement;
      const secondaryBgColor = document.getElementById("secondary-bg-color") as HTMLInputElement;

      primaryCheckbox.checked = true;
      primaryBgColor.value = "#ff0000";
      secondaryCheckbox.checked = true;
      secondaryBgColor.value = "#00ff00";

      // Trigger save
      const saveBtn = document.getElementById("save-config-btn") as HTMLButtonElement;
      saveBtn.click();

      // Check that the configuration was saved correctly
      const savedColors = configManager.get("challengeRowColors");
      expect(savedColors).toEqual(["#ff0000", "#00ff00"]);
    });
  });
});
