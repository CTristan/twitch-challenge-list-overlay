import type ConfigManager from "../classes/ConfigManager";
import {
    BACKGROUND_CONFIG,
    BACKGROUND_DEFAULTS,
    COLOR_CONFIG,
} from "../types/ConfigConstants";
import { ConfigType } from "../types/ConfigType";
import { CSS_SELECTORS } from "../types/DOMConstants";
import { WARNING_MESSAGES } from "../types/MessageConstants";
import { AdminPanelBackgroundPreview } from "./AdminPanelBackgroundPreview";
import ChallengeRenderer from "./ChallengeRenderer";
import { combineColorWithOpacity } from "./ColorUtils";
import { notifyConfigurationSavedViewerOnly } from "./windowRefresh";

/**
 * Utility class for updating DOM elements in the admin panel
 * Handles slider changes, overlay background updates, and challenge row color updates
 */
export class AdminPanelDOMUpdater {
    /**
     * Timer for debouncing viewer refresh notifications
     * Prevents quick refreshes while moving the slider
     */
    private static viewerNotifyTimer?: number | undefined;

    /**
     * Debounced viewer notification to prevent rapid-fire refreshes
     * Waits for user to pause slider drag before notifying viewer window
     * @param delay - Debounce delay in milliseconds
     * @returns {void}
     */
    static notifyViewerDebounced(delay: number = 200): void {
        if (AdminPanelDOMUpdater.viewerNotifyTimer) {
            clearTimeout(AdminPanelDOMUpdater.viewerNotifyTimer);
        }
        AdminPanelDOMUpdater.viewerNotifyTimer = window.setTimeout(() => {
            notifyConfigurationSavedViewerOnly();
            AdminPanelDOMUpdater.viewerNotifyTimer = undefined;
        }, delay);
    }

    /**
     * Update admin panel UI to reflect slider changes without page refresh
     * This is called during slider interaction to provide immediate visual feedback
     * @param configType - Type of configuration being updated (ConfigType.COLOR or ConfigType.BACKGROUND)
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static updateAdminUIForSliderChange(
        configType: ConfigType,
        configManager: ConfigManager
    ): void {
        if (configType === ConfigType.BACKGROUND) {
            // Update background preview
            AdminPanelBackgroundPreview.updateBackgroundPreview();

            // If overlay background opacity changed, update the main challenge card
            AdminPanelDOMUpdater.updateOverlayBackgroundInDOM(configManager);
        } else if (configType === ConfigType.COLOR) {
            // Update challenge row color preview to reflect new colors and opacity
            AdminPanelBackgroundPreview.updateBackgroundPreview();

            // Update challenge row colors in the DOM to reflect new opacity
            AdminPanelDOMUpdater.updateChallengeRowColorsInDOM(configManager);
        }
    }

    /**
     * Update overlay background styling in the DOM without page refresh
     * Applies current overlay background color and opacity to the challenge card
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static updateOverlayBackgroundInDOM(configManager: ConfigManager): void {
        // Target the specific challenge card in the challenge container
        const challengeCard = document.querySelector(
            CSS_SELECTORS.CHALLENGE_CONTAINER_CARD
        ) as HTMLElement;

        if (!challengeCard) {
            console.warn(
                WARNING_MESSAGES.CHALLENGE_CARD_NOT_FOUND_FOR_OVERLAY_UPDATE
            );
            return;
        }

        const overlayBackgroundColor = configManager.get(
            BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR
        );
        const overlayBackgroundOpacity = configManager.get(
            BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY
        );

        if (overlayBackgroundColor && overlayBackgroundOpacity !== undefined) {
            const overlayBackgroundRGBA = combineColorWithOpacity(
                overlayBackgroundColor,
                overlayBackgroundOpacity
            );
            challengeCard.style.backgroundColor = overlayBackgroundRGBA;
        }
    }

    /**
     * Update challenge row colors in the DOM without page refresh
     * Re-applies background customization to all challenge elements with updated opacity
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static updateChallengeRowColorsInDOM(configManager: ConfigManager): void {
        // Query all challenge list items
        const challengeElements = document.querySelectorAll(
            CSS_SELECTORS.CHALLENGE
        ) as NodeListOf<HTMLElement>;

        if (challengeElements.length === 0) {
            return;
        }

        // Get current color configuration
        const rowColors =
            configManager.get(COLOR_CONFIG.CHALLENGE_ROW_COLORS) || [];
        const rowTextColors =
            configManager.get(COLOR_CONFIG.CHALLENGE_ROW_TEXT_COLORS) || [];
        const rowColorsOpacity =
            configManager.get(COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY) ??
            BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY;

        // Get background customization configuration
        const backgroundConfig = {
            challengeBackgroundColor: configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR
            ),
            challengeBackgroundOpacity: configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_OPACITY
            ),
            challengeTextColor: configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_COLOR
            ),
            challengeAutoTextColor: configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_AUTO_TEXT_COLOR
            ),
            challengeTextShadow: configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_SHADOW
            ),
        };

        // Re-apply background customization to each challenge element
        challengeElements.forEach((challengeElement, index) => {
            ChallengeRenderer.applyBackgroundCustomization(
                challengeElement,
                backgroundConfig,
                index,
                rowColors,
                rowTextColors,
                rowColorsOpacity
            );
        });
    }
}
