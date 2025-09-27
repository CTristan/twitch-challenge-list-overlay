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
        "Available commands: !ch add, !ch edit, !ch done, !ch undone, !ch delete, !ch list, !ch check, !ch clearall, !ch cleardone, !ch help",

    // Guidance messages
    USE_ADD_COMMAND: "Use !ch add to create your first challenge!",
    NO_CHALLENGES_USE_ADD:
        "No challenges found. Use !ch add to create your first challenge!",

    // Command-specific help
    ADD_COMMAND_HELP:
        '!ch add title="Challenge Name" desc="Description" amount=5 timer=10m - Add a new challenge with optional parameters',
    EDIT_COMMAND_HELP:
        '!ch edit 1 title="New Title" desc="New Description" amount=10 - Edit challenge properties',
    DONE_COMMAND_HELP:
        "!ch done 1,2,3 - Mark challenges as completed (supports multiple IDs)",
    FAIL_COMMAND_HELP:
        "!ch fail 1,2,3 - Mark challenges as failed (supports multiple IDs)",
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
    CHECK_COMMAND_HELP: "!ch check - Show challenge statistics and summary",
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
 * Type definitions for message constant values
 */
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
