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

// Test constants
const COLOR_TIERS = ["primary", "secondary", "tertiary"] as const;
type ColorTier = (typeof COLOR_TIERS)[number];

const TEST_COLORS = {
    RED: "#ff0000",
    GREEN: "#00ff00",
    BLUE: "#0000ff",
} as const;

// Command prefix constant
const COMMAND_PREFIX = "!ch ";

/**
 * Helper function to create command arrays with the unified prefix
 * @param commands - Array of command keywords without prefix
 * @returns Array of commands with "!ch " prefix
 */
function createCommands(commands: string[]): string[] {
    return commands.map((cmd) => COMMAND_PREFIX + cmd);
}

// Helper functions
function createMockConfig() {
    return {
        auth: {
            twitch_oauth: "",
            twitch_username: "",
            twitch_channel: "",
        },
        maxChallenges: 10,
        challengeRowColors: [],
        commands: {
            clearAll: createCommands(["clearlist", "clearall"]),
            clearDone: createCommands(["cleardone"]),
            addChallenge: createCommands(["add"]),
            editChallenge: createCommands(["edit"]),
            finishChallenge: createCommands(["done"]),
            deleteChallenge: createCommands(["delete", "del"]),
            check: createCommands(["check"]),
            help: createCommands(["help"]),
            incrementChallenge: createCommands(["+"]),
            decrementChallenge: createCommands(["-"]),
            setProgress: createCommands(["set"]),
            failChallenge: createCommands(["fail"]),
            listChallenges: createCommands(["list"]),
            showChallenge: createCommands(["show"]),
        },
        responses: {
            clearAll: "All challenges cleared!",
            clearDone: "Done challenges cleared!",
            addChallenge: "Challenge added!",
            editChallenge: "Challenge edited!",
            finishChallenge: "Challenge completed!",
            deleteChallenge: "Challenge deleted!",
            deleteAll: "All challenges deleted!",
            check: "Challenge checked!",
            help: "Available commands:",
            maxChallengesAdded: "Maximum challenges reached!",
            noChallengeFound: "No challenge found!",
            invalidCommand: "Invalid command!",
        },
    };
}

function getColorTierElements(tier: ColorTier) {
    return {
        section: document.getElementById(`${tier}-color-section`),
        checkbox: document.getElementById(
            `${tier}-color-enabled`
        ) as HTMLInputElement,
        bgColorPicker: document.getElementById(
            `${tier}-bg-color`
        ) as HTMLInputElement,
        textColorPicker: document.getElementById(
            `${tier}-text-color`
        ) as HTMLInputElement,
        pickersContainer: document.getElementById(`${tier}-color-pickers`),
    };
}

function expectColorTierElementsExist(tier: ColorTier) {
    const elements = getColorTierElements(tier);
    expect(elements.section).toBeTruthy();
    // Primary tier has no checkbox (always enabled)
    if (tier !== "primary") {
        expect(elements.checkbox).toBeTruthy();
    }
    expect(elements.bgColorPicker).toBeTruthy();
    expect(elements.textColorPicker).toBeTruthy();
}

function expectCheckboxState(
    checkbox: HTMLInputElement | null,
    checked: boolean,
    bgPicker?: HTMLInputElement,
    textPicker?: HTMLInputElement,
    container?: Element | null
) {
    // Primary tier has no checkbox
    if (checkbox) {
        expect(checkbox.checked).toBe(checked);
    }

    if (bgPicker && textPicker) {
        expect(bgPicker.disabled).toBe(!checked);
        expect(textPicker.disabled).toBe(!checked);
    }

    if (container) {
        expect(container.classList.contains("disabled")).toBe(!checked);
        expect(container.classList.contains("expanded")).toBe(checked);
    }
}

function createFreshAdminPanel(
    configManager: ConfigManager,
    _mockApp: App
): AdminPanel {
    configManager.set("challengeRowColors", []);
    return new AdminPanel();
}

