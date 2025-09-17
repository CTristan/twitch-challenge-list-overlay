/**
 * Centralized command type system for the Twitch Challenge List Overlay
 * Provides type-safe command constants and aliasing functionality
 *
 * Permission Model: ALL commands require moderator or broadcaster permissions.
 * No commands are available to regular viewers.
 */

/**
 * Core command types - these are the canonical command identifiers
 */
export const CommandType = {
    // Challenge management commands
    ADD: "add",
    EDIT: "edit",
    DONE: "done",
    UNDONE: "undone",
    FAIL: "fail",
    DELETE: "delete",

    // Progress commands
    INCREMENT: "+",
    DECREMENT: "-",
    SET: "set",

    // Information commands
    LIST: "list",
    SHOW: "show",
    CHECK: "check",
    HELP: "help",

    // Admin commands
    CLEAR_ALL: "clearall",
    CLEAR_DONE: "cleardone",
} as const;

/**
 * Type for command type values
 */
export type CommandTypeValue = (typeof CommandType)[keyof typeof CommandType];

/**
 * Command aliases mapping - maps alternative command strings to canonical command types
 */
export const CommandAliases: Record<string, CommandTypeValue> = {
    // Primary command names
    add: CommandType.ADD,
    edit: CommandType.EDIT,
    done: CommandType.DONE,
    undone: CommandType.UNDONE,
    fail: CommandType.FAIL,
    delete: CommandType.DELETE,
    "+": CommandType.INCREMENT,
    "-": CommandType.DECREMENT,
    set: CommandType.SET,
    list: CommandType.LIST,
    show: CommandType.SHOW,
    check: CommandType.CHECK,
    help: CommandType.HELP,
    clearall: CommandType.CLEAR_ALL,
    cleardone: CommandType.CLEAR_DONE,

    // Alternative aliases
    del: CommandType.DELETE,
    remove: CommandType.DELETE,
    complete: CommandType.DONE,
    finish: CommandType.DONE,
    revert: CommandType.UNDONE,
    uncomplete: CommandType.UNDONE,
    undo: CommandType.UNDONE,
    inc: CommandType.INCREMENT,
    dec: CommandType.DECREMENT,
    clearlist: CommandType.CLEAR_ALL,
    clear: CommandType.CLEAR_ALL,
    ls: CommandType.LIST,
    status: CommandType.CHECK,
    info: CommandType.SHOW,
    display: CommandType.SHOW,
};

/**
 * Normalize a command string to its canonical command type
 * @param command - Raw command string (e.g., "del", "delete", "remove")
 * @returns Canonical command type or null if not found
 */
export function normalizeCommand(command: string): CommandTypeValue | null {
    const normalized = command.toLowerCase().trim();
    return CommandAliases[normalized] || null;
}

/**
 * Check if a command string is valid
 * @param command - Command string to validate
 * @returns True if the command is recognized
 */
export function isValidCommand(command: string): boolean {
    return normalizeCommand(command) !== null;
}

/**
 * Get all aliases for a given command type
 * @param commandType - Canonical command type
 * @returns Array of all aliases for this command
 */
export function getCommandAliases(commandType: CommandTypeValue): string[] {
    return Object.entries(CommandAliases)
        .filter(([_, type]) => type === commandType)
        .map(([alias, _]) => alias);
}

/**
 * Commands that require a target ID parameter
 */
export const TARGET_ID_COMMANDS: Set<CommandTypeValue> = new Set([
    CommandType.EDIT,
    CommandType.DONE,
    CommandType.UNDONE,
    CommandType.FAIL,
    CommandType.DELETE,
    CommandType.INCREMENT,
    CommandType.DECREMENT,
    CommandType.SET,
    CommandType.SHOW,
]);
