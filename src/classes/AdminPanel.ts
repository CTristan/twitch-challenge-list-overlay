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
    CORE_CONFIG,
} from "../types/ConfigConstants";
import {
    CSS_CLASSES,
    CSS_SELECTORS,
    ELEMENT_IDS,
    EVENT_NAMES,
    URL_HASH,
} from "../types/DOMConstants";
import {
    DEFAULT_FILENAMES,
    FILE_FORMATS,
    FILE_FORMAT_VALUES,
} from "../types/FileConstants";
import {
    ADMIN_FEEDBACK_MESSAGES,
    ADMIN_PANEL_LABELS,
    VALIDATION_MESSAGES,
} from "../types/MessageConstants";
import {
    COLOR_CONSTANTS,
    FORM_CONSTRAINTS,
    TIMING_CONSTANTS,
} from "../types/NumericConstants";
import CollapsibleSection from "../utils/CollapsibleSection";
import { notifyConfigurationSaved } from "../utils/windowRefresh";
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
        );
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

        // Create collapsible sections
        this.createAuthenticationSection(formContainer);
        this.createBehaviorSection(formContainer);
        this.createColorSection(formContainer);
        this.createBackgroundSection(formContainer);
        this.createActionsSection(formContainer);
        this.createBackupSection(formContainer);
        this.createDangerZoneSection(formContainer);

        adminContent.appendChild(formContainer);
    }

    /**
     * Create the Authentication section
     * @param container - The parent container element
     */
    private createAuthenticationSection(container: HTMLElement): void {
        const authContent = `
          <div class="form-group">
            <label for="${ELEMENT_IDS.TWITCH_OAUTH}">Twitch OAuth Token:</label>
            <input type="password" id="${ELEMENT_IDS.TWITCH_OAUTH}" class="${CSS_CLASSES.FORM_INPUT}" placeholder="OAuth Token">
          </div>
          <div class="form-group">
            <label for="${ELEMENT_IDS.TWITCH_USERNAME}">Twitch Username:</label>
            <input type="text" id="${ELEMENT_IDS.TWITCH_USERNAME}" class="${CSS_CLASSES.FORM_INPUT}" placeholder="Username">
          </div>
          <div class="form-group">
            <label for="${ELEMENT_IDS.TWITCH_CHANNEL}">Twitch Channel:</label>
            <input type="text" id="${ELEMENT_IDS.TWITCH_CHANNEL}" class="${CSS_CLASSES.FORM_INPUT}" placeholder="Channel">
          </div>
        `;

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
        const behaviorContent = `
          <div class="form-group">
            <label for="${ELEMENT_IDS.MAX_CHALLENGES}">Max Challenges:</label>
            <input type="number" id="${ELEMENT_IDS.MAX_CHALLENGES}" class="${CSS_CLASSES.FORM_INPUT}" min="${FORM_CONSTRAINTS.MAX_CHALLENGES_MIN}" max="${FORM_CONSTRAINTS.MAX_CHALLENGES_MAX}">
          </div>
        `;

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
     * Create the Color Configuration section
     * @param container - The parent container element
     */
    private createColorSection(container: HTMLElement): void {
        const colorContent = `
          <div class="form-group">
            <label>Challenge Row Colors:</label>

            <!-- Primary Color Configuration -->
            <div class="color-tier-section" id="primary-color-section">
              <div class="color-tier-header">
                <input type="checkbox" id="primary-color-enabled" class="color-tier-checkbox">
                <h5 class="color-tier-title">Primary Color</h5>
              </div>
              <div class="color-pickers-container" id="primary-color-pickers">
                <div class="color-picker-group">
                  <label class="color-picker-label">Row Background</label>
                  <input type="color" id="primary-bg-color" class="form-input" value="${DEFAULT_COLORS.PRIMARY_BACKGROUND}">
                </div>
                <div class="color-picker-group">
                  <label class="color-picker-label">Text Color</label>
                  <input type="color" id="primary-text-color" class="form-input" value="${DEFAULT_COLORS.PRIMARY_TEXT}">
                </div>
              </div>
            </div>

            <!-- Secondary Color Configuration -->
            <div class="color-tier-section" id="secondary-color-section">
              <div class="color-tier-header">
                <input type="checkbox" id="secondary-color-enabled" class="color-tier-checkbox">
                <h5 class="color-tier-title">Secondary Color</h5>
              </div>
              <div class="color-pickers-container" id="secondary-color-pickers">
                <div class="color-picker-group">
                  <label class="color-picker-label">Row Background</label>
                  <input type="color" id="secondary-bg-color" class="form-input" value="${DEFAULT_COLORS.SECONDARY_BACKGROUND}">
                </div>
                <div class="color-picker-group">
                  <label class="color-picker-label">Text Color</label>
                  <input type="color" id="secondary-text-color" class="form-input" value="${DEFAULT_COLORS.SECONDARY_TEXT}">
                </div>
              </div>
            </div>

            <!-- Tertiary Color Configuration -->
            <div class="color-tier-section" id="tertiary-color-section">
              <div class="color-tier-header">
                <input type="checkbox" id="tertiary-color-enabled" class="color-tier-checkbox">
                <h5 class="color-tier-title">Tertiary Color</h5>
              </div>
              <div class="color-pickers-container" id="tertiary-color-pickers">
                <div class="color-picker-group">
                  <label class="color-picker-label">Row Background</label>
                  <input type="color" id="tertiary-bg-color" class="form-input" value="${DEFAULT_COLORS.TERTIARY_BACKGROUND}">
                </div>
                <div class="color-picker-group">
                  <label class="color-picker-label">Text Color</label>
                  <input type="color" id="tertiary-text-color" class="form-input" value="${DEFAULT_COLORS.TERTIARY_TEXT}">
                </div>
              </div>
            </div>
          </div>
        `;

        const colorSection = new CollapsibleSection({
            id: ELEMENT_IDS.COLORS_SECTION,
            title: ADMIN_PANEL_LABELS.COLOR_CONFIGURATION,
            content: colorContent,
            defaultExpanded: false, // Colors should be collapsed by default
        });

        this.#collapsibleSections.set(ELEMENT_IDS.COLORS_SECTION, colorSection);
        container.appendChild(colorSection.createElement());
    }

    /**
     * Create the Background Customization section
     * @param container - The parent container element
     */
    private createBackgroundSection(container: HTMLElement): void {
        const backgroundContent = `
          <div class="form-group">
            <label>Background Customization:</label>
            <p class="form-description">Configure global background appearance for challenge containers. These settings apply to all challenges unless overridden by row-specific colors above.</p>

            <!-- Background Color Configuration -->
            <div class="background-config-section">
              <div class="form-row">
                <div class="form-column">
                  <label class="form-label">Background Color</label>
                  <input type="color" id="challenge-background-color" class="form-input color-input" value="${DEFAULT_COLORS.CHALLENGE_BACKGROUND}">
                </div>
                <div class="form-column">
                  <label class="form-label">Opacity (%)</label>
                  <div class="opacity-control">
                    <input type="range" id="challenge-background-opacity" class="form-input opacity-slider"
                           min="0" max="100" value="70" step="5">
                    <span id="opacity-display" class="opacity-value">70%</span>
                  </div>
                </div>
              </div>

              <!-- Text Readability Configuration -->
              <div class="text-readability-section">
                <h5 class="subsection-title">Text Readability</h5>

                <div class="form-row">
                  <div class="checkbox-group">
                    <input type="checkbox" id="challenge-auto-text-color" class="form-checkbox" checked>
                    <label for="challenge-auto-text-color" class="checkbox-label">
                      Automatic text color adjustment
                      <span class="help-text">Automatically choose white or black text for optimal readability</span>
                    </label>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-column">
                    <label class="form-label">Manual Text Color Override</label>
                    <input type="color" id="challenge-text-color" class="form-input color-input" value="${DEFAULT_COLORS.CHALLENGE_TEXT}" disabled>
                    <span class="help-text">Used when automatic adjustment is disabled</span>
                  </div>
                </div>

                <div class="form-row">
                  <div class="checkbox-group">
                    <input type="checkbox" id="challenge-text-shadow" class="form-checkbox" checked>
                    <label for="challenge-text-shadow" class="checkbox-label">
                      Enhanced text readability
                      <span class="help-text">Add text shadows/outlines for better visibility on various backgrounds</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Preview Section -->
              <div class="background-preview-section">
                <h5 class="subsection-title">Preview</h5>
                <div id="background-preview" class="background-preview">
                  <div class="preview-challenge">
                    <div class="preview-checkbox"></div>
                    <div class="preview-text">
                      <div class="preview-title">Sample Challenge</div>
                      <div class="preview-description">This is how your challenges will look</div>
                      <div class="preview-progress">Progress: 3/5</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

        const backgroundSection = new CollapsibleSection({
            id: ELEMENT_IDS.BACKGROUND_SECTION,
            title: ADMIN_PANEL_LABELS.BACKGROUND_CUSTOMIZATION,
            content: backgroundContent,
            defaultExpanded: false,
        });

        this.#collapsibleSections.set(
            ELEMENT_IDS.BACKGROUND_SECTION,
            backgroundSection
        );
        container.appendChild(backgroundSection.createElement());
    }

    /**
     * Create the Actions section
     * @param container - The parent container element
     */
    private createActionsSection(container: HTMLElement): void {
        const actionsContent = `
          <div class="config-actions">
            <button id="${ELEMENT_IDS.SAVE_CONFIG_BTN}" class="admin-button">Save Configuration</button>
            <button id="${ELEMENT_IDS.RESET_CONFIG_BTN}" class="admin-button">Reset to Defaults</button>
          </div>
        `;

        const actionsSection = new CollapsibleSection({
            id: ELEMENT_IDS.ACTIONS_SECTION,
            title: ADMIN_PANEL_LABELS.CONFIGURATION_ACTIONS,
            content: actionsContent,
            defaultExpanded: true, // Actions should be expanded by default
        });

        this.#collapsibleSections.set(
            ELEMENT_IDS.ACTIONS_SECTION,
            actionsSection
        );
        container.appendChild(actionsSection.createElement());
    }

    /**
     * Create the Backup & Restore section
     * @param container - The parent container element
     */
    private createBackupSection(container: HTMLElement): void {
        const backupContent = `
          <div class="transfer-actions">
            <button id="${ELEMENT_IDS.EXPORT_JSON_BTN}" class="admin-button primary">Backup configuration</button>
            <button id="${ELEMENT_IDS.IMPORT_CONFIG_BTN}" class="admin-button primary">Restore configuration</button>
            <input type="file" id="${ELEMENT_IDS.IMPORT_FILE_INPUT}" accept=".json" style="display: none;">
          </div>
        `;

        const backupSection = new CollapsibleSection({
            id: ELEMENT_IDS.BACKUP_SECTION,
            title: ADMIN_PANEL_LABELS.CONFIGURATION_BACKUP_RESTORE,
            content: backupContent,
            defaultExpanded: false, // Backup should be collapsed by default
        });

        this.#collapsibleSections.set(
            ELEMENT_IDS.BACKUP_SECTION,
            backupSection
        );
        container.appendChild(backupSection.createElement());
    }

    /**
     * Create the Danger Zone section
     * @param container - The parent container element
     */
    private createDangerZoneSection(container: HTMLElement): void {
        const dangerContent = `
          <p class="danger-warning">The action below will permanently delete all stored configuration data. This cannot be undone.</p>
          <div class="danger-actions">
            <button id="${ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN}" class="admin-button danger">
              Clear LocalStorage
            </button>
          </div>
        `;

        const dangerSection = new CollapsibleSection({
            id: ELEMENT_IDS.DANGER_ZONE_SECTION,
            title: ADMIN_PANEL_LABELS.DANGER_ZONE,
            content: dangerContent,
            defaultExpanded: false, // Danger zone should be collapsed by default
        });

        this.#collapsibleSections.set(
            ELEMENT_IDS.DANGER_ZONE_SECTION,
            dangerSection
        );
        container.appendChild(dangerSection.createElement());
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
        const tiers = ["primary", "secondary", "tertiary"] as const;

        tiers.forEach((tier) => {
            const checkbox = document.getElementById(
                `${tier}-color-enabled`
            ) as HTMLInputElement;
            const bgColorInput = document.getElementById(
                `${tier}-bg-color`
            ) as HTMLInputElement;
            const textColorInput = document.getElementById(
                `${tier}-text-color`
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
    }

    /**
     * Populate the background configuration UI with current values
     * @param config - Configuration object with background settings
     * @returns {void}
     */
    private populateBackgroundConfiguration(config: Config): void {
        // Background color
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

        // Background opacity
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
        // If it's already a hex color, return it
        if (colorString.startsWith("#")) {
            return colorString;
        }

        // Try to extract RGB values from rgba string
        const rgbaMatch = colorString.match(
            /rgba?\(([^,]+),\s*([^,]+),\s*([^,)]+)/
        );
        if (rgbaMatch && rgbaMatch[1] && rgbaMatch[2] && rgbaMatch[3]) {
            const r = parseInt(rgbaMatch[1].trim());
            const g = parseInt(rgbaMatch[2].trim());
            const b = parseInt(rgbaMatch[3].trim());

            // Convert to hex
            const toHex = (n: number) => {
                const hex = Math.max(0, Math.min(255, n)).toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            };

            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }

        // Default fallback
        return DEFAULT_COLORS.BLACK_TEXT;
    }

    /**
     * Setup event listeners for configuration form
     * @returns {void}
     */
    private setupConfigurationEventListeners(): void {
        const saveBtn = document.getElementById(ELEMENT_IDS.SAVE_CONFIG_BTN);
        const resetBtn = document.getElementById(ELEMENT_IDS.RESET_CONFIG_BTN);

        if (saveBtn) {
            const saveHandler = () => this.saveConfiguration();
            saveBtn.addEventListener(EVENT_NAMES.CLICK, saveHandler);
            this.#eventListeners.set(ELEMENT_IDS.SAVE_CONFIG_BTN, {
                element: saveBtn,
                event: EVENT_NAMES.CLICK,
                handler: saveHandler,
            });
        }

        if (resetBtn) {
            const resetHandler = () => this.resetConfiguration();
            resetBtn.addEventListener(EVENT_NAMES.CLICK, resetHandler);
            this.#eventListeners.set(ELEMENT_IDS.RESET_CONFIG_BTN, {
                element: resetBtn,
                event: EVENT_NAMES.CLICK,
                handler: resetHandler,
            });
        }

        // Setup color tier checkbox event listeners
        this.setupColorTierEventListeners();

        // Setup background customization event listeners
        this.setupBackgroundEventListeners();
    }

    /**
     * Setup event listeners for color tier checkboxes
     * @returns {void}
     */
    private setupColorTierEventListeners(): void {
        const colorTiers = ["primary", "secondary", "tertiary"];

        colorTiers.forEach((tier) => {
            const checkbox = document.getElementById(
                `${tier}-color-enabled`
            ) as HTMLInputElement;
            const pickersContainer = document.getElementById(
                `${tier}-color-pickers`
            );
            const section = document.getElementById(`${tier}-color-section`);
            const bgColorInput = document.getElementById(
                `${tier}-bg-color`
            ) as HTMLInputElement;
            const textColorInput = document.getElementById(
                `${tier}-text-color`
            ) as HTMLInputElement;

            if (
                checkbox &&
                pickersContainer &&
                section &&
                bgColorInput &&
                textColorInput
            ) {
                // Initial state setup
                this.updateColorTierState(tier, checkbox.checked);

                // Add change event listener with proper tracking
                const changeHandler = () => {
                    this.updateColorTierState(tier, checkbox.checked);
                };
                checkbox.addEventListener("change", changeHandler);
                this.#eventListeners.set(`${tier}-color-enabled`, {
                    element: checkbox,
                    event: "change",
                    handler: changeHandler,
                });
            }
        });
    }

    /**
     * Setup event listeners for background customization controls
     * @returns {void}
     */
    private setupBackgroundEventListeners(): void {
        // Background color picker
        const backgroundColorInput = document.getElementById(
            "challenge-background-color"
        ) as HTMLInputElement;
        if (backgroundColorInput) {
            const colorHandler = () => this.updateBackgroundPreview();
            backgroundColorInput.addEventListener("input", colorHandler);
            this.#eventListeners.set("challenge-background-color", {
                element: backgroundColorInput,
                event: "input",
                handler: colorHandler,
            });
        }

        // Opacity slider
        const opacitySlider = document.getElementById(
            "challenge-background-opacity"
        ) as HTMLInputElement;
        const opacityDisplay = document.getElementById(
            ELEMENT_IDS.OPACITY_DISPLAY
        );
        if (opacitySlider && opacityDisplay) {
            const opacityHandler = () => {
                opacityDisplay.textContent = `${opacitySlider.value}%`;
                this.updateBackgroundPreview();
            };
            opacitySlider.addEventListener("input", opacityHandler);
            this.#eventListeners.set("challenge-background-opacity", {
                element: opacitySlider,
                event: "input",
                handler: opacityHandler,
            });
        }

        // Auto text color checkbox
        const autoTextColorCheckbox = document.getElementById(
            "challenge-auto-text-color"
        ) as HTMLInputElement;
        const textColorInput = document.getElementById(
            "challenge-text-color"
        ) as HTMLInputElement;
        if (autoTextColorCheckbox && textColorInput) {
            const autoTextHandler = () => {
                textColorInput.disabled = autoTextColorCheckbox.checked;
                this.updateBackgroundPreview();
            };
            autoTextColorCheckbox.addEventListener("change", autoTextHandler);
            this.#eventListeners.set("challenge-auto-text-color", {
                element: autoTextColorCheckbox,
                event: "change",
                handler: autoTextHandler,
            });
        }

        // Manual text color picker
        if (textColorInput) {
            const textColorHandler = () => this.updateBackgroundPreview();
            textColorInput.addEventListener("input", textColorHandler);
            this.#eventListeners.set("challenge-text-color", {
                element: textColorInput,
                event: "input",
                handler: textColorHandler,
            });
        }

        // Text shadow checkbox
        const textShadowCheckbox = document.getElementById(
            "challenge-text-shadow"
        ) as HTMLInputElement;
        if (textShadowCheckbox) {
            const shadowHandler = () => this.updateBackgroundPreview();
            textShadowCheckbox.addEventListener("change", shadowHandler);
            this.#eventListeners.set("challenge-text-shadow", {
                element: textShadowCheckbox,
                event: "change",
                handler: shadowHandler,
            });
        }

        // Initial preview update
        this.updateBackgroundPreview();
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

        // Get current values
        const backgroundColorInput = document.getElementById(
            "challenge-background-color"
        ) as HTMLInputElement;
        const opacitySlider = document.getElementById(
            "challenge-background-opacity"
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

        if (!backgroundColorInput || !opacitySlider) return;

        // Apply background color and opacity
        const backgroundColor = backgroundColorInput.value;
        const opacity = parseInt(opacitySlider.value) / 100;
        const rgbaBackground = this.convertColorToRGBA(
            backgroundColor,
            opacity
        );
        previewChallenge.style.backgroundColor = rgbaBackground;

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
     * Convert a hex color and opacity to RGBA string
     * @param hexColor - Hex color string
     * @param opacity - Opacity value (0-1)
     * @returns RGBA color string
     */
    private convertColorToRGBA(hexColor: string, opacity: number): string {
        // Simple hex to RGB conversion
        const hex = hexColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
    private updateColorTierState(tier: string, enabled: boolean): void {
        const pickersContainer = document.getElementById(
            `${tier}-color-pickers`
        );
        const bgColorInput = document.getElementById(
            `${tier}-bg-color`
        ) as HTMLInputElement;
        const textColorInput = document.getElementById(
            `${tier}-text-color`
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
        const defaultConfig: ColorConfigurationUI = {
            primary: {
                enabled: false,
                backgroundColor: DEFAULT_COLORS.PRIMARY_BACKGROUND,
                textColor: DEFAULT_COLORS.PRIMARY_TEXT,
            },
            secondary: {
                enabled: false,
                backgroundColor: DEFAULT_COLORS.SECONDARY_BACKGROUND,
                textColor: DEFAULT_COLORS.SECONDARY_TEXT,
            },
            tertiary: {
                enabled: false,
                backgroundColor: DEFAULT_COLORS.TERTIARY_BACKGROUND,
                textColor: DEFAULT_COLORS.TERTIARY_TEXT,
            },
        };

        if (!backgroundColors || backgroundColors.length === 0) {
            return defaultConfig;
        }

        // Multiple colors rotate through the tiers
        const tiers = ["primary", "secondary", "tertiary"] as const;

        backgroundColors.forEach((backgroundColor, index) => {
            if (index < tiers.length) {
                const tier = tiers[index];
                if (tier && defaultConfig[tier]) {
                    const textColor =
                        textColors[index] || DEFAULT_COLORS.WHITE_TEXT; // Use corresponding text color or default
                    defaultConfig[tier].enabled = true;
                    defaultConfig[tier].backgroundColor =
                        backgroundColor.trim();
                    defaultConfig[tier].textColor = textColor.trim();
                }
            }
        });

        return defaultConfig;
    }

    /**
     * Convert ColorConfigurationUI format to string array for background colors
     * @param colorConfig - ColorConfigurationUI object
     * @returns Array of background color strings
     */
    private convertUIToColors(colorConfig: ColorConfigurationUI): string[] {
        const colors: string[] = [];
        const tiers = ["primary", "secondary", "tertiary"] as const;

        tiers.forEach((tier) => {
            if (colorConfig[tier].enabled) {
                colors.push(colorConfig[tier].backgroundColor);
            }
        });

        return colors;
    }

    /**
     * Convert ColorConfigurationUI format to string array for text colors
     * @param colorConfig - ColorConfigurationUI object
     * @returns Array of text color strings
     */
    private convertUIToTextColors(colorConfig: ColorConfigurationUI): string[] {
        const colors: string[] = [];
        const tiers = ["primary", "secondary", "tertiary"] as const;

        tiers.forEach((tier) => {
            if (colorConfig[tier].enabled) {
                colors.push(colorConfig[tier].textColor);
            }
        });

        return colors;
    }

    /**
     * Get current color configuration from the UI
     * @returns ColorConfigurationUI object
     */
    private getCurrentColorConfigFromUI(): ColorConfigurationUI {
        const config: ColorConfigurationUI = {
            primary: {
                enabled:
                    (
                        document.getElementById(
                            ELEMENT_IDS.PRIMARY_COLOR_ENABLED
                        ) as HTMLInputElement
                    )?.checked || false,
                backgroundColor:
                    (
                        document.getElementById(
                            ELEMENT_IDS.PRIMARY_BG_COLOR
                        ) as HTMLInputElement
                    )?.value || DEFAULT_COLORS.PRIMARY_BACKGROUND,
                textColor:
                    (
                        document.getElementById(
                            ELEMENT_IDS.PRIMARY_TEXT_COLOR
                        ) as HTMLInputElement
                    )?.value || DEFAULT_COLORS.PRIMARY_TEXT,
            },
            secondary: {
                enabled:
                    (
                        document.getElementById(
                            ELEMENT_IDS.SECONDARY_COLOR_ENABLED
                        ) as HTMLInputElement
                    )?.checked || false,
                backgroundColor:
                    (
                        document.getElementById(
                            ELEMENT_IDS.SECONDARY_BG_COLOR
                        ) as HTMLInputElement
                    )?.value || DEFAULT_COLORS.SECONDARY_BACKGROUND,
                textColor:
                    (
                        document.getElementById(
                            ELEMENT_IDS.SECONDARY_TEXT_COLOR
                        ) as HTMLInputElement
                    )?.value || DEFAULT_COLORS.SECONDARY_TEXT,
            },
            tertiary: {
                enabled:
                    (
                        document.getElementById(
                            ELEMENT_IDS.TERTIARY_COLOR_ENABLED
                        ) as HTMLInputElement
                    )?.checked || false,
                backgroundColor:
                    (
                        document.getElementById(
                            ELEMENT_IDS.TERTIARY_BG_COLOR
                        ) as HTMLInputElement
                    )?.value || DEFAULT_COLORS.TERTIARY_BACKGROUND,
                textColor:
                    (
                        document.getElementById(
                            ELEMENT_IDS.TERTIARY_TEXT_COLOR
                        ) as HTMLInputElement
                    )?.value || DEFAULT_COLORS.TERTIARY_TEXT,
            },
        };

        return config;
    }

    /**
     * Get current background configuration from the UI
     * @returns Background configuration object
     */
    private getCurrentBackgroundConfigFromUI(): {
        challengeBackgroundColor: string;
        challengeBackgroundOpacity: number;
        challengeTextColor: string;
        challengeAutoTextColor: boolean;
        challengeTextShadow: boolean;
    } {
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

        // Combine color and opacity into RGBA format
        const backgroundColor =
            backgroundColorInput?.value || DEFAULT_COLORS.CHALLENGE_BACKGROUND;
        const opacity = opacitySlider
            ? parseInt(opacitySlider.value) / 100
            : BACKGROUND_DEFAULTS.BACKGROUND_OPACITY;
        const rgbaBackgroundColor = this.convertColorToRGBA(
            backgroundColor,
            opacity
        );

        return {
            challengeBackgroundColor: rgbaBackgroundColor,
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
     * Save configuration from form inputs
     * @returns {void}
     */
    private saveConfiguration(): void {
        try {
            // Get form values
            const authConfig = {
                twitch_oauth: this.getInputValue(ELEMENT_IDS.TWITCH_OAUTH),
                twitch_username: this.getInputValue(
                    ELEMENT_IDS.TWITCH_USERNAME
                ),
                twitch_channel: this.getInputValue(ELEMENT_IDS.TWITCH_CHANNEL),
            };

            const maxChallenges = parseInt(
                this.getInputValue(ELEMENT_IDS.MAX_CHALLENGES),
                10
            );

            // Get color configuration from new UI
            const colorConfig = this.getCurrentColorConfigFromUI();
            const challengeRowColors = this.convertUIToColors(colorConfig);
            const challengeRowTextColors =
                this.convertUIToTextColors(colorConfig);

            // Get background configuration from UI
            const backgroundConfig = this.getCurrentBackgroundConfigFromUI();

            // Update configuration
            const authSuccess = this.#configManager.set(
                CORE_CONFIG.AUTH,
                authConfig
            );
            const maxChallengesSuccess = this.#configManager.set(
                CORE_CONFIG.MAX_CHALLENGES,
                maxChallenges
            );
            const colorsSuccess = this.#configManager.set(
                CORE_CONFIG.CHALLENGE_ROW_COLORS,
                challengeRowColors
            );
            const textColorsSuccess = this.#configManager.set(
                CORE_CONFIG.CHALLENGE_ROW_TEXT_COLORS,
                challengeRowTextColors
            );

            // Update background configuration
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

            // Check if all configuration updates were successful
            if (
                authSuccess &&
                maxChallengesSuccess &&
                colorsSuccess &&
                textColorsSuccess &&
                backgroundColorSuccess &&
                backgroundOpacitySuccess &&
                textColorSuccess &&
                autoTextColorSuccess &&
                textShadowSuccess
            ) {
                // Visual feedback
                this.showFeedback(
                    ELEMENT_IDS.SAVE_CONFIG_BTN,
                    ADMIN_FEEDBACK_MESSAGES.SAVED,
                    STATUS_COLORS.SUCCESS
                );

                // Notify other windows to refresh after successful save
                notifyConfigurationSaved();
            } else {
                // Some configuration updates failed
                console.error("Some configuration updates failed");
                this.showFeedback(
                    ELEMENT_IDS.SAVE_CONFIG_BTN,
                    ADMIN_FEEDBACK_MESSAGES.PARTIAL_SAVE_ERROR,
                    STATUS_COLORS.ERROR
                );
            }
        } catch (error) {
            console.error("Error saving configuration:", error);
            this.showFeedback(
                ELEMENT_IDS.SAVE_CONFIG_BTN,
                ADMIN_FEEDBACK_MESSAGES.ERROR,
                STATUS_COLORS.ERROR
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
