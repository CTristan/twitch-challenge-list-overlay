import {
    COLOR_FORMAT,
    DEFAULT_COLORS,
    SHADOW_COLORS,
} from "../types/ColorConstants";
import { BACKGROUND_DEFAULTS } from "../types/ConfigConstants";
import {
    CSS_PROPERTY_NAMES,
    CSS_SELECTORS,
    CSS_VALUES,
    ELEMENT_IDS,
} from "../types/DOMConstants";
import {
    COLOR_CONSTANTS,
    TEXT_SHADOW_CONSTANTS,
} from "../types/NumericConstants";
import { combineColorWithOpacity } from "./ColorUtils";

/**
 * Utility class for managing background preview in the admin panel
 * Handles preview updates, text color calculation, and text shadow generation
 */
export class AdminPanelBackgroundPreview {
    /**
     * Update the background preview based on current settings
     * @returns {void}
     */
    static updateBackgroundPreview(): void {
        const preview = document.getElementById(ELEMENT_IDS.BACKGROUND_PREVIEW);
        const previewChallenge = preview?.querySelector(
            CSS_SELECTORS.PREVIEW_CHALLENGE
        ) as HTMLElement;
        const previewText = preview?.querySelector(
            CSS_SELECTORS.PREVIEW_TEXT
        ) as HTMLElement;

        if (!previewChallenge || !previewText) return;

        // Get current values from Primary Color tier pickers
        const backgroundColorInput = document.getElementById(
            ELEMENT_IDS.PRIMARY_BG_COLOR
        ) as HTMLInputElement;
        const autoTextColorCheckbox = document.getElementById(
            ELEMENT_IDS.CHALLENGE_AUTO_TEXT_COLOR
        ) as HTMLInputElement;
        const textColorInput = document.getElementById(
            ELEMENT_IDS.CHALLENGE_TEXT_COLOR
        ) as HTMLInputElement;
        const textShadowCheckbox = document.getElementById(
            ELEMENT_IDS.CHALLENGE_TEXT_SHADOW
        ) as HTMLInputElement;

        if (!backgroundColorInput) return;

        // Get row colors opacity slider value
        const rowColorsOpacitySlider = document.getElementById(
            ELEMENT_IDS.ROW_COLORS_OPACITY
        ) as HTMLInputElement;
        const rowColorsOpacity = rowColorsOpacitySlider
            ? parseInt(rowColorsOpacitySlider.value) / 100
            : BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY;

        // Apply background color with opacity
        const backgroundColor = backgroundColorInput.value;
        const backgroundColorWithOpacity = combineColorWithOpacity(
            backgroundColor,
            rowColorsOpacity
        );
        previewChallenge.style[CSS_PROPERTY_NAMES.BACKGROUND_COLOR] =
            backgroundColorWithOpacity;

        // Apply text color
        let textColor: string = DEFAULT_COLORS.WHITE_TEXT;
        if (autoTextColorCheckbox?.checked) {
            // Use automatic text color calculation
            textColor =
                AdminPanelBackgroundPreview.calculateOptimalTextColor(
                    backgroundColor
                );
        } else if (textColorInput) {
            textColor = textColorInput.value;
        }
        previewText.style[CSS_PROPERTY_NAMES.COLOR] = textColor;

        // Apply text shadow
        if (textShadowCheckbox?.checked) {
            const shadowStyle =
                AdminPanelBackgroundPreview.generateTextShadow(textColor);
            previewText.style[CSS_PROPERTY_NAMES.TEXT_SHADOW] = shadowStyle;
        } else {
            previewText.style[CSS_PROPERTY_NAMES.TEXT_SHADOW] =
                CSS_VALUES.TEXT_SHADOW_NONE;
        }
    }

    /**
     * Calculate optimal text color for readability (simplified version)
     * @param backgroundColor - Background color hex string
     * @returns Optimal text color ("#ffffff" or "#000000")
     */
    static calculateOptimalTextColor(backgroundColor: string): string {
        // Simple brightness calculation
        const hex = backgroundColor.replace(COLOR_FORMAT.HEX_PREFIX, "");
        const r = parseInt(
            hex.substring(
                COLOR_CONSTANTS.HEX_RED_START,
                COLOR_CONSTANTS.HEX_RED_START + COLOR_CONSTANTS.HEX_RED_LENGTH
            ),
            COLOR_CONSTANTS.HEX_BASE
        );
        const g = parseInt(
            hex.substring(
                COLOR_CONSTANTS.HEX_GREEN_START,
                COLOR_CONSTANTS.HEX_GREEN_START +
                    COLOR_CONSTANTS.HEX_GREEN_LENGTH
            ),
            COLOR_CONSTANTS.HEX_BASE
        );
        const b = parseInt(
            hex.substring(
                COLOR_CONSTANTS.HEX_BLUE_START,
                COLOR_CONSTANTS.HEX_BLUE_START + COLOR_CONSTANTS.HEX_BLUE_LENGTH
            ),
            COLOR_CONSTANTS.HEX_BASE
        );
        const brightness =
            (r * COLOR_CONSTANTS.BRIGHTNESS_RED_WEIGHT +
                g * COLOR_CONSTANTS.BRIGHTNESS_GREEN_WEIGHT +
                b * COLOR_CONSTANTS.BRIGHTNESS_BLUE_WEIGHT) /
            COLOR_CONSTANTS.BRIGHTNESS_DIVISOR;
        return brightness > COLOR_CONSTANTS.BRIGHTNESS_THRESHOLD
            ? DEFAULT_COLORS.BLACK_TEXT
            : DEFAULT_COLORS.WHITE_TEXT;
    }

    /**
     * Generate text shadow for enhanced readability (simplified version)
     * @param textColor - Text color to determine shadow color
     * @returns CSS text-shadow property value
     */
    static generateTextShadow(textColor: string): string {
        const isDarkText =
            AdminPanelBackgroundPreview.calculateOptimalTextColor(textColor) ===
            DEFAULT_COLORS.WHITE_TEXT;
        const shadowColor = isDarkText
            ? SHADOW_COLORS.WHITE_SHADOW
            : SHADOW_COLORS.BLACK_SHADOW;

        const offsetX = TEXT_SHADOW_CONSTANTS.SHADOW_OFFSET_X;
        const offsetY = TEXT_SHADOW_CONSTANTS.SHADOW_OFFSET_Y;
        const blur = TEXT_SHADOW_CONSTANTS.SHADOW_BLUR;

        return `${offsetX}px ${offsetY}px ${blur}px ${shadowColor}, -${offsetX}px -${offsetY}px ${blur}px ${shadowColor}, ${offsetX}px -${offsetY}px ${blur}px ${shadowColor}, -${offsetX}px ${offsetY}px ${blur}px ${shadowColor}`;
    }
}
