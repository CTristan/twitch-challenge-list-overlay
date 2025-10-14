import { CSS_CLASSES, type ColorTier } from "../types/DOMConstants";
import { AdminPanelColorManager } from "./AdminPanelColorManager";

/**
 * Utility class for managing color tier state in the admin panel
 * Handles enabling/disabling color tiers and updating their visual state
 */
export class AdminPanelColorTierManager {
    /**
     * Update the visual state of a color tier based on checkbox state
     * @param tier - The color tier (primary, secondary, tertiary)
     * @param enabled - Whether the tier is enabled
     * @returns {void}
     */
    static updateColorTierState(tier: ColorTier, enabled: boolean): void {
        const tierConstants =
            AdminPanelColorManager.getColorTierConstants(tier);

        const pickersContainer = document.getElementById(tierConstants.pickers);
        const bgColorInput = document.getElementById(
            tierConstants.bgColor
        ) as HTMLInputElement;
        const textColorInput = document.getElementById(
            tierConstants.textColor
        ) as HTMLInputElement;

        if (pickersContainer && bgColorInput && textColorInput) {
            if (enabled) {
                // Expand the color pickers section
                pickersContainer.classList.add(CSS_CLASSES.EXPANDED);
                pickersContainer.classList.remove(CSS_CLASSES.DISABLED);
                bgColorInput.disabled = false;
                textColorInput.disabled = false;
            } else {
                // Collapse the color pickers section
                pickersContainer.classList.remove(CSS_CLASSES.EXPANDED);
                pickersContainer.classList.add(CSS_CLASSES.DISABLED);
                bgColorInput.disabled = true;
                textColorInput.disabled = true;
            }
        }
    }
}
