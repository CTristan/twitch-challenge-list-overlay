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
    JAVASCRIPT: "js",
    TEMPLATE: "template.js",
} as const;

/**
 * File extensions for validation and filtering
 */
export const FILE_EXTENSIONS = {
    JSON: ".json",
    JAVASCRIPT: ".js",
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
    JAVASCRIPT: "javascript",
} as const;

/**
 * MIME types for file downloads
 */
export const MIME_TYPES = {
    JSON: "application/json",
    JAVASCRIPT: "text/javascript",
} as const;

/**
 * Filename pattern components
 */
export const FILENAME_PATTERNS = {
    PREFIX: "twitch-overlay-config_",
    TIMESTAMP_SEPARATOR: "_",
    EXTENSION_SEPARATOR: ".",
} as const;
