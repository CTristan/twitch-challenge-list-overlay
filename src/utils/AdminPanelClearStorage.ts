import type ConfigManager from "../classes/ConfigManager";
import { STATUS_COLORS } from "../types/ColorConstants";
import { ELEMENT_IDS } from "../types/DOMConstants";
import { ADMIN_FEEDBACK_MESSAGES } from "../types/MessageConstants";
import { TIMING_CONSTANTS } from "../types/NumericConstants";
import { LOCALSTORAGE_PREFIX } from "../types/StorageConstants";
import { notifyConfigurationSaved } from "./windowRefresh";

/**
 * AdminPanelClearStorage - Utility class for clearing localStorage data
 * Handles the "Clear All Data" functionality with confirmation and feedback
 */
export class AdminPanelClearStorage {
    /**
     * Clear all localStorage data and update the UI
     * Removes ALL application-specific localStorage keys including:
     * - Configuration data
     * - Challenge list data
     * - UI state (collapsed panel states)
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static clearLocalStorage(configManager: ConfigManager): void {
        // Show confirmation dialog
        const confirmed = window.confirm(
            "Are you sure you want to clear all data?\n\n" +
                "This will permanently delete:\n" +
                "• All configuration settings\n" +
                "• All challenges\n" +
                "• All UI preferences\n\n" +
                "This action cannot be undone."
        );

        if (!confirmed) {
            return; // User cancelled
        }

        try {
            // Clear all application localStorage data
            // Inline implementation to avoid tree-shaking issues
            let removedCount = 0;
            const keysToRemove: string[] = [];

            // Collect all application keys with the prefix
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(LOCALSTORAGE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }

            // Remove all collected keys
            keysToRemove.forEach((key) => {
                localStorage.removeItem(key);
                removedCount++;
            });

            const success = removedCount > 0;

            const button = document.getElementById(
                ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN
            );
            if (button) {
                const originalText = button.textContent;

                if (success) {
                    // Visual feedback for success
                    button.textContent = `${ADMIN_FEEDBACK_MESSAGES.CLEARED} (${removedCount} keys)`;
                    button.style.backgroundColor = STATUS_COLORS.SUCCESS;

                    // Reset configuration to defaults
                    configManager.clearStorage();

                    // Refresh both admin and viewer overlays after a short delay
                    setTimeout(() => {
                        // Notify viewer window to refresh
                        notifyConfigurationSaved();

                        // Refresh admin window
                        window.location.reload();
                    }, 1000);
                } else {
                    // Visual feedback for failure
                    button.textContent = ADMIN_FEEDBACK_MESSAGES.ERROR;
                    button.style.backgroundColor = STATUS_COLORS.ERROR;

                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = "";
                    }, TIMING_CONSTANTS.FEEDBACK_TIMEOUT);
                }
            }
        } catch (error) {
            console.error("[AdminPanel] Error clearing localStorage:", error);

            // Visual feedback for error
            const button = document.getElementById(
                ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN
            );
            if (button) {
                const originalText = button.textContent;
                button.textContent = ADMIN_FEEDBACK_MESSAGES.ERROR;
                button.style.backgroundColor = STATUS_COLORS.ERROR;

                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = "";
                }, TIMING_CONSTANTS.FEEDBACK_TIMEOUT);
            }
        }
    }
}
