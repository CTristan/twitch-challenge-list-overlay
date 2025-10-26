/**
 * Centralized message constants for the Twitch Challenge List Overlay
 * Provides type-safe string constants for user-facing messages, error messages, and response strings.
 *
 * Following project conventions:
 * - UPPER_SNAKE_CASE naming for constants
 * - Logical grouping by message category
 * - TypeScript exports for proper module integration
 * - Eliminates magic strings throughout the application
 */

/**
 * Error messages for various failure scenarios
 */
export const ERROR_MESSAGES = {
    // Challenge not found errors
    CHALLENGE_NOT_FOUND: "Challenge not found",
    NO_CHALLENGES_FOUND: "No challenges found",
    NO_COMPLETED_CHALLENGES_FOUND: "No completed challenges found",
    NO_INCOMPLETE_CHALLENGES_FOUND: "No incomplete challenges found",

    // Clear operation errors
    NO_CHALLENGES_TO_CLEAR: "No challenges to clear",
    NO_COMPLETED_CHALLENGES_TO_CLEAR: "No completed challenges to clear",

    // Delete operation errors
    NO_VALID_CHALLENGES_TO_DELETE: "No valid challenges found to delete",
    NO_CHALLENGES_WERE_DELETED: "No challenges were deleted.",

    // Complete operation errors
    NO_CHALLENGES_WERE_COMPLETED: "No challenges were completed.",
    NO_CHALLENGES_WERE_REVERTED: "No challenges were reverted.",
    NO_CHALLENGES_WERE_FAILED: "No challenges were marked as failed.",

    // Revert operation errors
    NO_VALID_CHALLENGES_TO_REVERT: "No valid challenges found to revert",

    // Command errors
    UNKNOWN_COMMAND:
        "Unknown command: {command}. Use !ch help for available commands.",
    INVALID_COMMAND_FORMAT: "Invalid command format",
    INVALID_COMMAND_SINGLE: "Invalid command: {error}",
    INVALID_COMMAND_MULTIPLE: "Invalid command: {errors}",

    // General errors
    ERROR_CHALLENGE_NOT_FOUND: "Error: Challenge not found",
    ERROR_CHALLENGE_NOT_FOUND_DETAILED: "Error: Challenge not found",
    GENERIC_NOT_FOUND: "{type} {identifier} not found",
    MAXIMUM_CHALLENGES_REACHED:
        "Maximum number of challenges reached ({limit}). Delete some challenges first.",

    // Form validation errors
    CHALLENGE_TITLE_REQUIRED: "Challenge title is required",
    AMOUNT_INVALID_RANGE: "Amount must be a number between 1 and 999",
    TIMER_FORMAT_INVALID: "Timer format should be like '5m', '30s', or '1h'",
    TIMER_BEHAVIOR_INVALID: "Select a valid timer expiration behavior",
    FAILED_TO_CREATE_CHALLENGE: "Failed to create challenge",
    MAXIMUM_CHALLENGES_ALLOWED: "Maximum of {maxChallenges} challenges allowed",
    ERROR_CREATING_CHALLENGE: "Error creating challenge:",

    // DOM-related errors
    CHALLENGE_LIST_ELEMENT_NOT_FOUND:
        "Challenge list element not found in card",
    CHALLENGE_CONTAINER_NOT_FOUND: "Challenge container not found",
    CHALLENGE_ELEMENT_NOT_FOUND_FOR_CHECKBOX:
        "Could not find challenge element for checkbox",
    CHALLENGE_ID_NOT_FOUND_FOR_CHECKBOX:
        "Could not find challenge ID for checkbox",
    CHALLENGE_NOT_FOUND_BY_ID: "Challenge with ID {challengeId} not found",
    ERROR_TOGGLING_CHALLENGE_COMPLETION: "Error toggling challenge completion:",

    // Auto-save configuration errors
    ERROR_AUTO_SAVING_AUTH_CONFIG:
        "Error auto-saving authentication configuration:",
    ERROR_AUTO_SAVING_BEHAVIOR_CONFIG:
        "Error auto-saving behavior configuration:",
    ERROR_AUTO_SAVING_COLOR_CONFIG: "Error auto-saving color configuration:",
    ERROR_AUTO_SAVING_BACKGROUND_CONFIG:
        "Error auto-saving background configuration:",
} as const;

