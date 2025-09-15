import { ErrorHandler } from "../utils/errorHandler";

/**
 * @class ConfigExporter
 * Handles exporting configuration data in various formats with download functionality
 * optimized for OBS Browser Source environments.
 */
export default class ConfigExporter {
  private config: Config;
  private errorHandler: ErrorHandler;

  /**
   * @constructor
   * @param config - Configuration object to export
   */
  constructor(config: Config) {
    this.config = config;
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Backup configuration as JSON format
   * @returns JSON string representation of configuration
   */
  public exportAsJSON(): string {
    try {
      return JSON.stringify(this.config, null, 2);
    } catch (error) {
      console.error("Error exporting configuration as JSON:", error);
      throw new Error("Failed to backup configuration as JSON");
    }
  }

  /**
   * Backup configuration as JSON with metadata for backup/restore
   * @returns JSON string with metadata
   */
  public exportAsJSONWithMetadata(): string {
    try {
      const exportData = {
        _metadata: {
          exportedAt: new Date().toISOString(),
          version: "1.0.0",
          source: "Twitch Challenge Overlay Admin Panel",
          description: "Configuration backup for Twitch Challenge Overlay",
        },
        config: this.config,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error(
        "Error exporting configuration as JSON with metadata:",
        error
      );
      throw new Error("Failed to backup configuration as JSON with metadata");
    }
  }

  /**
   * Backup configuration as JavaScript file format
   * @returns JavaScript file content as string
   */
  public exportAsJavaScript(): string {
    try {
      const timestamp = new Date().toISOString();
      const configJSON = JSON.stringify(this.config, null, 2);

      return `// ========================================
// Twitch Challenge Overlay Configuration
// ========================================
// Generated on: ${timestamp}
// This file contains the complete configuration for the
// Twitch Challenge Overlay. It can be used as a drop-in
// replacement for the original _config.js file.

/** @type {Config} */
const _config = ${configJSON};`;
    } catch (error) {
      console.error("Error exporting configuration as JavaScript:", error);
      throw new Error("Failed to backup configuration as JavaScript");
    }
  }

  /**
   * Download configuration as JSON file
   * @param filename - Optional custom filename
   * @returns Success status
   */
  public downloadAsJSON(filename?: string): boolean {
    try {
      const content = this.exportAsJSON();
      const defaultFilename = filename || this.generateFileName("json");
      return this.triggerDownload(content, defaultFilename, "application/json");
    } catch (error) {
      const fallback = this.errorHandler.handleExportError(
        error as Error,
        "json",
        this.config
      );
      if (fallback.success) {
        console.warn(fallback.message);
        return true;
      }
      console.error("Error downloading JSON configuration:", fallback.message);
      return false;
    }
  }

  /**
   * Download configuration as JavaScript file
   * @param filename - Optional custom filename
   * @returns Success status
   */
  public downloadAsJavaScript(filename?: string): boolean {
    try {
      const content = this.exportAsJavaScript();
      const defaultFilename = filename || this.generateFileName("js");
      return this.triggerDownload(content, defaultFilename, "text/javascript");
    } catch (error) {
      const fallback = this.errorHandler.handleExportError(
        error as Error,
        "javascript",
        this.config
      );
      if (fallback.success) {
        console.warn(fallback.message);
        return true;
      }
      console.error(
        "Error downloading JavaScript configuration:",
        fallback.message
      );
      return false;
    }
  }

  /**
   * Copy configuration to clipboard as JSON
   * @returns Success status
   */
  public async copyToClipboard(): Promise<boolean> {
    try {
      const content = this.exportAsJSON();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
        return true;
      } else {
        // Fallback for older browsers or restricted environments
        return this.fallbackCopyToClipboard(content);
      }
    } catch (error) {
      console.error("Error copying configuration to clipboard:", error);
      return false;
    }
  }

  /**
   * Generate a timestamped filename
   * @param extension - File extension (without dot)
   * @returns Generated filename
   */
  private generateFileName(extension: string): string {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, -5); // Remove milliseconds and Z

    return `twitch-overlay-config_${timestamp}.${extension}`;
  }

