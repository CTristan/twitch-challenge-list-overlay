/**
 * Load hardcoded default styles for the overlay.
 * @param {Config} _config - Configuration object (only used for future extensibility).
 * @returns {void}
 */
export function loadStyles(_config: Config): void {
    const root: HTMLElement = document.querySelector(":root") as HTMLElement;

    // Load default Google Fonts
    loadGoogleFont("Roboto Mono");

    // Apply hardcoded default styles as CSS variables
    const defaultStyles = getDefaultStyles();
    for (let [key, val] of Object.entries(defaultStyles)) {
        root.style.setProperty(convertToCSSVar(key), val);
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
