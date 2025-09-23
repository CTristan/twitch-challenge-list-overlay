import type App from "../app";
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
        if (window.location.hash !== "#admin") {
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
            "hashchange",
            () => {
                if (window.location.hash === "#admin") {
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
        const clearButton = document.getElementById("clear-localstorage-btn");
        if (clearButton) {
            const handler = () => this.clearLocalStorage();
            clearButton.addEventListener("click", handler);
            this.#eventListeners.set("clear-localstorage-btn", {
                element: clearButton,
                event: "click",
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
        const exportJsonBtn = document.getElementById("export-json-btn");

        if (exportJsonBtn) {
            const handler = () => this.exportConfiguration("json");
            exportJsonBtn.addEventListener("click", handler);
            this.#eventListeners.set("export-json-btn", {
                element: exportJsonBtn,
                event: "click",
                handler,
            });
        }
    }

    /**
     * Setup import controls
     * @returns {void}
     */
    private setupImportControls(): void {
        const importConfigBtn = document.getElementById("import-config-btn");
        const importFileInput = document.getElementById(
            "import-file-input"
        ) as HTMLInputElement;

        // Handle import button click - trigger file picker
        if (importConfigBtn && importFileInput) {
            const clickHandler = () => {
                importFileInput.click();
            };
            importConfigBtn.addEventListener("click", clickHandler);
            this.#eventListeners.set("import-config-btn", {
                element: importConfigBtn,
                event: "click",
                handler: clickHandler,
            });

            // Handle file selection
            const changeHandler = () => {
                if (importFileInput.files?.length) {
                    this.importFromFile(importFileInput);
                }
            };
            importFileInput.addEventListener("change", changeHandler);
            this.#eventListeners.set("import-file-input", {
                element: importFileInput,
                event: "change",
                handler: changeHandler,
            });
        }
    }

    /**
     * Create the configuration form HTML
     * @returns {void}
     */
    private createConfigurationForm(): void {
        const adminContent = document.querySelector(".admin-content");
        if (!adminContent) return;

        // Check if form already exists
        if (document.getElementById("config-form")) return;

        const formHTML = `
      <div id="config-form" class="config-form">
        <h3>Configuration Settings</h3>

        <div class="config-section">
          <h4>Authentication</h4>
          <div class="form-group">
            <label for="twitch-oauth">Twitch OAuth Token:</label>
            <input type="password" id="twitch-oauth" class="form-input" placeholder="OAuth Token">
          </div>
          <div class="form-group">
            <label for="twitch-username">Twitch Username:</label>
            <input type="text" id="twitch-username" class="form-input" placeholder="Username">
          </div>
          <div class="form-group">
            <label for="twitch-channel">Twitch Channel:</label>
            <input type="text" id="twitch-channel" class="form-input" placeholder="Channel">
          </div>
        </div>

        <div class="config-section">
          <h4>Behavior Settings</h4>
          <div class="form-group">
            <label for="max-challenges">Max Challenges:</label>
            <input type="number" id="max-challenges" class="form-input" min="1" max="50">
          </div>
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
                  <input type="color" id="primary-bg-color" class="form-input" value="#ff0000">
                </div>
                <div class="color-picker-group">
                  <label class="color-picker-label">Text Color</label>
                  <input type="color" id="primary-text-color" class="form-input" value="#ffffff">
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
                  <input type="color" id="secondary-bg-color" class="form-input" value="#00ff00">
                </div>
                <div class="color-picker-group">
                  <label class="color-picker-label">Text Color</label>
                  <input type="color" id="secondary-text-color" class="form-input" value="#ffffff">
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
                  <input type="color" id="tertiary-bg-color" class="form-input" value="#0000ff">
                </div>
                <div class="color-picker-group">
                  <label class="color-picker-label">Text Color</label>
                  <input type="color" id="tertiary-text-color" class="form-input" value="#ffffff">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="config-actions">
          <button id="save-config-btn" class="admin-button">Save Configuration</button>
          <button id="reset-config-btn" class="admin-button">Reset to Defaults</button>
        </div>

        <div class="config-transfer-section">
          <h4>Configuration Backup & Restore</h4>
          <div class="transfer-actions">
            <button id="export-json-btn" class="admin-button primary">Backup configuration</button>
            <button id="import-config-btn" class="admin-button primary">Restore configuration</button>
            <input type="file" id="import-file-input" accept=".json" style="display: none;">
          </div>
        </div>

        <!-- Danger Zone Section -->
        <div class="danger-zone-section">
          <h4>Danger Zone</h4>
          <p class="danger-warning">The action below will permanently delete all stored configuration data. This cannot be undone.</p>
          <div class="danger-actions">
            <button id="clear-localstorage-btn" class="admin-button danger">
              Clear LocalStorage
            </button>
          </div>
        </div>
      </div>
    `;

        adminContent.insertAdjacentHTML("beforeend", formHTML);
    }

    /**
     * Populate the configuration form with current values
     * @returns {void}
     */
    private populateConfigurationForm(): void {
        const config = this.#configManager.getAll();

        // Populate auth fields
        this.setInputValue("twitch-oauth", config.auth?.twitch_oauth || "");
        this.setInputValue(
            "twitch-username",
            config.auth?.twitch_username || ""
        );
        this.setInputValue("twitch-channel", config.auth?.twitch_channel || "");

        // Populate behavior fields
        this.setInputValue(
            "max-challenges",
            config.maxChallenges?.toString() || "10"
        );

        // Populate color configuration
        this.populateColorConfiguration(
            config.challengeRowColors || [],
            config.challengeRowTextColors || []
        );
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
     * Setup event listeners for configuration form
     * @returns {void}
     */
    private setupConfigurationEventListeners(): void {
        const saveBtn = document.getElementById("save-config-btn");
        const resetBtn = document.getElementById("reset-config-btn");

        if (saveBtn) {
            const saveHandler = () => this.saveConfiguration();
            saveBtn.addEventListener("click", saveHandler);
            this.#eventListeners.set("save-config-btn", {
                element: saveBtn,
                event: "click",
                handler: saveHandler,
            });
        }

        if (resetBtn) {
            const resetHandler = () => this.resetConfiguration();
            resetBtn.addEventListener("click", resetHandler);
            this.#eventListeners.set("reset-config-btn", {
                element: resetBtn,
                event: "click",
                handler: resetHandler,
            });
        }

        // Setup color tier checkbox event listeners
        this.setupColorTierEventListeners();
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
                backgroundColor: "#ff0000",
                textColor: "#ffffff",
            },
            secondary: {
                enabled: false,
                backgroundColor: "#00ff00",
                textColor: "#ffffff",
            },
            tertiary: {
                enabled: false,
                backgroundColor: "#0000ff",
                textColor: "#ffffff",
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
                    const textColor = textColors[index] || "#ffffff"; // Use corresponding text color or default
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
                            "primary-color-enabled"
                        ) as HTMLInputElement
                    )?.checked || false,
                backgroundColor:
                    (
                        document.getElementById(
                            "primary-bg-color"
                        ) as HTMLInputElement
                    )?.value || "#ff0000",
                textColor:
                    (
                        document.getElementById(
                            "primary-text-color"
                        ) as HTMLInputElement
                    )?.value || "#ffffff",
            },
            secondary: {
                enabled:
                    (
                        document.getElementById(
                            "secondary-color-enabled"
                        ) as HTMLInputElement
                    )?.checked || false,
                backgroundColor:
                    (
                        document.getElementById(
                            "secondary-bg-color"
                        ) as HTMLInputElement
                    )?.value || "#00ff00",
                textColor:
                    (
                        document.getElementById(
                            "secondary-text-color"
                        ) as HTMLInputElement
                    )?.value || "#ffffff",
            },
            tertiary: {
                enabled:
                    (
                        document.getElementById(
                            "tertiary-color-enabled"
                        ) as HTMLInputElement
                    )?.checked || false,
                backgroundColor:
                    (
                        document.getElementById(
                            "tertiary-bg-color"
                        ) as HTMLInputElement
                    )?.value || "#0000ff",
                textColor:
                    (
                        document.getElementById(
                            "tertiary-text-color"
                        ) as HTMLInputElement
                    )?.value || "#ffffff",
            },
        };

        return config;
    }

    /**
     * Clear all localStorage data and update the UI
     * @returns {void}
     */
    clearLocalStorage(): void {
        try {
            const success = this.#configManager.clearStorage();

            const button = document.getElementById("clear-localstorage-btn");
            if (button) {
                const originalText = button.textContent;

                if (success) {
                    // Visual feedback for success
                    button.textContent = "Cleared!";
                    button.style.backgroundColor = "#28a745";

                    // Refresh the form with default values
                    this.populateConfigurationForm();
                } else {
                    // Visual feedback for failure
                    button.textContent = "Error!";
                    button.style.backgroundColor = "#dc3545";
                }

                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = "";
                }, 2000);
            }
        } catch (error) {
            console.error("Error clearing localStorage:", error);

            // Visual feedback for error
            const button = document.getElementById("clear-localstorage-btn");
            if (button) {
                const originalText = button.textContent;
                button.textContent = "Error!";
                button.style.backgroundColor = "#dc3545";

                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = "";
                }, 2000);
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
                twitch_oauth: this.getInputValue("twitch-oauth"),
                twitch_username: this.getInputValue("twitch-username"),
                twitch_channel: this.getInputValue("twitch-channel"),
            };

            const maxChallenges = parseInt(
                this.getInputValue("max-challenges"),
                10
            );

            // Get color configuration from new UI
            const colorConfig = this.getCurrentColorConfigFromUI();
            const challengeRowColors = this.convertUIToColors(colorConfig);
            const challengeRowTextColors =
                this.convertUIToTextColors(colorConfig);

            // Update configuration
            const authSuccess = this.#configManager.set("auth", authConfig);
            const maxChallengesSuccess = this.#configManager.set(
                "maxChallenges",
                maxChallenges
            );
            const colorsSuccess = this.#configManager.set(
                "challengeRowColors",
                challengeRowColors
            );
            const textColorsSuccess = this.#configManager.set(
                "challengeRowTextColors",
                challengeRowTextColors
            );

            // Check if all configuration updates were successful
            if (
                authSuccess &&
                maxChallengesSuccess &&
                colorsSuccess &&
                textColorsSuccess
            ) {
                // Visual feedback
                this.showFeedback("save-config-btn", "Saved!", "#28a745");

                // Notify other windows to refresh after successful save
                notifyConfigurationSaved();
            } else {
                // Some configuration updates failed
                console.error("Some configuration updates failed");
                this.showFeedback(
                    "save-config-btn",
                    "Partial Save Error!",
                    "#dc3545"
                );
            }
        } catch (error) {
            console.error("Error saving configuration:", error);
            this.showFeedback("save-config-btn", "Error!", "#dc3545");
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
                this.showFeedback("reset-config-btn", "Reset!", "#28a745");

                // Notify other windows to refresh after successful reset
                notifyConfigurationSaved();
            } else {
                console.error("Configuration reset failed");
                this.showFeedback(
                    "reset-config-btn",
                    "Reset Failed!",
                    "#dc3545"
                );
            }
        } catch (error) {
            console.error("Error resetting configuration:", error);
            this.showFeedback("reset-config-btn", "Error!", "#dc3545");
        }
    }

    /**
     * Backup configuration as JSON
     * @param format - Export format (only "json" is supported)
     * @returns {void}
     */
    private exportConfiguration(format: string): void {
        if (format !== "json") {
            console.error(
                `Unsupported export format: ${format}. Only JSON export is supported.`
            );
            return;
        }

        try {
            const config = this.#configManager.export();
            this.#configExporter = new ConfigExporter(config);

            const success = this.#configExporter.downloadAsJSON(
                "twitch-overlay-config.json"
            );
            const buttonId = "export-json-btn";

            if (success) {
                this.showFeedback(buttonId, "Exported!", "#28a745");
            } else {
                this.showFeedback(buttonId, "Failed!", "#dc3545");
            }
        } catch (error) {
            console.error("Error exporting configuration:", error);
            this.showFeedback("export-json-btn", "Error!", "#dc3545");
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
                "import-config-btn",
                "No file selected!",
                "#dc3545"
            );
            return;
        }

        if (!file.name.toLowerCase().endsWith(".json")) {
            this.showFeedback(
                "import-config-btn",
                "Please select a JSON file!",
                "#dc3545"
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
                    "import-config-btn",
                    "Error reading file!",
                    "#dc3545"
                );
            }
        };

        reader.onerror = () => {
            this.showFeedback(
                "import-config-btn",
                "Error reading file!",
                "#dc3545"
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
                    "#dc3545"
                );
                return;
            }

            // Restore configuration using ConfigManager
            const success = this.#configManager.import(configToImport);

            if (success) {
                this.showFeedback(
                    buttonId,
                    "Configuration imported successfully!",
                    "#28a745"
                );

                // Refresh the configuration UI to show imported values
                setTimeout(() => {
                    this.refreshConfigurationUI();
                }, 1000);

                // Notify other windows to refresh after successful import
                notifyConfigurationSaved();
            } else {
                this.showFeedback(
                    buttonId,
                    "Failed to restore configuration!",
                    "#dc3545"
                );
            }
        } catch (error) {
            console.error("Error importing configuration:", error);
            if (error instanceof SyntaxError) {
                this.showFeedback(buttonId, "Invalid JSON format!", "#dc3545");
            } else {
                this.showFeedback(buttonId, "Import failed!", "#dc3545");
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
                errorMessage: "Configuration must be a valid object!",
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
        this.setInputValue("twitch-channel", config.auth?.twitch_channel || "");
        this.setInputValue("twitch-oauth", config.auth?.twitch_oauth || "");
        this.setInputValue(
            "twitch-username",
            config.auth?.twitch_username || ""
        );

        // Update behavior fields
        this.setInputValue(
            "max-challenges",
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
