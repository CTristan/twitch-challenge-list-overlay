/**
 * @class ErrorHandler
 * Centralized error handling and fallback mechanisms for the configuration system
 */
export class ErrorHandler {
  private static instance: ErrorHandler | null = null;
  private errorLog: Array<{ timestamp: Date; error: string; context: string }> =
    [];
  private maxLogEntries = 100;

  /**
   * Get singleton instance
   * @returns ErrorHandler instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle localStorage errors with fallback strategies
   * @param error - The error that occurred
   * @param operation - The operation that failed
   * @returns Fallback strategy result
   */
  public handleStorageError(
    error: Error,
    operation: string
  ): {
    canFallback: boolean;
    fallbackStrategy: string;
    message: string;
  } {
    this.logError(error.message, `localStorage.${operation}`);

    // Check if localStorage is completely unavailable
    if (!this.isStorageAvailable()) {
      return {
        canFallback: true,
        fallbackStrategy: "memory-only",
        message:
          "localStorage unavailable, using in-memory storage only. Settings will not persist between sessions.",
      };
    }

    // Check if quota is exceeded
    if (
      error.message.includes("QuotaExceededError") ||
      error.message.includes("quota")
    ) {
      return {
        canFallback: true,
        fallbackStrategy: "cleanup-and-retry",
        message:
          "Storage quota exceeded. Attempting to clean up old data and retry.",
      };
    }

    // Check for permission/security errors
    if (
      error.message.includes("SecurityError") ||
      error.message.includes("access")
    ) {
      return {
        canFallback: true,
        fallbackStrategy: "memory-only",
        message: "Storage access denied. Using in-memory storage only.",
      };
    }

    return {
      canFallback: false,
      fallbackStrategy: "none",
      message: `Storage operation failed: ${error.message}`,
    };
  }

  /**
   * Handle configuration validation errors
   * @param config - The invalid configuration
   * @param errors - Array of validation errors
   * @returns Sanitized configuration or null
   */
  public handleConfigValidationError(
    config: any,
    errors: string[]
  ): Config | null {
    this.logError(
      `Configuration validation failed: ${errors.join(", ")}`,
      "config-validation"
    );

    try {
      // Attempt to sanitize the configuration
      const sanitized = this.sanitizeConfiguration(config);
      if (sanitized) {
        console.warn(
          "Configuration was sanitized due to validation errors:",
          errors
        );
        return sanitized;
      }
    } catch (sanitizeError) {
      this.logError(
        `Configuration sanitization failed: ${sanitizeError}`,
        "config-sanitization"
      );
    }

    return null;
  }

  /**
   * Handle export functionality errors with fallbacks
   * @param error - The export error
   * @param format - The export format that failed
   * @param config - The configuration to export
   * @returns Fallback export result
   */
  public handleExportError(
    error: Error,
    format: string,
    config: Config
  ): {
    success: boolean;
    fallbackUsed: string | null;
    message: string;
  } {
    this.logError(error.message, `export.${format}`);

    // Try clipboard fallback for download failures
    if (error.message.includes("download") || error.message.includes("blob")) {
      try {
        const content = JSON.stringify(config, null, 2);
        this.copyToClipboardFallback(content);
        return {
          success: true,
          fallbackUsed: "clipboard",
          message:
            "Download failed, configuration copied to clipboard instead.",
        };
      } catch (clipboardError) {
        this.logError(
          `Clipboard fallback failed: ${clipboardError}`,
          "export.clipboard"
        );
      }
    }

    // Try console output fallback
    try {
      console.log(
        "Configuration export (copy from console):",
        JSON.stringify(config, null, 2)
      );
      return {
        success: true,
        fallbackUsed: "console",
        message:
          "Export failed, configuration printed to console. Check browser developer tools.",
      };
    } catch (consoleError) {
      this.logError(
        `Console fallback failed: ${consoleError}`,
        "export.console"
      );
    }

    return {
      success: false,
      fallbackUsed: null,
      message: `Export failed and no fallback available: ${error.message}`,
    };
  }

