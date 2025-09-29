/**
 * Centralized configuration property constants for the Twitch Challenge List Overlay
 * Provides type-safe configuration property names to eliminate hardcoded strings
 *
 * This follows the established pattern of centralized constants used in CommandTypes
 * and MessageConstants to maintain consistency and prevent magic strings.
 */

/**
 * Authentication configuration property names
 */
export const AUTH_CONFIG = {
    TWITCH_OAUTH: "auth.twitch_oauth",
    TWITCH_USERNAME: "auth.twitch_username",
    TWITCH_CHANNEL: "auth.twitch_channel",
} as const;

/**
 * Basic behavior configuration property names
 */
export const BEHAVIOR_CONFIG = {
    MAX_CHALLENGES: "maxChallenges",
} as const;

/**
 * Response template configuration property names
 */
export const RESPONSE_CONFIG = {
    INVALID_COMMAND: "responses.invalidCommand",
} as const;

/**
 * Challenge row color configuration property names
 */
export const COLOR_CONFIG = {
    CHALLENGE_ROW_COLORS: "challengeRowColors",
    CHALLENGE_ROW_TEXT_COLORS: "challengeRowTextColors",
} as const;

/**
 * Core configuration property names
 */
export const CORE_CONFIG = {
    AUTH: "auth",
    MAX_CHALLENGES: "maxChallenges",
    COMMANDS: "commands",
    RESPONSES: "responses",
    CHALLENGE_ROW_COLORS: "challengeRowColors",
    CHALLENGE_ROW_TEXT_COLORS: "challengeRowTextColors",
} as const;

/**
 * Background customization configuration property names
 */
export const BACKGROUND_CONFIG = {
    // Overlay background (main container behind all challenges)
    OVERLAY_BACKGROUND_COLOR: "overlayBackgroundColor",
    OVERLAY_BACKGROUND_OPACITY: "overlayBackgroundOpacity",

    // Challenge row backgrounds (individual challenge containers)
    CHALLENGE_BACKGROUND_COLOR: "challengeBackgroundColor",
    CHALLENGE_BACKGROUND_OPACITY: "challengeBackgroundOpacity",
    CHALLENGE_TEXT_COLOR: "challengeTextColor",
    CHALLENGE_AUTO_TEXT_COLOR: "challengeAutoTextColor",
    CHALLENGE_TEXT_SHADOW: "challengeTextShadow",
} as const;

/**
 * All configuration property names grouped by category
 */
export const CONFIG_PROPERTIES = {
    AUTH: AUTH_CONFIG,
    BEHAVIOR: BEHAVIOR_CONFIG,
    RESPONSE: RESPONSE_CONFIG,
    COLOR: COLOR_CONFIG,
    BACKGROUND: BACKGROUND_CONFIG,
    CORE: CORE_CONFIG,
} as const;

/**
 * Type for configuration property values
 */
export type ConfigPropertyValue =
    | (typeof AUTH_CONFIG)[keyof typeof AUTH_CONFIG]
    | (typeof BEHAVIOR_CONFIG)[keyof typeof BEHAVIOR_CONFIG]
    | (typeof RESPONSE_CONFIG)[keyof typeof RESPONSE_CONFIG]
    | (typeof COLOR_CONFIG)[keyof typeof COLOR_CONFIG]
    | (typeof BACKGROUND_CONFIG)[keyof typeof BACKGROUND_CONFIG]
    | (typeof CORE_CONFIG)[keyof typeof CORE_CONFIG];

/**
 * Default values for background configuration
 */
export const BACKGROUND_DEFAULTS = {
    // Overlay background defaults (main container)
    OVERLAY_BACKGROUND_COLOR: "rgba(100, 100, 100, 0.6)",
    OVERLAY_BACKGROUND_OPACITY: 0.6,

    // Challenge row background defaults
    BACKGROUND_COLOR: "rgba(0, 0, 0, 0.7)",
    BACKGROUND_OPACITY: 0.7,
    TEXT_COLOR: "#ffffff",
    AUTO_TEXT_COLOR: true,
    TEXT_SHADOW: true,
} as const;

/**
 * Numeric constants for background configuration
 */
export const BACKGROUND_NUMERIC_CONSTANTS = {
    DEFAULT_OPACITY: 0.7,
} as const;

/**
 * CSS custom property names for background customization
 */
export const CSS_VARIABLES = {
    // Overlay background CSS variables
    OVERLAY_BACKGROUND_COLOR: "overlayBackgroundColor",
    OVERLAY_BACKGROUND_OPACITY: "overlayBackgroundOpacity",

    // Challenge row background CSS variables
    CHALLENGE_BACKGROUND_COLOR: "challengeBackgroundColor",
    CHALLENGE_BACKGROUND_OPACITY: "challengeBackgroundOpacity",
    CHALLENGE_TEXT_COLOR_OVERRIDE: "challengeTextColorOverride",
    CHALLENGE_AUTO_TEXT_COLOR_ENABLED: "challengeAutoTextColorEnabled",
    CHALLENGE_TEXT_SHADOW_ENABLED: "challengeTextShadowEnabled",
} as const;

/**
 * CSS custom property names for checkbox styling
 */
export const CSS_CUSTOM_PROPERTIES = {
    CHALLENGE_CHECKBOX_BORDER_COLOR: "--challenge-checkbox-border-color",
    CHALLENGE_CHECKBOX_CHECKED_BORDER_COLOR:
        "--challenge-checkbox-checked-border-color",
    CHALLENGE_CHECKBOX_CHECKMARK_COLOR: "--challenge-checkbox-checkmark-color",
} as const;

/**
 * DOM element IDs for background configuration UI
 */
export const BACKGROUND_UI_ELEMENTS = {
    // Overlay background UI elements
    OVERLAY_BACKGROUND_COLOR_INPUT: "overlay-background-color",
    OVERLAY_BACKGROUND_OPACITY_SLIDER: "overlay-background-opacity",
    OVERLAY_OPACITY_DISPLAY: "overlay-opacity-display",

    // Challenge row background UI elements
    BACKGROUND_COLOR_INPUT: "challenge-background-color",
    BACKGROUND_OPACITY_SLIDER: "challenge-background-opacity",
    OPACITY_DISPLAY: "opacity-display",
    AUTO_TEXT_COLOR_CHECKBOX: "challenge-auto-text-color",
    TEXT_COLOR_INPUT: "challenge-text-color",
    TEXT_SHADOW_CHECKBOX: "challenge-text-shadow",
} as const;
