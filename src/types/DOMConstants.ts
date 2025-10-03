/**
 * Centralized DOM-related constants for the Twitch Challenge List Overlay
 * Provides type-safe constants for CSS selectors, class names, data attributes, and event names
 * to eliminate hardcoded strings and improve maintainability.
 */

/**
 * CSS class names used throughout the application
 */
export const CSS_CLASSES = {
    // Challenge-related classes
    CHALLENGE: "challenge",
    CHALLENGE_CONTAINER: "challenge-container",
    CHALLENGE_CHECKBOX: "challenge-checkbox",
    CHALLENGE_TEXT: "challenge-text",
    CHALLENGE_TITLE: "challenge-title",
    CHALLENGE_DESCRIPTION: "challenge-description",
    CHALLENGE_AMOUNT: "challenge-amount",
    CHALLENGES: "challenges",

    // State classes
    DONE: "done",
    CHECKED: "checked",
    HIDDEN: "hidden",
    ADMIN_INTERACTIVE: "admin-interactive",
    EXPANDED: "expanded",
    DISABLED: "disabled",
    ERROR: "error",

    // Add Challenge Button classes
    ADD_CHALLENGE_BTN: "add-challenge-btn",
    ADD_CHALLENGE_CONTAINER: "add-challenge-container",
    CLEAR_FINISHED_BTN: "clear-finished-btn",

    // Background customization classes
    CUSTOM_OVERLAY_BACKGROUND: "custom-overlay-background",
    CUSTOM_BACKGROUND: "custom-background",
    ENHANCED_READABILITY: "enhanced-readability",
    TEXT_SHADOW_LIGHT: "text-shadow-light",
    TEXT_SHADOW_DARK: "text-shadow-dark",

    // Layout classes
    CARD: "card",
    USERNAME: "username",
    CUSTOM_HEADER: "custom-header",
    CUSTOM_TEXT: "custom-text",

    // Admin panel classes
    ADMIN_CONTENT: "admin-content",
    CONFIG_FORM: "config-form",
    FORM_INPUT: "form-input",
    COLOR_TIER_SECTION: "color-tier-section",
    COLOR_TIER_HEADER: "color-tier-header",
    COLOR_TIER_CHECKBOX: "color-tier-checkbox",
    COLOR_TIER_TITLE: "color-tier-title",
    COLOR_PICKERS_CONTAINER: "color-pickers-container",
    COLOR_PICKER_GROUP: "color-picker-group",
    COLOR_PICKER_LABEL: "color-picker-label",
    PREVIEW_CHALLENGE: "preview-challenge",
    PREVIEW_TEXT: "preview-text",
} as const;

/**
 * CSS selectors for DOM queries
 */
export const CSS_SELECTORS = {
    // Challenge-related selectors
    CHALLENGE_CONTAINER: ".challenge-container",
    CHALLENGE_CHECKBOX: ".challenge-checkbox",
    CHALLENGE_TEXT: ".challenge-text",
    CHALLENGE_TITLE: ".challenge-title",
    CHALLENGE_DESCRIPTION: ".challenge-description",
    CHALLENGE_AMOUNT: ".challenge-amount",
    CHALLENGE: ".challenge",
    CHALLENGES_LIST: ".challenges",
    CHALLENGES_ORDERED_LIST: "ol.challenges",

    // Header and text selectors
    CUSTOM_HEADER: ".custom-header",
    CUSTOM_TEXT: ".custom-text",
    CARD: ".card",
    CARD_HEADER: ".card .username",

    // Admin panel selectors
    ADMIN_CONTENT: ".admin-content",
    PREVIEW_CHALLENGE: ".preview-challenge",
    PREVIEW_TEXT: ".preview-text",

    // Combined selectors
    CHALLENGE_BY_ID: (challengeId: string) =>
        `[data-challenge-id="${challengeId}"]`,
} as const;

/**
 * DOM element IDs used throughout the application
 */