  /**
   * Check if localStorage is available
   * @returns Availability status
   */
  private isStorageAvailable(): boolean {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Attempt to sanitize invalid configuration
   * @param config - Invalid configuration
   * @returns Sanitized configuration or null
   */
  private sanitizeConfiguration(config: any): Config | null {
    if (!config || typeof config !== "object") {
      return null;
    }

    const sanitized: any = {};

    // Sanitize auth section
    if (config.auth && typeof config.auth === "object") {
      sanitized.auth = {
        twitch_oauth:
          typeof config.auth.twitch_oauth === "string"
            ? config.auth.twitch_oauth
            : "",
        twitch_username:
          typeof config.auth.twitch_username === "string"
            ? config.auth.twitch_username
            : "",
        twitch_channel:
          typeof config.auth.twitch_channel === "string"
            ? config.auth.twitch_channel
            : "",
      };
    } else {
      sanitized.auth = {
        twitch_oauth: "",
        twitch_username: "",
        twitch_channel: "",
      };
    }

    // Sanitize maxChallenges
    sanitized.maxChallenges =
      typeof config.maxChallenges === "number" && config.maxChallenges > 0
        ? config.maxChallenges
        : 10;

    // Sanitize challengeRowColors
    if (Array.isArray(config.challengeRowColors)) {
      sanitized.challengeRowColors = config.challengeRowColors.filter(
        (color: any) => typeof color === "string" && color.trim().length > 0
      );
    } else {
      sanitized.challengeRowColors = [];
    }

    // Sanitize commands (use defaults if invalid)
    if (config.commands && typeof config.commands === "object") {
      sanitized.commands = config.commands;
    } else {
      sanitized.commands = {
        clearList: ["!clearlist"],
        clearDone: ["!cleardone"],
        clearUser: ["!clearuser"],
        addChallenge: ["!challenge", "!add"],
        editChallenge: ["!edit"],
        finishChallenge: ["!done"],
        deleteChallenge: ["!delete"],
        check: ["!check"],
        help: ["!help"],
      };
    }

    // Sanitize responses (use defaults if invalid)
    if (config.responses && typeof config.responses === "object") {
      sanitized.responses = config.responses;
    } else {
      sanitized.responses = {
        clearList: "All challenges have been cleared",
        clearDone: "All done challenges have been cleared",
        clearUser: "All challenges for {message} have been cleared",
        addChallenge: "Challenge(s) {message} added!",
        editChallenge: "Challenge {message} updated!",
        finishChallenge: "Good job on completing challenge(s) {message}!",
        deleteChallenge: "Challenge(s) {message} has been deleted!",
        deleteAll: "All of your challenges have been deleted!",
        check: "Your current challenge(s) are: {message}",
        help: "Try these commands - !challenge !edit !done !delete !check",
        maxChallengesAdded:
          "Maximum number of challenges reached, try deleting old challenges.",
        noChallengeFound:
          "That challenge doesn't seem to exist, try adding one!",
        invalidCommand: "Invalid command: {message}. Try !help",
      };
    }

    return sanitized as Config;
  }

  /**
   * Fallback clipboard copy method
   * @param content - Content to copy
   * @returns Success status
   */
  private copyToClipboardFallback(content: string): boolean {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";

      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999);

      const success = document.execCommand("copy");
      document.body.removeChild(textarea);

      return success;
    } catch {
      return false;
    }
  }

  /**
   * Log error with context
   * @param error - Error message
   * @param context - Context where error occurred
   */
  private logError(error: string, context: string): void {
    const entry = {
      timestamp: new Date(),
      error,
      context,
    };

    this.errorLog.push(entry);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog.shift();
    }

    // Log to console for debugging
    console.error(`[${context}] ${error}`);
  }

  /**
   * Get error log for debugging
   * @returns Array of error log entries
   */
  public getErrorLog(): Array<{
    timestamp: Date;
    error: string;
    context: string;
  }> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get system health status
   * @returns Health status information
   */
  public getSystemHealth(): {
    storageAvailable: boolean;
    recentErrors: number;
    criticalErrors: string[];
  } {
    const recentErrors = this.errorLog.filter(
      (entry) => Date.now() - entry.timestamp.getTime() < 300000 // Last 5 minutes
    );

    const criticalErrors = recentErrors
      .filter(
        (entry) =>
          entry.context.includes("storage") ||
          entry.context.includes("config-validation")
      )
      .map((entry) => entry.error);

    return {
      storageAvailable: this.isStorageAvailable(),
      recentErrors: recentErrors.length,
      criticalErrors,
    };
  }
}
