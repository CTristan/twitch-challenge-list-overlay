import type ConfigManager from "../classes/ConfigManager";
import {
    BACKGROUND_DEFAULTS,
    BACKGROUND_UI_ELEMENTS,
    COLOR_CONFIG,
} from "../types/ConfigConstants";
import { COLOR_TIERS, ELEMENT_IDS } from "../types/DOMConstants";
import { AdminPanelBackgroundPreview } from "./AdminPanelBackgroundPreview";
import { AdminPanelColorManager } from "./AdminPanelColorManager";
import { AdminPanelColorTierManager } from "./AdminPanelColorTierManager";
import { AdminPanelUIHelper } from "./AdminPanelUIHelper";

/**
 * Utility class for populating admin panel UI with configuration values
 * Handles form population for authentication, behavior, colors, and background
 */
export class AdminPanelUIPopulator {
    /**
     * Populate the configuration form with current values
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static populateConfigurationForm(configManager: ConfigManager): void {
        const config = configManager.getAll();

        // Populate auth fields
        AdminPanelUIHelper.setInputValue(
            ELEMENT_IDS.TWITCH_OAUTH,
            config.auth?.twitch_oauth || ""
        );
        AdminPanelUIHelper.setInputValue(
            ELEMENT_IDS.TWITCH_USERNAME,
            config.auth?.twitch_username || ""
        );
        AdminPanelUIHelper.setInputValue(
            ELEMENT_IDS.TWITCH_CHANNEL,
            config.auth?.twitch_channel || ""
        );

        // Populate behavior fields
        AdminPanelUIHelper.setInputValue(
            ELEMENT_IDS.MAX_CHALLENGES,
            config.maxChallenges?.toString() || "10"
        );

        // Populate color configuration
        AdminPanelUIPopulator.populateColorConfiguration(
            config.challengeRowColors || [],
            config.challengeRowTextColors || [],
            configManager
        );

        // Populate background configuration
        AdminPanelUIPopulator.populateBackgroundConfiguration(config);
    }

    /**
     * Populate the color configuration UI with current values
     * @param backgroundColors - Array of background color strings from configuration
     * @param textColors - Array of text color strings from configuration
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static populateColorConfiguration(
        backgroundColors: string[],
        textColors: string[],
        configManager: ConfigManager
    ): void {
        const colorConfig = AdminPanelColorManager.convertColorsToUI(
            backgroundColors,
            textColors
        );
        const tiers = COLOR_TIERS;

        tiers.forEach((tier) => {
            const tierConstants =
                AdminPanelColorManager.getColorTierConstants(tier);

            const checkbox = document.getElementById(
                tierConstants.enabled
            ) as HTMLInputElement;
            const bgColorInput = document.getElementById(
                tierConstants.bgColor
            ) as HTMLInputElement;
            const textColorInput = document.getElementById(
                tierConstants.textColor
            ) as HTMLInputElement;

            // Primary tier has no checkbox (always enabled), so only check color inputs
            const isPrimaryTier = tier === COLOR_TIERS[0];
            const hasRequiredElements = isPrimaryTier
                ? bgColorInput && textColorInput
                : checkbox && bgColorInput && textColorInput;

            if (hasRequiredElements) {
                const tierConfig = colorConfig[tier];

                // Set checkbox state (only for non-primary tiers)
                if (checkbox) {
                    checkbox.checked = tierConfig.enabled;
                }

                // Set color values
                bgColorInput.value = tierConfig.backgroundColor;
                textColorInput.value = tierConfig.textColor;

                // Update visual state
                AdminPanelColorTierManager.updateColorTierState(
                    tier,
                    tierConfig.enabled
                );
            }
        });

        // Populate row colors opacity
        const opacitySlider = document.getElementById(
            ELEMENT_IDS.ROW_COLORS_OPACITY
        ) as HTMLInputElement;
        const opacityDisplay = document.getElementById(
            ELEMENT_IDS.ROW_COLORS_OPACITY_DISPLAY
        );
        if (opacitySlider && opacityDisplay) {
            const opacity =
                configManager.get(COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY) ??
                BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY;
            const opacityPercent = Math.round(opacity * 100);
            opacitySlider.value = opacityPercent.toString();
            opacityDisplay.textContent = `${opacityPercent}%`;
        }
    }

    /**
     * Populate the background configuration UI with current values
     * @param config - Configuration object with background settings
     * @returns {void}
     */
    static populateBackgroundConfiguration(config: Config): void {
        // Overlay background color
        const overlayBackgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        if (overlayBackgroundColorInput) {
            // Extract color from rgba or use default
            const overlayBackgroundColor =
                config.overlayBackgroundColor ||
                BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_COLOR;
            const hexColor = AdminPanelColorManager.extractColorFromRGBA(
                overlayBackgroundColor
            );
            overlayBackgroundColorInput.value = hexColor;
        }

        // Overlay background opacity
        const overlayOpacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;
        const overlayOpacityDisplay = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_OPACITY_DISPLAY
        );
        if (overlayOpacitySlider && overlayOpacityDisplay) {
            const overlayOpacity =
                config.overlayBackgroundOpacity ??
                BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY;
            const overlayOpacityPercent = Math.round(overlayOpacity * 100);
            overlayOpacitySlider.value = overlayOpacityPercent.toString();
            overlayOpacityDisplay.textContent = `${overlayOpacityPercent}%`;
        }

        // Challenge row background color
        const backgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        if (backgroundColorInput) {
            // Extract color from rgba or use default
            const backgroundColor =
                config.challengeBackgroundColor ||
                BACKGROUND_DEFAULTS.BACKGROUND_COLOR;
            const hexColor =
                AdminPanelColorManager.extractColorFromRGBA(backgroundColor);
            backgroundColorInput.value = hexColor;
        }

        // Challenge row background opacity
        const opacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;
        const opacityDisplay = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OPACITY_DISPLAY
        );
        if (opacitySlider && opacityDisplay) {
            const opacity =
                config.challengeBackgroundOpacity ??
                BACKGROUND_DEFAULTS.BACKGROUND_OPACITY;
            const opacityPercent = Math.round(opacity * 100);
            opacitySlider.value = opacityPercent.toString();
            opacityDisplay.textContent = `${opacityPercent}%`;
        }

        // Auto text color
        const autoTextColorCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX
        ) as HTMLInputElement;
        if (autoTextColorCheckbox) {
            autoTextColorCheckbox.checked =
                config.challengeAutoTextColor ??
                BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR;
        }

        // Manual text color
        const textColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT
        ) as HTMLInputElement;
        if (textColorInput) {
            textColorInput.value =
                config.challengeTextColor || BACKGROUND_DEFAULTS.TEXT_COLOR;
            textColorInput.disabled =
                config.challengeAutoTextColor ??
                BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR;
        }

        // Text shadow
        const textShadowCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX
        ) as HTMLInputElement;
        if (textShadowCheckbox) {
            textShadowCheckbox.checked =
                config.challengeTextShadow ?? BACKGROUND_DEFAULTS.TEXT_SHADOW;
        }

        // Update preview
        AdminPanelBackgroundPreview.updateBackgroundPreview();
    }
}
