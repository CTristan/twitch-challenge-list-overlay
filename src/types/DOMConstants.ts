/**
 * Centralized DOM-related constants for the Twitch Challenge List Overlay
 * Provides type-safe constants for CSS selectors, class names, data attributes, and event names
 * to eliminate hardcoded strings and improve maintainability.
 */

/**
 * CSS class names used throughout the application
 */
export const CSS_CLASSES = {
    // Admin panel classes
    ADMIN_PANEL_COLLAPSED: "admin-panel-collapsed",
    ADMIN_PANEL_HEADER: "admin-panel-header",
    ADMIN_PANEL_CONTENT: "admin-panel-content",
    ADMIN_TEXT_ONLY_CARD: "admin-text-only-card",
    ADMIN_STANDARD_CARD: "admin-standard-card",
    ADMIN_TEXT_ONLY_PANEL: "admin-panel-text-only",

    // Challenge-related classes
    CHALLENGE: "challenge",
    CHALLENGE_CONTAINER: "challenge-container",
    CHALLENGE_CHECKBOX: "challenge-checkbox",
    CHALLENGE_EDIT_ICON: "challenge-edit-icon",
    CHALLENGE_INCREMENT_BUTTON: "challenge-increment-button",
    CHALLENGE_DECREMENT_BUTTON: "challenge-decrement-button",
    CHALLENGE_TEXT_ONLY_EDIT: "challenge-text-only-edit",
    CHALLENGE_TEXT_ONLY_COMPLETE: "challenge-text-only-complete",
    CHALLENGE_TEXT_ONLY_UNCOMPLETE: "challenge-text-only-uncomplete",
    CHALLENGE_TEXT_ONLY_FAIL: "challenge-text-only-fail",
    CHALLENGE_TEXT_ONLY_UNFAIL: "challenge-text-only-unfail",
    CHALLENGE_TEXT_ONLY_DELETE: "challenge-text-only-delete",
    CHALLENGE_DELETE_CONFIRM: "challenge-delete-confirm",
    CHALLENGE_TEXT_ONLY_INCREMENT: "challenge-text-only-increment",
    CHALLENGE_TEXT_ONLY_DECREMENT: "challenge-text-only-decrement",
    CHALLENGE_TEXT_ONLY_ITEM: "challenge-text-only-item",
    CHALLENGE_TEXT_ONLY_CONTENT: "challenge-text-only-content",
    CHALLENGE_TEXT_ONLY_BUTTONS: "challenge-text-only-buttons",
    CHALLENGE_TEXT: "challenge-text",
    CHALLENGE_TITLE: "challenge-title",
    CHALLENGE_DESCRIPTION: "challenge-description",
    CHALLENGE_METADATA: "challenge-metadata",
    CHALLENGE_AMOUNT: "challenge-amount",
    CHALLENGE_TIMER: "challenge-timer",
    CHALLENGE_CONTENT_WRAPPER: "challenge-content-wrapper",
    CHALLENGE_ACTIONS: "challenge-actions",
    CHALLENGES: "challenges",

    // State classes
    DONE: "done",
    FAILED: "failed",
    CHECKED: "checked",
    HIDDEN: "hidden",
    ADMIN_INTERACTIVE: "admin-interactive",
    EXPANDED: "expanded",
    DISABLED: "disabled",
    ERROR: "error",

    // Add Challenge Button classes
    ADD_CHALLENGE_BTN: "add-challenge-btn",
    ADD_CHALLENGE_CONTAINER: "add-challenge-container",
    CLEAR_COMPLETED_BTN: "clear-completed-btn",
    CLEAR_FAILED_BTN: "clear-failed-btn",
    REFRESH_BTN: "refresh-btn",
    ADMIN_TEXT_ONLY_ACTION_CONTAINER: "admin-text-only-action-container",
    ADMIN_TEXT_ONLY_ACTION_LABEL: "admin-text-only-action-label",
    ADMIN_TEXT_ONLY_ACTION: "admin-text-only-action",
    ADMIN_TEXT_ONLY_ACTION_ADD: "admin-text-only-action-add",
    ADMIN_TEXT_ONLY_ACTION_CLEAR: "admin-text-only-action-clear",
    ADMIN_TEXT_ONLY_ACTION_CLEAR_FAILED: "admin-text-only-action-clear-failed",
    ADMIN_TEXT_ONLY_ACTION_REFRESH: "admin-text-only-action-refresh",

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
    PREVIEW_TITLE: "preview-title",
    PREVIEW_DESCRIPTION: "preview-description",
    PREVIEW_PROGRESS: "preview-progress",
    PREVIEW_CHECKBOX: "preview-checkbox",

    // Collapsible section classes
    COLLAPSIBLE_SECTION: "collapsible-section",
    COLLAPSIBLE_HEADER: "collapsible-header",
    COLLAPSIBLE_TITLE: "collapsible-title",
    COLLAPSIBLE_ICON: "collapsible-icon",
    COLLAPSIBLE_CONTENT: "collapsible-content",

    // Connection warning classes
    CONNECTION_WARNING: "connection-warning",
    CONNECTION_WARNING_HIDDEN: "connection-warning-hidden",
} as const;

