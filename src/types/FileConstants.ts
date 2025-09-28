/**
 * Centralized file-related constants for the Twitch Challenge List Overlay
 * Provides type-safe file format, extension, and filename constants
 * to eliminate hardcoded strings and improve maintainability.
 */

/**
 * Supported file formats for import/export operations
 */
export const FILE_FORMATS = {
    JSON: "json",
} as const;

/**
 * File extensions for validation and filtering
 */
export const FILE_EXTENSIONS = {
    JSON: ".json",
} as const;

/**
 * Default filenames for export operations
 */
export const DEFAULT_FILENAMES = {
    CONFIG_EXPORT: "twitch-overlay-config.json",
} as const;

/**
 * File format constants
 */
export const FILE_FORMAT_VALUES = {
    JSON: "json",
} as const;
