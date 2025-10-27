import { BACKGROUND_DEFAULTS, CSS_VARIABLES } from "./types/ConfigConstants";
import { URL_HASH } from "./types/DOMConstants";
import { FONT_SIZE_CONSTANTS } from "./types/NumericConstants";

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
    const viewerFontPercent = normalizeViewerFontPercent(
        config.challengeFontSize
    );
    const viewerFontSizeRem = convertPercentToRem(viewerFontPercent);
    const viewportWidth = window.innerWidth ?? 0;
    const viewportHeight = window.innerHeight ?? 0;
    const viewportScale = getViewportScale(viewportWidth, viewportHeight);
    const fontStyles = getFontStyleOverrides(viewerFontSizeRem, viewportScale, {
        isAdminMode: window.location.hash === URL_HASH.ADMIN,
        viewportWidth,
        viewportHeight,
    });

    // Override defaults with configuration values for background customization
    const configuredStyles = {
        ...defaultStyles,
        ...fontStyles,
        // Overlay background properties
        [CSS_VARIABLES.OVERLAY_BACKGROUND_COLOR]:
            config.overlayBackgroundColor ||
            defaultStyles[CSS_VARIABLES.OVERLAY_BACKGROUND_COLOR],
        [CSS_VARIABLES.OVERLAY_BACKGROUND_OPACITY]: (
            config.overlayBackgroundOpacity ??
            BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY
        ).toString(),

        // Challenge row background properties
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
    const defaultFontPercent = BACKGROUND_DEFAULTS.VIEWER_CHALLENGE_FONT_SIZE;
    const defaultFontSizeRem = convertPercentToRem(defaultFontPercent);
    const defaultControlHeight = clampAdminControlHeight(
        defaultFontSizeRem * FONT_SIZE_CONSTANTS.ADMIN_CONTROL_HEIGHT_RATIO
    );

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
        // Overlay background defaults
        [CSS_VARIABLES.OVERLAY_BACKGROUND_COLOR]:
            BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_COLOR,
        [CSS_VARIABLES.OVERLAY_BACKGROUND_OPACITY]:
            BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY.toString(),

        // Challenge row background defaults
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
        [CSS_VARIABLES.CHALLENGE_FONT_SIZE]: "clamp(2rem, 3rem, 4rem)",
        [CSS_VARIABLES.CHALLENGE_DESCRIPTION_FONT_SIZE]: "1.56rem",
        challengeFontColor: "#FFFFFF",
        challengeFontWeight: "normal",
        challengeDoneFontColor: "#b0b0b0",
        challengeDoneFontStyle: "italic",
        challengeDoneTextDecoration: "line-through",
        challengeFocusFontColor: "#111111",
        challengeFocusBackgroundColor: "rgba(255, 255, 255, 0.7)",
        challengeFocusBorderRadius: "0.5rem",

        // Checkbox styling
        [CSS_VARIABLES.ADMIN_CONTROL_HEIGHT]:
            formatRemValue(defaultControlHeight),
        challengeCheckboxSize: "var(--admin-control-height)",
        challengeCheckboxCheckmarkSize:
            "calc(var(--admin-control-height) * 0.65)",
        challengeCheckboxMarginRight: "0.6rem",
        challengeCheckboxBorderWidth: "0.1875rem",
        challengeCheckboxBorderColor: "#ffffff",
        challengeCheckboxBorderRadius: "0.375rem",
        challengeCheckboxBackgroundColor: "transparent",
        challengeCheckboxCheckedBorderColor: "#4a90e2",
        challengeCheckboxCheckmarkColor: "#4a90e2",
        [CSS_VARIABLES.CHALLENGE_TIMER_FONT_SIZE]: "1.44rem",
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

function normalizeViewerFontPercent(value?: number): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return BACKGROUND_DEFAULTS.VIEWER_CHALLENGE_FONT_SIZE;
    }

    if (value < FONT_SIZE_CONSTANTS.VIEWER_PERCENT_MIN) {
        return FONT_SIZE_CONSTANTS.VIEWER_PERCENT_MIN;
    }

    if (value > FONT_SIZE_CONSTANTS.VIEWER_PERCENT_MAX) {
        return FONT_SIZE_CONSTANTS.VIEWER_PERCENT_MAX;
    }

    return value;
}

function convertPercentToRem(percent: number): number {
    return FONT_SIZE_CONSTANTS.VIEWER_BASE_REM + percent / 100;
}

