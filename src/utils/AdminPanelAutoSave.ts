import type ConfigManager from "../classes/ConfigManager";
import {
    BACKGROUND_CONFIG,
    BACKGROUND_DEFAULTS,
    COLOR_CONFIG,
    CORE_CONFIG,
} from "../types/ConfigConstants";
import { ConfigType } from "../types/ConfigType";
import { ELEMENT_IDS } from "../types/DOMConstants";
import { ERROR_MESSAGES } from "../types/MessageConstants";
import { AdminPanelBackgroundConfigGetter } from "./AdminPanelBackgroundConfigGetter";
import { AdminPanelColorManager } from "./AdminPanelColorManager";
import { AdminPanelDOMUpdater } from "./AdminPanelDOMUpdater";
import { AdminPanelUIHelper } from "./AdminPanelUIHelper";
import { notifyConfigurationSaved } from "./windowRefresh";

/**
 * Utility class for auto-saving admin panel configuration
 * Handles auto-save for authentication, behavior, color, and background configuration
 */
export class AdminPanelAutoSave {
    /**
     * Auto-save authentication configuration
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static autoSaveAuthConfiguration(configManager: ConfigManager): void {
        try {
            const authConfig = {
                twitch_oauth: AdminPanelUIHelper.getInputValue(
                    ELEMENT_IDS.TWITCH_OAUTH
                ),
                twitch_username: AdminPanelUIHelper.getInputValue(
                    ELEMENT_IDS.TWITCH_USERNAME
                ),
                twitch_channel: AdminPanelUIHelper.getInputValue(
                    ELEMENT_IDS.TWITCH_CHANNEL
                ),
            };

            const success = configManager.set(CORE_CONFIG.AUTH, authConfig);

            if (success) {
                // Notify other windows to refresh after successful save
                notifyConfigurationSaved();
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.ERROR_AUTO_SAVING_AUTH_CONFIG, error);
        }
    }

    /**
     * Auto-save behavior configuration
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static autoSaveBehaviorConfiguration(configManager: ConfigManager): void {
        try {
            const maxChallenges = parseInt(
                AdminPanelUIHelper.getInputValue(ELEMENT_IDS.MAX_CHALLENGES),
                10
            );

            const success = configManager.set(
                CORE_CONFIG.MAX_CHALLENGES,
                maxChallenges
            );

            if (success) {
                // Notify other windows to refresh after successful save
                notifyConfigurationSaved();
            }
        } catch (error) {
            console.error(
                ERROR_MESSAGES.ERROR_AUTO_SAVING_BEHAVIOR_CONFIG,
                error
            );
        }
    }

    /**
     * Auto-save color configuration
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static autoSaveColorConfiguration(configManager: ConfigManager): void {
        try {
            // Get color configuration from UI
            const colorConfig =
                AdminPanelColorManager.getCurrentColorConfigFromUI();
            const challengeRowColors =
                AdminPanelColorManager.convertUIToColors(colorConfig);
            const challengeRowTextColors =
                AdminPanelColorManager.convertUIToTextColors(colorConfig);

            // Get row colors opacity
            const rowColorsOpacitySlider = document.getElementById(
                ELEMENT_IDS.ROW_COLORS_OPACITY
            ) as HTMLInputElement;
            const rowColorsOpacity = rowColorsOpacitySlider
                ? parseInt(rowColorsOpacitySlider.value) / 100
                : BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY;

            // Save all color-related configuration
            const colorsSuccess = configManager.set(
                CORE_CONFIG.CHALLENGE_ROW_COLORS,
                challengeRowColors
            );
            const textColorsSuccess = configManager.set(
                CORE_CONFIG.CHALLENGE_ROW_TEXT_COLORS,
                challengeRowTextColors
            );
            const rowColorsOpacitySuccess = configManager.set(
                COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY,
                rowColorsOpacity
            );

            if (colorsSuccess && textColorsSuccess && rowColorsOpacitySuccess) {
                // Update admin UI directly (no refresh) - IMMEDIATE
                AdminPanelDOMUpdater.updateAdminUIForSliderChange(
                    ConfigType.COLOR,
                    configManager
                );

                // Notify viewer window to refresh - DEBOUNCED (prevents flicker)
                AdminPanelDOMUpdater.notifyViewerDebounced();
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.ERROR_AUTO_SAVING_COLOR_CONFIG, error);
        }
    }

    /**
     * Auto-save background configuration
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static autoSaveBackgroundConfiguration(configManager: ConfigManager): void {
        try {
            // Get background configuration from UI
            const backgroundConfig =
                AdminPanelBackgroundConfigGetter.getCurrentBackgroundConfigFromUI();

            // Save all background-related configuration
            const overlayBackgroundColorSuccess = configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR,
                backgroundConfig.overlayBackgroundColor
            );
            const overlayBackgroundOpacitySuccess = configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY,
                backgroundConfig.overlayBackgroundOpacity
            );
            const backgroundColorSuccess = configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR,
                backgroundConfig.challengeBackgroundColor
            );
            const backgroundOpacitySuccess = configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_OPACITY,
                backgroundConfig.challengeBackgroundOpacity
            );
            const textColorSuccess = configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_COLOR,
                backgroundConfig.challengeTextColor
            );
            const autoTextColorSuccess = configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_AUTO_TEXT_COLOR,
                backgroundConfig.challengeAutoTextColor
            );
            const textShadowSuccess = configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_SHADOW,
                backgroundConfig.challengeTextShadow
            );

            if (
                overlayBackgroundColorSuccess &&
                overlayBackgroundOpacitySuccess &&
                backgroundColorSuccess &&
                backgroundOpacitySuccess &&
                textColorSuccess &&
                autoTextColorSuccess &&
                textShadowSuccess
            ) {
                // Update admin UI directly (no refresh) - IMMEDIATE
                AdminPanelDOMUpdater.updateAdminUIForSliderChange(
                    ConfigType.BACKGROUND,
                    configManager
                );

                // Notify viewer window to refresh - DEBOUNCED (prevents flicker)
                AdminPanelDOMUpdater.notifyViewerDebounced();
            }
        } catch (error) {
            console.error(
                ERROR_MESSAGES.ERROR_AUTO_SAVING_BACKGROUND_CONFIG,
                error
            );
        }
    }
}
