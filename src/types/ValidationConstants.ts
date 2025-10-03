/**
 * Validation constants for the Twitch Challenge List Overlay
 * Provides type-safe validation patterns and rules used throughout the application.
 *
 * Following project conventions:
 * - UPPER_SNAKE_CASE naming for constants
 * - Logical grouping by validation type
 * - TypeScript exports for proper module integration
 * - Eliminates magic values throughout the application
 */

/**
 * Regular expression patterns for validation
 */
export const VALIDATION_PATTERNS = {
    /**
     * Timer format validation pattern
     * Matches patterns like "5m", "30s", "1h" (case insensitive)
     * - One or more digits followed by s/m/h
     */
    TIMER_FORMAT: /^\d+[smh]$/i,
} as const;

/**
 * Default values for validation constraints
 */
export const VALIDATION_DEFAULTS = {
    /**
     * Default maximum challenges value
     * Used when maxChallenges is not configured
     */
    MAX_CHALLENGES: 10,
} as const;

/**
 * Validation constraint values for form inputs
 */
export const VALIDATION_CONSTRAINTS = {
    /**
     * Challenge amount validation constraints
     * Minimum and maximum values for challenge amounts
     */
    AMOUNT_MIN: 1,
    AMOUNT_MAX: 999,
} as const;

/**
 * Type definitions for validation constant values
 */
export type ValidationPatternValue =
    (typeof VALIDATION_PATTERNS)[keyof typeof VALIDATION_PATTERNS];
export type ValidationDefaultValue =
    (typeof VALIDATION_DEFAULTS)[keyof typeof VALIDATION_DEFAULTS];
export type ValidationConstraintValue =
    (typeof VALIDATION_CONSTRAINTS)[keyof typeof VALIDATION_CONSTRAINTS];
