// ========================================
// CORE CONFIGURATION TYPES
// ========================================

/**
 * Authentication configuration for Twitch IRC connection
 */
interface TwitchAuthConfig {
    /** OAuth token for Twitch IRC authentication */
    twitch_oauth: string;
    /** Bot username for Twitch IRC connection */
    twitch_username: string;
    /** Target Twitch channel to connect to */
    twitch_channel: string;
}

/**
 * Chat command configuration mapping command types to their aliases
 * Each command type can have multiple string aliases that users can type
 */
interface ChatCommandsConfig {
    // Admin commands (moderator/broadcaster only)
    /** Commands to clear all challenges */
    clearAll: string[];
    /** Commands to clear completed challenges */
    clearDone: string[];

    // Challenge management commands (moderator/broadcaster only)
    /** Commands to add new challenges */
    addChallenge: string[];
    /** Commands to edit existing challenges */
    editChallenge: string[];
    /** Commands to mark challenges as complete */
    finishChallenge: string[];
    /** Commands to delete challenges */
    deleteChallenge: string[];

    // Progress commands (moderator/broadcaster only)
    /** Commands to increment challenge progress */
    incrementChallenge: string[];
    /** Commands to decrement challenge progress */
    decrementChallenge: string[];
    /** Commands to set absolute progress value */
    setProgress: string[];
    /** Commands to mark challenges as failed */
    failChallenge: string[];

    // Information commands (moderator/broadcaster only)
    /** Commands to list active challenges */
    listChallenges: string[];
    /** Commands to show detailed challenge information */
    showChallenge: string[];
    /** Commands to check current challenges (legacy format) */
    check: string[];
    /** Commands to show help information */
    help: string[];
}

/**
 * Bot response message templates with placeholder support
 * Supports {message}, {user}, and other dynamic placeholders
 */
interface BotResponsesConfig {
    // Admin responses
    /** Message when all challenges are cleared */
    clearAll: string;
    /** Message when completed challenges are cleared */
    clearDone: string;

    // User responses
    /** Message when challenge(s) are added */
    addChallenge: string;
    /** Message when challenge is edited */
    editChallenge: string;
    /** Message when challenge(s) are completed */
    finishChallenge: string;
    /** Message when challenge(s) are deleted */
    deleteChallenge: string;
    /** Message when all user challenges are deleted */
    deleteAll: string;
    /** Message when checking current challenges */
    check: string;
    /** Help message listing available commands */
    help: string;
    /** Message when maximum challenges limit is reached */
    maxChallengesAdded: string;
    /** Message when requested challenge is not found */
    noChallengeFound: string;
    /** Message for invalid/unrecognized commands */
    invalidCommand: string;
}

/**
 * Color tier configuration for the admin panel UI
 * Represents a single color tier (primary, secondary, tertiary) with enable/disable state
 */
interface ColorTierConfig {
    /** Whether this color tier is enabled */
    enabled: boolean;
    /** Background color for this tier */
    backgroundColor: string;
    /** Text color for this tier */
    textColor: string;
}

/**
 * Complete color configuration UI structure
 * Used by the admin panel for managing challenge row colors
 */
interface ColorConfigurationUI {
    /** Primary color tier configuration */
    primary: ColorTierConfig;
    /** Secondary color tier configuration */
    secondary: ColorTierConfig;
    /** Tertiary color tier configuration */
    tertiary: ColorTierConfig;
}

/**
 * Main application configuration interface
 * Contains all user-configurable settings for the Twitch Challenge Overlay
 */
interface Config {
    /** Twitch chat integration settings */
    auth: TwitchAuthConfig;

    /** Maximum number of challenges that can be active simultaneously */
    maxChallenges: number;

    /** Optional array of background colors for challenge rows (supports 1-3 colors for cycling) */
    challengeRowColors?: string[];

    /** Optional array of text colors for challenge rows (should match challengeRowColors length) */
    challengeRowTextColors?: string[];

    /** Opacity for challenge row colors when Color Configuration is enabled (0-1, default: 1.0) */
    challengeRowColorsOpacity?: number;

    /** Overlay background color for the main container behind all challenges (default: rgba(100, 100, 100, 0.6)) */
    overlayBackgroundColor?: string;

    /** Overlay background opacity for the main container (0-1, default: 0.6) */
    overlayBackgroundOpacity?: number;

    /** Global background color for challenge containers (overridden by challengeRowColors if set) */
    challengeBackgroundColor?: string;

    /** Global background opacity for challenge containers (0-1, default: 0.7) */
    challengeBackgroundOpacity?: number;

    /** Global text color override for challenges (when not using automatic adjustment) */
    challengeTextColor?: string;

