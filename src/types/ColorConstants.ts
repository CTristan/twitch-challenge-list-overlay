/**
 * Centralized color constants for the Twitch Challenge List Overlay
 * Provides type-safe color values to eliminate hardcoded color strings
 * and improve maintainability.
 */

/**
 * Default color values for form inputs and UI elements
 */
export const DEFAULT_COLORS = {
    // Primary color tier defaults
    PRIMARY_BACKGROUND: "#ff0000",
    PRIMARY_TEXT: "#ffffff",

    // Secondary color tier defaults
    SECONDARY_BACKGROUND: "#00ff00",
    SECONDARY_TEXT: "#ffffff",

    // Tertiary color tier defaults
    TERTIARY_BACKGROUND: "#0000ff",
    TERTIARY_TEXT: "#ffffff",

    // Background configuration defaults
    CHALLENGE_BACKGROUND: "#000000",
    CHALLENGE_TEXT: "#ffffff",

    // Text color calculation defaults
    BLACK_TEXT: "#000000",
    BLACK_TEXT_SHORT: "#000",
    WHITE_TEXT: "#ffffff",
} as const;

/**
 * Status colors for feedback and visual states
 */
export const STATUS_COLORS = {
    SUCCESS: "#28a745",
    ERROR: "#dc3545",
    WARNING: "#ffc107",
    INFO: "#17a2b8",
} as const;

/**
 * Shadow colors for text readability enhancement
 */
export const SHADOW_COLORS = {
    WHITE_SHADOW: "rgba(255, 255, 255, 0.8)",
    BLACK_SHADOW: "rgba(0, 0, 0, 0.8)",
} as const;

/**
 * Color format strings for parsing and conversion
 */
export const COLOR_FORMAT = {
    HEX_PREFIX: "#",
    RGBA_PREFIX: "rgba(",
    RGBA_SEPARATOR: ",",
    HEX_PADDING_CHAR: "0",
} as const;