/**
 * Warning messages for non-critical issues
 */
export const WARNING_MESSAGES = {
    // DOM-related warnings
    CHALLENGE_CARD_NOT_FOUND_FOR_OVERLAY_UPDATE:
        "Challenge card not found for overlay background update",
} as const;

/**
 * Success messages for various operations
 */
export const SUCCESS_MESSAGES = {
    // Challenge completion
    GOOD_JOB_COMPLETING: "Good job on completing",
    GOOD_JOB_COMPLETING_CHALLENGE: "Good job on completing challenge",
    GOOD_JOB_COMPLETING_CHALLENGES: "Good job on completing challenges",

    // Challenge updates
    CHALLENGE_UPDATED: "updated!",
    CHALLENGE_ADDED: "added!",
    PROGRESS_UPDATED: "progress updated",

    // Challenge deletion
    CHALLENGE_DELETED: "has been deleted!",
    CHALLENGES_DELETED: "have been deleted!",

    // Challenge status changes
    CHALLENGE_MARKED_FAILED: "marked as failed",
    CHALLENGE_REVERTED: "reverted to active status",
    CHALLENGES_REVERTED: "reverted to active status",

    // Clear operations
    ALL_CHALLENGES_CLEARED: "All challenges have been cleared",
    ALL_COMPLETED_CHALLENGES_CLEARED:
        "All completed challenges have been cleared",

    // Completion indicators
    COMPLETED_INDICATOR: "✅ Completed!",
} as const;

/**
 * Help and informational messages
 */
export const HELP_MESSAGES = {
    // General help
    GENERAL_HELP:
        "Available commands: !ch add, !ch edit, !ch done, !ch undone, !ch delete, !ch list, !ch clearall, !ch cleardone, !ch help",

    // Guidance messages
    USE_ADD_COMMAND: "Use !ch add to create your first challenge!",
    NO_CHALLENGES_USE_ADD:
        "No challenges found. Use !ch add to create your first challenge!",

    // Command-specific help
    ADD_COMMAND_HELP:
        '!ch add "Challenge Name" d/desc="Description" a/amount=5 t/timer=10m - Add a new challenge with optional parameters',
    EDIT_COMMAND_HELP:
        '!ch edit 1 "New Title" d/desc="New Description" a/amount=10 - Edit challenge properties',
    DONE_COMMAND_HELP:
        "!ch done 1,2,3 - Mark challenges as completed (supports multiple IDs)",
    UNDONE_COMMAND_HELP:
        "!ch undone 1,2,3 - Revert completed challenges to in-progress (supports multiple IDs)",
    FAIL_COMMAND_HELP:
        "!ch fail 1,2,3 - Mark challenges as failed (supports multiple IDs)",
    UNFAIL_COMMAND_HELP:
        "!ch unfail 1,2,3 - Revert failed challenges to in-progress (supports multiple IDs)",
    DELETE_COMMAND_HELP:
        "!ch delete 1,2,3 - Delete challenges (supports multiple IDs)",
    INCREMENT_COMMAND_HELP:
        "!ch + 1 [amount] - Increment challenge progress by amount (default: 1)",
    DECREMENT_COMMAND_HELP:
        "!ch - 1 [amount] - Decrement challenge progress by amount (default: 1)",
    SET_COMMAND_HELP: "!ch set 1 5 - Set challenge progress to specific value",
    LIST_COMMAND_HELP:
        "!ch list [all|done|incomplete] - List challenges with optional filter (default: incomplete)",
    SHOW_COMMAND_HELP:
        "!ch show 1 - Show detailed information about a specific challenge",
    CLEARALL_COMMAND_HELP:
        "!ch clearall - Clear all challenges (requires confirmation)",
    CLEARDONE_COMMAND_HELP: "!ch cleardone - Clear all completed challenges",
    HELP_COMMAND_HELP:
        "!ch help [command] - Show general help or specific command help",
} as const;

/**
 * Status and state description messages
 */
