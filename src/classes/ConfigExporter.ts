import {
    EXPORT_METADATA_KEYS,
    EXPORT_METADATA_VALUES,
    EXPORT_PLACEHOLDERS,
} from "../types/ConfigConstants";
import {
    FILE_FORMATS,
    FILENAME_PATTERNS,
    MIME_TYPES,
} from "../types/FileConstants";
import {
    CONFIG_EXPORT_ERRORS,
    CONFIG_EXPORT_MESSAGES,
    CONFIG_EXPORT_TEMPLATES,
    CONFIG_VALIDATION_ERRORS,
} from "../types/MessageConstants";
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
            console.error(CONFIG_EXPORT_MESSAGES.ERROR_EXPORTING_JSON, error);
            throw new Error(CONFIG_EXPORT_ERRORS.FAILED_BACKUP_JSON);
        }
    }

    /**
     * Backup configuration as JSON with metadata for backup/restore
     * @returns JSON string with metadata
     */
    public exportAsJSONWithMetadata(): string {
        try {
            const exportData = {
                [EXPORT_METADATA_KEYS.METADATA]: {
                    [EXPORT_METADATA_KEYS.EXPORTED_AT]:
                        new Date().toISOString(),
                    [EXPORT_METADATA_KEYS.VERSION]:
                        EXPORT_METADATA_VALUES.VERSION,
                    [EXPORT_METADATA_KEYS.SOURCE]:
                        EXPORT_METADATA_VALUES.SOURCE,
                    [EXPORT_METADATA_KEYS.DESCRIPTION]:
                        EXPORT_METADATA_VALUES.DESCRIPTION,
                },
                [EXPORT_METADATA_KEYS.CONFIG]: this.config,
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error(
                CONFIG_EXPORT_MESSAGES.ERROR_EXPORTING_JSON_WITH_METADATA,
                error
            );
            throw new Error(
                CONFIG_EXPORT_ERRORS.FAILED_BACKUP_JSON_WITH_METADATA
            );
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

            return `${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_HEADER_LINE_1}
${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_HEADER_LINE_2}
${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_HEADER_LINE_3}
${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_HEADER_GENERATED}${timestamp}
${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_HEADER_DESCRIPTION_LINE_1}
${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_HEADER_DESCRIPTION_LINE_2}
${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_HEADER_DESCRIPTION_LINE_3}

${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_CONFIG_DECLARATION}
${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_CONFIG_VARIABLE}${configJSON};`;
        } catch (error) {
            console.error(
                CONFIG_EXPORT_MESSAGES.ERROR_EXPORTING_JAVASCRIPT,
                error
            );
            throw new Error(CONFIG_EXPORT_ERRORS.FAILED_BACKUP_JAVASCRIPT);
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
            const defaultFilename =
                filename || this.generateFileName(FILE_FORMATS.JSON);
            return this.triggerDownload(
                content,
                defaultFilename,
                MIME_TYPES.JSON
            );
        } catch (error) {
            const fallback = this.errorHandler.handleExportError(
                error as Error,
                FILE_FORMATS.JSON,
                this.config
            );
            if (fallback.success) {
                console.warn(fallback.message);
                return true;
            }
            console.error(
                CONFIG_EXPORT_MESSAGES.ERROR_DOWNLOADING_JSON,
                fallback.message
            );
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
            const defaultFilename =
                filename || this.generateFileName(FILE_FORMATS.JAVASCRIPT);
            return this.triggerDownload(
                content,
                defaultFilename,
                MIME_TYPES.JAVASCRIPT
            );
        } catch (error) {
            const fallback = this.errorHandler.handleExportError(
                error as Error,
                FILE_FORMATS.JAVASCRIPT,
                this.config
            );
            if (fallback.success) {
                console.warn(fallback.message);
                return true;
            }
            console.error(
                CONFIG_EXPORT_MESSAGES.ERROR_DOWNLOADING_JAVASCRIPT,
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
            console.error(
                CONFIG_EXPORT_MESSAGES.ERROR_COPYING_TO_CLIPBOARD,
                error
            );
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

        return `${FILENAME_PATTERNS.PREFIX}${timestamp}${FILENAME_PATTERNS.EXTENSION_SEPARATOR}${extension}`;
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
            console.error(
                CONFIG_EXPORT_MESSAGES.ERROR_TRIGGERING_DOWNLOAD,
                error
            );
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

            // Note: execCommand is deprecated but still used as a fallback in the implementation
            const success = (document as any).execCommand("copy");
            document.body.removeChild(textarea);

            return success;
        } catch (error) {
            console.error(
                CONFIG_EXPORT_MESSAGES.ERROR_FALLBACK_CLIPBOARD_COPY,
                error
            );
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
            errors.push(CONFIG_VALIDATION_ERRORS.CONFIG_NULL_OR_UNDEFINED);
            return { valid: false, errors };
        }

        // Validate auth section structure (values can be empty for optional Twitch integration)
        if (!this.config.auth) {
            errors.push(CONFIG_VALIDATION_ERRORS.MISSING_AUTH_CONFIG);
        } else {
            // Check that auth properties exist and are strings (empty strings are allowed)
            if (typeof this.config.auth.twitch_oauth !== "string") {
                errors.push(
                    CONFIG_VALIDATION_ERRORS.OAUTH_TOKEN_MUST_BE_STRING
                );
            }
            if (typeof this.config.auth.twitch_username !== "string") {
                errors.push(CONFIG_VALIDATION_ERRORS.USERNAME_MUST_BE_STRING);
            }
            if (typeof this.config.auth.twitch_channel !== "string") {
                errors.push(CONFIG_VALIDATION_ERRORS.CHANNEL_MUST_BE_STRING);
            }
        }

        // Validate commands section
        if (!this.config.commands) {
            errors.push(CONFIG_VALIDATION_ERRORS.MISSING_COMMANDS_CONFIG);
        }

        // Validate responses section
        if (!this.config.responses) {
            errors.push(CONFIG_VALIDATION_ERRORS.MISSING_RESPONSES_CONFIG);
        }

        // Check for circular references that would break JSON.stringify
        try {
            JSON.stringify(this.config);
        } catch (error) {
            errors.push(CONFIG_VALIDATION_ERRORS.CIRCULAR_REFERENCES);
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
                stats.totalResponses = Object.keys(
                    this.config.responses
                ).length;
            }

            // Calculate approximate size
            stats.configSize = JSON.stringify(this.config).length;

            // Check for custom colors
            stats.hasCustomColors = Boolean(
                this.config.challengeRowColors &&
                    this.config.challengeRowColors.length > 0
            );
        } catch (error) {
            console.error(
                CONFIG_EXPORT_MESSAGES.ERROR_CALCULATING_STATS,
                error
            );
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
            sanitized.auth.twitch_oauth = EXPORT_PLACEHOLDERS.OAUTH_TOKEN;
            sanitized.auth.twitch_username = EXPORT_PLACEHOLDERS.USERNAME;
            sanitized.auth.twitch_channel = EXPORT_PLACEHOLDERS.CHANNEL;
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

            return `${CONFIG_EXPORT_TEMPLATES.TEMPLATE_HEADER_LINE_1}
${CONFIG_EXPORT_TEMPLATES.TEMPLATE_HEADER_LINE_2}
${CONFIG_EXPORT_TEMPLATES.TEMPLATE_HEADER_LINE_3}
${CONFIG_EXPORT_TEMPLATES.TEMPLATE_HEADER_GENERATED}${timestamp}
${CONFIG_EXPORT_TEMPLATES.TEMPLATE_HEADER_DESCRIPTION_LINE_1}
${CONFIG_EXPORT_TEMPLATES.TEMPLATE_HEADER_DESCRIPTION_LINE_2}

${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_CONFIG_DECLARATION}
${CONFIG_EXPORT_TEMPLATES.JAVASCRIPT_CONFIG_VARIABLE}${configJSON};`;
        } catch (error) {
            console.error(
                CONFIG_EXPORT_MESSAGES.ERROR_EXPORTING_TEMPLATE,
                error
            );
            throw new Error(CONFIG_EXPORT_ERRORS.FAILED_BACKUP_TEMPLATE);
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
            const defaultFilename =
                filename || this.generateFileName(FILE_FORMATS.TEMPLATE);
            return this.triggerDownload(
                content,
                defaultFilename,
                MIME_TYPES.JAVASCRIPT
            );
        } catch (error) {
            console.error(
                CONFIG_EXPORT_MESSAGES.ERROR_DOWNLOADING_TEMPLATE,
                error
            );
            return false;
        }
    }
}
