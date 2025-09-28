import { BACKGROUND_DEFAULTS, CSS_VARIABLES } from "./types/ConfigConstants";

/**
 * Load styles for the overlay, combining defaults with configuration values.
 * @param {Config} config - Configuration object with user customizations.
 * @returns {void}
 */
export function loadStyles(config: Config): void {
    const root: HTMLElement = document.querySelector(":root") as HTMLElement;

    // Load default Google Fonts
    loadGoogleFont("Roboto Mono");

    // Apply default styles as CSS variables
    const defaultStyles = getDefaultStyles();

    // Override defaults with configuration values for background customization
    const configuredStyles = {
        ...defaultStyles,
        [CSS_VARIABLES.CHALLENGE_BACKGROUND_COLOR]:
            config.challengeBackgroundColor ||
            defaultStyles[CSS_VARIABLES.CHALLENGE_BACKGROUND_COLOR],
        [CSS_VARIABLES.CHALLENGE_BACKGROUND_OPACITY]: (
            config.challengeBackgroundOpacity ??
            BACKGROUND_DEFAULTS.BACKGROUND_OPACITY
        ).toString(),
        [CSS_VARIABLES.CHALLENGE_TEXT_COLOR_OVERRIDE]:
            config.challengeTextColor ||
            defaultStyles[CSS_VARIABLES.CHALLENGE_TEXT_COLOR_OVERRIDE],
        [CSS_VARIABLES.CHALLENGE_AUTO_TEXT_COLOR_ENABLED]: (
            config.challengeAutoTextColor ?? BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR
        ).toString(),
        [CSS_VARIABLES.CHALLENGE_TEXT_SHADOW_ENABLED]: (
            config.challengeTextShadow ?? BACKGROUND_DEFAULTS.TEXT_SHADOW
        ).toString(),
    };

    for (let [key, val] of Object.entries(configuredStyles)) {
        if (val !== undefined) {
            root.style.setProperty(convertToCSSVar(key), val);
        }
    }
}

/**
 * Get hardcoded default styles for the overlay
 * @returns {Record<string, string>} Default style values
 */
function getDefaultStyles(): Record<string, string> {
    return {
        // Font settings
        headerFontFamily: "Roboto Mono",
        cardFontFamily: "Roboto Mono",

        // App container styling
        appBorderRadius: "0.5rem",
        appPadding: "0.75rem",
        appBackgroundColor: "rgba(0, 0, 0, 0)",
        appBackgroundImage: "url(../images/transparent-image.png)",

        // Header styling
        headerDisplay: "flex",
        headerBorderRadius: "0.5rem",
        headerMarginBottom: "0.75rem",
        headerPadding: "1.5rem",
        headerBackgroundColor: "rgba(0, 0, 0, 0.7)",
        headerFontSize: "2.25rem",
        headerFontColor: "#FFFFFF",
        headerFontWeight: "normal",

        // Challenge card styling
        cardGapBetween: "0.75rem",
        cardBorderRadius: "0.5rem",
        cardPadding: "1.5rem",
        cardBackgroundColor: "rgba(0, 0, 0, 0.7)",

        // Background customization
        [CSS_VARIABLES.CHALLENGE_BACKGROUND_COLOR]:
            BACKGROUND_DEFAULTS.BACKGROUND_COLOR,
        [CSS_VARIABLES.CHALLENGE_BACKGROUND_OPACITY]:
            BACKGROUND_DEFAULTS.BACKGROUND_OPACITY.toString(),
        [CSS_VARIABLES.CHALLENGE_TEXT_COLOR_OVERRIDE]:
            BACKGROUND_DEFAULTS.TEXT_COLOR,
        [CSS_VARIABLES.CHALLENGE_AUTO_TEXT_COLOR_ENABLED]:
            BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR.toString(),
        [CSS_VARIABLES.CHALLENGE_TEXT_SHADOW_ENABLED]:
            BACKGROUND_DEFAULTS.TEXT_SHADOW.toString(),

        // Username styling
        usernameFontSize: "2.25rem",
        usernameColor: "#FFFFFF",
        usernameFontWeight: "normal",

        // Challenge text styling
        challengeFontSize: "2rem",
        challengeDescriptionFontSize: "1.7rem",
        challengeFontColor: "#FFFFFF",
        challengeFontWeight: "normal",
        challengeDoneFontColor: "#b0b0b0",
        challengeDoneFontStyle: "italic",
        challengeDoneTextDecoration: "line-through",
        challengeFocusFontColor: "#111111",
        challengeFocusBackgroundColor: "rgba(255, 255, 255, 0.7)",
        challengeFocusBorderRadius: "0.5rem",

        // Checkbox styling
        challengeCheckboxSize: "2.5rem",
        challengeCheckboxCheckmarkSize: "2.75rem",
        challengeCheckboxMarginRight: "1rem",
        challengeCheckboxBorderWidth: "0.25rem",
        challengeCheckboxBorderColor: "#ffffff",
        challengeCheckboxBorderRadius: "0.375rem",
        challengeCheckboxBackgroundColor: "transparent",
        challengeCheckboxCheckedBorderColor: "#4a90e2",
        challengeCheckboxCheckmarkColor: "#4a90e2",
    };
}

/**
 * @param {string} font - Font family name.
 * @returns {void}
 */
function loadGoogleFont(font: string): void {
    window.WebFont.load({
        google: {
            families: [`${font}:100,400,700`],
        },
    });
}

/**
 * @param {string} name - The name of the CSS variable.
 * @returns {string}
 */
function convertToCSSVar(name: string): string {
    let cssVar = name.replace(/([A-Z])/g, "-$1").toLowerCase();
    return `--${cssVar}`;
}