    /** Enable automatic text color adjustment based on background brightness (default: true) */
    challengeAutoTextColor?: boolean;

    /** Enable text shadow/outline for enhanced readability (default: true) */
    challengeTextShadow?: boolean;

    /** App container background opacity (0-1, default: 0.0 for fully transparent) */
    appBackgroundOpacity?: number;

    /** Chat command configuration mapping command types to user-typed aliases */
    commands: ChatCommandsConfig;

    /** Bot response message templates with placeholder support */
    responses: BotResponsesConfig;
}

// ========================================
// TWITCH CHAT & COMMAND TYPES
// ========================================

/**
 * User permission flags from Twitch IRC
 */
interface TwitchUserFlags {
    /** True if user is the channel broadcaster */
    broadcaster: boolean;
    /** True if user is a channel moderator */
    mod: boolean;
}

/**
 * Additional metadata from Twitch IRC messages
 */
interface TwitchMessageExtra {
    /** User's chat color in hex format */
    userColor: string;
    /** Unique message ID for potential replies */
    messageId: string;
}

/**
 * Parsed command data from Twitch IRC chat
 * Represents a complete command message with user context and permissions
 */
interface CommandData {
    /** Username of the command sender */
    user: string;
    /** Command name (without ! prefix) */
    command: string;
    /** Command parameters/arguments */
    message: string;
    /** User permission flags */
    flags: TwitchUserFlags;
    /** Additional message metadata */
    extra: TwitchMessageExtra;
}

// ========================================
// CHALLENGE SYSTEM TYPES
// ========================================

/**
 * Timer configuration for timed challenges
 * Supports active/paused states and precise timing
 */
interface ChallengeTimer {
    /** Total duration in seconds */
    duration: number;
    /** Timestamp when timer was started */
    startTime: number;
    /** Timestamp when timer should end */
    endTime: number;
    /** Whether timer is currently running */
    isActive: boolean;
    /** Whether timer is paused */
    isPaused: boolean;
    /** Timestamp when timer was paused (0 if not paused) */
    pausedTime: number;
}

/**
 * Complete challenge data structure
 * Supports enhanced features like progress tracking, timers, and dual ID system
 */
interface EnhancedChallengeData {
    /** Main challenge title */
    title: string;
    /** Optional detailed description */
    description?: string;
    /** Target amount/quantity (default: 1) */
    amount: number;
    /** Current progress towards amount (default: 0) */
    progress: number;
    /** Optional timer configuration */
    timer?: ChallengeTimer;
    /** Whether challenge is marked as complete */
    completionStatus: boolean;
    /** Whether challenge has failed */
    failureStatus: boolean;
    /** Unique long-form identifier (timestamp-based) */
    id: string;
    /** Short base36 ID for user-friendly display (#A, #1Z, etc.) */
    shortId: string;
    /** Creation timestamp */
    createdAt: number;
}

// ========================================
// COMMAND PARSING & PROCESSING TYPES
// ========================================

/**
 * Parsed command parameters with support for both full names and aliases
 * Supports key=value syntax: !ch add title="Challenge" desc="Description" amount=5
 */
interface ParsedCommandParameters {
    // Full parameter names
    /** Challenge title */
    title?: string;
    /** Challenge description (full name) */
    desc?: string;
    /** Challenge description (alias) */
    description?: string;
    /** Target amount/quantity */
    amount?: string;
    /** Timer duration */
    timer?: string;

    // Short aliases for common parameters
    /** Timer duration (short alias) */
    tm?: string;
    /** Title (short alias) */
    t?: string;
    /** Description (short alias) */
    d?: string;
    /** Amount (short alias) */
    a?: string;

    /** Allow any additional string parameters */
    [key: string]: string | undefined;
}

/**
 * Fully parsed command with validation results
 * Represents a command after parsing and initial validation
 */
interface ParsedCommand {
    /** Primary command name (e.g., "add", "edit", "done") */
    command: string;
    /** Optional sub-command for complex commands */
    subCommand?: string;
    /** Parsed key=value parameters */
    parameters: ParsedCommandParameters;
    /** Raw unparsed parameter string */
    rawParameters: string;
    /** Target challenge ID for commands that operate on specific challenges */
    targetId?: string;
    /** Array of parsing errors */
    errors: string[];
    /** Whether the command parsed successfully */
    isValid: boolean;
}

/**
 * Generic validation result with detailed feedback
 * Used for validating commands, configurations, and other data
 */
interface ValidationResult {
    /** Whether validation passed */
    isValid: boolean;
    /** Array of error messages */
    errors: string[];
    /** Array of warning messages */
    warnings: string[];
}

// ========================================
// EXTERNAL LIBRARY TYPES
// ========================================

/**
 * Configuration for WebFont loader (Google Fonts CDN)
 * Used for loading custom fonts dynamically
 */
