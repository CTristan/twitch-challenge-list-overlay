import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfigManager from "../../src/classes/ConfigManager";
import {
    BACKGROUND_DEFAULTS,
    BACKGROUND_UI_ELEMENTS,
} from "../../src/types/ConfigConstants";
import { ELEMENT_IDS } from "../../src/types/DOMConstants";
import { AdminPanelBackgroundPreview } from "../../src/utils/AdminPanelBackgroundPreview";
import { AdminPanelColorManager } from "../../src/utils/AdminPanelColorManager";
import { AdminPanelColorTierManager } from "../../src/utils/AdminPanelColorTierManager";
import { AdminPanelUIHelper } from "../../src/utils/AdminPanelUIHelper";
import { AdminPanelUIPopulator } from "../../src/utils/AdminPanelUIPopulator";

// Mock dependencies
vi.mock("../../src/utils/AdminPanelColorManager");
vi.mock("../../src/utils/AdminPanelBackgroundPreview");
vi.mock("../../src/utils/AdminPanelUIHelper");
vi.mock("../../src/utils/AdminPanelColorTierManager");

// Helper function to create a minimal valid config with optional overrides
function createTestConfig(overrides: Partial<Config> = {}): Config {
    return {
        auth: {
            twitch_oauth: "oauth:test",
            twitch_username: "testuser",
            twitch_channel: "testchannel",
        },
        maxChallenges: 10,
        commands: {
            clearAll: ["!ch clearlist", "!ch clearall"],
            clearDone: ["!ch cleardone"],
            addChallenge: ["!ch add"],
            editChallenge: ["!ch edit"],
            finishChallenge: ["!ch done"],
            deleteChallenge: ["!ch delete", "!ch del"],
            incrementChallenge: ["!ch +"],
            decrementChallenge: ["!ch -"],
            setProgress: ["!ch set"],
            failChallenge: ["!ch fail"],
            listChallenges: ["!ch list"],
            showChallenge: ["!ch show"],
            check: ["!ch check"],
            help: ["!ch help"],
        },
        responses: {
            clearAll: "All challenges have been cleared",
            clearDone: "All done challenges have been cleared",
            addChallenge: "Challenge(s) {message} added!",
            editChallenge: "Challenge {message} updated!",
            finishChallenge: "Good job on completing challenge(s) {message}!",
            deleteChallenge: "Challenge(s) {message} has been deleted!",
            deleteAll: "All of your challenges have been deleted!",
            check: "Your current challenge(s) are: {message}",
            help: "Try these commands - !ch add, !ch edit, !ch done, !ch delete, !ch check, !ch clearlist, !ch cleardone, !ch help",
            maxChallengesAdded:
                "Maximum number of challenges reached, try deleting old challenges.",
            noChallengeFound:
                "That challenge doesn't seem to exist, try adding one!",
            invalidCommand: "Invalid command: {message}. Try !help",
        },
        ...overrides,
    };
}