export const STATUS_MESSAGES = {
    // Challenge states
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    FAILED: "Failed",

    // Timer states
    TIMER_ACTIVE: "Active",
    TIMER_STOPPED: "Stopped",
    TIMER_STARTED: "timer started",
    TIMER_EXPIRED_FOR_CHALLENGE: "Timer expired for challenge: {title}",

    // Progress descriptions
    PROGRESS_LABEL: "Progress:",
    STATUS_LABEL: "Status:",
    TIMER_LABEL: "Timer:",
    DESCRIPTION_LABEL: "Description:",
    CREATED_LABEL: "Created:",
    CREATED_UNKNOWN: "Unknown",
} as const;

/**
 * List and display formatting messages
 */
export const LIST_MESSAGES = {
    // List prefixes
    ALL_CHALLENGES: "All",
    COMPLETED_CHALLENGES: "Completed",
    INCOMPLETE_CHALLENGES: "Incomplete",

    // Count formatting
    ONE_CHALLENGE: "1 challenge",
    MULTIPLE_CHALLENGES: "challenges",

    // Statistics formatting
    TOTAL_CHALLENGE: "total challenge",
    TOTAL_CHALLENGES: "total challenges",
    COMPLETION_RATE: "completion rate",
    ACTIVE_TIMER: "active timer",
    ACTIVE_TIMERS: "active timers",
} as const;

/**
 * Permission and validation messages
 */
export const PERMISSION_MESSAGES = {
    MODERATOR_ONLY: "Only moderators and the broadcaster can manage challenges",
} as const;

/**
 * Storage and persistence error messages
 */
export const STORAGE_MESSAGES = {
    // localStorage availability errors
    LOCALSTORAGE_UNAVAILABLE:
        "localStorage unavailable, using in-memory storage only. Settings will not persist between sessions.",
    STORAGE_ACCESS_DENIED:
        "Storage access denied. Using in-memory storage only.",

    // Storage quota errors
    STORAGE_QUOTA_EXCEEDED:
        "Storage quota exceeded. Attempting to clean up old data and retry.",

    // General storage errors
    STORAGE_OPERATION_FAILED: "Storage operation failed: {error}",
} as const;

/**
 * UI element text content constants
 */
export const UI_ELEMENTS = {
    EDIT_ICON: "✏️",
    INCREMENT_BUTTON: "+",
    DECREMENT_BUTTON: "-",
    TEXT_ONLY_EDIT_BUTTON: "Edit",
    TEXT_ONLY_COMPLETE_BUTTON: "Complete",
    TEXT_ONLY_UNCOMPLETE_BUTTON: "Uncomplete",
    TEXT_ONLY_FAIL_BUTTON: "Fail",
    TEXT_ONLY_UNFAIL_BUTTON: "Unfail",
    TEXT_ONLY_DELETE_BUTTON: "Delete",
    DELETE_CONFIRM_PROMPT: "Confirm deletion?",
    TEXT_ONLY_INCREMENT_BUTTON: "+",
    TEXT_ONLY_DECREMENT_BUTTON: "-",
    TEXT_ONLY_ADMIN_ACTIONS_LABEL: "Admin Actions",
    TEXT_ONLY_ADD_CHALLENGE_ACTION: "Add Challenge",
    TEXT_ONLY_CLEAR_COMPLETED_ACTION: "Clear Completed",
    TEXT_ONLY_CLEAR_FAILED_ACTION: "Clear Failed",
    TEXT_ONLY_REFRESH_ACTION: "Refresh",
    CONNECTION_WARNING_TEXT:
        "⚠️ Admin panel not connected - overlay may require manual refresh",
} as const;

/**
 * ARIA label constants for accessibility
 */
export const ARIA_LABELS = {
    TOGGLE_ADMIN_PANEL: "Toggle admin panel visibility",
    TOGGLE_CONFIG_SETTINGS: "Toggle configuration settings visibility",
    EDIT_CHALLENGE: "Edit challenge",
    INCREMENT_PROGRESS: "Increment challenge progress",
    DECREMENT_PROGRESS: "Decrement challenge progress",
    DELETE_CHALLENGE: "Delete challenge",
    CONFIRM_DELETE_CHALLENGE: "Confirm challenge deletion",
    FAIL_CHALLENGE: "Mark challenge as failed",
    UNFAIL_CHALLENGE: "Restore challenge to in-progress",
} as const;

