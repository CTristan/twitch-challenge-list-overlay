import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfigManager from "../../src/classes/ConfigManager";
import {
    BACKGROUND_CONFIG,
    BACKGROUND_DEFAULTS,
    COLOR_CONFIG,
} from "../../src/types/ConfigConstants";
import { ConfigType } from "../../src/types/ConfigType";
import { WARNING_MESSAGES } from "../../src/types/MessageConstants";
import { AdminPanelBackgroundPreview } from "../../src/utils/AdminPanelBackgroundPreview";
import { AdminPanelDOMUpdater } from "../../src/utils/AdminPanelDOMUpdater";
import ChallengeRenderer from "../../src/utils/ChallengeRenderer";
import { notifyConfigurationSavedViewerOnly } from "../../src/utils/windowRefresh";

// Mock dependencies
vi.mock("../../src/utils/AdminPanelBackgroundPreview");
vi.mock("../../src/utils/windowRefresh");
vi.mock("../../src/utils/ChallengeRenderer");

describe("AdminPanelDOMUpdater", () => {
    let configManager: ConfigManager;
    let consoleWarnSpy: any;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = "";

        // Reset mocks
        vi.clearAllMocks();

        // Create config manager
        configManager = ConfigManager.getInstance();

        // Spy on console.warn
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // Clear any existing timers
        vi.clearAllTimers();
    });

    describe("notifyViewerDebounced", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should debounce viewer notifications", () => {
            AdminPanelDOMUpdater.notifyViewerDebounced(200);

            expect(notifyConfigurationSavedViewerOnly).not.toHaveBeenCalled();

            vi.advanceTimersByTime(200);

            expect(notifyConfigurationSavedViewerOnly).toHaveBeenCalledTimes(1);
        });

        it("should cancel previous timer when called multiple times", () => {
            AdminPanelDOMUpdater.notifyViewerDebounced(200);
            AdminPanelDOMUpdater.notifyViewerDebounced(200);
            AdminPanelDOMUpdater.notifyViewerDebounced(200);

            vi.advanceTimersByTime(200);

            // Should only be called once after all the debouncing
            expect(notifyConfigurationSavedViewerOnly).toHaveBeenCalledTimes(1);
        });

        it("should use default delay of 200ms when not specified", () => {
            AdminPanelDOMUpdater.notifyViewerDebounced();

            expect(notifyConfigurationSavedViewerOnly).not.toHaveBeenCalled();

            vi.advanceTimersByTime(199);
            expect(notifyConfigurationSavedViewerOnly).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(notifyConfigurationSavedViewerOnly).toHaveBeenCalledTimes(1);
        });

        it("should clear timer reference after notification", () => {
            AdminPanelDOMUpdater.notifyViewerDebounced(200);

            vi.advanceTimersByTime(200);

            expect(notifyConfigurationSavedViewerOnly).toHaveBeenCalledTimes(1);

            // Call again - should create new timer
            AdminPanelDOMUpdater.notifyViewerDebounced(200);
            vi.advanceTimersByTime(200);

            expect(notifyConfigurationSavedViewerOnly).toHaveBeenCalledTimes(2);
        });
    });

    describe("updateAdminUIForSliderChange", () => {
        it("should update background preview and overlay background for BACKGROUND config type", () => {
            const updateOverlaySpy = vi.spyOn(
                AdminPanelDOMUpdater,
                "updateOverlayBackgroundInDOM"
            );

            AdminPanelDOMUpdater.updateAdminUIForSliderChange(
                ConfigType.BACKGROUND,
                configManager
            );

            expect(
                AdminPanelBackgroundPreview.updateBackgroundPreview
            ).toHaveBeenCalledTimes(1);
            expect(updateOverlaySpy).toHaveBeenCalledWith(configManager);
        });

        it("should update background preview and challenge row colors for COLOR config type", () => {
            const updateRowColorsSpy = vi.spyOn(
                AdminPanelDOMUpdater,
                "updateChallengeRowColorsInDOM"
            );

            AdminPanelDOMUpdater.updateAdminUIForSliderChange(
                ConfigType.COLOR,
                configManager
            );

            expect(
                AdminPanelBackgroundPreview.updateBackgroundPreview
            ).toHaveBeenCalledTimes(1);
            expect(updateRowColorsSpy).toHaveBeenCalledWith(configManager);
        });

        it("should not update anything for invalid config type (AUTH)", () => {
            const updateOverlaySpy = vi.spyOn(
                AdminPanelDOMUpdater,
                "updateOverlayBackgroundInDOM"
            );
            const updateRowColorsSpy = vi.spyOn(
                AdminPanelDOMUpdater,
                "updateChallengeRowColorsInDOM"
            );

            AdminPanelDOMUpdater.updateAdminUIForSliderChange(
                "auth" as ConfigType,
                configManager
            );

            expect(
                AdminPanelBackgroundPreview.updateBackgroundPreview
            ).not.toHaveBeenCalled();
            expect(updateOverlaySpy).not.toHaveBeenCalled();
            expect(updateRowColorsSpy).not.toHaveBeenCalled();
        });

        it("should not update anything for invalid config type (BEHAVIOR)", () => {
            const updateOverlaySpy = vi.spyOn(
                AdminPanelDOMUpdater,
                "updateOverlayBackgroundInDOM"
            );
            const updateRowColorsSpy = vi.spyOn(
                AdminPanelDOMUpdater,
                "updateChallengeRowColorsInDOM"
            );

            AdminPanelDOMUpdater.updateAdminUIForSliderChange(
                "behavior" as ConfigType,
                configManager
            );

            expect(
                AdminPanelBackgroundPreview.updateBackgroundPreview
            ).not.toHaveBeenCalled();
            expect(updateOverlaySpy).not.toHaveBeenCalled();
            expect(updateRowColorsSpy).not.toHaveBeenCalled();
        });
    });

    describe("updateOverlayBackgroundInDOM", () => {
        it("should update challenge card background when card exists", () => {
            // Create challenge card with proper structure
            const challengeCard = document.createElement("div");
            challengeCard.className = "card";
            const challengeContainer = document.createElement("div");
            challengeContainer.className = "challenge-container";
            challengeContainer.appendChild(challengeCard);
            document.body.appendChild(challengeContainer);

            // Set config values
            configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR,
                "#646464"
            );
            configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY,
                0.6
            );

            AdminPanelDOMUpdater.updateOverlayBackgroundInDOM(configManager);

            expect(challengeCard.style.backgroundColor).toBe(
                "rgba(100, 100, 100, 0.6)"
            );
        });

        it("should warn when challenge card is not found", () => {
            AdminPanelDOMUpdater.updateOverlayBackgroundInDOM(configManager);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                WARNING_MESSAGES.CHALLENGE_CARD_NOT_FOUND_FOR_OVERLAY_UPDATE
            );
        });

        it("should not update background when color is not set", () => {
            const challengeCard = document.createElement("div");
            challengeCard.className = "card";
            const challengeContainer = document.createElement("div");
            challengeContainer.className = "challenge-container";
            challengeContainer.appendChild(challengeCard);
            document.body.appendChild(challengeContainer);

            // Clear color config
            configManager.set(BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR, "");

            AdminPanelDOMUpdater.updateOverlayBackgroundInDOM(configManager);

            expect(challengeCard.style.backgroundColor).toBe("");
        });

        it("should not update background when opacity is undefined", () => {
            const challengeCard = document.createElement("div");
            challengeCard.className = "card";
            const challengeContainer = document.createElement("div");
            challengeContainer.className = "challenge-container";
            challengeContainer.appendChild(challengeCard);
            document.body.appendChild(challengeContainer);

            configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR,
                "#646464"
            );
            configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY,
                undefined
            );

            AdminPanelDOMUpdater.updateOverlayBackgroundInDOM(configManager);

            expect(challengeCard.style.backgroundColor).toBe("");
        });

        it("should handle opacity value of 0", () => {
            const challengeCard = document.createElement("div");
            challengeCard.className = "card";
            const challengeContainer = document.createElement("div");
            challengeContainer.className = "challenge-container";
            challengeContainer.appendChild(challengeCard);
            document.body.appendChild(challengeContainer);

            configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR,
                "#646464"
            );
            configManager.set(BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY, 0);

            AdminPanelDOMUpdater.updateOverlayBackgroundInDOM(configManager);

            expect(challengeCard.style.backgroundColor).toBe(
                "rgba(100, 100, 100, 0)"
            );
        });

        it("should handle opacity value of 1", () => {
            const challengeCard = document.createElement("div");
            challengeCard.className = "card";
            const challengeContainer = document.createElement("div");
            challengeContainer.className = "challenge-container";
            challengeContainer.appendChild(challengeCard);
            document.body.appendChild(challengeContainer);

            configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR,
                "#646464"
            );
            configManager.set(BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY, 1);

            AdminPanelDOMUpdater.updateOverlayBackgroundInDOM(configManager);

            // Browser normalizes rgba(100, 100, 100, 1) to rgb(100, 100, 100)
            expect(challengeCard.style.backgroundColor).toBe(
                "rgb(100, 100, 100)"
            );
        });
    });

    describe("updateChallengeRowColorsInDOM", () => {
        it("should return early when no challenge elements exist", () => {
            AdminPanelDOMUpdater.updateChallengeRowColorsInDOM(configManager);

            expect(
                ChallengeRenderer.applyBackgroundCustomization
            ).not.toHaveBeenCalled();
        });

        it("should apply background customization to all challenge elements", () => {
            // Create challenge elements
            const challenge1 = document.createElement("li");
            challenge1.className = "challenge";
            const challenge2 = document.createElement("li");
            challenge2.className = "challenge";
            const challenge3 = document.createElement("li");
            challenge3.className = "challenge";

            const challengeList = document.createElement("ul");
            challengeList.id = "challenge-list";
            challengeList.appendChild(challenge1);
            challengeList.appendChild(challenge2);
            challengeList.appendChild(challenge3);
            document.body.appendChild(challengeList);

            // Set config values
            configManager.set(COLOR_CONFIG.CHALLENGE_ROW_COLORS, [
                "#ff0000",
                "#00ff00",
            ]);
            configManager.set(COLOR_CONFIG.CHALLENGE_ROW_TEXT_COLORS, [
                "#ffffff",
                "#000000",
            ]);
            configManager.set(COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY, 0.8);
            configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR,
                "#646464"
            );
            configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_OPACITY,
                0.6
            );
            configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_COLOR,
                "#ffffff"
            );
            configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_AUTO_TEXT_COLOR,
                false
            );
            configManager.set(BACKGROUND_CONFIG.CHALLENGE_TEXT_SHADOW, true);

            AdminPanelDOMUpdater.updateChallengeRowColorsInDOM(configManager);

            expect(
                ChallengeRenderer.applyBackgroundCustomization
            ).toHaveBeenCalledTimes(3);

            // Verify first call
            expect(
                ChallengeRenderer.applyBackgroundCustomization
            ).toHaveBeenNthCalledWith(
                1,
                challenge1,
                {
                    challengeBackgroundColor: "#646464",
                    challengeBackgroundOpacity: 0.6,
                    challengeTextColor: "#ffffff",
                    challengeAutoTextColor: false,
                    challengeTextShadow: true,
                },
                0,
                ["#ff0000", "#00ff00"],
                ["#ffffff", "#000000"],
                0.8
            );
        });

        it("should use default opacity when not configured", () => {
            const challenge = document.createElement("li");
            challenge.className = "challenge";
            document.body.appendChild(challenge);

            // Clear all color config to ensure defaults are used
            configManager.set(COLOR_CONFIG.CHALLENGE_ROW_COLORS, null);
            configManager.set(COLOR_CONFIG.CHALLENGE_ROW_TEXT_COLORS, null);
            configManager.set(
                COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY,
                undefined
            );

            AdminPanelDOMUpdater.updateChallengeRowColorsInDOM(configManager);

            expect(
                ChallengeRenderer.applyBackgroundCustomization
            ).toHaveBeenCalledWith(
                challenge,
                expect.any(Object),
                0,
                [],
                [],
                BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY
            );
        });

        it("should handle empty row colors arrays", () => {
            const challenge = document.createElement("li");
            challenge.className = "challenge";
            document.body.appendChild(challenge);

            configManager.set(COLOR_CONFIG.CHALLENGE_ROW_COLORS, []);
            configManager.set(COLOR_CONFIG.CHALLENGE_ROW_TEXT_COLORS, []);

            AdminPanelDOMUpdater.updateChallengeRowColorsInDOM(configManager);

            expect(
                ChallengeRenderer.applyBackgroundCustomization
            ).toHaveBeenCalledWith(
                challenge,
                expect.any(Object),
                0,
                [],
                [],
                expect.any(Number)
            );
        });

        it("should handle null row colors", () => {
            const challenge = document.createElement("li");
            challenge.className = "challenge";
            document.body.appendChild(challenge);

            configManager.set(COLOR_CONFIG.CHALLENGE_ROW_COLORS, null);
            configManager.set(COLOR_CONFIG.CHALLENGE_ROW_TEXT_COLORS, null);

            AdminPanelDOMUpdater.updateChallengeRowColorsInDOM(configManager);

            expect(
                ChallengeRenderer.applyBackgroundCustomization
            ).toHaveBeenCalledWith(
                challenge,
                expect.any(Object),
                0,
                [],
                [],
                expect.any(Number)
            );
        });

        it("should pass correct index to each challenge element", () => {
            const challenges = [
                document.createElement("li"),
                document.createElement("li"),
                document.createElement("li"),
            ];

            challenges.forEach((challenge) => {
                challenge.className = "challenge";
                document.body.appendChild(challenge);
            });

            AdminPanelDOMUpdater.updateChallengeRowColorsInDOM(configManager);

            expect(
                ChallengeRenderer.applyBackgroundCustomization
            ).toHaveBeenNthCalledWith(
                1,
                challenges[0],
                expect.any(Object),
                0,
                expect.any(Array),
                expect.any(Array),
                expect.any(Number)
            );

            expect(
                ChallengeRenderer.applyBackgroundCustomization
            ).toHaveBeenNthCalledWith(
                2,
                challenges[1],
                expect.any(Object),
                1,
                expect.any(Array),
                expect.any(Array),
                expect.any(Number)
            );

            expect(
                ChallengeRenderer.applyBackgroundCustomization
            ).toHaveBeenNthCalledWith(
                3,
                challenges[2],
                expect.any(Object),
                2,
                expect.any(Array),
                expect.any(Array),
                expect.any(Number)
            );
        });
    });
});
