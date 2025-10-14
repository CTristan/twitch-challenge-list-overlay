import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfigManager from "../../src/classes/ConfigManager";
import {
    BACKGROUND_CONFIG,
    COLOR_CONFIG,
    CORE_CONFIG,
} from "../../src/types/ConfigConstants";
import { ELEMENT_IDS } from "../../src/types/DOMConstants";
import { AdminPanelAutoSave } from "../../src/utils/AdminPanelAutoSave";
import { AdminPanelBackgroundConfigGetter } from "../../src/utils/AdminPanelBackgroundConfigGetter";
import { AdminPanelColorManager } from "../../src/utils/AdminPanelColorManager";
import { AdminPanelDOMUpdater } from "../../src/utils/AdminPanelDOMUpdater";
import { AdminPanelUIHelper } from "../../src/utils/AdminPanelUIHelper";
import { notifyConfigurationSaved } from "../../src/utils/windowRefresh";

// Mock dependencies
vi.mock("../../src/utils/AdminPanelUIHelper");
vi.mock("../../src/utils/AdminPanelColorManager");
vi.mock("../../src/utils/AdminPanelBackgroundConfigGetter");
vi.mock("../../src/utils/AdminPanelDOMUpdater");
vi.mock("../../src/utils/windowRefresh");

describe("AdminPanelAutoSave", () => {
    let configManager: ConfigManager;
    let consoleErrorSpy: any;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Create fresh ConfigManager instance
        (ConfigManager as any).instance = null;
        configManager = ConfigManager.getInstance({
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
        });

        // Spy on console.error
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Setup DOM
        document.body.innerHTML = `
            <input id="${ELEMENT_IDS.TWITCH_OAUTH}" value="oauth:test123" />
            <input id="${ELEMENT_IDS.TWITCH_USERNAME}" value="testuser" />
            <input id="${ELEMENT_IDS.TWITCH_CHANNEL}" value="testchannel" />
            <input id="${ELEMENT_IDS.MAX_CHALLENGES}" value="15" />
            <input id="${ELEMENT_IDS.ROW_COLORS_OPACITY}" value="80" />
        `;
    });

    describe("autoSaveAuthConfiguration", () => {
        it("should save auth configuration successfully", () => {
            // Mock UIHelper to return values
            vi.mocked(AdminPanelUIHelper.getInputValue).mockImplementation(
                (id: string) => {
                    if (id === ELEMENT_IDS.TWITCH_OAUTH) return "oauth:test123";
                    if (id === ELEMENT_IDS.TWITCH_USERNAME) return "testuser";
                    if (id === ELEMENT_IDS.TWITCH_CHANNEL) return "testchannel";
                    return "";
                }
            );

            // Spy on configManager.set
            const setSpy = vi.spyOn(configManager, "set");

            AdminPanelAutoSave.autoSaveAuthConfiguration(configManager);

            // Verify set was called with correct auth config
            expect(setSpy).toHaveBeenCalledWith(CORE_CONFIG.AUTH, {
                twitch_oauth: "oauth:test123",
                twitch_username: "testuser",
                twitch_channel: "testchannel",
            });

            // Verify notification was sent
            expect(notifyConfigurationSaved).toHaveBeenCalled();
        });

        it("should handle errors gracefully", () => {
            // Mock UIHelper to throw error
            vi.mocked(AdminPanelUIHelper.getInputValue).mockImplementation(
                () => {
                    throw new Error("Test error");
                }
            );

            AdminPanelAutoSave.autoSaveAuthConfiguration(configManager);

            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it("should not notify if save fails", () => {
            // Mock UIHelper
            vi.mocked(AdminPanelUIHelper.getInputValue).mockReturnValue("test");

            // Mock set to return false
            vi.spyOn(configManager, "set").mockReturnValue(false);

            AdminPanelAutoSave.autoSaveAuthConfiguration(configManager);

            // Verify notification was NOT sent
            expect(notifyConfigurationSaved).not.toHaveBeenCalled();
        });
    });

    describe("autoSaveBehaviorConfiguration", () => {
        it("should save behavior configuration successfully", () => {
            // Mock UIHelper to return max challenges value
            vi.mocked(AdminPanelUIHelper.getInputValue).mockReturnValue("15");

            // Spy on configManager.set
            const setSpy = vi.spyOn(configManager, "set");

            AdminPanelAutoSave.autoSaveBehaviorConfiguration(configManager);

            // Verify set was called with correct value
            expect(setSpy).toHaveBeenCalledWith(CORE_CONFIG.MAX_CHALLENGES, 15);

            // Verify notification was sent
            expect(notifyConfigurationSaved).toHaveBeenCalled();
        });

        it("should handle errors gracefully", () => {
            // Mock UIHelper to throw error
            vi.mocked(AdminPanelUIHelper.getInputValue).mockImplementation(
                () => {
                    throw new Error("Test error");
                }
            );

            AdminPanelAutoSave.autoSaveBehaviorConfiguration(configManager);

            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it("should not notify if save fails", () => {
            // Mock UIHelper
            vi.mocked(AdminPanelUIHelper.getInputValue).mockReturnValue("10");

            // Mock set to return false
            vi.spyOn(configManager, "set").mockReturnValue(false);

            AdminPanelAutoSave.autoSaveBehaviorConfiguration(configManager);

            // Verify notification was NOT sent
            expect(notifyConfigurationSaved).not.toHaveBeenCalled();
        });
    });

    describe("autoSaveColorConfiguration", () => {
        it("should save color configuration successfully", () => {
            // Mock color manager methods
            const mockColorConfig = {
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
                    textColor: "#ffffff",
                },
            };
            vi.mocked(
                AdminPanelColorManager.getCurrentColorConfigFromUI
            ).mockReturnValue(mockColorConfig);
            vi.mocked(AdminPanelColorManager.convertUIToColors).mockReturnValue(
                ["#ff0000"]
            );
            vi.mocked(
                AdminPanelColorManager.convertUIToTextColors
            ).mockReturnValue(["#ffffff"]);

            // Spy on configManager.set
            const setSpy = vi.spyOn(configManager, "set");

            AdminPanelAutoSave.autoSaveColorConfiguration(configManager);

            // Verify all color settings were saved
            expect(setSpy).toHaveBeenCalledWith(
                CORE_CONFIG.CHALLENGE_ROW_COLORS,
                ["#ff0000"]
            );
            expect(setSpy).toHaveBeenCalledWith(
                CORE_CONFIG.CHALLENGE_ROW_TEXT_COLORS,
                ["#ffffff"]
            );
            expect(setSpy).toHaveBeenCalledWith(
                COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY,
                0.8
            );

            // Verify DOM updater was called
            expect(
                AdminPanelDOMUpdater.updateAdminUIForSliderChange
            ).toHaveBeenCalled();
            expect(
                AdminPanelDOMUpdater.notifyViewerDebounced
            ).toHaveBeenCalled();
        });

        it("should use default opacity if slider not found", () => {
            // Remove opacity slider from DOM
            document.body.innerHTML = "";

            // Mock color manager methods
            const mockColorConfig = {
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
                    textColor: "#ffffff",
                },
            };
            vi.mocked(
                AdminPanelColorManager.getCurrentColorConfigFromUI
            ).mockReturnValue(mockColorConfig);
            vi.mocked(AdminPanelColorManager.convertUIToColors).mockReturnValue(
                ["#ff0000"]
            );
            vi.mocked(
                AdminPanelColorManager.convertUIToTextColors
            ).mockReturnValue(["#ffffff"]);

            // Spy on configManager.set
            const setSpy = vi.spyOn(configManager, "set");

            AdminPanelAutoSave.autoSaveColorConfiguration(configManager);

            // Verify default opacity was used (1.0)
            expect(setSpy).toHaveBeenCalledWith(
                COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY,
                1.0
            );
        });

        it("should handle errors gracefully", () => {
            // Mock color manager to throw error
            vi.mocked(
                AdminPanelColorManager.getCurrentColorConfigFromUI
            ).mockImplementation(() => {
                throw new Error("Test error");
            });

            AdminPanelAutoSave.autoSaveColorConfiguration(configManager);

            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it("should not update UI if any save fails", () => {
            // Mock color manager methods
            const mockColorConfig = {
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
                    textColor: "#ffffff",
                },
            };
            vi.mocked(
                AdminPanelColorManager.getCurrentColorConfigFromUI
            ).mockReturnValue(mockColorConfig);
            vi.mocked(AdminPanelColorManager.convertUIToColors).mockReturnValue(
                ["#ff0000"]
            );
            vi.mocked(
                AdminPanelColorManager.convertUIToTextColors
            ).mockReturnValue(["#ffffff"]);

            // Mock one set to fail
            vi.spyOn(configManager, "set")
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);

            AdminPanelAutoSave.autoSaveColorConfiguration(configManager);

            // Verify DOM updater was NOT called
            expect(
                AdminPanelDOMUpdater.updateAdminUIForSliderChange
            ).not.toHaveBeenCalled();
            expect(
                AdminPanelDOMUpdater.notifyViewerDebounced
            ).not.toHaveBeenCalled();
        });
    });

    describe("autoSaveBackgroundConfiguration", () => {
        it("should save background configuration successfully", () => {
            // Mock background config getter
            const mockBackgroundConfig = {
                overlayBackgroundColor: "#646464",
                overlayBackgroundOpacity: 0.6,
                challengeBackgroundColor: "#000000",
                challengeBackgroundOpacity: 1.0,
                challengeTextColor: "#ffffff",
                challengeAutoTextColor: false,
                challengeTextShadow: true,
            };
            vi.mocked(
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI
            ).mockReturnValue(mockBackgroundConfig);

            // Spy on configManager.set
            const setSpy = vi.spyOn(configManager, "set");

            AdminPanelAutoSave.autoSaveBackgroundConfiguration(configManager);

            // Verify all background settings were saved
            expect(setSpy).toHaveBeenCalledWith(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR,
                "#646464"
            );
            expect(setSpy).toHaveBeenCalledWith(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY,
                0.6
            );
            expect(setSpy).toHaveBeenCalledWith(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR,
                "#000000"
            );
            expect(setSpy).toHaveBeenCalledWith(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_OPACITY,
                1.0
            );
            expect(setSpy).toHaveBeenCalledWith(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_COLOR,
                "#ffffff"
            );
            expect(setSpy).toHaveBeenCalledWith(
                BACKGROUND_CONFIG.CHALLENGE_AUTO_TEXT_COLOR,
                false
            );
            expect(setSpy).toHaveBeenCalledWith(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_SHADOW,
                true
            );

            // Verify DOM updater was called
            expect(
                AdminPanelDOMUpdater.updateAdminUIForSliderChange
            ).toHaveBeenCalled();
            expect(
                AdminPanelDOMUpdater.notifyViewerDebounced
            ).toHaveBeenCalled();
        });

        it("should handle errors gracefully", () => {
            // Mock background config getter to throw error
            vi.mocked(
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI
            ).mockImplementation(() => {
                throw new Error("Test error");
            });

            AdminPanelAutoSave.autoSaveBackgroundConfiguration(configManager);

            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it("should not update UI if any save fails", () => {
            // Mock background config getter
            const mockBackgroundConfig = {
                overlayBackgroundColor: "#646464",
                overlayBackgroundOpacity: 0.6,
                challengeBackgroundColor: "#000000",
                challengeBackgroundOpacity: 1.0,
                challengeTextColor: "#ffffff",
                challengeAutoTextColor: false,
                challengeTextShadow: true,
            };
            vi.mocked(
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI
            ).mockReturnValue(mockBackgroundConfig);

            // Mock one set to fail
            vi.spyOn(configManager, "set")
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);

            AdminPanelAutoSave.autoSaveBackgroundConfiguration(configManager);

            // Verify DOM updater was NOT called
            expect(
                AdminPanelDOMUpdater.updateAdminUIForSliderChange
            ).not.toHaveBeenCalled();
            expect(
                AdminPanelDOMUpdater.notifyViewerDebounced
            ).not.toHaveBeenCalled();
        });
    });
});
