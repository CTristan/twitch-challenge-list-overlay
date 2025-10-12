import type App from "../app";
import {
    DEFAULT_COLORS,
    SHADOW_COLORS,
    STATUS_COLORS,
} from "../types/ColorConstants";
import {
    BACKGROUND_CONFIG,
    BACKGROUND_DEFAULTS,
    BACKGROUND_UI_ELEMENTS,
    COLOR_CONFIG,
    CORE_CONFIG,
} from "../types/ConfigConstants";
import { ConfigType } from "../types/ConfigType";
import {
    COLOR_TIERS,
    CSS_CLASSES,
    CSS_SELECTORS,
    ELEMENT_IDS,
    EVENT_NAMES,
    URL_HASH,
    type ColorTier,
} from "../types/DOMConstants";
import {
    DEFAULT_FILENAMES,
    FILE_FORMATS,
    FILE_FORMAT_VALUES,
} from "../types/FileConstants";
import {
    ADMIN_FEEDBACK_MESSAGES,
    ADMIN_PANEL_LABELS,
    ERROR_MESSAGES,
    VALIDATION_MESSAGES,
    WARNING_MESSAGES,
} from "../types/MessageConstants";
import { COLOR_CONSTANTS, TIMING_CONSTANTS } from "../types/NumericConstants";
import {
    AdminPanelColorManager,
    type ColorConfigurationUI,
} from "../utils/AdminPanelColorManager";
import { AdminPanelDOMBuilder } from "../utils/AdminPanelDOMBuilder";
import { AdminPanelEventSetup } from "../utils/AdminPanelEventSetup";
import CollapsibleSection from "../utils/CollapsibleSection";
import { combineColorWithOpacity } from "../utils/ColorUtils";
import {
    notifyConfigurationSaved,
    notifyConfigurationSavedViewerOnly,
} from "../utils/windowRefresh";
import ConfigExporter from "./ConfigExporter";
import ConfigManager from "./ConfigManager";

/**
 * @class AdminPanel
 * @property {App} app - The main application instance
 * @property {ConfigManager} configManager - Configuration manager instance
 * @method initialize - Initialize the admin panel functionality
 * @method clearLocalStorage - Clear all localStorage data
 * @method setupConfigurationUI - Setup configuration editing interface
 * @method exportConfiguration - Backup configuration in various formats
 */
export default class AdminPanel {
    #configManager: ConfigManager;
    #configExporter: ConfigExporter | null = null;
    #app: App | null = null;
    #abortController: AbortController | null = null;
    #eventListeners: Map<
        string,
        { element: Element; event: string; handler: EventListener }
    > = new Map();
    #collapsibleSections: Map<string, CollapsibleSection> = new Map();

    /**
     * Timer for debouncing viewer refresh notifications
     * Prevents quick refreshes while moving the slider
     */
    private viewerNotifyTimer?: number | undefined;

    /**
     * @constructor
     * @param app - Optional App instance for enabling interactive features
     */
    constructor(app?: App) {
        this.#configManager = ConfigManager.getInstance();
        this.#app = app || null;
        this.initialize();
    }

    /**
     * Initialize the admin panel functionality
     * @returns {void}
     */
    initialize(): void {
        // Only initialize if we're in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        // Clean up existing listeners before setting up new ones
        this.cleanup();

        this.setupBasicControls();
        this.setupConfigurationUI();
        this.setupExportControls();
        this.setupImportControls();
        this.setupHashChangeListener();

        // Enable interactive checkbox functionality if App instance is available
        if (this.#app) {
            this.#app.enableAdminCheckboxInteraction();
        }
    }

    /**
     * Clean up all event listeners to prevent memory leaks
     * @returns {void}
     */
    private cleanup(): void {
        // Abort the hashchange listener if it exists
        if (this.#abortController) {
            this.#abortController.abort();
            this.#abortController = null;
        }

        // Remove all tracked event listeners
        this.#eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.#eventListeners.clear();

        // Clear collapsible sections
        this.#collapsibleSections.clear();
    }

