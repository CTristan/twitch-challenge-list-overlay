import type ConfigManager from "../classes/ConfigManager";
import { ELEMENT_IDS } from "../types/DOMConstants";

/**
 * Utility class for admin panel UI helper functions
 * Handles input value management, UI refresh, and visual feedback
 */
export class AdminPanelUIHelper {
    /**
     * Refresh configuration UI with current values from ConfigManager
     * @param configManager - ConfigManager instance
     * @returns {void}
     */
    static refreshConfigurationUI(configManager: ConfigManager): void {
        // Reload current configuration values into the form
        const config = configManager.getAll();

        // Update auth fields
        AdminPanelUIHelper.setInputValue(
            ELEMENT_IDS.TWITCH_CHANNEL,
            config.auth?.twitch_channel || ""
        );
        AdminPanelUIHelper.setInputValue(
            ELEMENT_IDS.TWITCH_OAUTH,
            config.auth?.twitch_oauth || ""
        );
        AdminPanelUIHelper.setInputValue(
            ELEMENT_IDS.TWITCH_USERNAME,
            config.auth?.twitch_username || ""
        );

        // Update behavior fields
        AdminPanelUIHelper.setInputValue(
            ELEMENT_IDS.MAX_CHALLENGES,
            config.maxChallenges?.toString() || ""
        );

        // Note: Other configuration fields will be updated as the UI form is expanded
        // Currently focusing on the core auth and maxChallenges fields that are in the Config interface
    }

    /**
     * Helper method to set input value safely
     * @param id - Input element ID
     * @param value - Value to set
     * @returns {void}
     */
    static setInputValue(id: string, value: string): void {
        const input = document.getElementById(id) as HTMLInputElement;
        if (input) {
            input.value = value;
        }
    }

    /**
     * Helper method to get input value safely
     * @param id - Input element ID
     * @returns Input value or empty string
     */
    static getInputValue(id: string): string {
        const input = document.getElementById(id) as HTMLInputElement;
        return input ? input.value : "";
    }

    /**
     * Show visual feedback on a button
     * @param buttonId - Button element ID
     * @param message - Message to display
     * @param color - Background color
     * @returns {void}
     */
    static showFeedback(
        buttonId: string,
        message: string,
        color: string
    ): void {
        const button = document.getElementById(buttonId);
        if (button) {
            const originalText = button.textContent;
            const originalColor = button.style.backgroundColor;

            button.textContent = message;
            button.style.backgroundColor = color;

            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = originalColor;
            }, 2000);
        }
    }
}
