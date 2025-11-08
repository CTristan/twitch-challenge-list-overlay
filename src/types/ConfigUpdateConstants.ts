/**
 * Configuration update constants and types
 * Centralizes config update event type and origin strings to eliminate magic literals.
 */

export const CONFIG_UPDATE_TYPES = {
    INIT: "init",
    SET: "set",
    SET_ALL: "setAll",
    RESET: "reset",
    IMPORT: "import",
    SYNC: "sync",
} as const;

export type ConfigUpdateTypeValue =
    (typeof CONFIG_UPDATE_TYPES)[keyof typeof CONFIG_UPDATE_TYPES];

export const CONFIG_UPDATE_ORIGINS = {
    LOCAL: "local",
    EXTERNAL: "external",
} as const;

export type ConfigUpdateOriginValue =
    (typeof CONFIG_UPDATE_ORIGINS)[keyof typeof CONFIG_UPDATE_ORIGINS];
