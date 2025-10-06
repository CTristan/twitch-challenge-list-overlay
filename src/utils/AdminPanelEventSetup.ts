import { BACKGROUND_UI_ELEMENTS } from "../types/ConfigConstants";
import {
    COLOR_TIERS,
    COMMON_STRINGS,
    ELEMENT_IDS,
    EVENT_NAMES,
    type ColorTier,
} from "../types/DOMConstants";

/**
 * Callback type for auto-save operations
 */
export type AutoSaveCallback = () => void;

/**
 * Callback type for color tier changes
 */
export type ColorTierCallback = (tier: ColorTier, enabled: boolean) => void;

/**
 * Callback type for background preview updates
 */
export type BackgroundPreviewCallback = () => void;

/**
 * Utility class for setting up event listeners in the admin panel
 * Handles event delegation and listener registration
 */
export class AdminPanelEventSetup {
    /**
     * Setup authentication field auto-save listeners
     * @param autoSaveCallback - Callback to execute on field change
     */
    static setupAuthenticationAutoSave(
        autoSaveCallback: AutoSaveCallback
    ): void {
        const authFields = [
            ELEMENT_IDS.TWITCH_OAUTH,
            ELEMENT_IDS.TWITCH_USERNAME,
            ELEMENT_IDS.TWITCH_CHANNEL,
        ];

        authFields.forEach((fieldId) => {
            const field = document.getElementById(fieldId) as HTMLInputElement;
            if (field) {
                field.addEventListener(EVENT_NAMES.INPUT, autoSaveCallback);
            }
        });
    }

    /**
     * Setup behavior field auto-save listeners
     * @param autoSaveCallback - Callback to execute on field change
     */
    static setupBehaviorAutoSave(autoSaveCallback: AutoSaveCallback): void {
        const maxChallengesInput = document.getElementById(
            ELEMENT_IDS.MAX_CHALLENGES
        ) as HTMLInputElement;

        if (maxChallengesInput) {
            maxChallengesInput.addEventListener(
                EVENT_NAMES.CHANGE,
                autoSaveCallback
            );
        }
    }

    /**
     * Setup color tier checkbox event listeners
     * @param onTierChange - Callback when tier checkbox changes
     * @param autoSaveCallback - Callback to execute after tier change
     */
    static setupColorTierEventListeners(
        onTierChange: ColorTierCallback,
        autoSaveCallback: AutoSaveCallback
    ): void {
        const colorTiers = COLOR_TIERS;

        colorTiers.forEach((tier) => {
            const tierConstants = this.getColorTierConstants(tier);
            const checkbox = document.getElementById(
                tierConstants.enabled
            ) as HTMLInputElement;
            const bgColorInput = document.getElementById(
                tierConstants.bgColor
            ) as HTMLInputElement;
            const textColorInput = document.getElementById(
                tierConstants.textColor
            ) as HTMLInputElement;

            if (checkbox) {
                checkbox.addEventListener(EVENT_NAMES.CHANGE, () => {
                    const isEnabled = checkbox.checked;
                    onTierChange(tier, isEnabled);
                    autoSaveCallback();
                });
            }

            // Auto-save when color pickers change
            if (bgColorInput) {
                bgColorInput.addEventListener(
                    EVENT_NAMES.INPUT,
                    autoSaveCallback
                );
            }
            if (textColorInput) {
                textColorInput.addEventListener(
                    EVENT_NAMES.INPUT,
                    autoSaveCallback
                );
            }
        });
    }

    /**
     * Setup row colors opacity slider event listener
     * @param autoSaveCallback - Callback to execute on slider change
     */
    static setupRowColorsOpacityEventListener(
        autoSaveCallback: AutoSaveCallback
    ): void {
        const opacitySlider = document.getElementById(
            ELEMENT_IDS.ROW_COLORS_OPACITY
        ) as HTMLInputElement;
        const opacityDisplay = document.getElementById(
            ELEMENT_IDS.ROW_COLORS_OPACITY_DISPLAY
        );

        if (opacitySlider && opacityDisplay) {
            opacitySlider.addEventListener(EVENT_NAMES.INPUT, () => {
                const opacityValue = parseInt(opacitySlider.value);
                opacityDisplay.textContent = `${opacityValue}${COMMON_STRINGS.PERCENT_SYMBOL}`;
                autoSaveCallback();
            });
        }
    }