describe("AdminPanelUIPopulator", () => {
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = "";

        // Reset mocks
        vi.clearAllMocks();

        // Reset ConfigManager singleton
        (ConfigManager as any).instance = null;
        configManager = ConfigManager.getInstance(createTestConfig());

        // Mock extractColorFromRGBA to return the input (simulating hex color)
        vi.mocked(
            AdminPanelColorManager.extractColorFromRGBA
        ).mockImplementation((color: string) => color);
    });

    describe("populateBackgroundConfiguration", () => {
        it("should populate overlay background color input with config value", () => {
            // Setup DOM
            const overlayColorInput = document.createElement("input");
            overlayColorInput.type = "color";
            overlayColorInput.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT;
            document.body.appendChild(overlayColorInput);

            const config = createTestConfig({
                overlayBackgroundColor: "#646464",
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(
                AdminPanelColorManager.extractColorFromRGBA
            ).toHaveBeenCalledWith("#646464");
            expect(overlayColorInput.value).toBe("#646464");
        });

        it("should use default overlay background color when config value is missing", () => {
            // Setup DOM
            const overlayColorInput = document.createElement("input");
            overlayColorInput.type = "color";
            overlayColorInput.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT;
            document.body.appendChild(overlayColorInput);

            const config = createTestConfig();

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(
                AdminPanelColorManager.extractColorFromRGBA
            ).toHaveBeenCalledWith(
                BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_COLOR
            );
        });

        it("should populate overlay background opacity slider and display", () => {
            // Setup DOM
            const opacitySlider = document.createElement("input");
            opacitySlider.type = "range";
            opacitySlider.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER;
            document.body.appendChild(opacitySlider);

            const opacityDisplay = document.createElement("span");
            opacityDisplay.id = BACKGROUND_UI_ELEMENTS.OVERLAY_OPACITY_DISPLAY;
            document.body.appendChild(opacityDisplay);

            const config = createTestConfig({
                overlayBackgroundOpacity: 0.75,
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(opacitySlider.value).toBe("75");
            expect(opacityDisplay.textContent).toBe("75%");
        });

        it("should use default overlay opacity when config value is missing", () => {
            // Setup DOM
            const opacitySlider = document.createElement("input");
            opacitySlider.type = "range";
            opacitySlider.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER;
            document.body.appendChild(opacitySlider);

            const opacityDisplay = document.createElement("span");
            opacityDisplay.id = BACKGROUND_UI_ELEMENTS.OVERLAY_OPACITY_DISPLAY;
            document.body.appendChild(opacityDisplay);

            const config = createTestConfig();

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            const expectedPercent = Math.round(
                BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY * 100
            );
            expect(opacitySlider.value).toBe(expectedPercent.toString());
            expect(opacityDisplay.textContent).toBe(`${expectedPercent}%`);
        });

        it("should populate challenge row background color input with config value", () => {
            // Setup DOM
            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.type = "color";
            backgroundColorInput.id =
                BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT;
            document.body.appendChild(backgroundColorInput);

            const config = createTestConfig({
                challengeBackgroundColor: "#000000",
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(
                AdminPanelColorManager.extractColorFromRGBA
            ).toHaveBeenCalledWith("#000000");
            expect(backgroundColorInput.value).toBe("#000000");
        });

        it("should use default challenge background color when config value is missing", () => {
            // Setup DOM
            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.type = "color";
            backgroundColorInput.id =
                BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT;
            document.body.appendChild(backgroundColorInput);

            const config = createTestConfig();

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(
                AdminPanelColorManager.extractColorFromRGBA
            ).toHaveBeenCalledWith(BACKGROUND_DEFAULTS.BACKGROUND_COLOR);
        });

        it("should populate challenge row background opacity slider and display", () => {
            // Setup DOM
            const opacitySlider = document.createElement("input");
            opacitySlider.type = "range";
            opacitySlider.id = BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER;
            document.body.appendChild(opacitySlider);

            const opacityDisplay = document.createElement("span");
            opacityDisplay.id = BACKGROUND_UI_ELEMENTS.OPACITY_DISPLAY;
            document.body.appendChild(opacityDisplay);

            const config = createTestConfig({
                challengeBackgroundOpacity: 0.9,
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(opacitySlider.value).toBe("90");
            expect(opacityDisplay.textContent).toBe("90%");
        });

        it("should use default challenge background opacity when config value is missing", () => {
            // Setup DOM
            const opacitySlider = document.createElement("input");
            opacitySlider.type = "range";
            opacitySlider.id = BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER;
            document.body.appendChild(opacitySlider);

            const opacityDisplay = document.createElement("span");
            opacityDisplay.id = BACKGROUND_UI_ELEMENTS.OPACITY_DISPLAY;
            document.body.appendChild(opacityDisplay);

            const config = createTestConfig();

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            const expectedPercent = Math.round(
                BACKGROUND_DEFAULTS.BACKGROUND_OPACITY * 100
            );
            expect(opacitySlider.value).toBe(expectedPercent.toString());
            expect(opacityDisplay.textContent).toBe(`${expectedPercent}%`);
        });

        it("should populate auto text color checkbox with config value", () => {
            // Setup DOM
            const autoTextColorCheckbox = document.createElement("input");
            autoTextColorCheckbox.type = "checkbox";
            autoTextColorCheckbox.id =
                BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX;
            document.body.appendChild(autoTextColorCheckbox);

            const config = createTestConfig({
                challengeAutoTextColor: true,
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(autoTextColorCheckbox.checked).toBe(true);
        });

        it("should use default auto text color when config value is missing", () => {
            // Setup DOM
            const autoTextColorCheckbox = document.createElement("input");
            autoTextColorCheckbox.type = "checkbox";
            autoTextColorCheckbox.id =
                BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX;
            document.body.appendChild(autoTextColorCheckbox);

            const config = createTestConfig();

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(autoTextColorCheckbox.checked).toBe(
                BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR
            );
        });

        it("should populate manual text color input and disable it when auto text color is enabled", () => {
            // Setup DOM
            const textColorInput = document.createElement("input");
            textColorInput.type = "color";
            textColorInput.id = BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT;
            document.body.appendChild(textColorInput);

            const config = createTestConfig({
                challengeTextColor: "#ffffff",
                challengeAutoTextColor: true,
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(textColorInput.value).toBe("#ffffff");
            expect(textColorInput.disabled).toBe(true);
        });

        it("should populate manual text color input and enable it when auto text color is disabled", () => {
            // Setup DOM
            const textColorInput = document.createElement("input");
            textColorInput.type = "color";
            textColorInput.id = BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT;
            document.body.appendChild(textColorInput);

            const config = createTestConfig({
                challengeTextColor: "#000000",
                challengeAutoTextColor: false,
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(textColorInput.value).toBe("#000000");
            expect(textColorInput.disabled).toBe(false);
        });

        it("should use default text color when config value is missing", () => {
            // Setup DOM
            const textColorInput = document.createElement("input");
            textColorInput.type = "color";
            textColorInput.id = BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT;
            document.body.appendChild(textColorInput);

            const config = createTestConfig();

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(textColorInput.value).toBe(BACKGROUND_DEFAULTS.TEXT_COLOR);
        });

        it("should populate text shadow checkbox with config value", () => {
            // Setup DOM
            const textShadowCheckbox = document.createElement("input");
            textShadowCheckbox.type = "checkbox";
            textShadowCheckbox.id = BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX;
            document.body.appendChild(textShadowCheckbox);

            const config = createTestConfig({
                challengeTextShadow: true,
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(textShadowCheckbox.checked).toBe(true);
        });

        it("should use default text shadow when config value is missing", () => {
            // Setup DOM
            const textShadowCheckbox = document.createElement("input");
            textShadowCheckbox.type = "checkbox";
            textShadowCheckbox.id = BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX;
            document.body.appendChild(textShadowCheckbox);

            const config = createTestConfig();

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(textShadowCheckbox.checked).toBe(
                BACKGROUND_DEFAULTS.TEXT_SHADOW
            );
        });

        it("should call AdminPanelBackgroundPreview.updateBackgroundPreview after populating", () => {
            const config = createTestConfig();

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(
                AdminPanelBackgroundPreview.updateBackgroundPreview
            ).toHaveBeenCalledTimes(1);
        });

        it("should handle missing DOM elements gracefully", () => {
            // Empty DOM - no elements
            const config = createTestConfig({
                overlayBackgroundColor: "#646464",
                overlayBackgroundOpacity: 0.75,
                challengeBackgroundColor: "#000000",
                challengeBackgroundOpacity: 0.9,
                challengeTextColor: "#ffffff",
                challengeAutoTextColor: true,
                challengeTextShadow: true,
            });

            // Should not throw
            expect(() => {
                AdminPanelUIPopulator.populateBackgroundConfiguration(config);
            }).not.toThrow();

            // Preview update should still be called
            expect(
                AdminPanelBackgroundPreview.updateBackgroundPreview
            ).toHaveBeenCalledTimes(1);
        });

        it("should handle opacity values of 0 correctly", () => {
            // Setup DOM
            const overlayOpacitySlider = document.createElement("input");
            overlayOpacitySlider.type = "range";
            overlayOpacitySlider.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER;
            document.body.appendChild(overlayOpacitySlider);

            const overlayOpacityDisplay = document.createElement("span");
            overlayOpacityDisplay.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_OPACITY_DISPLAY;
            document.body.appendChild(overlayOpacityDisplay);

            const challengeOpacitySlider = document.createElement("input");
            challengeOpacitySlider.type = "range";
            challengeOpacitySlider.id =
                BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER;
            document.body.appendChild(challengeOpacitySlider);

            const challengeOpacityDisplay = document.createElement("span");
            challengeOpacityDisplay.id = BACKGROUND_UI_ELEMENTS.OPACITY_DISPLAY;
            document.body.appendChild(challengeOpacityDisplay);

            const config = createTestConfig({
                overlayBackgroundOpacity: 0,
                challengeBackgroundOpacity: 0,
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(overlayOpacitySlider.value).toBe("0");
            expect(overlayOpacityDisplay.textContent).toBe("0%");
            expect(challengeOpacitySlider.value).toBe("0");
            expect(challengeOpacityDisplay.textContent).toBe("0%");
        });

        it("should handle opacity values of 1 correctly", () => {
            // Setup DOM
            const overlayOpacitySlider = document.createElement("input");
            overlayOpacitySlider.type = "range";
            overlayOpacitySlider.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER;
            document.body.appendChild(overlayOpacitySlider);

            const overlayOpacityDisplay = document.createElement("span");
            overlayOpacityDisplay.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_OPACITY_DISPLAY;
            document.body.appendChild(overlayOpacityDisplay);

            const challengeOpacitySlider = document.createElement("input");
            challengeOpacitySlider.type = "range";
            challengeOpacitySlider.id =
                BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER;
            document.body.appendChild(challengeOpacitySlider);

            const challengeOpacityDisplay = document.createElement("span");
            challengeOpacityDisplay.id = BACKGROUND_UI_ELEMENTS.OPACITY_DISPLAY;
            document.body.appendChild(challengeOpacityDisplay);

            const config = createTestConfig({
                overlayBackgroundOpacity: 1,
                challengeBackgroundOpacity: 1,
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(overlayOpacitySlider.value).toBe("100");
            expect(overlayOpacityDisplay.textContent).toBe("100%");
            expect(challengeOpacitySlider.value).toBe("100");
            expect(challengeOpacityDisplay.textContent).toBe("100%");
        });

        it("should handle RGBA color strings by extracting hex values", () => {
            // Setup DOM
            const overlayColorInput = document.createElement("input");
            overlayColorInput.type = "color";
            overlayColorInput.id =
                BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT;
            document.body.appendChild(overlayColorInput);

            const backgroundColorInput = document.createElement("input");
            backgroundColorInput.type = "color";
            backgroundColorInput.id =
                BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT;
            document.body.appendChild(backgroundColorInput);

            // Mock extractColorFromRGBA to simulate RGBA to hex conversion
            vi.mocked(AdminPanelColorManager.extractColorFromRGBA)
                .mockReturnValueOnce("#646464")
                .mockReturnValueOnce("#000000");

            const config = createTestConfig({
                overlayBackgroundColor: "rgba(100, 100, 100, 0.6)",
                challengeBackgroundColor: "rgba(0, 0, 0, 1.0)",
            });

            AdminPanelUIPopulator.populateBackgroundConfiguration(config);

            expect(
                AdminPanelColorManager.extractColorFromRGBA
            ).toHaveBeenCalledWith("rgba(100, 100, 100, 0.6)");
            expect(
                AdminPanelColorManager.extractColorFromRGBA
            ).toHaveBeenCalledWith("rgba(0, 0, 0, 1.0)");
            expect(overlayColorInput.value).toBe("#646464");
            expect(backgroundColorInput.value).toBe("#000000");
        });
    });

    describe("populateConfigurationForm", () => {
        beforeEach(() => {
            // Mock getColorTierConstants to prevent errors
            vi.mocked(
                AdminPanelColorManager.getColorTierConstants
            ).mockReturnValue({
                enabled: "test-enabled",
                pickers: "test-pickers",
                section: "test-section",
                bgColor: "test-bg",
                textColor: "test-text",
            });
            // Mock convertColorsToUI to prevent errors
            vi.mocked(AdminPanelColorManager.convertColorsToUI).mockReturnValue(
                {
                    primary: {
                        enabled: true,
                        backgroundColor: "#ff0000",
                        textColor: "#ffffff",
                    },
                    secondary: {
                        enabled: false,
                        backgroundColor: "#00ff00",
                        textColor: "#000000",
                    },
                    tertiary: {
                        enabled: false,
                        backgroundColor: "#0000ff",
                        textColor: "#ffff00",
                    },
                }
            );
        });

        it("should populate all auth fields with config values", () => {
            AdminPanelUIPopulator.populateConfigurationForm(configManager);

            expect(AdminPanelUIHelper.setInputValue).toHaveBeenCalledWith(
                ELEMENT_IDS.TWITCH_OAUTH,
                "oauth:test"
            );
            expect(AdminPanelUIHelper.setInputValue).toHaveBeenCalledWith(
                ELEMENT_IDS.TWITCH_USERNAME,
                "testuser"
            );
            expect(AdminPanelUIHelper.setInputValue).toHaveBeenCalledWith(
                ELEMENT_IDS.TWITCH_CHANNEL,
                "testchannel"
            );
        });

        it("should populate maxChallenges field with config value", () => {
            AdminPanelUIPopulator.populateConfigurationForm(configManager);

            expect(AdminPanelUIHelper.setInputValue).toHaveBeenCalledWith(
                ELEMENT_IDS.MAX_CHALLENGES,
                "10"
            );
        });

        it("should use empty string for missing auth fields", () => {
            // Reset ConfigManager with missing auth
            (ConfigManager as any).instance = null;
            configManager = ConfigManager.getInstance(
                createTestConfig({ auth: undefined as any })
            );

            AdminPanelUIPopulator.populateConfigurationForm(configManager);

            expect(AdminPanelUIHelper.setInputValue).toHaveBeenCalledWith(
                ELEMENT_IDS.TWITCH_OAUTH,
                ""
            );
            expect(AdminPanelUIHelper.setInputValue).toHaveBeenCalledWith(
                ELEMENT_IDS.TWITCH_USERNAME,
                ""
            );
            expect(AdminPanelUIHelper.setInputValue).toHaveBeenCalledWith(
                ELEMENT_IDS.TWITCH_CHANNEL,
                ""
            );
        });

        it("should use default '10' for missing maxChallenges", () => {
            // Reset ConfigManager with missing maxChallenges
            (ConfigManager as any).instance = null;
            configManager = ConfigManager.getInstance(
                createTestConfig({ maxChallenges: undefined as any })
            );

            AdminPanelUIPopulator.populateConfigurationForm(configManager);

            expect(AdminPanelUIHelper.setInputValue).toHaveBeenCalledWith(
                ELEMENT_IDS.MAX_CHALLENGES,
                "10"
            );
        });

        it("should call populateColorConfiguration with color arrays", () => {
            const populateColorSpy = vi.spyOn(
                AdminPanelUIPopulator,
                "populateColorConfiguration"
            );

            // Reset ConfigManager with color config
            (ConfigManager as any).instance = null;
            configManager = ConfigManager.getInstance(
                createTestConfig({
                    challengeRowColors: ["#ff0000", "#00ff00"],
                    challengeRowTextColors: ["#ffffff", "#000000"],
                })
            );

            AdminPanelUIPopulator.populateConfigurationForm(configManager);

            expect(populateColorSpy).toHaveBeenCalledWith(
                ["#ff0000", "#00ff00"],
                ["#ffffff", "#000000"],
                configManager
            );
        });

        it("should call populateColorConfiguration with empty arrays when colors missing", () => {
            const populateColorSpy = vi.spyOn(
                AdminPanelUIPopulator,
                "populateColorConfiguration"
            );

            AdminPanelUIPopulator.populateConfigurationForm(configManager);

            expect(populateColorSpy).toHaveBeenCalledWith(
                [],
                [],
                configManager
            );
        });

        it("should call populateBackgroundConfiguration with config", () => {
            const populateBackgroundSpy = vi.spyOn(
                AdminPanelUIPopulator,
                "populateBackgroundConfiguration"
            );

            AdminPanelUIPopulator.populateConfigurationForm(configManager);

            expect(populateBackgroundSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    auth: {
                        twitch_oauth: "oauth:test",
                        twitch_username: "testuser",
                        twitch_channel: "testchannel",
                    },
                    maxChallenges: 10,
                })
            );
        });
    });

    describe("populateColorConfiguration", () => {
        beforeEach(() => {
            // Clear localStorage to ensure clean state
            localStorage.clear();

            // Reset ConfigManager to ensure clean state for each test
            (ConfigManager as any).instance = null;
            configManager = ConfigManager.getInstance(createTestConfig());

            // Mock convertColorsToUI to return a predictable structure
            vi.mocked(AdminPanelColorManager.convertColorsToUI).mockReturnValue(
                {
                    primary: {
                        enabled: true,
                        backgroundColor: "#ff0000",
                        textColor: "#ffffff",
                    },
                    secondary: {
                        enabled: false,
                        backgroundColor: "#00ff00",
                        textColor: "#000000",
                    },
                    tertiary: {
                        enabled: false,
                        backgroundColor: "#0000ff",
                        textColor: "#ffff00",
                    },
                }
            );

            // Mock getColorTierConstants
            vi.mocked(
                AdminPanelColorManager.getColorTierConstants
            ).mockImplementation((tier: string) => {
                if (tier === "primary") {
                    return {
                        enabled: "primary-enabled",
                        pickers: "primary-pickers",
                        section: "primary-section",
                        bgColor: "primary-bg-color",
                        textColor: "primary-text-color",
                    };
                } else if (tier === "secondary") {
                    return {
                        enabled: "secondary-enabled",
                        pickers: "secondary-pickers",
                        section: "secondary-section",
                        bgColor: "secondary-bg-color",
                        textColor: "secondary-text-color",
                    };
                } else {
                    return {
                        enabled: "tertiary-enabled",
                        pickers: "tertiary-pickers",
                        section: "tertiary-section",
                        bgColor: "tertiary-bg-color",
                        textColor: "tertiary-text-color",
                    };
                }
            });
        });

        it("should populate primary tier colors without checkbox", () => {
            // Setup DOM for primary tier (no checkbox)
            const primaryBgInput = document.createElement("input");
            primaryBgInput.id = "primary-bg-color";
            document.body.appendChild(primaryBgInput);

            const primaryTextInput = document.createElement("input");
            primaryTextInput.id = "primary-text-color";
            document.body.appendChild(primaryTextInput);

            AdminPanelUIPopulator.populateColorConfiguration(
                ["#ff0000"],
                ["#ffffff"],
                configManager
            );

            expect(primaryBgInput.value).toBe("#ff0000");
            expect(primaryTextInput.value).toBe("#ffffff");
            expect(
                AdminPanelColorTierManager.updateColorTierState
            ).toHaveBeenCalledWith("primary", true);
        });

        it("should populate secondary tier with checkbox", () => {
            // Setup DOM for secondary tier (with checkbox)
            const secondaryCheckbox = document.createElement("input");
            secondaryCheckbox.type = "checkbox";
            secondaryCheckbox.id = "secondary-enabled";
            document.body.appendChild(secondaryCheckbox);

            const secondaryBgInput = document.createElement("input");
            secondaryBgInput.id = "secondary-bg-color";
            document.body.appendChild(secondaryBgInput);

            const secondaryTextInput = document.createElement("input");
            secondaryTextInput.id = "secondary-text-color";
            document.body.appendChild(secondaryTextInput);

            AdminPanelUIPopulator.populateColorConfiguration(
                ["#ff0000", "#00ff00"],
                ["#ffffff", "#000000"],
                configManager
            );

            expect(secondaryCheckbox.checked).toBe(false);
            expect(secondaryBgInput.value).toBe("#00ff00");
            expect(secondaryTextInput.value).toBe("#000000");
            expect(
                AdminPanelColorTierManager.updateColorTierState
            ).toHaveBeenCalledWith("secondary", false);
        });

        it("should skip tier if required elements are missing", () => {
            // No DOM elements - should not throw
            expect(() => {
                AdminPanelUIPopulator.populateColorConfiguration(
                    ["#ff0000"],
                    ["#ffffff"],
                    configManager
                );
            }).not.toThrow();
        });

        it("should populate row colors opacity slider and display", () => {
            // Setup DOM
            const opacitySlider = document.createElement("input");
            opacitySlider.type = "range";
            opacitySlider.id = ELEMENT_IDS.ROW_COLORS_OPACITY;
            document.body.appendChild(opacitySlider);

            const opacityDisplay = document.createElement("span");
            opacityDisplay.id = ELEMENT_IDS.ROW_COLORS_OPACITY_DISPLAY;
            document.body.appendChild(opacityDisplay);

            // Set opacity in config
            configManager.set("challengeRowColorsOpacity", 0.75);

            AdminPanelUIPopulator.populateColorConfiguration(
                [],
                [],
                configManager
            );

            expect(opacitySlider.value).toBe("75");
            expect(opacityDisplay.textContent).toBe("75%");
        });

        it("should use default opacity when config value is missing", () => {
            // Setup DOM
            const opacitySlider = document.createElement("input");
            opacitySlider.type = "range";
            opacitySlider.id = ELEMENT_IDS.ROW_COLORS_OPACITY;
            document.body.appendChild(opacitySlider);

            const opacityDisplay = document.createElement("span");
            opacityDisplay.id = ELEMENT_IDS.ROW_COLORS_OPACITY_DISPLAY;
            document.body.appendChild(opacityDisplay);

            AdminPanelUIPopulator.populateColorConfiguration(
                [],
                [],
                configManager
            );

            const expectedPercent = Math.round(
                BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY * 100
            );
            expect(opacitySlider.value).toBe(expectedPercent.toString());
            expect(opacityDisplay.textContent).toBe(`${expectedPercent}%`);
        });

        it("should handle missing opacity slider gracefully", () => {
            // No DOM elements - should not throw
            expect(() => {
                AdminPanelUIPopulator.populateColorConfiguration(
                    [],
                    [],
                    configManager
                );
            }).not.toThrow();
        });

        it("should call convertColorsToUI with provided color arrays", () => {
            const backgroundColors = ["#ff0000", "#00ff00", "#0000ff"];
            const textColors = ["#ffffff", "#000000", "#ffff00"];

            AdminPanelUIPopulator.populateColorConfiguration(
                backgroundColors,
                textColors,
                configManager
            );

            expect(
                AdminPanelColorManager.convertColorsToUI
            ).toHaveBeenCalledWith(backgroundColors, textColors);
        });
    });
});
