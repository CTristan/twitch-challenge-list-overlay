/**
 * Centralized numeric constants for the Twitch Challenge List Overlay
 * Provides type-safe numeric values to eliminate magic numbers
 * and improve maintainability.
 */

/**
 * Form input constraints and validation values
 */
export const FORM_CONSTRAINTS = {
    // Max challenges input constraints
    MAX_CHALLENGES_MIN: 1,
    MAX_CHALLENGES_MAX: 50,

    // Opacity slider constraints
    OPACITY_MIN: 0,
    OPACITY_MAX: 100,
    OPACITY_DEFAULT: 70,
    OPACITY_STEP: 5,

    // Percentage conversion
    PERCENTAGE_MULTIPLIER: 100,
    PERCENTAGE_DIVISOR: 100,
} as const;

/**
 * Color parsing and calculation constants
 */
export const COLOR_CONSTANTS = {
    // Hex color parsing positions
    HEX_RED_START: 0,
    HEX_RED_LENGTH: 2,
    HEX_GREEN_START: 2,
    HEX_GREEN_LENGTH: 2,
    HEX_BLUE_START: 4,
    HEX_BLUE_LENGTH: 2,

    // Brightness calculation weights (ITU-R BT.709)
    BRIGHTNESS_RED_WEIGHT: 299,
    BRIGHTNESS_GREEN_WEIGHT: 587,
    BRIGHTNESS_BLUE_WEIGHT: 114,
    BRIGHTNESS_DIVISOR: 1000,
    BRIGHTNESS_THRESHOLD: 128,

    // Color value constraints
    COLOR_MIN_VALUE: 0,
    COLOR_MAX_VALUE: 255,
    HEX_PADDING_LENGTH: 1,
    HEX_BASE: 16,
} as const;

/**
 * Timeout and delay constants (in milliseconds)
 */
export const TIMING_CONSTANTS = {
    FEEDBACK_TIMEOUT: 2000,
    IMPORT_REFRESH_DELAY: 1000,
    BUTTON_FEEDBACK_DURATION: 2000,
    DELETE_CONFIRMATION_TIMEOUT: 5000,
} as const;

/**
 * Text shadow configuration constants
 */
export const TEXT_SHADOW_CONSTANTS = {
    SHADOW_OFFSET_X: 1,
    SHADOW_OFFSET_Y: 1,
    SHADOW_BLUR: 2,
    SHADOW_SPREAD: 0,
} as const;