interface WebFontConfig {
    /** Google Fonts configuration */
    google?: {
        /** Array of font family names to load */
        families: string[];
    };
    /** Custom font configuration */
    custom?: {
        /** Array of custom font family names */
        families: string[];
        /** Array of CSS URLs containing the fonts */
        urls: string[];
    };
    /** Callback when all fonts are loaded */
    active?: () => void;
    /** Callback when font loading fails */
    inactive?: () => void;
    /** Callback when font loading starts */
    loading?: () => void;
    /** Callback when a specific font becomes active */
    fontactive?: (familyName: string, fvd: string) => void;
    /** Callback when a specific font fails to load */
    fontinactive?: (familyName: string, fvd: string) => void;
    /** Callback when a specific font starts loading */
    fontloading?: (familyName: string, fvd: string) => void;
    /** Callback when a specific font loading times out */
    fontloadingtimeout?: (familyName: string, fvd: string) => void;
}

/**
 * WebFont loader interface
 * Provides dynamic font loading capabilities
 */
interface WebFont {
    /** Load fonts with the specified configuration */
    load: (config: WebFontConfig) => void;
}

/**
 * Window interface extension for WebFont loader
 * Makes WebFont available globally
 */
interface Window {
    /** WebFont loader instance */
    WebFont: WebFont;
}

// ========================================
// CONFIGURATION MANAGEMENT TYPES
// ========================================

/**
 * Result of configuration validation
 * Used when importing or validating configuration files
 */
interface ConfigValidationResult {
    /** Whether the configuration is valid */
    valid: boolean;
    /** Array of validation error messages */
    errors: string[];
}

/**
 * Statistics about exported configuration
 * Provides metadata about the configuration export
 */
interface ConfigExportStats {
    /** Number of command types configured */
    totalCommands: number;
    /** Number of response messages configured */
    totalResponses: number;
    /** Approximate size of configuration in bytes */
    configSize: number;
    /** Whether custom challenge row colors are configured */
    hasCustomColors: boolean;
}

/**
 * Event handlers for configuration changes
 * Used by ConfigManager to notify listeners of configuration updates
 */
interface ConfigManagerEvents {
    /** Called when a specific configuration value changes */
    configChanged: (path: string, newValue: any, oldValue: any) => void;
    /** Called when configuration is reset to defaults */
    configReset: () => void;
    /** Called when configuration is imported from external source */
    configImported: (config: Config) => void;
    /** Called when configuration is exported */
    configExported: (format: string) => void;
}

/**
 * Configuration with additional metadata for storage
 * Extends base Config with versioning and timestamp information
 */
interface StoredConfig extends Config {
    /** Configuration version for migration compatibility */
    _version?: string;
    /** Timestamp when configuration was last saved */
    _timestamp?: number;
}

/**
 * Configuration Manager interface
 * Defines the contract for configuration management operations
 */
interface IConfigManager {
    /** Get a configuration value by dot-notation path */
    get(path: string): any;
    /** Set a configuration value by dot-notation path */
    set(path: string, value: any): boolean;
    /** Get the complete configuration object */
    getAll(): Config;
    /** Replace the entire configuration */
    setAll(newConfig: Config): boolean;
    /** Reset configuration to default values */
    reset(): boolean;
    /** Export configuration for backup */
    export(): Config;
    /** Import configuration from external source */
    import(importedConfig: Config): boolean;
    /** Clear all stored configuration data */
    clearStorage(): boolean;
    /** Check if localStorage is available */
    isStorageAvailable(): boolean;
}

/**
 * Configuration Exporter interface
 * Defines the contract for configuration export/import operations
 */
interface IConfigExporter {
    /** Export configuration as JSON string */
    exportAsJSON(): string;
    /** Export configuration as JavaScript code */
    exportAsJavaScript(): string;
    /** Download configuration as JSON file */
    downloadAsJSON(filename?: string): boolean;
    /** Download configuration as JavaScript file */
    downloadAsJavaScript(filename?: string): boolean;
    /** Copy configuration to clipboard */
    copyToClipboard(): Promise<boolean>;
    /** Validate configuration before export */
    validateForExport(): ConfigValidationResult;
    /** Get statistics about the configuration */
    getExportStats(): ConfigExportStats;
    /** Create sanitized configuration for export */
    createSanitizedExport(): Config;
    /** Export configuration as template */
    exportAsTemplate(): string;
    /** Download configuration template file */
    downloadTemplate(filename?: string): boolean;
}

// ========================================
// GLOBAL DECLARATIONS
// ========================================

/**
 * Global configuration object loaded via script tag in index.html
 * Contains all user-configurable settings for the application
 */
declare const _config: Config;
