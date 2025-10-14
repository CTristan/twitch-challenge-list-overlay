import type ConfigManager from "../classes/ConfigManager";
import { STATUS_COLORS } from "../types/ColorConstants";
import { EXPORT_METADATA_KEYS } from "../types/ConfigConstants";
import { ELEMENT_IDS } from "../types/DOMConstants";
import { FILE_EXTENSIONS } from "../types/FileConstants";
import {
    ADMIN_FEEDBACK_MESSAGES,
    IMPORT_EXPORT_CONSOLE_MESSAGES,
} from "../types/MessageConstants";
import { TIMING_CONSTANTS } from "../types/NumericConstants";
import { AdminPanelConfigValidator } from "./AdminPanelConfigValidator";
import { AdminPanelUIHelper } from "./AdminPanelUIHelper";
import { notifyConfigurationSaved } from "./windowRefresh";

/**
 * Utility class for importing configuration in the admin panel
 * Handles file reading, parsing, validation, and configuration restoration
 */
export class AdminPanelConfigImporter {
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
        const file = fileInput.files?.[0];
        if (!file) {
            AdminPanelUIHelper.showFeedback(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.NO_FILE_SELECTED,
                STATUS_COLORS.ERROR
            );
            return;
        }

        if (!file.name.toLowerCase().endsWith(FILE_EXTENSIONS.JSON)) {
            AdminPanelUIHelper.showFeedback(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.INVALID_FILE_TYPE,
                STATUS_COLORS.ERROR
            );
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                AdminPanelConfigImporter.processImportedConfiguration(
                    content,
                    ELEMENT_IDS.IMPORT_CONFIG_BTN,
                    configManager,
                    refreshUICallback
                );

                // Clear the file input after processing
                fileInput.value = "";
            } catch (error) {
                console.error(
                    IMPORT_EXPORT_CONSOLE_MESSAGES.ERROR_READING_FILE,
                    error
                );
                AdminPanelUIHelper.showFeedback(
                    ELEMENT_IDS.IMPORT_CONFIG_BTN,
                    ADMIN_FEEDBACK_MESSAGES.FILE_READ_ERROR,
                    STATUS_COLORS.ERROR
                );
            }
        };

        reader.onerror = () => {
            AdminPanelUIHelper.showFeedback(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.FILE_READ_ERROR,
                STATUS_COLORS.ERROR
            );
        };

        reader.readAsText(file);
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
        try {
            // Parse JSON
            const importedData = JSON.parse(jsonContent);

            // Check if this is a metadata-wrapped export or direct config
            let configToImport = importedData;
            if (
                importedData[EXPORT_METADATA_KEYS.METADATA] &&
                importedData[EXPORT_METADATA_KEYS.CONFIG]
            ) {
                // This is a metadata-wrapped export, extract the config
                configToImport = importedData[EXPORT_METADATA_KEYS.CONFIG];
                console.log(
                    IMPORT_EXPORT_CONSOLE_MESSAGES.IMPORTING_CONFIGURATION_FROM,
                    importedData[EXPORT_METADATA_KEYS.METADATA][
                        EXPORT_METADATA_KEYS.EXPORTED_AT
                    ]
                );
            }

            // Validate configuration structure
            const validationResult =
                AdminPanelConfigValidator.validateImportedConfiguration(
                    configToImport
                );
            if (!validationResult.isValid) {
                AdminPanelUIHelper.showFeedback(
                    buttonId,
                    validationResult.errorMessage,
                    STATUS_COLORS.ERROR
                );
                return;
            }

            // Restore configuration using ConfigManager
            const success = configManager.import(configToImport);

            if (success) {
                AdminPanelUIHelper.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.CONFIGURATION_IMPORTED,
                    STATUS_COLORS.SUCCESS
                );

                // Refresh the configuration UI to show imported values
                setTimeout(() => {
                    refreshUICallback();
                }, TIMING_CONSTANTS.IMPORT_REFRESH_DELAY);

                // Notify other windows to refresh after successful import
                notifyConfigurationSaved();
            } else {
                AdminPanelUIHelper.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.RESTORE_FAILED,
                    STATUS_COLORS.ERROR
                );
            }
        } catch (error) {
            console.error(
                IMPORT_EXPORT_CONSOLE_MESSAGES.ERROR_IMPORTING_CONFIGURATION,
                error
            );
            if (error instanceof SyntaxError) {
                AdminPanelUIHelper.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.INVALID_JSON_FORMAT,
                    STATUS_COLORS.ERROR
                );
            } else {
                AdminPanelUIHelper.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.IMPORT_FAILED,
                    STATUS_COLORS.ERROR
                );
            }
        }
    }
}
