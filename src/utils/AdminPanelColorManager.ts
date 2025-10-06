import { COLOR_FORMAT, DEFAULT_COLORS } from "../types/ColorConstants";
import {
    COLOR_TIERS,
    CSS_VALUES,
    ELEMENT_IDS,
    type ColorTier,
} from "../types/DOMConstants";
import { COLOR_CONSTANTS } from "../types/NumericConstants";

/**
 * Interface for color configuration in UI format
 */
export interface ColorConfigurationUI {
    primary: {
        enabled: boolean;
        backgroundColor: string;
        textColor: string;
    };
    secondary: {
        enabled: boolean;
        backgroundColor: string;
        textColor: string;
    };
    tertiary: {
        enabled: boolean;
        backgroundColor: string;
        textColor: string;
    };
}

/**
 * Utility class for managing color configuration in the admin panel
 * Handles conversion between storage format and UI format
 */
export class AdminPanelColorManager {
    /**
     * Convert arrays of background and text colors to UI format
     * @param backgroundColors - Array of background colors
     * @param textColors - Array of text colors
     * @returns Color configuration in UI format
     */
    static convertColorsToUI(
        backgroundColors: string[],
        textColors: string[]
    ): ColorConfigurationUI {
        return {
            primary: {
                enabled: backgroundColors.length > 0,
                backgroundColor:
                    backgroundColors[0] || DEFAULT_COLORS.PRIMARY_BACKGROUND,
                textColor: textColors[0] || DEFAULT_COLORS.PRIMARY_TEXT,
            },
            secondary: {
                enabled: backgroundColors.length > 1,
                backgroundColor:
                    backgroundColors[1] || DEFAULT_COLORS.SECONDARY_BACKGROUND,
                textColor: textColors[1] || DEFAULT_COLORS.SECONDARY_TEXT,
            },
            tertiary: {
                enabled: backgroundColors.length > 2,
                backgroundColor:
                    backgroundColors[2] || DEFAULT_COLORS.TERTIARY_BACKGROUND,
                textColor: textColors[2] || DEFAULT_COLORS.TERTIARY_TEXT,
            },
        };
    }

    /**
     * Convert UI format to array of background colors
     * @param colorConfig - Color configuration in UI format
     * @returns Array of background colors
     */
    static convertUIToColors(colorConfig: ColorConfigurationUI): string[] {
        const colors: string[] = [];

        if (colorConfig.primary.enabled) {
            colors.push(colorConfig.primary.backgroundColor);
        }
        if (colorConfig.secondary.enabled) {
            colors.push(colorConfig.secondary.backgroundColor);
        }
        if (colorConfig.tertiary.enabled) {
            colors.push(colorConfig.tertiary.backgroundColor);
        }

        return colors;
    }

    /**
     * Convert UI format to array of text colors
     * @param colorConfig - Color configuration in UI format
     * @returns Array of text colors
     */
    static convertUIToTextColors(colorConfig: ColorConfigurationUI): string[] {
        const colors: string[] = [];

        if (colorConfig.primary.enabled) {
            colors.push(colorConfig.primary.textColor);
        }
        if (colorConfig.secondary.enabled) {
            colors.push(colorConfig.secondary.textColor);
        }
        if (colorConfig.tertiary.enabled) {
            colors.push(colorConfig.tertiary.textColor);
        }

        return colors;
    }

    /**
     * Get current color configuration from UI elements
     * @returns Color configuration in UI format
     */
    static getCurrentColorConfigFromUI(): ColorConfigurationUI {
        const config: ColorConfigurationUI = {
            primary: {
                enabled: false,
                backgroundColor: DEFAULT_COLORS.PRIMARY_BACKGROUND,
                textColor: DEFAULT_COLORS.PRIMARY_TEXT,
            },
            secondary: {
                enabled: false,
                backgroundColor: DEFAULT_COLORS.SECONDARY_BACKGROUND,
                textColor: DEFAULT_COLORS.SECONDARY_TEXT,
            },
            tertiary: {
                enabled: false,
                backgroundColor: DEFAULT_COLORS.TERTIARY_BACKGROUND,
                textColor: DEFAULT_COLORS.TERTIARY_TEXT,
            },
        };

        // Get primary tier values
        const primaryEnabled = document.getElementById(
            ELEMENT_IDS.PRIMARY_COLOR_ENABLED
        ) as HTMLInputElement;
        const primaryBgColor = document.getElementById(
            ELEMENT_IDS.PRIMARY_BG_COLOR
        ) as HTMLInputElement;
        const primaryTextColor = document.getElementById(
            ELEMENT_IDS.PRIMARY_TEXT_COLOR
        ) as HTMLInputElement;

        if (primaryEnabled && primaryBgColor && primaryTextColor) {
            config.primary.enabled = primaryEnabled.checked;
            config.primary.backgroundColor = primaryBgColor.value;
            config.primary.textColor = primaryTextColor.value;
        }

        // Get secondary tier values
        const secondaryEnabled = document.getElementById(
            ELEMENT_IDS.SECONDARY_COLOR_ENABLED
        ) as HTMLInputElement;
        const secondaryBgColor = document.getElementById(
            ELEMENT_IDS.SECONDARY_BG_COLOR
        ) as HTMLInputElement;
        const secondaryTextColor = document.getElementById(
            ELEMENT_IDS.SECONDARY_TEXT_COLOR
        ) as HTMLInputElement;

        if (secondaryEnabled && secondaryBgColor && secondaryTextColor) {
            config.secondary.enabled = secondaryEnabled.checked;
            config.secondary.backgroundColor = secondaryBgColor.value;
            config.secondary.textColor = secondaryTextColor.value;
        }

        // Get tertiary tier values
        const tertiaryEnabled = document.getElementById(
            ELEMENT_IDS.TERTIARY_COLOR_ENABLED
        ) as HTMLInputElement;
        const tertiaryBgColor = document.getElementById(
            ELEMENT_IDS.TERTIARY_BG_COLOR
        ) as HTMLInputElement;
        const tertiaryTextColor = document.getElementById(
            ELEMENT_IDS.TERTIARY_TEXT_COLOR
        ) as HTMLInputElement;

        if (tertiaryEnabled && tertiaryBgColor && tertiaryTextColor) {
            config.tertiary.enabled = tertiaryEnabled.checked;
            config.tertiary.backgroundColor = tertiaryBgColor.value;
            config.tertiary.textColor = tertiaryTextColor.value;
        }

        return config;
    }