/**
 * CSS selectors for DOM queries
 */
export const CSS_SELECTORS = {
    // Challenge-related selectors
    CHALLENGE_CONTAINER: ".challenge-container",
    CHALLENGE_CHECKBOX: ".challenge-checkbox",
    CHALLENGE_EDIT_ICON: ".challenge-edit-icon",
    CHALLENGE_INCREMENT_BUTTON: ".challenge-increment-button",
    CHALLENGE_DECREMENT_BUTTON: ".challenge-decrement-button",
    CHALLENGE_TEXT: ".challenge-text",
    CHALLENGE_TITLE: ".challenge-title",
    CHALLENGE_DESCRIPTION: ".challenge-description",
    CHALLENGE_METADATA: ".challenge-metadata",
    CHALLENGE_AMOUNT: ".challenge-amount",
    CHALLENGE_TIMER: ".challenge-timer",
    CHALLENGE: ".challenge",
    CHALLENGES_LIST: ".challenges",
    CHALLENGES_ORDERED_LIST: "ol.challenges",
    CHALLENGE_CONTENT_WRAPPER: ".challenge-content-wrapper",
    CHALLENGE_ACTIONS: ".challenge-actions",

    // Header and text selectors
    CUSTOM_HEADER: ".custom-header",
    CUSTOM_TEXT: ".custom-text",
    CARD: ".card",
    CARD_HEADER: ".card .username",

    // Admin panel selectors
    ADMIN_CONTENT: ".admin-content",
    PREVIEW_CHALLENGE: ".preview-challenge",
    PREVIEW_TEXT: ".preview-text",
    PREVIEW_TITLE: ".preview-title",
    PREVIEW_DESCRIPTION: ".preview-description",
    PREVIEW_PROGRESS: ".preview-progress",
    PREVIEW_CHECKBOX: ".preview-checkbox",

    // Combined selectors
    CHALLENGE_BY_ID: (challengeId: string) =>
        `[data-challenge-id="${challengeId}"]`,
    CHALLENGE_CONTAINER_CARD: ".challenge-container > .card",
} as const;

/**
 * DOM element IDs used throughout the application
 */
export const ELEMENT_IDS = {
    // Admin panel elements
    ADMIN_PANEL: "admin-panel",
    ADMIN_PANEL_TOGGLE_HEADER: "admin-panel-toggle-header",
    ADMIN_PANEL_COLLAPSIBLE_CONTENT: "admin-panel-collapsible-content",
    CONFIG_SETTINGS_TOGGLE_HEADER: "config-settings-toggle-header",
    CONFIG_SETTINGS_COLLAPSIBLE_CONTENT: "config-settings-collapsible-content",

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
    ADMIN_TEXT_ONLY_MODE: "admin-text-only-mode",

    // Add Challenge Modal elements
    ADD_CHALLENGE_MODAL: "add-challenge-modal",
    ADD_CHALLENGE_MODAL_TITLE: "add-challenge-modal-title",
    ADD_CHALLENGE_FORM: "add-challenge-form",
    ADD_CHALLENGE_TITLE: "add-challenge-title",
    ADD_CHALLENGE_DESCRIPTION: "add-challenge-description",
    ADD_CHALLENGE_AMOUNT: "add-challenge-amount",
    ADD_CHALLENGE_TIMER: "add-challenge-timer",
    ADD_CHALLENGE_TIMER_BEHAVIOR_GROUP: "add-challenge-timer-behavior-group",
    ADD_CHALLENGE_TIMER_BEHAVIOR: "add-challenge-timer-behavior",
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
    VIEWER_FONT_SIZE: "viewer-font-size",
    VIEWER_FONT_SIZE_DISPLAY: "viewer-font-size-display",

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
    CHALLENGE_ROW_STYLING_SECTION: "challenge-row-styling",
    OVERLAY_BACKGROUND_SECTION: "overlay-background",
    ACTIONS_SECTION: "actions",
    BACKUP_SECTION: "backup",
    DANGER_ZONE_SECTION: "danger-zone",

    // Connection warning element
    CONNECTION_WARNING: "connection-warning",

    // Main application container
    APP: "app",
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
    DELETE_CONFIRM_PENDING: "deleteConfirmPending",
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
    MESSAGE: "message",
    CHALLENGE_LIST_REFRESH: "challenge-list-refresh",
    BEFOREUNLOAD: "beforeunload",
} as const;

