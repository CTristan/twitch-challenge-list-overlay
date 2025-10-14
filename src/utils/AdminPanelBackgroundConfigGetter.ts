import { DEFAULT_COLORS } from "../types/ColorConstants";
import {
    BACKGROUND_DEFAULTS,
    BACKGROUND_UI_ELEMENTS,
} from "../types/ConfigConstants";

/**
 * Interface for background configuration from UI
 */
export interface BackgroundConfigurationUI {
    overlayBackgroundColor: string;
    overlayBackgroundOpacity: number;
    challengeBackgroundColor: string;
    challengeBackgroundOpacity: number;
    challengeTextColor: string;
    challengeAutoTextColor: boolean;
    challengeTextShadow: boolean;
}

/**
 * Utility class for getting background configuration from UI elements
 */
export class AdminPanelBackgroundConfigGetter {
    /**
     * Get current background configuration from the UI
     * @returns Background configuration object
     */
    static getCurrentBackgroundConfigFromUI(): BackgroundConfigurationUI {
        // Overlay background elements
        const overlayBackgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        const overlayOpacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;

        // Challenge row background elements
        const backgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        const opacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;
        const textColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT
        ) as HTMLInputElement;
        const autoTextColorCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX
        ) as HTMLInputElement;
        const textShadowCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX
        ) as HTMLInputElement;

        // Get overlay background color and opacity (store separately, not as RGBA)
        const overlayBackgroundColor =
            overlayBackgroundColorInput?.value ||
            DEFAULT_COLORS.CHALLENGE_BACKGROUND;
        const overlayOpacity = overlayOpacitySlider
            ? parseInt(overlayOpacitySlider.value) / 100
            : BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY;

        // Get challenge background color and opacity (store separately, not as RGBA)
        const backgroundColor =
            backgroundColorInput?.value || DEFAULT_COLORS.CHALLENGE_BACKGROUND;
        const opacity = opacitySlider
            ? parseInt(opacitySlider.value) / 100
            : BACKGROUND_DEFAULTS.BACKGROUND_OPACITY;

        return {
            overlayBackgroundColor: overlayBackgroundColor,
            overlayBackgroundOpacity: overlayOpacity,
            challengeBackgroundColor: backgroundColor,
            challengeBackgroundOpacity: opacity,
            challengeTextColor:
                textColorInput?.value || BACKGROUND_DEFAULTS.TEXT_COLOR,
            challengeAutoTextColor:
                autoTextColorCheckbox?.checked ??
                BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR,
            challengeTextShadow:
                textShadowCheckbox?.checked ?? BACKGROUND_DEFAULTS.TEXT_SHADOW,
        };
    }
}
