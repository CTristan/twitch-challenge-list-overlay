import ConfigExporter from "../classes/ConfigExporter";
import type ConfigManager from "../classes/ConfigManager";
import { STATUS_COLORS } from "../types/ColorConstants";
import { ELEMENT_IDS } from "../types/DOMConstants";
import { DEFAULT_FILENAMES, FILE_FORMAT_VALUES } from "../types/FileConstants";
import {
    ADMIN_FEEDBACK_MESSAGES,
    IMPORT_EXPORT_CONSOLE_MESSAGES,
    VALIDATION_MESSAGES,
} from "../types/MessageConstants";
import { AdminPanelConfigImporter } from "./AdminPanelConfigImporter";
import { AdminPanelConfigValidator } from "./AdminPanelConfigValidator";
import { AdminPanelUIHelper } from "./AdminPanelUIHelper";
import { notifyConfigurationSaved } from "./windowRefresh";

/**
 * Utility class for import/export functionality in the admin panel
 * Handles configuration backup, restore, validation, and reset
 */
export class AdminPanelImportExport {
    /**
     * Reset configuration to defaults
     * @param configManager - ConfigManager instance
     * @param populateFormCallback - Callback to repopulate the form after reset
     * @returns {void}
     */
    static resetConfiguration(
        configManager: ConfigManager,
        populateFormCallback: () => void
    ): void {
        try {
            const resetSuccess = configManager.reset();
            if (resetSuccess) {
                populateFormCallback();
                AdminPanelUIHelper.showFeedback(
                    ELEMENT_IDS.RESET_CONFIG_BTN,
                    ADMIN_FEEDBACK_MESSAGES.RESET,
                    STATUS_COLORS.SUCCESS
                );

                // Notify other windows to refresh after successful reset
                notifyConfigurationSaved();
            } else {
                console.error(
                    IMPORT_EXPORT_CONSOLE_MESSAGES.CONFIGURATION_RESET_FAILED
                );
                AdminPanelUIHelper.showFeedback(
                    ELEMENT_IDS.RESET_CONFIG_BTN,
                    ADMIN_FEEDBACK_MESSAGES.RESET_FAILED,
                    STATUS_COLORS.ERROR
                );
            }
        } catch (error) {
            console.error(
                IMPORT_EXPORT_CONSOLE_MESSAGES.ERROR_RESETTING_CONFIGURATION,
                error
            );
            AdminPanelUIHelper.showFeedback(
                ELEMENT_IDS.RESET_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.ERROR,
                STATUS_COLORS.ERROR
            );
        }
    }

    /**
     * Backup configuration as JSON
     * @param format - Export format (only "json" is supported)
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static exportConfiguration(
        format: string,
        configManager: ConfigManager
    ): void {
        if (format !== FILE_FORMAT_VALUES.JSON) {
            console.error(
                VALIDATION_MESSAGES.UNSUPPORTED_EXPORT_FORMAT.replace(
                    "{format}",
                    format
                )
            );
            return;
        }

        try {
            const config = configManager.export();
            const configExporter = new ConfigExporter(config);

            const success = configExporter.downloadAsJSON(
                DEFAULT_FILENAMES.CONFIG_EXPORT
            );
            const buttonId = ELEMENT_IDS.EXPORT_JSON_BTN;

            if (success) {
                AdminPanelUIHelper.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.EXPORTED,
                    STATUS_COLORS.SUCCESS
                );
            } else {
                AdminPanelUIHelper.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.FAILED,
                    STATUS_COLORS.ERROR
                );
            }
        } catch (error) {
            console.error(
                IMPORT_EXPORT_CONSOLE_MESSAGES.ERROR_EXPORTING_CONFIGURATION,
                error
            );
            AdminPanelUIHelper.showFeedback(
                ELEMENT_IDS.EXPORT_JSON_BTN,
                ADMIN_FEEDBACK_MESSAGES.ERROR,
                STATUS_COLORS.ERROR
            );
        }
    }

    /**
     * Restore configuration from file upload
     * @param fileInput - File input element
     * @param configManager - ConfigManager instance
     * @param refreshUICallback - Callback to refresh the UI after import
     * @returns {void}
     */
    static importFromFile(
        fileInput: HTMLInputElement,
        configManager: ConfigManager,
        refreshUICallback: () => void
    ): void {
        AdminPanelConfigImporter.importFromFile(
            fileInput,
            configManager,
            refreshUICallback
        );
    }

    /**
     * Process and validate imported configuration
     * @param jsonContent - JSON string content
     * @param buttonId - Button ID for feedback
     * @param configManager - ConfigManager instance
     * @param refreshUICallback - Callback to refresh the UI after import
     * @returns {void}
     */
    static processImportedConfiguration(
        jsonContent: string,
        buttonId: string,
        configManager: ConfigManager,
        refreshUICallback: () => void
    ): void {
        AdminPanelConfigImporter.processImportedConfiguration(
            jsonContent,
            buttonId,
            configManager,
            refreshUICallback
        );
    }

    /**
     * Validate imported configuration with detailed error messages
     * @param config - Configuration object to validate
     * @returns {object} Validation result with isValid flag and error message
     * @deprecated Use AdminPanelConfigValidator.validateImportedConfiguration instead
     */
    static validateImportedConfiguration(config: any): {
        isValid: boolean;
        errorMessage: string;
    } {
        return AdminPanelConfigValidator.validateImportedConfiguration(config);
    }
}