function getFontStyleOverrides(
    fontSizeRem: number,
    viewportScale: number,
    options?: {
        isAdminMode?: boolean;
        viewportWidth: number;
        viewportHeight: number;
    }
): Record<string, string> {
    const scaledFontSize = fontSizeRem * viewportScale;
    const descriptionSize =
        scaledFontSize * FONT_SIZE_CONSTANTS.DESCRIPTION_RATIO;
    const timerSize = scaledFontSize * FONT_SIZE_CONSTANTS.TIMER_RATIO;
    const controlHeight = clampAdminControlHeight(
        scaledFontSize * FONT_SIZE_CONSTANTS.ADMIN_CONTROL_HEIGHT_RATIO
    );

    const overrides = {
        [CSS_VARIABLES.CHALLENGE_FONT_SIZE]: formatFontSizeClamp(
            scaledFontSize,
            viewportScale
        ),
        [CSS_VARIABLES.CHALLENGE_DESCRIPTION_FONT_SIZE]:
            formatRemValue(descriptionSize),
        [CSS_VARIABLES.CHALLENGE_TIMER_FONT_SIZE]: formatRemValue(timerSize),
        [CSS_VARIABLES.ADMIN_CONTROL_HEIGHT]: formatRemValue(controlHeight),
    };

    if (!options?.isAdminMode) {
        return overrides;
    }

    return applyAdminViewportConstraints(overrides, viewportScale, {
        viewportWidth: options.viewportWidth,
        viewportHeight: options.viewportHeight,
    });
}

function clampAdminControlHeight(value: number): number {
    return clampValue(
        value,
        FONT_SIZE_CONSTANTS.ADMIN_CONTROL_HEIGHT_MIN_REM,
        FONT_SIZE_CONSTANTS.ADMIN_CONTROL_HEIGHT_MAX_REM
    );
}

function formatFontSizeClamp(
    fontSizeRem: number,
    viewportScale: number
): string {
    const min = formatRemValue(
        convertPercentToRem(FONT_SIZE_CONSTANTS.VIEWER_PERCENT_MIN) *
            viewportScale
    );
    const target = formatRemValue(fontSizeRem);
    const max = formatRemValue(
        convertPercentToRem(FONT_SIZE_CONSTANTS.VIEWER_PERCENT_MAX) *
            viewportScale
    );
    return `clamp(${min}, ${target}, ${max})`;
}

function getViewportScale(width: number, height: number): number {
    const safeWidth = Number.isFinite(width) && width > 0 ? width : 1920;
    const safeHeight = Number.isFinite(height) && height > 0 ? height : 1080;

    if (safeWidth <= 320 || safeHeight <= 250) {
        return 0.75;
    }

    if (safeWidth <= 400 || safeHeight <= 350) {
        return 0.85;
    }

    return 1;
}
function formatRemValue(value: number): string {
    const fixed = value.toFixed(3);
    const withoutTrailingZeros = fixed
        .replace(/\.000$/, "")
        .replace(/0+$/, "")
        .replace(/\.$/, "");
    return `${withoutTrailingZeros}rem`;
}

function clampValue(value: number, min: number, max: number): number {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

function applyAdminViewportConstraints(
    overrides: Record<string, string>,
    viewportScale: number,
    options: { viewportWidth: number; viewportHeight: number }
): Record<string, string> {
    const currentHeightRem = parseRemValue(
        overrides[CSS_VARIABLES.ADMIN_CONTROL_HEIGHT]
    );

    if (currentHeightRem === null) {
        return overrides;
    }

    const cap = getAdminControlHeightCap(
        options.viewportWidth,
        options.viewportHeight
    );

    if (cap === null || currentHeightRem <= cap) {
        return overrides;
    }

    const constrainedHeight = cap;
    const constrainedFontSize =
        constrainedHeight / FONT_SIZE_CONSTANTS.ADMIN_CONTROL_HEIGHT_RATIO;

    return {
        ...overrides,
        [CSS_VARIABLES.ADMIN_CONTROL_HEIGHT]: formatRemValue(constrainedHeight),
        [CSS_VARIABLES.CHALLENGE_FONT_SIZE]: formatFontSizeClamp(
            constrainedFontSize,
            viewportScale
        ),
        [CSS_VARIABLES.CHALLENGE_DESCRIPTION_FONT_SIZE]: formatRemValue(
            constrainedFontSize * FONT_SIZE_CONSTANTS.DESCRIPTION_RATIO
        ),
        [CSS_VARIABLES.CHALLENGE_TIMER_FONT_SIZE]: formatRemValue(
            constrainedFontSize * FONT_SIZE_CONSTANTS.TIMER_RATIO
        ),
    };
}

function getAdminControlHeightCap(
    width: number,
    height: number
): number | null {
    if (width <= 320 || height <= 250) {
        return 1.2;
    }

    if (width <= 400 || height <= 350) {
        return 1.3;
    }

    return null;
}

function parseRemValue(value: string | undefined): number | null {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    const match = /^(-?\d+(?:\.\d+)?)rem$/.exec(trimmed);

    if (!match) {
        return null;
    }

    const numericValue = Number(match[1]);
    return Number.isFinite(numericValue) ? numericValue : null;
}