/**
 * URL hash values for mode switching
 */
export const URL_HASH = {
    ADMIN: "#admin",
    VIEWER: "",
} as const;

/**
 * BroadcastChannel names for cross-window communication
 */
export const BROADCAST_CHANNEL_NAMES = {
    CONFIG_UPDATES: "twitch-overlay-config-updates",
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
    PERCENT_SYMBOL: "%",
    COMMAND_NOT_FOUND: "command not found",
    HYPHEN: "-",
    EVENT_SUFFIX_CLICK: "-click",
    EVENT_SUFFIX_KEYDOWN: "-keydown",
} as const;

/**
 * HTML element type constants
 */
export const HTML_ELEMENTS = {
    DIV: "div",
    BUTTON: "button",
    H2: "h2",
    LI: "li",
    ANCHOR: "a",
    TEXTAREA: "textarea",
} as const;

/**
 * HTML attribute name constants
 */
export const HTML_ATTRIBUTE_NAMES = {
    ROLE: "role",
    ARIA_LABEL: "aria-label",
    ARIA_EXPANDED: "aria-expanded",
    ARIA_HIDDEN: "aria-hidden",
    TABINDEX: "tabindex",
    HREF: "href",
    DOWNLOAD: "download",
    STYLE: "style",
    VALUE: "value",
} as const;

/**
 * HTML attribute value constants
 */
export const HTML_ATTRIBUTES = {
    BUTTON_TYPE: "button",
    ROLE_BUTTON: "button",
    TABINDEX_ZERO: "0",
    ARIA_TRUE: "true",
    ARIA_FALSE: "false",
} as const;

/**
 * Keyboard key constants
 */
export const KEYBOARD_KEYS = {
    ENTER: "Enter",
    SPACE: " ",
} as const;

/**
 * Button text constants
 */
export const BUTTON_TEXT = {
    ADD_CHALLENGE: "Add Challenge",
    CLEAR_COMPLETED: "Clear Completed",
    CLEAR_FAILED: "Clear Failed",
    REFRESH: "Refresh",
} as const;

/**
 * Modal mode constants for form dialogs
 */
export const MODAL_MODES = {
    ADD: "add",
    EDIT: "edit",
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
export type HTMLAttributeNameValue =
    (typeof HTML_ATTRIBUTE_NAMES)[keyof typeof HTML_ATTRIBUTE_NAMES];
export type HTMLAttributeValue =
    (typeof HTML_ATTRIBUTES)[keyof typeof HTML_ATTRIBUTES];
export type KeyboardKeyValue =
    (typeof KEYBOARD_KEYS)[keyof typeof KEYBOARD_KEYS];
export type ButtonTextValue = (typeof BUTTON_TEXT)[keyof typeof BUTTON_TEXT];
export type ModalModeValue = (typeof MODAL_MODES)[keyof typeof MODAL_MODES];
export type BroadcastChannelNameValue =
    (typeof BROADCAST_CHANNEL_NAMES)[keyof typeof BROADCAST_CHANNEL_NAMES];

/**
 * CSS property values used throughout the application
 */
export const CSS_VALUES = {
    // Text shadow values
    TEXT_SHADOW_NONE: "none",

    // Display values
    DISPLAY_FLEX: "flex",
    DISPLAY_NONE: "none",

    // Opacity values
    OPACITY_FULL: "1",
    OPACITY_DISABLED: "0.6",
    OPACITY_ZERO: "0",

    // Position values
    POSITION_FIXED: "fixed",
} as const;

export type CSSValue = (typeof CSS_VALUES)[keyof typeof CSS_VALUES];

/**
 * CSS property names
 */
export const CSS_PROPERTY_NAMES = {
    DISPLAY: "display",
    POSITION: "position",
    OPACITY: "opacity",
    POINTER_EVENTS: "pointerEvents",
} as const;

/**
 * DOM command names for document.execCommand
 */
export const DOM_COMMANDS = {
    COPY: "copy",
} as const;

/**
 * Challenge state values returned by Challenge.getState()
 * Used for state comparison and conditional logic
 */
export const CHALLENGE_STATES = {
    IN_PROGRESS: "in-progress",
    DONE: "done",
    FAILED: "failed",
} as const;

export type ChallengeState =
    (typeof CHALLENGE_STATES)[keyof typeof CHALLENGE_STATES];
