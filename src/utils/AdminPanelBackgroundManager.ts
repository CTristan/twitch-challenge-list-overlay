import {
    COLOR_FORMAT,
    DEFAULT_COLORS,
    SHADOW_COLORS,
} from "../types/ColorConstants";
import {
    BACKGROUND_DEFAULTS,
    BACKGROUND_UI_ELEMENTS,
} from "../types/ConfigConstants";
import { CSS_VALUES, ELEMENT_IDS } from "../types/DOMConstants";
import { COLOR_CONSTANTS } from "../types/NumericConstants";

/**
 * Utility class for managing background configuration in the admin panel
 * Handles background colors, opacity, text colors, and shadows
 */
export class AdminPanelBackgroundManager {
    /**
     * Convert hex color to RGBA format with opacity
     * @param hexColor - Hex color string
     * @param opacity - Opacity value (0-1)
     * @returns RGBA color string
     */
    static convertColorToRGBA(hexColor: string, opacity: number): string {
        // Simple hex to RGB conversion
        const hex = hexColor.replace(COLOR_FORMAT.HEX_PREFIX, "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `${COLOR_FORMAT.RGBA_PREFIX}${r}${COLOR_FORMAT.RGBA_SEPARATOR} ${g}${COLOR_FORMAT.RGBA_SEPARATOR} ${b}${COLOR_FORMAT.RGBA_SEPARATOR} ${opacity})`;
    }

    /**
     * Calculate optimal text color (black or white) based on background brightness
     * @param backgroundColor - Background color string
     * @returns Optimal text color (black or white)
     */
    static calculateOptimalTextColor(backgroundColor: string): string {
        // Simple brightness calculation
        const hex = backgroundColor.replace(COLOR_FORMAT.HEX_PREFIX, "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculate perceived brightness (0-255)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Return black for light backgrounds, white for dark backgrounds
        return brightness > COLOR_CONSTANTS.BRIGHTNESS_THRESHOLD
            ? DEFAULT_COLORS.BLACK_TEXT // Dark text for light backgrounds
            : DEFAULT_COLORS.WHITE_TEXT; // Light text for dark backgrounds
    }

    /**
     * Generate text shadow CSS based on text color
     * @param textColor - Text color string
     * @returns Text shadow CSS string
     */
    static generateTextShadow(textColor: string): string {
        const isDarkText =
            textColor === DEFAULT_COLORS.BLACK_TEXT ||
            textColor.toLowerCase() === DEFAULT_COLORS.BLACK_TEXT ||
            textColor.toLowerCase() === DEFAULT_COLORS.BLACK_TEXT_SHORT;

        return isDarkText
            ? SHADOW_COLORS.WHITE_SHADOW
            : SHADOW_COLORS.BLACK_SHADOW;
    }

    /**
     * Get current background configuration from UI elements
     * @returns Background configuration object
     */
    static getCurrentBackgroundConfigFromUI(): {
        overlayBackgroundColor: string;
        overlayBackgroundOpacity: number;
        appBackgroundOpacity: number;
        challengeBackgroundColor: string;
        challengeBackgroundOpacity: number;
        challengeTextColor: string;
        challengeAutoTextColor: boolean;
        challengeTextShadow: boolean;
    } {
        // Get overlay background color and opacity
        const overlayBackgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        const overlayOpacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;

        const overlayBackgroundColor =
            overlayBackgroundColorInput?.value ||
            BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_COLOR;
        const overlayOpacity = overlayOpacitySlider
            ? parseInt(overlayOpacitySlider.value) / 100
            : BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY;

        const rgbaOverlayBackgroundColor = this.convertColorToRGBA(
            overlayBackgroundColor,
            overlayOpacity
        );

        // Get app background opacity
        const appBackgroundOpacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.APP_BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;
        const appBackgroundOpacity = appBackgroundOpacitySlider
            ? parseInt(appBackgroundOpacitySlider.value) / 100
            : BACKGROUND_DEFAULTS.APP_BACKGROUND_OPACITY;

        // Get challenge background color and opacity
        const backgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        const opacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;

        const backgroundColor =
            backgroundColorInput?.value || BACKGROUND_DEFAULTS.BACKGROUND_COLOR;
        const opacity = opacitySlider
            ? parseInt(opacitySlider.value) / 100
            : BACKGROUND_DEFAULTS.BACKGROUND_OPACITY;

        const rgbaBackgroundColor = this.convertColorToRGBA(
            backgroundColor,
            opacity
        );

        // Get text color settings
        const textColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT
        ) as HTMLInputElement;
        const autoTextColorCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX
        ) as HTMLInputElement;
        const textShadowCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX
        ) as HTMLInputElement;

        return {
            overlayBackgroundColor: rgbaOverlayBackgroundColor,
            overlayBackgroundOpacity: overlayOpacity,
            challengeBackgroundColor: rgbaBackgroundColor,
            challengeBackgroundOpacity: opacity,
            challengeTextColor:
                textColorInput?.value || BACKGROUND_DEFAULTS.TEXT_COLOR,
            challengeAutoTextColor:
                autoTextColorCheckbox?.checked ??
                BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR,
            challengeTextShadow:
                textShadowCheckbox?.checked ?? BACKGROUND_DEFAULTS.TEXT_SHADOW,
            appBackgroundOpacity: appBackgroundOpacity,
        };
    }

    /**
     * Update background preview element with current settings
     */
    static updateBackgroundPreview(): void {
        const preview = document.getElementById(ELEMENT_IDS.BACKGROUND_PREVIEW);
        if (!preview) return;

        const config = this.getCurrentBackgroundConfigFromUI();

        // Apply background color
        preview.style.backgroundColor = config.challengeBackgroundColor;

        // Apply text color
        let textColor = config.challengeTextColor;
        if (config.challengeAutoTextColor) {
            const bgColorPart = config.challengeBackgroundColor.split(
                COLOR_FORMAT.RGBA_SEPARATOR
            )[0];
            if (bgColorPart) {
                const hexColor = bgColorPart.replace(
                    COLOR_FORMAT.RGBA_PREFIX,
                    COLOR_FORMAT.HEX_PREFIX
                );
                textColor = this.calculateOptimalTextColor(hexColor);
            }
        }

        preview.style.color = textColor;

        // Apply text shadow
        if (config.challengeTextShadow) {
            preview.style.textShadow = this.generateTextShadow(textColor);
        } else {
            preview.style.textShadow = CSS_VALUES.TEXT_SHADOW_NONE;
        }
    }
}