export const ELEMENT_IDS = {
    // Admin panel form elements
    CONFIG_FORM: "config-form",
    CLEAR_LOCALSTORAGE_BTN: "clear-localstorage-btn",
    EXPORT_JSON_BTN: "export-json-btn",
    IMPORT_CONFIG_BTN: "import-config-btn",
    IMPORT_FILE_INPUT: "import-file-input",
    SAVE_CONFIG_BTN: "save-config-btn",
    RESET_CONFIG_BTN: "reset-config-btn",

    // Authentication form elements
    TWITCH_OAUTH: "twitch-oauth",
    TWITCH_USERNAME: "twitch-username",
    TWITCH_CHANNEL: "twitch-channel",

    // Behavior form elements
    MAX_CHALLENGES: "max-challenges",

    // Add Challenge Modal elements
    ADD_CHALLENGE_MODAL: "add-challenge-modal",
    ADD_CHALLENGE_FORM: "add-challenge-form",
    ADD_CHALLENGE_TITLE: "add-challenge-title",
    ADD_CHALLENGE_DESCRIPTION: "add-challenge-description",
    ADD_CHALLENGE_AMOUNT: "add-challenge-amount",
    ADD_CHALLENGE_TIMER: "add-challenge-timer",
    ADD_CHALLENGE_SUBMIT: "add-challenge-submit",
    ADD_CHALLENGE_CANCEL: "add-challenge-cancel",

    // Color configuration elements
    PRIMARY_COLOR_ENABLED: "primary-color-enabled",
    PRIMARY_BG_COLOR: "primary-bg-color",
    PRIMARY_TEXT_COLOR: "primary-text-color",
    SECONDARY_COLOR_ENABLED: "secondary-color-enabled",
    SECONDARY_BG_COLOR: "secondary-bg-color",
    SECONDARY_TEXT_COLOR: "secondary-text-color",
    TERTIARY_COLOR_ENABLED: "tertiary-color-enabled",
    TERTIARY_BG_COLOR: "tertiary-bg-color",
    TERTIARY_TEXT_COLOR: "tertiary-text-color",
    ROW_COLORS_OPACITY: "row-colors-opacity",
    ROW_COLORS_OPACITY_DISPLAY: "row-colors-opacity-display",

    // Background configuration elements
    CHALLENGE_BACKGROUND_COLOR: "challenge-background-color",
    CHALLENGE_BACKGROUND_OPACITY: "challenge-background-opacity",
    OPACITY_DISPLAY: "opacity-display",
    CHALLENGE_AUTO_TEXT_COLOR: "challenge-auto-text-color",
    CHALLENGE_TEXT_COLOR: "challenge-text-color",
    CHALLENGE_TEXT_SHADOW: "challenge-text-shadow",
    BACKGROUND_PREVIEW: "background-preview",

    // Color tier sections
    PRIMARY_COLOR_SECTION: "primary-color-section",
    SECONDARY_COLOR_SECTION: "secondary-color-section",
    TERTIARY_COLOR_SECTION: "tertiary-color-section",
    PRIMARY_COLOR_PICKERS: "primary-color-pickers",
    SECONDARY_COLOR_PICKERS: "secondary-color-pickers",
    TERTIARY_COLOR_PICKERS: "tertiary-color-pickers",

    // Admin panel collapsible section IDs
    AUTHENTICATION_SECTION: "authentication",
    BEHAVIOR_SECTION: "behavior",
    COLORS_SECTION: "colors",
    BACKGROUND_SECTION: "background",
    ACTIONS_SECTION: "actions",
    BACKUP_SECTION: "backup",
    DANGER_ZONE_SECTION: "danger-zone",
} as const;

/**
 * Color tier names used throughout the admin panel for color configuration
 */
export const COLOR_TIERS = ["primary", "secondary", "tertiary"] as const;

/**
 * Type for color tier values
 */
export type ColorTier = (typeof COLOR_TIERS)[number];

/**
 * Data attribute names
 */
export const DATA_ATTRIBUTES = {
    CHALLENGE_ID: "challengeId",
} as const;

/**
 * Event names
 */
export const EVENT_NAMES = {
    CLICK: "click",
    CHANGE: "change",
    INPUT: "input",
    KEYDOWN: "keydown",
    KEYUP: "keyup",
    SUBMIT: "submit",
    LOAD: "load",
    RESIZE: "resize",
    SCROLL: "scroll",
    HASHCHANGE: "hashchange",
    CHALLENGE_LIST_REFRESH: "challenge-list-refresh",
} as const;

/**
 * URL hash values for mode switching
 */
export const URL_HASH = {
    ADMIN: "#admin",
    VIEWER: "",
} as const;

/**
 * Command-related constants
 */
export const COMMAND_CONSTANTS = {
    PREFIX: "!",
    COMMAND_PREFIX: "!ch",
    COMMAND_PREFIX_WITH_SPACE: "!ch ",
    PREFIX_SLICE_INDEX: 1,
} as const;

/**
 * Common string values
 */
export const COMMON_STRINGS = {
    EMPTY: "",
    SPACE: " ",
    COMMAND_NOT_FOUND: "command not found",
} as const;

/**
 * HTML element type constants
 */
export const HTML_ELEMENTS = {
    DIV: "div",
    BUTTON: "button",
} as const;

/**
 * HTML attribute value constants
 */
export const HTML_ATTRIBUTES = {
    BUTTON_TYPE: "button",
} as const;

/**
 * Button text constants
 */
export const BUTTON_TEXT = {
    ADD_CHALLENGE: "Add Challenge",
    CLEAR_FINISHED: "Clear Finished Challenges",
} as const;

/**
 * Type definitions for constant values
 */
export type CSSClassValue = (typeof CSS_CLASSES)[keyof typeof CSS_CLASSES];
export type EventNameValue = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];
export type DataAttributeValue =
    (typeof DATA_ATTRIBUTES)[keyof typeof DATA_ATTRIBUTES];
export type ElementIdValue = (typeof ELEMENT_IDS)[keyof typeof ELEMENT_IDS];
export type URLHashValue = (typeof URL_HASH)[keyof typeof URL_HASH];
export type CommonStringValue =
    (typeof COMMON_STRINGS)[keyof typeof COMMON_STRINGS];
export type CommandConstantValue =
    (typeof COMMAND_CONSTANTS)[keyof typeof COMMAND_CONSTANTS];
export type HTMLElementValue =
    (typeof HTML_ELEMENTS)[keyof typeof HTML_ELEMENTS];
export type HTMLAttributeValue =
    (typeof HTML_ATTRIBUTES)[keyof typeof HTML_ATTRIBUTES];
export type ButtonTextValue = (typeof BUTTON_TEXT)[keyof typeof BUTTON_TEXT];