function setColorConfiguration(configManager: ConfigManager, colors: string[]) {
    configManager.set("challengeRowColors", colors);
}

describe("AdminPanel Color Configuration", () => {
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

        configManager = ConfigManager.getInstance(createMockConfig());
        mockApp = new App("testChallengeList");
        new AdminPanel();
    });

    describe("Color Configuration UI", () => {
        it("should render color tier sections with checkboxes and color pickers", () => {
            // Check that all color tier elements exist for each tier
            COLOR_TIERS.forEach((tier) => {
                expectColorTierElementsExist(tier);
            });
        });

        it("should populate color configuration from existing challengeRowColors", () => {
            // Set some existing colors
            setColorConfiguration(configManager, [
                TEST_COLORS.RED,
                TEST_COLORS.GREEN,
            ]);

            // Create a new AdminPanel to test population
            new AdminPanel();

            const primaryElements = getColorTierElements("primary");
            const secondaryElements = getColorTierElements("secondary");
            const tertiaryElements = getColorTierElements("tertiary");

            // Primary is always enabled (no checkbox) with red color
            expect(primaryElements.bgColorPicker.value).toBe(TEST_COLORS.RED);

            // Secondary should be enabled with green color
            expect(secondaryElements.checkbox.checked).toBe(true);
            expect(secondaryElements.bgColorPicker.value).toBe(
                TEST_COLORS.GREEN
            );

            // Tertiary should be disabled (no third color provided)
            expect(tertiaryElements.checkbox.checked).toBe(false);
        });

        it("should disable color pickers when checkbox is unchecked", () => {
            // Create a fresh AdminPanel with clean state
            createFreshAdminPanel(configManager, mockApp);

            // Test with secondary tier (which has a checkbox)
            const secondaryElements = getColorTierElements("secondary");

            // Initially unchecked, so pickers should be disabled and collapsed
            expectCheckboxState(
                secondaryElements.checkbox,
                false,
                secondaryElements.bgColorPicker,
                secondaryElements.textColorPicker,
                secondaryElements.pickersContainer
            );

            // Check the checkbox
            secondaryElements.checkbox.checked = true;
            secondaryElements.checkbox.dispatchEvent(new Event("change"));

            // Pickers should now be enabled and expanded
            expectCheckboxState(
                secondaryElements.checkbox,
                true,
                secondaryElements.bgColorPicker,
                secondaryElements.textColorPicker,
                secondaryElements.pickersContainer
            );
        });

        it("should show collapsible behavior with smooth transitions", () => {
            // Create a fresh AdminPanel with clean state
            createFreshAdminPanel(configManager, mockApp);

            const secondaryElements = getColorTierElements("secondary");

            // Initially collapsed
            expect(secondaryElements.checkbox.checked).toBe(false);
            expect(
                secondaryElements.pickersContainer?.classList.contains(
                    "expanded"
                )
            ).toBe(false);

            // Expand by checking
            secondaryElements.checkbox.checked = true;
            secondaryElements.checkbox.dispatchEvent(new Event("change"));
            expect(
                secondaryElements.pickersContainer?.classList.contains(
                    "expanded"
                )
            ).toBe(true);

            // Collapse by unchecking
            secondaryElements.checkbox.checked = false;
            secondaryElements.checkbox.dispatchEvent(new Event("change"));
            expect(
                secondaryElements.pickersContainer?.classList.contains(
                    "expanded"
                )
            ).toBe(false);
        });

        it("should convert UI configuration to challengeRowColors array when auto-saving", () => {
            // Primary is always enabled, just set its color
            const primaryElements = getColorTierElements("primary");
            const secondaryElements = getColorTierElements("secondary");

            // Primary has no checkbox - just set the color
            primaryElements.bgColorPicker.value = TEST_COLORS.RED;
            primaryElements.bgColorPicker.dispatchEvent(new Event("input"));

            // Enable secondary color
            secondaryElements.checkbox.checked = true;
            secondaryElements.bgColorPicker.value = TEST_COLORS.GREEN;
            secondaryElements.checkbox.dispatchEvent(new Event("change"));

            // Check that the configuration was auto-saved correctly
            const savedColors = configManager.get("challengeRowColors");
            expect(savedColors).toEqual([TEST_COLORS.RED, TEST_COLORS.GREEN]);
        });
    });

    describe("Primary Color Picker Population Bug (Regression Test)", () => {
        it("should populate primary color picker with stored value on initial load", () => {
            // This test prevents regression of the bug where primary color picker
            // always showed red (#ff0000) on page load instead of the stored value.
            // Bug cause: populateColorConfiguration() was checking for a checkbox
            // element that doesn't exist for the primary tier (it's always enabled).

            // Set a non-default color in configuration
            const customColor = "#3498db"; // Blue color
            setColorConfiguration(configManager, [customColor]);

            // Create a new AdminPanel to simulate page load
            new AdminPanel();

            // Get the primary color picker element
            const primaryElements = getColorTierElements("primary");

            // CRITICAL: The color picker should show the stored value, NOT the template default
            expect(primaryElements.bgColorPicker.value).toBe(customColor);
            expect(primaryElements.bgColorPicker.value).not.toBe(
                TEST_COLORS.RED
            );
        });

        it("should populate primary color picker even when no checkbox exists", () => {
            // Verify that the primary tier (which has no checkbox) still gets populated
            const customColor = "#2ecc71"; // Green color
            setColorConfiguration(configManager, [customColor]);

            // Create a new AdminPanel
            new AdminPanel();

            const primaryElements = getColorTierElements("primary");

            // Primary tier should not have a checkbox
            expect(primaryElements.checkbox).toBeNull();

            // But the color picker should still be populated with the stored value
            expect(primaryElements.bgColorPicker.value).toBe(customColor);
        });

        it("should populate primary color picker after manual browser refresh simulation", () => {
            // Simulate a scenario where user sets a color, refreshes the page
            const userSelectedColor = "#e74c3c"; // Red-orange color

            // User sets the color
            setColorConfiguration(configManager, [userSelectedColor]);

            // Simulate page refresh by destroying and recreating AdminPanel
            const firstPanel = new AdminPanel();
            firstPanel.destroy();

            // Clear DOM and recreate (simulating refresh)
            document.body.innerHTML = `
                <div id="app">
                    <div class="admin-panel">
                        <div class="admin-content"></div>
                    </div>
                </div>
            `;

            // Create new AdminPanel (simulating page reload)
            new AdminPanel();

            const primaryElements = getColorTierElements("primary");

            // After "refresh", the color picker should still show the user's color
            expect(primaryElements.bgColorPicker.value).toBe(userSelectedColor);
        });

        it("should populate all color tiers correctly including primary", () => {
            // Test that all three tiers are populated correctly
            const colors = [
                TEST_COLORS.RED,
                TEST_COLORS.GREEN,
                TEST_COLORS.BLUE,
            ];
            setColorConfiguration(configManager, colors);

            new AdminPanel();

            const primaryElements = getColorTierElements("primary");
            const secondaryElements = getColorTierElements("secondary");
            const tertiaryElements = getColorTierElements("tertiary");

            // All tiers should have their correct colors
            expect(primaryElements.bgColorPicker.value).toBe(TEST_COLORS.RED);
            expect(secondaryElements.bgColorPicker.value).toBe(
                TEST_COLORS.GREEN
            );
            expect(tertiaryElements.bgColorPicker.value).toBe(TEST_COLORS.BLUE);

            // Primary has no checkbox, but others do
            expect(primaryElements.checkbox).toBeNull();
            expect(secondaryElements.checkbox).toBeTruthy();
            expect(tertiaryElements.checkbox).toBeTruthy();

            // Secondary and tertiary should be enabled (checked)
            expect(secondaryElements.checkbox.checked).toBe(true);
            expect(tertiaryElements.checkbox.checked).toBe(true);
        });
    });
});