    /**
     * Setup hash change listener with proper cleanup support
     * @returns {void}
     */
    private setupHashChangeListener(): void {
        // Create new AbortController for this listener
        this.#abortController = new AbortController();

        // Add hashchange listener with abort signal
        window.addEventListener(
            EVENT_NAMES.HASHCHANGE,
            () => {
                if (window.location.hash === URL_HASH.ADMIN) {
                    this.initialize();
                }
            },
            { signal: this.#abortController.signal }
        );
    }

    /**
     * Destroy the AdminPanel instance and clean up all resources
     * @returns {void}
     */
    destroy(): void {
        this.cleanup();
    }

    /**
     * Setup basic admin controls (clear localStorage, etc.)
     * @returns {void}
     */
    private setupBasicControls(): void {
        const clearButton = document.getElementById(
            ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN
        );
        if (clearButton) {
            const handler = () => this.clearLocalStorage();
            clearButton.addEventListener(EVENT_NAMES.CLICK, handler);
            this.#eventListeners.set(ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN, {
                element: clearButton,
                event: EVENT_NAMES.CLICK,
                handler,
            });
        }
    }

    /**
     * Setup configuration editing UI
     * @returns {void}
     */
    private setupConfigurationUI(): void {
        // Create configuration form if it doesn't exist
        this.createConfigurationForm();
        this.populateConfigurationForm();
        this.setupConfigurationEventListeners();
    }

    /**
     * Setup export controls
     * @returns {void}
     */
    private setupExportControls(): void {
        const exportJsonBtn = document.getElementById(
            ELEMENT_IDS.EXPORT_JSON_BTN
        );

        if (exportJsonBtn) {
            const handler = () => this.exportConfiguration(FILE_FORMATS.JSON);
            exportJsonBtn.addEventListener(EVENT_NAMES.CLICK, handler);
            this.#eventListeners.set(ELEMENT_IDS.EXPORT_JSON_BTN, {
                element: exportJsonBtn,
                event: EVENT_NAMES.CLICK,
                handler,
            });
        }
    }

    /**
     * Setup import controls
     * @returns {void}
     */
    private setupImportControls(): void {
        const importConfigBtn = document.getElementById(
            ELEMENT_IDS.IMPORT_CONFIG_BTN
        );
        const importFileInput = document.getElementById(
            ELEMENT_IDS.IMPORT_FILE_INPUT
        ) as HTMLInputElement;

        // Handle import button click - trigger file picker
        if (importConfigBtn && importFileInput) {
            const clickHandler = () => {
                importFileInput.click();
            };
            importConfigBtn.addEventListener(EVENT_NAMES.CLICK, clickHandler);
            this.#eventListeners.set(ELEMENT_IDS.IMPORT_CONFIG_BTN, {
                element: importConfigBtn,
                event: EVENT_NAMES.CLICK,
                handler: clickHandler,
            });

            // Handle file selection
            const changeHandler = () => {
                if (importFileInput.files?.length) {
                    this.importFromFile(importFileInput);
                }
            };
            importFileInput.addEventListener(EVENT_NAMES.CHANGE, changeHandler);
            this.#eventListeners.set(ELEMENT_IDS.IMPORT_FILE_INPUT, {
                element: importFileInput,
                event: EVENT_NAMES.CHANGE,
                handler: changeHandler,
            });
        }
    }

    /**
     * Create the configuration form HTML with collapsible sections
     * @returns {void}
     */
    private createConfigurationForm(): void {
        const adminContent = document.querySelector(
            CSS_SELECTORS.ADMIN_CONTENT
        ) as HTMLElement;
        if (!adminContent) {
            return;
        }

        // Check if form already exists
        if (document.getElementById(ELEMENT_IDS.CONFIG_FORM)) {
            return;
        }

        // Create the main form container
        const formContainer = document.createElement("div");
        formContainer.id = ELEMENT_IDS.CONFIG_FORM;
        formContainer.className = CSS_CLASSES.CONFIG_FORM;

        const title = document.createElement("h3");
        title.textContent = ADMIN_PANEL_LABELS.CONFIGURATION_SETTINGS;
        formContainer.appendChild(title);

        // Create collapsible sections in desired order
        this.createBehaviorSection(formContainer);
        this.createChallengeRowStylingSection(formContainer);
        this.createOverlayBackgroundSection(formContainer);
        this.createAuthenticationSection(formContainer);

        adminContent.appendChild(formContainer);

        // Add action buttons at the bottom of the admin panel (outside the form)
        this.createBottomActionButtons(adminContent);
    }

    /**
     * Create the Authentication section
     * @param container - The parent container element
     */
    private createAuthenticationSection(container: HTMLElement): void {
        const authContent = AdminPanelDOMBuilder.createAuthenticationSection();

        try {
            const authSection = new CollapsibleSection({
                id: ELEMENT_IDS.AUTHENTICATION_SECTION,
                title: ADMIN_PANEL_LABELS.AUTHENTICATION_SETTINGS,
                content: authContent,
                defaultExpanded: true, // Authentication should be expanded by default
            });

            this.#collapsibleSections.set(
                ELEMENT_IDS.AUTHENTICATION_SECTION,
                authSection
            );
            const element = authSection.createElement();
            container.appendChild(element);
        } catch (error) {
            console.error("Error creating CollapsibleSection:", error);
            // Fallback to old HTML structure
            const fallbackHTML = `
                <div class="config-section">
                  <h4>${ADMIN_PANEL_LABELS.AUTHENTICATION}</h4>
                  ${authContent}
                </div>
            `;
            container.innerHTML += fallbackHTML;
        }
    }

    /**
     * Create the Behavior Settings section
     * @param container - The parent container element
     */
    private createBehaviorSection(container: HTMLElement): void {
        const behaviorContent = AdminPanelDOMBuilder.createBehaviorSection();

        const behaviorSection = new CollapsibleSection({
            id: ELEMENT_IDS.BEHAVIOR_SECTION,
            title: ADMIN_PANEL_LABELS.BEHAVIOR_SETTINGS,
            content: behaviorContent,
            defaultExpanded: true, // Behavior should be expanded by default
        });

        this.#collapsibleSections.set(
            ELEMENT_IDS.BEHAVIOR_SECTION,
            behaviorSection
        );
        container.appendChild(behaviorSection.createElement());
    }

    /**
     * Create the Challenge Row Styling section
     * Combines tier-based color configuration with default challenge row background settings
     * @param container - The parent container element
     */
    private createChallengeRowStylingSection(container: HTMLElement): void {
        const challengeRowStylingContent =
            AdminPanelDOMBuilder.createChallengeRowStylingSection();

        const challengeRowStylingSection = new CollapsibleSection({
            id: ELEMENT_IDS.CHALLENGE_ROW_STYLING_SECTION,
            title: ADMIN_PANEL_LABELS.CHALLENGE_ROW_STYLING,
            content: challengeRowStylingContent,
            defaultExpanded: false, // Challenge row styling should be collapsed by default
        });

        this.#collapsibleSections.set(
            ELEMENT_IDS.CHALLENGE_ROW_STYLING_SECTION,
            challengeRowStylingSection
        );
        container.appendChild(challengeRowStylingSection.createElement());
    }

    /**
     * Create the Overlay Background section
     * Controls the main container background behind all challenges
     * @param container - The parent container element
     */
    private createOverlayBackgroundSection(container: HTMLElement): void {
        const overlayBackgroundContent =
            AdminPanelDOMBuilder.createOverlayBackgroundSection();

        const overlayBackgroundSection = new CollapsibleSection({
            id: ELEMENT_IDS.OVERLAY_BACKGROUND_SECTION,
            title: ADMIN_PANEL_LABELS.OVERLAY_BACKGROUND,
            content: overlayBackgroundContent,
            defaultExpanded: false, // Overlay background should be collapsed by default
        });

        this.#collapsibleSections.set(
            ELEMENT_IDS.OVERLAY_BACKGROUND_SECTION,
            overlayBackgroundSection
        );
        container.appendChild(overlayBackgroundSection.createElement());
    }

    /**
     * Create action buttons at the bottom of the admin panel
     * Includes configuration actions and danger zone buttons
     * @param container - The parent container element (admin-content)
     */
    private createBottomActionButtons(container: HTMLElement): void {
        const buttonContainer =
            AdminPanelDOMBuilder.createBottomActionButtons();
        container.appendChild(buttonContainer);
    }

    /**
     * Populate the configuration form with current values
     * @returns {void}
     */
    private populateConfigurationForm(): void {
        const config = this.#configManager.getAll();

        // Populate auth fields
        this.setInputValue(
            ELEMENT_IDS.TWITCH_OAUTH,
            config.auth?.twitch_oauth || ""
        );
        this.setInputValue(
            ELEMENT_IDS.TWITCH_USERNAME,
            config.auth?.twitch_username || ""
        );
        this.setInputValue(
            ELEMENT_IDS.TWITCH_CHANNEL,
            config.auth?.twitch_channel || ""
        );

        // Populate behavior fields
        this.setInputValue(
            ELEMENT_IDS.MAX_CHALLENGES,
            config.maxChallenges?.toString() || "10"
        );

        // Populate color configuration
        this.populateColorConfiguration(
            config.challengeRowColors || [],
            config.challengeRowTextColors || []
        );

        // Populate background configuration
        this.populateBackgroundConfiguration(config);
    }

    /**
     * Populate the color configuration UI with current values
     * @param backgroundColors - Array of background color strings from configuration
     * @param textColors - Array of text color strings from configuration
     * @returns {void}
     */
    private populateColorConfiguration(
        backgroundColors: string[],
        textColors: string[] = []
    ): void {
        const colorConfig = this.convertColorsToUI(
            backgroundColors,
            textColors
        );
        const tiers = COLOR_TIERS;

        tiers.forEach((tier) => {
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

            if (checkbox && bgColorInput && textColorInput) {
                const tierConfig = colorConfig[tier];

                // Set checkbox state
                checkbox.checked = tierConfig.enabled;

                // Set color values
                bgColorInput.value = tierConfig.backgroundColor;
                textColorInput.value = tierConfig.textColor;

                // Update visual state
                this.updateColorTierState(tier, tierConfig.enabled);
            }
        });

        // Populate row colors opacity
        const opacitySlider = document.getElementById(
            ELEMENT_IDS.ROW_COLORS_OPACITY
        ) as HTMLInputElement;
        const opacityDisplay = document.getElementById(
            ELEMENT_IDS.ROW_COLORS_OPACITY_DISPLAY
        );
        if (opacitySlider && opacityDisplay) {
            const opacity =
                this.#configManager.get(
                    COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY
                ) ?? BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY;
            const opacityPercent = Math.round(opacity * 100);
            opacitySlider.value = opacityPercent.toString();
            opacityDisplay.textContent = `${opacityPercent}%`;
        }
    }

    /**
     * Populate the background configuration UI with current values
     * @param config - Configuration object with background settings
     * @returns {void}
     */
    private populateBackgroundConfiguration(config: Config): void {
        // Overlay background color
        const overlayBackgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        if (overlayBackgroundColorInput) {
            // Extract color from rgba or use default
            const overlayBackgroundColor =
                config.overlayBackgroundColor ||
                BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_COLOR;
            const hexColor = this.extractColorFromRGBA(overlayBackgroundColor);
            overlayBackgroundColorInput.value = hexColor;
        }

        // Overlay background opacity
        const overlayOpacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;
        const overlayOpacityDisplay = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_OPACITY_DISPLAY
        );
        if (overlayOpacitySlider && overlayOpacityDisplay) {
            const overlayOpacity =
                config.overlayBackgroundOpacity ??
                BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY;
            const overlayOpacityPercent = Math.round(overlayOpacity * 100);
            overlayOpacitySlider.value = overlayOpacityPercent.toString();
            overlayOpacityDisplay.textContent = `${overlayOpacityPercent}%`;
        }

        // Challenge row background color
        const backgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        if (backgroundColorInput) {
            // Extract color from rgba or use default
            const backgroundColor =
                config.challengeBackgroundColor ||
                BACKGROUND_DEFAULTS.BACKGROUND_COLOR;
            const hexColor = this.extractColorFromRGBA(backgroundColor);
            backgroundColorInput.value = hexColor;
        }

        // Challenge row background opacity
        const opacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;
        const opacityDisplay = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OPACITY_DISPLAY
        );
        if (opacitySlider && opacityDisplay) {
            const opacity =
                config.challengeBackgroundOpacity ??
                BACKGROUND_DEFAULTS.BACKGROUND_OPACITY;
            const opacityPercent = Math.round(opacity * 100);
            opacitySlider.value = opacityPercent.toString();
            opacityDisplay.textContent = `${opacityPercent}%`;
        }

        // Auto text color
        const autoTextColorCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX
        ) as HTMLInputElement;
        if (autoTextColorCheckbox) {
            autoTextColorCheckbox.checked =
                config.challengeAutoTextColor ??
                BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR;
        }

        // Manual text color
        const textColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT
        ) as HTMLInputElement;
        if (textColorInput) {
            textColorInput.value =
                config.challengeTextColor || BACKGROUND_DEFAULTS.TEXT_COLOR;
            textColorInput.disabled =
                config.challengeAutoTextColor ??
                BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR;
        }

        // Text shadow
        const textShadowCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX
        ) as HTMLInputElement;
        if (textShadowCheckbox) {
            textShadowCheckbox.checked =
                config.challengeTextShadow ?? BACKGROUND_DEFAULTS.TEXT_SHADOW;
        }

        // Update preview
        this.updateBackgroundPreview();
    }

    /**
     * Extract hex color from RGBA string or return default
     * @param colorString - Color string (rgba, hex, etc.)
     * @returns Hex color string
     */
    private extractColorFromRGBA(colorString: string): string {
        return AdminPanelColorManager.extractColorFromRGBA(colorString);
    }

    /**
     * Setup event listeners for configuration form with auto-save
     * @returns {void}
     */
    private setupConfigurationEventListeners(): void {
        const resetBtn = document.getElementById(ELEMENT_IDS.RESET_CONFIG_BTN);

        if (resetBtn) {
            const resetHandler = () => this.resetConfiguration();
            resetBtn.addEventListener(EVENT_NAMES.CLICK, resetHandler);
            this.#eventListeners.set(ELEMENT_IDS.RESET_CONFIG_BTN, {
                element: resetBtn,
                event: EVENT_NAMES.CLICK,
                handler: resetHandler,
            });
        }

        // Setup auto-save for authentication fields
        this.setupAuthenticationAutoSave();

        // Setup auto-save for behavior fields
        this.setupBehaviorAutoSave();

        // Setup color tier checkbox event listeners with auto-save
        this.setupColorTierEventListeners();

        // Setup row colors opacity event listener with auto-save
        this.setupRowColorsOpacityEventListener();

        // Setup background customization event listeners with auto-save
        this.setupBackgroundEventListeners();
    }

    /**
     * Setup auto-save for authentication fields
     * @returns {void}
     */
    private setupAuthenticationAutoSave(): void {
        AdminPanelEventSetup.setupAuthenticationAutoSave(() =>
            this.autoSaveAuthConfiguration()
        );
    }

    /**
     * Setup auto-save for behavior fields
     * @returns {void}
     */
    private setupBehaviorAutoSave(): void {
        AdminPanelEventSetup.setupBehaviorAutoSave(() =>
            this.autoSaveBehaviorConfiguration()
        );
    }

    /**
     * Setup event listeners for color tier checkboxes with auto-save
     * @returns {void}
     */
    private setupColorTierEventListeners(): void {
        AdminPanelEventSetup.setupColorTierEventListeners(
            (tier, enabled) => this.updateColorTierState(tier, enabled),
            () => this.autoSaveColorConfiguration(),
            () => this.updateBackgroundPreview()
        );
    }

    /**
     * Setup event listener for row colors opacity slider with auto-save
     * @returns {void}
     */
    private setupRowColorsOpacityEventListener(): void {
        AdminPanelEventSetup.setupRowColorsOpacityEventListener(() =>
            this.autoSaveColorConfiguration()
        );
    }

    /**
     * Get the appropriate constants for a color tier
     * @param tier - The color tier (primary, secondary, tertiary)
     * @returns Object with the constants for that tier
     */
    private getColorTierConstants(tier: ColorTier): {
        enabled: string;
        pickers: string;
        section: string;
        bgColor: string;
        textColor: string;
    } {
        return AdminPanelColorManager.getColorTierConstants(tier);
    }

    /**
     * Setup event listeners for background customization controls with auto-save
     * @returns {void}
     */
    private setupBackgroundEventListeners(): void {
        AdminPanelEventSetup.setupBackgroundEventListeners(
            () => this.autoSaveBackgroundConfiguration(),
            () => this.updateBackgroundPreview()
        );
    }

    /**
     * Update the background preview based on current settings
     * @returns {void}
     */
    private updateBackgroundPreview(): void {
        const preview = document.getElementById(ELEMENT_IDS.BACKGROUND_PREVIEW);
        const previewChallenge = preview?.querySelector(
            ".preview-challenge"
        ) as HTMLElement;
        const previewText = preview?.querySelector(
            ".preview-text"
        ) as HTMLElement;

        if (!previewChallenge || !previewText) return;

        // Get current values from Primary Color tier pickers
        const backgroundColorInput = document.getElementById(
            ELEMENT_IDS.PRIMARY_BG_COLOR
        ) as HTMLInputElement;
        const autoTextColorCheckbox = document.getElementById(
            "challenge-auto-text-color"
        ) as HTMLInputElement;
        const textColorInput = document.getElementById(
            "challenge-text-color"
        ) as HTMLInputElement;
        const textShadowCheckbox = document.getElementById(
            "challenge-text-shadow"
        ) as HTMLInputElement;

        if (!backgroundColorInput) return;

        // Get row colors opacity slider value
        const rowColorsOpacitySlider = document.getElementById(
            ELEMENT_IDS.ROW_COLORS_OPACITY
        ) as HTMLInputElement;
        const rowColorsOpacity = rowColorsOpacitySlider
            ? parseInt(rowColorsOpacitySlider.value) / 100
            : BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY;

        // Apply background color with opacity
        const backgroundColor = backgroundColorInput.value;
        const backgroundColorWithOpacity = combineColorWithOpacity(
            backgroundColor,
            rowColorsOpacity
        );
        previewChallenge.style.backgroundColor = backgroundColorWithOpacity;

        // Apply text color
        let textColor: string = DEFAULT_COLORS.WHITE_TEXT;
        if (autoTextColorCheckbox?.checked) {
            // Use automatic text color calculation
            textColor = this.calculateOptimalTextColor(backgroundColor);
        } else if (textColorInput) {
            textColor = textColorInput.value;
        }
        previewText.style.color = textColor;

        // Apply text shadow
        if (textShadowCheckbox?.checked) {
            const shadowStyle = this.generateTextShadow(textColor);
            previewText.style.textShadow = shadowStyle;
        } else {
            previewText.style.textShadow = "none";
        }
    }

    /**
     * Calculate optimal text color for readability (simplified version)
     * @param backgroundColor - Background color hex string
     * @returns Optimal text color ("#ffffff" or "#000000")
     */
    private calculateOptimalTextColor(backgroundColor: string): string {
        // Simple brightness calculation
        const hex = backgroundColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness =
            (r * COLOR_CONSTANTS.BRIGHTNESS_RED_WEIGHT +
                g * COLOR_CONSTANTS.BRIGHTNESS_GREEN_WEIGHT +
                b * COLOR_CONSTANTS.BRIGHTNESS_BLUE_WEIGHT) /
            COLOR_CONSTANTS.BRIGHTNESS_DIVISOR;
        return brightness > COLOR_CONSTANTS.BRIGHTNESS_THRESHOLD
            ? DEFAULT_COLORS.BLACK_TEXT
            : DEFAULT_COLORS.WHITE_TEXT;
    }

    /**
     * Generate text shadow for enhanced readability (simplified version)
     * @param textColor - Text color to determine shadow color
     * @returns CSS text-shadow property value
     */
    private generateTextShadow(textColor: string): string {
        const isDarkText =
            this.calculateOptimalTextColor(textColor) ===
            DEFAULT_COLORS.WHITE_TEXT;
        const shadowColor = isDarkText
            ? SHADOW_COLORS.WHITE_SHADOW
            : SHADOW_COLORS.BLACK_SHADOW;
        return `1px 1px 2px ${shadowColor}, -1px -1px 2px ${shadowColor}, 1px -1px 2px ${shadowColor}, -1px 1px 2px ${shadowColor}`;
    }

    /**
     * Update the visual state of a color tier based on checkbox state
     * @param tier - The color tier (primary, secondary, tertiary)
     * @param enabled - Whether the tier is enabled
     * @returns {void}
     */
    private updateColorTierState(tier: ColorTier, enabled: boolean): void {
        const tierConstants = this.getColorTierConstants(tier);

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
                pickersContainer.classList.add("expanded");
                pickersContainer.classList.remove("disabled");
                bgColorInput.disabled = false;
                textColorInput.disabled = false;
            } else {
                // Collapse the color pickers section
                pickersContainer.classList.remove("expanded");
                pickersContainer.classList.add("disabled");
                bgColorInput.disabled = true;
                textColorInput.disabled = true;
            }
        }
    }

    /**
     * Convert string array colors to ColorConfigurationUI format
     * @param backgroundColors - Array of background color strings
     * @param textColors - Array of text color strings (optional)
     * @returns ColorConfigurationUI object
     */
    private convertColorsToUI(
        backgroundColors: string[],
        textColors: string[] = []
    ): ColorConfigurationUI {
        return AdminPanelColorManager.convertColorsToUI(
            backgroundColors,
            textColors
        );
    }

    /**
     * Convert ColorConfigurationUI format to string array for background colors
     * @param colorConfig - ColorConfigurationUI object
     * @returns Array of background color strings
     */
    private convertUIToColors(colorConfig: ColorConfigurationUI): string[] {
        return AdminPanelColorManager.convertUIToColors(colorConfig);
    }

    /**
     * Convert ColorConfigurationUI format to string array for text colors
     * @param colorConfig - ColorConfigurationUI object
     * @returns Array of text color strings
     */
    private convertUIToTextColors(colorConfig: ColorConfigurationUI): string[] {
        return AdminPanelColorManager.convertUIToTextColors(colorConfig);
    }

    /**
     * Get current color configuration from the UI
     * @returns ColorConfigurationUI object
     */
    private getCurrentColorConfigFromUI(): ColorConfigurationUI {
        return AdminPanelColorManager.getCurrentColorConfigFromUI();
    }

    /**
     * Get current background configuration from the UI
     * @returns Background configuration object
     */
    private getCurrentBackgroundConfigFromUI(): {
        overlayBackgroundColor: string;
        overlayBackgroundOpacity: number;
        challengeBackgroundColor: string;
        challengeBackgroundOpacity: number;
        challengeTextColor: string;
        challengeAutoTextColor: boolean;
        challengeTextShadow: boolean;
    } {
        // Overlay background elements
        const overlayBackgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        const overlayOpacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.OVERLAY_BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;

        // Challenge row background elements
        const backgroundColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_COLOR_INPUT
        ) as HTMLInputElement;
        const opacitySlider = document.getElementById(
            BACKGROUND_UI_ELEMENTS.BACKGROUND_OPACITY_SLIDER
        ) as HTMLInputElement;
        const textColorInput = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_COLOR_INPUT
        ) as HTMLInputElement;
        const autoTextColorCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.AUTO_TEXT_COLOR_CHECKBOX
        ) as HTMLInputElement;
        const textShadowCheckbox = document.getElementById(
            BACKGROUND_UI_ELEMENTS.TEXT_SHADOW_CHECKBOX
        ) as HTMLInputElement;

        // Get overlay background color and opacity (store separately, not as RGBA)
        const overlayBackgroundColor =
            overlayBackgroundColorInput?.value ||
            DEFAULT_COLORS.CHALLENGE_BACKGROUND;
        const overlayOpacity = overlayOpacitySlider
            ? parseInt(overlayOpacitySlider.value) / 100
            : BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY;

        // Get challenge background color and opacity (store separately, not as RGBA)
        const backgroundColor =
            backgroundColorInput?.value || DEFAULT_COLORS.CHALLENGE_BACKGROUND;
        const opacity = opacitySlider
            ? parseInt(opacitySlider.value) / 100
            : BACKGROUND_DEFAULTS.BACKGROUND_OPACITY;

        return {
            overlayBackgroundColor: overlayBackgroundColor,
            overlayBackgroundOpacity: overlayOpacity,
            challengeBackgroundColor: backgroundColor,
            challengeBackgroundOpacity: opacity,
            challengeTextColor:
                textColorInput?.value || BACKGROUND_DEFAULTS.TEXT_COLOR,
            challengeAutoTextColor:
                autoTextColorCheckbox?.checked ??
                BACKGROUND_DEFAULTS.AUTO_TEXT_COLOR,
            challengeTextShadow:
                textShadowCheckbox?.checked ?? BACKGROUND_DEFAULTS.TEXT_SHADOW,
        };
    }

    /**
     * Clear all localStorage data and update the UI
     * @returns {void}
     */
    clearLocalStorage(): void {
        try {
            const success = this.#configManager.clearStorage();

            const button = document.getElementById(
                ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN
            );
            if (button) {
                const originalText = button.textContent;

                if (success) {
                    // Visual feedback for success
                    button.textContent = ADMIN_FEEDBACK_MESSAGES.CLEARED;
                    button.style.backgroundColor = STATUS_COLORS.SUCCESS;

                    // Refresh the form with default values
                    this.populateConfigurationForm();
                } else {
                    // Visual feedback for failure
                    button.textContent = ADMIN_FEEDBACK_MESSAGES.ERROR;
                    button.style.backgroundColor = STATUS_COLORS.ERROR;
                }

                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = "";
                }, TIMING_CONSTANTS.FEEDBACK_TIMEOUT);
            }
        } catch (error) {
            console.error("Error clearing localStorage:", error);

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

    /**
     * Debounced viewer notification to prevent rapid-fire refreshes
     * Waits for user to pause slider drag before notifying viewer window
     * @param delay - Debounce delay in milliseconds
     * @returns {void}
     */
    private notifyViewerDebounced(delay: number = 200): void {
        if (this.viewerNotifyTimer) {
            clearTimeout(this.viewerNotifyTimer);
        }
        this.viewerNotifyTimer = window.setTimeout(() => {
            notifyConfigurationSavedViewerOnly();
            this.viewerNotifyTimer = undefined;
        }, delay);
    }

    /**
     * Update admin panel UI to reflect slider changes without page refresh
     * This is called during slider interaction to provide immediate visual feedback
     * @param configType - Type of configuration being updated (ConfigType.COLOR or ConfigType.BACKGROUND)
     * @returns {void}
     */
    private updateAdminUIForSliderChange(configType: ConfigType): void {
        if (configType === ConfigType.BACKGROUND) {
            // Update background preview
            this.updateBackgroundPreview();

            // If overlay background opacity changed, update the main challenge card
            this.updateOverlayBackgroundInDOM();
        } else if (configType === ConfigType.COLOR) {
            // Update challenge row color preview to reflect new colors and opacity
            this.updateBackgroundPreview();
        }
    }

    /**
     * Update overlay background styling in the DOM without page refresh
     * Applies current overlay background color and opacity to the challenge card
     * @returns {void}
     */
    private updateOverlayBackgroundInDOM(): void {
        // Target the specific challenge card in the challenge container
        const challengeCard = document.querySelector(
            CSS_SELECTORS.CHALLENGE_CONTAINER_CARD
        ) as HTMLElement;

        if (!challengeCard) {
            console.warn(
                WARNING_MESSAGES.CHALLENGE_CARD_NOT_FOUND_FOR_OVERLAY_UPDATE
            );
            return;
        }

        const overlayBackgroundColor = this.#configManager.get(
            BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR
        );
        const overlayBackgroundOpacity = this.#configManager.get(
            BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY
        );

        if (overlayBackgroundColor && overlayBackgroundOpacity !== undefined) {
            const overlayBackgroundRGBA = combineColorWithOpacity(
                overlayBackgroundColor,
                overlayBackgroundOpacity
            );
            challengeCard.style.backgroundColor = overlayBackgroundRGBA;
        }
    }

    /**
     * Auto-save authentication configuration
     * @returns {void}
     */
    private autoSaveAuthConfiguration(): void {
        try {
            const authConfig = {
                twitch_oauth: this.getInputValue(ELEMENT_IDS.TWITCH_OAUTH),
                twitch_username: this.getInputValue(
                    ELEMENT_IDS.TWITCH_USERNAME
                ),
                twitch_channel: this.getInputValue(ELEMENT_IDS.TWITCH_CHANNEL),
            };

            const success = this.#configManager.set(
                CORE_CONFIG.AUTH,
                authConfig
            );

            if (success) {
                // Notify other windows to refresh after successful save
                notifyConfigurationSaved();
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.ERROR_AUTO_SAVING_AUTH_CONFIG, error);
        }
    }

    /**
     * Auto-save behavior configuration
     * @returns {void}
     */
    private autoSaveBehaviorConfiguration(): void {
        try {
            const maxChallenges = parseInt(
                this.getInputValue(ELEMENT_IDS.MAX_CHALLENGES),
                10
            );

            const success = this.#configManager.set(
                CORE_CONFIG.MAX_CHALLENGES,
                maxChallenges
            );

            if (success) {
                // Notify other windows to refresh after successful save
                notifyConfigurationSaved();
            }
        } catch (error) {
            console.error(
                ERROR_MESSAGES.ERROR_AUTO_SAVING_BEHAVIOR_CONFIG,
                error
            );
        }
    }

    /**
     * Auto-save color configuration
     * @returns {void}
     */
    private autoSaveColorConfiguration(): void {
        try {
            // Get color configuration from UI
            const colorConfig = this.getCurrentColorConfigFromUI();
            const challengeRowColors = this.convertUIToColors(colorConfig);
            const challengeRowTextColors =
                this.convertUIToTextColors(colorConfig);

            // Get row colors opacity
            const rowColorsOpacitySlider = document.getElementById(
                ELEMENT_IDS.ROW_COLORS_OPACITY
            ) as HTMLInputElement;
            const rowColorsOpacity = rowColorsOpacitySlider
                ? parseInt(rowColorsOpacitySlider.value) / 100
                : BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY;

            // Save all color-related configuration
            const colorsSuccess = this.#configManager.set(
                CORE_CONFIG.CHALLENGE_ROW_COLORS,
                challengeRowColors
            );
            const textColorsSuccess = this.#configManager.set(
                CORE_CONFIG.CHALLENGE_ROW_TEXT_COLORS,
                challengeRowTextColors
            );
            const rowColorsOpacitySuccess = this.#configManager.set(
                COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY,
                rowColorsOpacity
            );

            if (colorsSuccess && textColorsSuccess && rowColorsOpacitySuccess) {
                // Update admin UI directly (no refresh) - IMMEDIATE
                this.updateAdminUIForSliderChange(ConfigType.COLOR);

                // Notify viewer window to refresh - DEBOUNCED (prevents flicker)
                this.notifyViewerDebounced();
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.ERROR_AUTO_SAVING_COLOR_CONFIG, error);
        }
    }

    /**
     * Auto-save background configuration
     * @returns {void}
     */
    private autoSaveBackgroundConfiguration(): void {
        try {
            // Get background configuration from UI
            const backgroundConfig = this.getCurrentBackgroundConfigFromUI();

            // Save all background-related configuration
            const overlayBackgroundColorSuccess = this.#configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR,
                backgroundConfig.overlayBackgroundColor
            );
            const overlayBackgroundOpacitySuccess = this.#configManager.set(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY,
                backgroundConfig.overlayBackgroundOpacity
            );
            const backgroundColorSuccess = this.#configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR,
                backgroundConfig.challengeBackgroundColor
            );
            const backgroundOpacitySuccess = this.#configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_OPACITY,
                backgroundConfig.challengeBackgroundOpacity
            );
            const textColorSuccess = this.#configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_COLOR,
                backgroundConfig.challengeTextColor
            );
            const autoTextColorSuccess = this.#configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_AUTO_TEXT_COLOR,
                backgroundConfig.challengeAutoTextColor
            );
            const textShadowSuccess = this.#configManager.set(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_SHADOW,
                backgroundConfig.challengeTextShadow
            );

            if (
                overlayBackgroundColorSuccess &&
                overlayBackgroundOpacitySuccess &&
                backgroundColorSuccess &&
                backgroundOpacitySuccess &&
                textColorSuccess &&
                autoTextColorSuccess &&
                textShadowSuccess
            ) {
                // Update admin UI directly (no refresh) - IMMEDIATE
                this.updateAdminUIForSliderChange(ConfigType.BACKGROUND);

                // Notify viewer window to refresh - DEBOUNCED (prevents flicker)
                this.notifyViewerDebounced();
            }
        } catch (error) {
            console.error(
                ERROR_MESSAGES.ERROR_AUTO_SAVING_BACKGROUND_CONFIG,
                error
            );
        }
    }

    /**
     * Reset configuration to defaults
     * @returns {void}
     */
    private resetConfiguration(): void {
        try {
            const resetSuccess = this.#configManager.reset();
            if (resetSuccess) {
                this.populateConfigurationForm();
                this.showFeedback(
                    ELEMENT_IDS.RESET_CONFIG_BTN,
                    ADMIN_FEEDBACK_MESSAGES.RESET,
                    STATUS_COLORS.SUCCESS
                );

                // Notify other windows to refresh after successful reset
                notifyConfigurationSaved();
            } else {
                console.error("Configuration reset failed");
                this.showFeedback(
                    ELEMENT_IDS.RESET_CONFIG_BTN,
                    ADMIN_FEEDBACK_MESSAGES.RESET_FAILED,
                    STATUS_COLORS.ERROR
                );
            }
        } catch (error) {
            console.error("Error resetting configuration:", error);
            this.showFeedback(
                ELEMENT_IDS.RESET_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.ERROR,
                STATUS_COLORS.ERROR
            );
        }
    }

    /**
     * Backup configuration as JSON
     * @param format - Export format (only "json" is supported)
     * @returns {void}
     */
    private exportConfiguration(format: string): void {
        if (format !== FILE_FORMAT_VALUES.JSON) {
            console.error(
                `Unsupported export format: ${format}. Only JSON export is supported.`
            );
            return;
        }

        try {
            const config = this.#configManager.export();
            this.#configExporter = new ConfigExporter(config);

            const success = this.#configExporter.downloadAsJSON(
                DEFAULT_FILENAMES.CONFIG_EXPORT
            );
            const buttonId = ELEMENT_IDS.EXPORT_JSON_BTN;

            if (success) {
                this.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.EXPORTED,
                    STATUS_COLORS.SUCCESS
                );
            } else {
                this.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.FAILED,
                    STATUS_COLORS.ERROR
                );
            }
        } catch (error) {
            console.error("Error exporting configuration:", error);
            this.showFeedback(
                ELEMENT_IDS.EXPORT_JSON_BTN,
                ADMIN_FEEDBACK_MESSAGES.ERROR,
                STATUS_COLORS.ERROR
            );
        }
    }

    /**
     * Restore configuration from file upload
     * @param fileInput - File input element
     * @returns {void}
     */
    private importFromFile(fileInput: HTMLInputElement): void {
        const file = fileInput.files?.[0];
        if (!file) {
            this.showFeedback(
                ELEMENT_IDS.IMPORT_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.NO_FILE_SELECTED,
                STATUS_COLORS.ERROR
            );
            return;
        }

        if (!file.name.toLowerCase().endsWith(".json")) {
            this.showFeedback(
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
                this.processImportedConfiguration(content, "import-config-btn");

                // Clear the file input after processing
                fileInput.value = "";
            } catch (error) {
                console.error("Error reading file:", error);
                this.showFeedback(
                    ELEMENT_IDS.IMPORT_CONFIG_BTN,
                    ADMIN_FEEDBACK_MESSAGES.FILE_READ_ERROR,
                    STATUS_COLORS.ERROR
                );
            }
        };

        reader.onerror = () => {
            this.showFeedback(
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
     * @returns {void}
     */
    private processImportedConfiguration(
        jsonContent: string,
        buttonId: string
    ): void {
        try {
            // Parse JSON
            const importedData = JSON.parse(jsonContent);

            // Check if this is a metadata-wrapped export or direct config
            let configToImport = importedData;
            if (importedData._metadata && importedData.config) {
                // This is a metadata-wrapped export, extract the config
                configToImport = importedData.config;
                console.log(
                    `Importing configuration exported on: ${importedData._metadata.exportedAt}`
                );
            }

            // Validate configuration structure
            const validationResult =
                this.validateImportedConfiguration(configToImport);
            if (!validationResult.isValid) {
                this.showFeedback(
                    buttonId,
                    validationResult.errorMessage,
                    STATUS_COLORS.ERROR
                );
                return;
            }

            // Restore configuration using ConfigManager
            const success = this.#configManager.import(configToImport);

            if (success) {
                this.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.CONFIGURATION_IMPORTED,
                    STATUS_COLORS.SUCCESS
                );

                // Refresh the configuration UI to show imported values
                setTimeout(() => {
                    this.refreshConfigurationUI();
                }, TIMING_CONSTANTS.IMPORT_REFRESH_DELAY);

                // Notify other windows to refresh after successful import
                notifyConfigurationSaved();
            } else {
                this.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.RESTORE_FAILED,
                    STATUS_COLORS.ERROR
                );
            }
        } catch (error) {
            console.error("Error importing configuration:", error);
            if (error instanceof SyntaxError) {
                this.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.INVALID_JSON_FORMAT,
                    STATUS_COLORS.ERROR
                );
            } else {
                this.showFeedback(
                    buttonId,
                    ADMIN_FEEDBACK_MESSAGES.IMPORT_FAILED,
                    STATUS_COLORS.ERROR
                );
            }
        }
    }

    /**
     * Validate imported configuration with detailed error messages
     * @param config - Configuration object to validate
     * @returns {object} Validation result with isValid flag and error message
     */
    private validateImportedConfiguration(config: any): {
        isValid: boolean;
        errorMessage: string;
    } {
        if (!config || typeof config !== "object") {
            return {
                isValid: false,
                errorMessage: VALIDATION_MESSAGES.CONFIGURATION_INVALID_OBJECT,
            };
        }

        // Check for required top-level properties
        const requiredProperties = [
            "auth",
            "maxChallenges",
            "commands",
            "responses",
        ];
        for (const prop of requiredProperties) {
            if (!(prop in config)) {
                return {
                    isValid: false,
                    errorMessage: `Missing required property: ${prop}`,
                };
            }
        }

        // Validate auth section
        if (!config.auth || typeof config.auth !== "object") {
            return {
                isValid: false,
                errorMessage: "Auth section must be an object!",
            };
        }

        const authProps = ["twitch_channel", "twitch_oauth", "twitch_username"];
        for (const prop of authProps) {
            if (!(prop in config.auth)) {
                return {
                    isValid: false,
                    errorMessage: `Missing auth property: ${prop}`,
                };
            }
            if (typeof config.auth[prop] !== "string") {
                return {
                    isValid: false,
                    errorMessage: `Auth property ${prop} must be a string`,
                };
            }
        }

        // Validate maxChallenges
        if (
            typeof config.maxChallenges !== "number" ||
            config.maxChallenges < 1
        ) {
            return {
                isValid: false,
                errorMessage: "maxChallenges must be a positive number!",
            };
        }

        // Validate commands and responses
        if (!config.commands || typeof config.commands !== "object") {
            return {
                isValid: false,
                errorMessage: "Commands section must be an object!",
            };
        }

        if (!config.responses || typeof config.responses !== "object") {
            return {
                isValid: false,
                errorMessage: "Responses section must be an object!",
            };
        }

        return { isValid: true, errorMessage: "" };
    }

    /**
     * Refresh the configuration UI with current values
     * @returns {void}
     */
    private refreshConfigurationUI(): void {
        // Reload current configuration values into the form
        const config = this.#configManager.getAll();

        // Update auth fields
        this.setInputValue(
            ELEMENT_IDS.TWITCH_CHANNEL,
            config.auth?.twitch_channel || ""
        );
        this.setInputValue(
            ELEMENT_IDS.TWITCH_OAUTH,
            config.auth?.twitch_oauth || ""
        );
        this.setInputValue(
            ELEMENT_IDS.TWITCH_USERNAME,
            config.auth?.twitch_username || ""
        );

        // Update behavior fields
        this.setInputValue(
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
    private setInputValue(id: string, value: string): void {
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
    private getInputValue(id: string): string {
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
    private showFeedback(
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