  /**
   * Trigger file download using blob and anchor element
   * @param content - File content
   * @param filename - Filename for download
   * @param mimeType - MIME type for the file
   * @returns Success status
   */
  private triggerDownload(
    content: string,
    filename: string,
    mimeType: string
  ): boolean {
    try {
      // Create blob with content
      const blob = new Blob([content], { type: mimeType });

      // Create temporary URL for the blob
      const url = URL.createObjectURL(blob);

      // Create temporary anchor element
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = "none";

      // Add to DOM, trigger click, and clean up
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 100);

      return true;
    } catch (error) {
      console.error("Error triggering download:", error);
      return false;
    }
  }

  /**
   * Fallback clipboard copy method for restricted environments
   * @param content - Content to copy
   * @returns Success status
   */
  private fallbackCopyToClipboard(content: string): boolean {
    try {
      // Create temporary textarea element
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";

      // Add to DOM, select, copy, and clean up
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999); // For mobile devices

      const success = document.execCommand("copy");
      document.body.removeChild(textarea);

      return success;
    } catch (error) {
      console.error("Error in fallback clipboard copy:", error);
      return false;
    }
  }

  /**
   * Validate that the configuration can be exported
   * @returns Validation result with details
   */
  public validateForExport(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required properties
    if (!this.config) {
      errors.push("Configuration object is null or undefined");
      return { valid: false, errors };
    }

    // Validate auth section
    if (!this.config.auth) {
      errors.push("Missing authentication configuration");
    } else {
      if (!this.config.auth.twitch_oauth) {
        errors.push("Missing Twitch OAuth token");
      }
      if (!this.config.auth.twitch_username) {
        errors.push("Missing Twitch username");
      }
      if (!this.config.auth.twitch_channel) {
        errors.push("Missing Twitch channel");
      }
    }

    // Validate commands section
    if (!this.config.commands) {
      errors.push("Missing commands configuration");
    }

    // Validate responses section
    if (!this.config.responses) {
      errors.push("Missing responses configuration");
    }

    // Check for circular references that would break JSON.stringify
    try {
      JSON.stringify(this.config);
    } catch (error) {
      errors.push(
        "Configuration contains circular references or non-serializable data"
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get export statistics
   * @returns Statistics about the configuration
   */
  public getExportStats(): {
    totalCommands: number;
    totalResponses: number;
    configSize: number;
    hasCustomColors: boolean;
  } {
    const stats = {
      totalCommands: 0,
      totalResponses: 0,
      configSize: 0,
      hasCustomColors: false,
    };

    try {
      // Count commands
      if (this.config.commands) {
        stats.totalCommands = Object.keys(this.config.commands).length;
      }

      // Count responses
      if (this.config.responses) {
        stats.totalResponses = Object.keys(this.config.responses).length;
      }

      // Calculate approximate size
      stats.configSize = JSON.stringify(this.config).length;

      // Check for custom colors
      stats.hasCustomColors = Boolean(
        this.config.challengeRowColors &&
          this.config.challengeRowColors.length > 0
      );
    } catch (error) {
      console.error("Error calculating export stats:", error);
    }

    return stats;
  }

  /**
   * Create a sanitized version of the configuration for export
   * (removes sensitive data like OAuth tokens)
   * @returns Sanitized configuration
   */
  public createSanitizedExport(): Config {
    const sanitized = JSON.parse(JSON.stringify(this.config));

    // Replace sensitive auth data with placeholders
    if (sanitized.auth) {
      sanitized.auth.twitch_oauth = "YOUR_OAUTH_TOKEN_HERE";
      sanitized.auth.twitch_username = "YOUR_USERNAME_HERE";
      sanitized.auth.twitch_channel = "YOUR_CHANNEL_HERE";
    }

    return sanitized;
  }

  /**
   * Export sanitized configuration as template
   * @returns JavaScript template file content
   */
  public exportAsTemplate(): string {
    try {
      const sanitizedConfig = this.createSanitizedExport();
      const timestamp = new Date().toISOString();
      const configJSON = JSON.stringify(sanitizedConfig, null, 2);

      return `// ========================================
// Twitch Challenge Overlay Configuration Template
// ========================================
// Generated on: ${timestamp}
// This is a template file with placeholder values.
// Replace the placeholder values with your actual settings.

/** @type {Config} */
const _config = ${configJSON};`;
    } catch (error) {
      console.error("Error exporting configuration template:", error);
      throw new Error("Failed to backup configuration template");
    }
  }

  /**
   * Download sanitized configuration template
   * @param filename - Optional custom filename
   * @returns Success status
   */
  public downloadTemplate(filename?: string): boolean {
    try {
      const content = this.exportAsTemplate();
      const defaultFilename = filename || this.generateFileName("template.js");
      return this.triggerDownload(content, defaultFilename, "text/javascript");
    } catch (error) {
      console.error("Error downloading configuration template:", error);
      return false;
    }
  }
}