    /**
     * Setup background configuration event listeners
     * @param autoSaveCallback - Callback to execute on field change
     * @param updatePreviewCallback - Callback to update background preview
     */
    static setupBackgroundEventListeners(
        autoSaveCallback: AutoSaveCallback,
        updatePreviewCallback: BackgroundPreviewCallback
    ): void {
        // Overlay background color picker
        const overlayBackgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        const overlayOpacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;
        const overlayOpacityDisplay = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_OPACITY_DISPLAY
        );

        // Challenge background color picker
        const backgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        const opacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;
        const opacityDisplay = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OPACITY_DISPLAY
        );

        // Text color settings
        const textColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT
        ) as HTMLInputElement;
        const autoTextColorCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX
        ) as HTMLInputElement;
        const textShadowCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX
        ) as HTMLInputElement;

        // Overlay background listeners
        if (overlayBackgroundColorInput) {
            overlayBackgroundColorInput.addEventListener(
                EVENT_NAMES.INPUT,
                () => {
                    autoSaveCallback();
                }
            );
        }

        if (overlayOpacitySlider && overlayOpacityDisplay) {
            overlayOpacitySlider.addEventListener(EVENT_NAMES.INPUT, () => {
                const opacityValue = parseInt(overlayOpacitySlider.value);
                overlayOpacityDisplay.textContent = `${opacityValue}${COMMON_STRINGS.PERCENT_SYMBOL}`;
                autoSaveCallback();
            });
        }

        // Challenge background listeners
        if (backgroundColorInput) {
            backgroundColorInput.addEventListener(EVENT_NAMES.INPUT, () => {
                updatePreviewCallback();
                autoSaveCallback();
            });
        }

        if (opacitySlider && opacityDisplay) {
            opacitySlider.addEventListener(EVENT_NAMES.INPUT, () => {
                const opacityValue = parseInt(opacitySlider.value);
                opacityDisplay.textContent = `${opacityValue}${COMMON_STRINGS.PERCENT_SYMBOL}`;
                updatePreviewCallback();
                autoSaveCallback();
            });
        }

        // Text color listeners
        if (textColorInput) {
            textColorInput.addEventListener(EVENT_NAMES.INPUT, () => {
                updatePreviewCallback();
                autoSaveCallback();
            });
        }

        if (autoTextColorCheckbox) {
            autoTextColorCheckbox.addEventListener(EVENT_NAMES.CHANGE, () => {
                if (textColorInput) {
                    textColorInput.disabled = autoTextColorCheckbox.checked;
                }
                updatePreviewCallback();
                autoSaveCallback();
            });
        }

        if (textShadowCheckbox) {
            textShadowCheckbox.addEventListener(EVENT_NAMES.CHANGE, () => {
                updatePreviewCallback();
                autoSaveCallback();
            });
        }
    }

    /**
     * Get the element IDs for a specific color tier
     * @param tier - The color tier (primary, secondary, tertiary)
     * @returns Object with the constants for that tier
     */
    private static getColorTierConstants(tier: ColorTier): {
        enabled: string;
        pickers: string;
        section: string;
        bgColor: string;
        textColor: string;
    } {
        switch (tier) {
            case COLOR_TIERS[0]: // "primary"
                return {
                    enabled: ELEMENT_IDS.PRIMARY_COLOR_ENABLED,
                    pickers: ELEMENT_IDS.PRIMARY_COLOR_PICKERS,
                    section: ELEMENT_IDS.PRIMARY_COLOR_SECTION,
                    bgColor: ELEMENT_IDS.PRIMARY_BG_COLOR,
                    textColor: ELEMENT_IDS.PRIMARY_TEXT_COLOR,
                };
            case COLOR_TIERS[1]: // "secondary"
                return {
                    enabled: ELEMENT_IDS.SECONDARY_COLOR_ENABLED,
                    pickers: ELEMENT_IDS.SECONDARY_COLOR_PICKERS,
                    section: ELEMENT_IDS.SECONDARY_COLOR_SECTION,
                    bgColor: ELEMENT_IDS.SECONDARY_BG_COLOR,
                    textColor: ELEMENT_IDS.SECONDARY_TEXT_COLOR,
                };
            case COLOR_TIERS[2]: // "tertiary"
                return {
                    enabled: ELEMENT_IDS.TERTIARY_COLOR_ENABLED,
                    pickers: ELEMENT_IDS.TERTIARY_COLOR_PICKERS,
                    section: ELEMENT_IDS.TERTIARY_COLOR_SECTION,
                    bgColor: ELEMENT_IDS.TERTIARY_BG_COLOR,
                    textColor: ELEMENT_IDS.TERTIARY_TEXT_COLOR,
                };
        }
    }
}