/**
 * Modal text constants for form dialogs
 */
export const MODAL_TEXT = {
    // Add Challenge Modal
    ADD_CHALLENGE_TITLE: "Add New Challenge",
    ADD_CHALLENGE_BUTTON: "Add Challenge",

    // Edit Challenge Modal
    EDIT_CHALLENGE_TITLE: "Edit Challenge",
    EDIT_CHALLENGE_BUTTON: "Save Changes",
    TIMER_BEHAVIOR_LABEL: "When the timer ends",
    TIMER_BEHAVIOR_AUTO_FAIL_OPTION: "Fail the challenge",
    TIMER_BEHAVIOR_AUTO_COMPLETE_OPTION: "Complete the challenge",

    // Error messages
    CHALLENGE_NOT_FOUND_FOR_EDIT: "Challenge not found",
} as const;

/**
 * Admin panel section titles and labels
 */
export const ADMIN_PANEL_LABELS = {
    ADMIN_PANEL_TITLE: "Challenges Overlay Admin Panel",
    CONFIGURATION_SETTINGS: "Configuration Settings",
    AUTHENTICATION_SETTINGS: "Twitch Chat Integration Settings",
    AUTHENTICATION: "Authentication",
    BEHAVIOR_SETTINGS: "General Settings",
    CHALLENGE_ROW_STYLING: "Challenge Row Styling",
    OVERLAY_BACKGROUND: "Overlay Background",
    CONFIGURATION_ACTIONS: "Configuration Actions",
    CONFIGURATION_BACKUP_RESTORE: "Configuration Backup & Restore",
    DANGER_ZONE: "Danger Zone",
} as const;

/**
 * Admin panel feedback messages
 */
export const ADMIN_FEEDBACK_MESSAGES = {
    // Success messages
    CLEARED: "Cleared!",
    SAVED: "Saved!",
    RESET: "Reset!",
    EXPORTED: "Exported!",
    CONFIGURATION_IMPORTED: "Configuration imported successfully!",

    // Error messages
    ERROR: "Error!",
    PARTIAL_SAVE_ERROR: "Partial Save Error!",
    RESET_FAILED: "Reset Failed!",
    FAILED: "Failed!",
    NO_FILE_SELECTED: "No file selected!",
    INVALID_FILE_TYPE: "Please select a JSON file!",
    FILE_READ_ERROR: "Error reading file!",
    INVALID_JSON_FORMAT: "Invalid JSON format!",
    IMPORT_FAILED: "Import failed!",
    RESTORE_FAILED: "Failed to restore configuration!",
} as const;

/**
 * Configuration validation error messages
 */
export const VALIDATION_MESSAGES = {
    CONFIGURATION_INVALID_OBJECT: "Configuration must be a valid object!",
    MISSING_REQUIRED_PROPERTY: "Missing required property: {prop}",
    AUTH_SECTION_INVALID: "Auth section must be an object!",
    MISSING_AUTH_PROPERTY: "Missing auth property: {prop}",
    AUTH_PROPERTY_INVALID_TYPE: "Auth property {prop} must be a string",
    MAX_CHALLENGES_INVALID: "maxChallenges must be a positive number!",
    COMMANDS_SECTION_INVALID: "Commands section must be an object!",
    RESPONSES_SECTION_INVALID: "Responses section must be an object!",
    UNSUPPORTED_EXPORT_FORMAT:
        "Unsupported export format: {format}. Only JSON export is supported.",
} as const;

/**
 * Type definitions for message constant values
 */
