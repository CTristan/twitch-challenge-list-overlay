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
            check: "Current challenges:",
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
    expect(elements.checkbox).toBeTruthy();
    expect(elements.bgColorPicker).toBeTruthy();
    expect(elements.textColorPicker).toBeTruthy();
}

function expectCheckboxState(
    checkbox: HTMLInputElement,
    checked: boolean,
    bgPicker?: HTMLInputElement,
    textPicker?: HTMLInputElement,
    container?: Element | null
) {
    expect(checkbox.checked).toBe(checked);

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

            // Primary should be enabled with red color
            expect(primaryElements.checkbox.checked).toBe(true);
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

            const primaryElements = getColorTierElements("primary");

            // Initially unchecked, so pickers should be disabled and collapsed
            expectCheckboxState(
                primaryElements.checkbox,
                false,
                primaryElements.bgColorPicker,
                primaryElements.textColorPicker,
                primaryElements.pickersContainer
            );

            // Check the checkbox
            primaryElements.checkbox.checked = true;
            primaryElements.checkbox.dispatchEvent(new Event("change"));

            // Pickers should now be enabled and expanded
            expectCheckboxState(
                primaryElements.checkbox,
                true,
                primaryElements.bgColorPicker,
                primaryElements.textColorPicker,
                primaryElements.pickersContainer
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

        it("should convert UI configuration to challengeRowColors array when saving", () => {
            // Enable primary and secondary colors
            const primaryElements = getColorTierElements("primary");
            const secondaryElements = getColorTierElements("secondary");

            primaryElements.checkbox.checked = true;
            primaryElements.bgColorPicker.value = TEST_COLORS.RED;
            secondaryElements.checkbox.checked = true;
            secondaryElements.bgColorPicker.value = TEST_COLORS.GREEN;

            // Trigger save
            const saveBtn = document.getElementById(
                "save-config-btn"
            ) as HTMLButtonElement;
            saveBtn.click();

            // Check that the configuration was saved correctly
            const savedColors = configManager.get("challengeRowColors");
            expect(savedColors).toEqual([TEST_COLORS.RED, TEST_COLORS.GREEN]);
        });
    });
});
