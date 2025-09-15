interface AuthConfig {
  twitch_oauth: string;
  twitch_channel: string;
  twitch_username: string;
}

// Color configuration interfaces for the new UI
interface ColorTierConfig {
  enabled: boolean;
  backgroundColor: string;
  textColor: string;
}

interface ColorConfigurationUI {
  primary: ColorTierConfig;
  secondary: ColorTierConfig;
  tertiary: ColorTierConfig;
}

interface Config {
  // Authentication settings
  auth: {
    twitch_oauth: string;
    twitch_username: string;
    twitch_channel: string;
  };

  // Basic behavior settings
  maxChallenges: number;

  // Challenge row colors configuration
  challengeRowColors?: string[];

  // Challenge row text colors configuration
  challengeRowTextColors?: string[];

  // Chat commands configuration
  commands: {
    // Admin commands
    clearList: string[];
    clearDone: string[];
    clearUser: string[];

    // Legacy user commands
    addChallenge: string[];
    editChallenge: string[];
    finishChallenge: string[];
    deleteChallenge: string[];
    check: string[];
    help: string[];

    // Enhanced command system
    enhancedAdd?: string[];
    enhancedIncrement?: string[];
    enhancedDecrement?: string[];
    enhancedSet?: string[];
    enhancedEdit?: string[];
    enhancedComplete?: string[];
    enhancedFail?: string[];
    enhancedDelete?: string[];
    enhancedList?: string[];
    enhancedShow?: string[];
    enhancedHelp?: string[];
  };

  // Bot response messages
  responses: {
    // Admin responses
    clearList: string;
    clearDone: string;
    clearUser: string;

    // User responses
    addChallenge: string;
    editChallenge: string;
    finishChallenge: string;
    deleteChallenge: string;
    deleteAll: string;
    check: string;
    help: string;
    maxChallengesAdded: string;
    noChallengeFound: string;
    invalidCommand: string;
  };
}

interface CommandData {
  user: string;
  command: string;
  message: string;
  flags: {
    broadcaster: boolean;
    mod: boolean;
  };
  extra: {
    userColor: string;
    messageId: string;
  };
}

// Enhanced Challenge System Types
interface ChallengeTimer {
  duration: number; // Duration in seconds
  startTime: number; // Timestamp when timer started
  endTime: number; // Timestamp when timer should end
  isActive: boolean; // Whether timer is currently running
  isPaused: boolean; // Whether timer is paused
}

interface EnhancedChallengeData {
  title: string; // Main challenge title
  description?: string; // Optional detailed description
  amount: number; // Target amount/quantity (default: 1)
  progress: number; // Current progress (default: 0)
  timer?: ChallengeTimer; // Optional timer configuration
  completionStatus: boolean; // Whether challenge is complete
  failureStatus: boolean; // Whether challenge has failed
  id: string; // Unique identifier
  shortId: string; // Short base36 ID for display
  createdAt: number; // Creation timestamp
}

// Command Parser Types
interface ParsedCommandParameters {
  title?: string;
  desc?: string;
  description?: string;
  amount?: string;
  timer?: string;
  tm?: string;
  t?: string;
  d?: string;
  a?: string;
  [key: string]: string | undefined;
}

interface ParsedCommand {
  command: string;
  subCommand?: string; // For commands like "!ch add", "!ch +"
  parameters: ParsedCommandParameters;
  rawParameters: string;
  targetId?: string; // For commands targeting specific challenges
  errors: string[];
  isValid: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface CommandResponse {
  message: string;
  error: boolean;
  challengeId?: string;
  action?: string;
}

// WebFont Loader types (loaded from Google CDN)
interface WebFontConfig {
  google?: {
    families: string[];
  };
  custom?: {
    families: string[];
    urls: string[];
  };
  active?: () => void;
  inactive?: () => void;
  loading?: () => void;
  fontactive?: (familyName: string, fvd: string) => void;
  fontinactive?: (familyName: string, fvd: string) => void;
  fontloading?: (familyName: string, fvd: string) => void;
  fontloadingtimeout?: (familyName: string, fvd: string) => void;
}

interface WebFont {
  load: (config: WebFontConfig) => void;
}

// Extend Window interface to include WebFont
interface Window {
  WebFont: WebFont;
}

// Configuration Management Types
interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
}

interface ConfigExportStats {
  totalCommands: number;
  totalResponses: number;
  configSize: number;
  hasCustomColors: boolean;
}

interface ConfigManagerEvents {
  configChanged: (path: string, newValue: any, oldValue: any) => void;
  configReset: () => void;
  configImported: (config: Config) => void;
  configExported: (format: string) => void;
}

interface StoredConfig extends Config {
  _version?: string;
  _timestamp?: number;
}

// Configuration Manager Interface
interface IConfigManager {
  get(path: string): any;
  set(path: string, value: any): boolean;
  getAll(): Config;
  setAll(newConfig: Config): boolean;
  reset(): boolean;
  export(): Config;
  import(importedConfig: Config): boolean;
  clearStorage(): boolean;
  isStorageAvailable(): boolean;
}

// Configuration Exporter Interface
interface IConfigExporter {
  exportAsJSON(): string;
  exportAsJavaScript(): string;
  downloadAsJSON(filename?: string): boolean;
  downloadAsJavaScript(filename?: string): boolean;
  copyToClipboard(): Promise<boolean>;
  validateForExport(): ConfigValidationResult;
  getExportStats(): ConfigExportStats;
  createSanitizedExport(): Config;
  exportAsTemplate(): string;
  downloadTemplate(filename?: string): boolean;
}

// Global variables loaded via script tags in index.html
declare const _config: Config;