export type UIElementValue = (typeof UI_ELEMENTS)[keyof typeof UI_ELEMENTS];
export type AriaLabelValue = (typeof ARIA_LABELS)[keyof typeof ARIA_LABELS];
export type ErrorMessageValue =
    (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
export type SuccessMessageValue =
    (typeof SUCCESS_MESSAGES)[keyof typeof SUCCESS_MESSAGES];
export type HelpMessageValue =
    (typeof HELP_MESSAGES)[keyof typeof HELP_MESSAGES];
export type StatusMessageValue =
    (typeof STATUS_MESSAGES)[keyof typeof STATUS_MESSAGES];
export type ListMessageValue =
    (typeof LIST_MESSAGES)[keyof typeof LIST_MESSAGES];
export type PermissionMessageValue =
    (typeof PERMISSION_MESSAGES)[keyof typeof PERMISSION_MESSAGES];
export type StorageMessageValue =
    (typeof STORAGE_MESSAGES)[keyof typeof STORAGE_MESSAGES];
/**
 * Console log messages for Twitch integration status
 */
export const TWITCH_INTEGRATION_MESSAGES = {
    ENABLED: "[TwitchChat] Twitch integration enabled",
    DISABLED:
        "[TwitchChat] Twitch integration disabled - no credentials configured",
    ADMIN_PANEL_AVAILABLE:
        "[TwitchChat] Admin panel is available for challenge management",
} as const;

/**
 * Console log messages for test mode
 */
export const TEST_MODE_MESSAGES = {
    ENABLED: "Test mode enabled",
} as const;

/**
 * Console log messages for command handler errors
 */
export const COMMAND_HANDLER_MESSAGES = {
    ERROR_PREFIX: "[CommandHandler] Error: ",
} as const;

/**
 * Console warning messages for AdminPanel operations
 */
export const ADMIN_PANEL_CONSOLE_MESSAGES = {
    FAILED_TO_LOAD_COLLAPSED_STATE:
        "[AdminPanel] Failed to load collapsed state:",
    FAILED_TO_SAVE_COLLAPSED_STATE:
        "[AdminPanel] Failed to save collapsed state:",
} as const;

/**
 * Console messages for configuration settings collapsible section
 */
export const CONFIG_SETTINGS_CONSOLE_MESSAGES = {
    FAILED_TO_LOAD_COLLAPSED_STATE:
        "[ConfigSettings] Failed to load collapsed state:",
    FAILED_TO_SAVE_COLLAPSED_STATE:
        "[ConfigSettings] Failed to save collapsed state:",
} as const;

/**
 * Console error messages for configuration export operations
 */
export const CONFIG_EXPORT_MESSAGES = {
    ERROR_EXPORTING_JSON: "Error exporting configuration as JSON:",
    ERROR_EXPORTING_JSON_WITH_METADATA:
        "Error exporting configuration as JSON with metadata:",
    ERROR_EXPORTING_JAVASCRIPT: "Error exporting configuration as JavaScript:",
    ERROR_DOWNLOADING_JSON: "Error downloading JSON configuration:",
    ERROR_DOWNLOADING_JAVASCRIPT: "Error downloading JavaScript configuration:",
    ERROR_COPYING_TO_CLIPBOARD: "Error copying configuration to clipboard:",
    ERROR_TRIGGERING_DOWNLOAD: "Error triggering download:",
    ERROR_FALLBACK_CLIPBOARD_COPY: "Error in fallback clipboard copy:",
    ERROR_CALCULATING_STATS: "Error calculating export stats:",
    ERROR_EXPORTING_TEMPLATE: "Error exporting configuration template:",
    ERROR_DOWNLOADING_TEMPLATE: "Error downloading configuration template:",
} as const;

/**
 * Error messages thrown during configuration export operations
 */
export const CONFIG_EXPORT_ERRORS = {
    FAILED_BACKUP_JSON: "Failed to backup configuration as JSON",
    FAILED_BACKUP_JSON_WITH_METADATA:
        "Failed to backup configuration as JSON with metadata",
    FAILED_BACKUP_JAVASCRIPT: "Failed to backup configuration as JavaScript",
    FAILED_BACKUP_TEMPLATE: "Failed to backup configuration template",
} as const;

/**
 * Validation error messages for configuration export
 */
export const CONFIG_VALIDATION_ERRORS = {
    CONFIG_NULL_OR_UNDEFINED: "Configuration object is null or undefined",
    MISSING_AUTH_CONFIG: "Missing authentication configuration",
    OAUTH_TOKEN_MUST_BE_STRING: "Twitch OAuth token must be a string",
    USERNAME_MUST_BE_STRING: "Twitch username must be a string",
    CHANNEL_MUST_BE_STRING: "Twitch channel must be a string",
    MISSING_COMMANDS_CONFIG: "Missing commands configuration",
    MISSING_RESPONSES_CONFIG: "Missing responses configuration",
    CIRCULAR_REFERENCES:
        "Configuration contains circular references or non-serializable data",
} as const;

/**
 * Template strings for configuration export file headers
 */
export const CONFIG_EXPORT_TEMPLATES = {
    JAVASCRIPT_HEADER_LINE_1: "// ========================================",
    JAVASCRIPT_HEADER_LINE_2: "// Twitch Challenge Overlay Configuration",
    JAVASCRIPT_HEADER_LINE_3: "// ========================================",
    JAVASCRIPT_HEADER_GENERATED: "// Generated on: ",
    JAVASCRIPT_HEADER_DESCRIPTION_LINE_1:
        "// This file contains the complete configuration for the",
    JAVASCRIPT_HEADER_DESCRIPTION_LINE_2:
        "// Twitch Challenge Overlay. Import this configuration via",
    JAVASCRIPT_HEADER_DESCRIPTION_LINE_3:
        "// the admin panel's 'Restore Configuration' feature.",
    JAVASCRIPT_CONFIG_DECLARATION: "/** @type {Config} */",
    JAVASCRIPT_CONFIG_VARIABLE: "const _config = ",

    TEMPLATE_HEADER_LINE_1: "// ========================================",
    TEMPLATE_HEADER_LINE_2:
        "// Twitch Challenge Overlay Configuration Template",
    TEMPLATE_HEADER_LINE_3: "// ========================================",
    TEMPLATE_HEADER_GENERATED: "// Generated on: ",
    TEMPLATE_HEADER_DESCRIPTION_LINE_1:
        "// This is a template file with placeholder values.",
    TEMPLATE_HEADER_DESCRIPTION_LINE_2:
        "// Replace the placeholder values with your actual settings.",
} as const;

export type ModalTextValue = (typeof MODAL_TEXT)[keyof typeof MODAL_TEXT];
export type AdminPanelLabelValue =
    (typeof ADMIN_PANEL_LABELS)[keyof typeof ADMIN_PANEL_LABELS];
export type AdminFeedbackMessageValue =
    (typeof ADMIN_FEEDBACK_MESSAGES)[keyof typeof ADMIN_FEEDBACK_MESSAGES];
export type ValidationMessageValue =
    (typeof VALIDATION_MESSAGES)[keyof typeof VALIDATION_MESSAGES];
export type WarningMessageValue =
    (typeof WARNING_MESSAGES)[keyof typeof WARNING_MESSAGES];
export type TwitchIntegrationMessageValue =
    (typeof TWITCH_INTEGRATION_MESSAGES)[keyof typeof TWITCH_INTEGRATION_MESSAGES];
export type TestModeMessageValue =
    (typeof TEST_MODE_MESSAGES)[keyof typeof TEST_MODE_MESSAGES];
export type CommandHandlerMessageValue =
    (typeof COMMAND_HANDLER_MESSAGES)[keyof typeof COMMAND_HANDLER_MESSAGES];
export type AdminPanelConsoleMessageValue =
    (typeof ADMIN_PANEL_CONSOLE_MESSAGES)[keyof typeof ADMIN_PANEL_CONSOLE_MESSAGES];
export type ConfigSettingsConsoleMessageValue =
    (typeof CONFIG_SETTINGS_CONSOLE_MESSAGES)[keyof typeof CONFIG_SETTINGS_CONSOLE_MESSAGES];
export type ConfigExportMessageValue =
    (typeof CONFIG_EXPORT_MESSAGES)[keyof typeof CONFIG_EXPORT_MESSAGES];
export type ConfigExportErrorValue =
    (typeof CONFIG_EXPORT_ERRORS)[keyof typeof CONFIG_EXPORT_ERRORS];
export type ConfigValidationErrorValue =
    (typeof CONFIG_VALIDATION_ERRORS)[keyof typeof CONFIG_VALIDATION_ERRORS];
export type ConfigExportTemplateValue =
    (typeof CONFIG_EXPORT_TEMPLATES)[keyof typeof CONFIG_EXPORT_TEMPLATES];