    /**
     * Get color tier element IDs for a specific tier
     * @param tier - Color tier name
     * @returns Object containing element IDs for the tier
     */
    static getColorTierConstants(tier: ColorTier): {
        enabled: string;
        pickers: string;
        section: string;
        bgColor: string;
        textColor: string;
    } {
        switch (tier) {
            case COLOR_TIERS[0]: // "primary"
                return {
                    enabled: ELEMENT_IDS.PRIMARY_COLOR_ENABLED,
                    pickers: ELEMENT_IDS.PRIMARY_COLOR_PICKERS,
                    section: ELEMENT_IDS.PRIMARY_COLOR_SECTION,
                    bgColor: ELEMENT_IDS.PRIMARY_BG_COLOR,
                    textColor: ELEMENT_IDS.PRIMARY_TEXT_COLOR,
                };
            case COLOR_TIERS[1]: // "secondary"
                return {
                    enabled: ELEMENT_IDS.SECONDARY_COLOR_ENABLED,
                    pickers: ELEMENT_IDS.SECONDARY_COLOR_PICKERS,
                    section: ELEMENT_IDS.SECONDARY_COLOR_SECTION,
                    bgColor: ELEMENT_IDS.SECONDARY_BG_COLOR,
                    textColor: ELEMENT_IDS.SECONDARY_TEXT_COLOR,
                };
            case COLOR_TIERS[2]: // "tertiary"
                return {
                    enabled: ELEMENT_IDS.TERTIARY_COLOR_ENABLED,
                    pickers: ELEMENT_IDS.TERTIARY_COLOR_PICKERS,
                    section: ELEMENT_IDS.TERTIARY_COLOR_SECTION,
                    bgColor: ELEMENT_IDS.TERTIARY_BG_COLOR,
                    textColor: ELEMENT_IDS.TERTIARY_TEXT_COLOR,
                };
        }
    }

    /**
     * Update color tier UI state (enable/disable pickers)
     * @param tier - Color tier name
     * @param enabled - Whether the tier is enabled
     */
    static updateColorTierState(tier: ColorTier, enabled: boolean): void {
        const tierConstants = this.getColorTierConstants(tier);
        const pickersContainer = document.getElementById(tierConstants.pickers);
        const section = document.getElementById(tierConstants.section);

        if (pickersContainer) {
            pickersContainer.style.display = enabled
                ? CSS_VALUES.DISPLAY_FLEX
                : CSS_VALUES.DISPLAY_NONE;
        }

        if (section) {
            section.style.opacity = enabled
                ? CSS_VALUES.OPACITY_FULL
                : CSS_VALUES.OPACITY_DISABLED;
        }
    }

    /**
     * Extract hex color from RGBA string
     * @param colorString - Color string (hex or rgba)
     * @returns Hex color string
     */
    static extractColorFromRGBA(colorString: string): string {
        // If it's already a hex color, return it
        if (colorString.startsWith(COLOR_FORMAT.HEX_PREFIX)) {
            return colorString;
        }

        // Extract RGB values from rgba string
        // Format: rgba(r, g, b, a) or rgb(r, g, b)
        const rgbaMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

        if (rgbaMatch && rgbaMatch[1] && rgbaMatch[2] && rgbaMatch[3]) {
            const r = parseInt(rgbaMatch[1]);
            const g = parseInt(rgbaMatch[2]);
            const b = parseInt(rgbaMatch[3]);

            const toHex = (n: number) => {
                const hex = n.toString(COLOR_CONSTANTS.HEX_BASE);
                return hex.length === COLOR_CONSTANTS.HEX_PADDING_LENGTH
                    ? COLOR_FORMAT.HEX_PADDING_CHAR + hex
                    : hex;
            };

            return `${COLOR_FORMAT.HEX_PREFIX}${toHex(r)}${toHex(g)}${toHex(
                b
            )}`;
        }

        // Fallback to default if parsing fails
        return DEFAULT_COLORS.PRIMARY_BACKGROUND;
    }
}
