import type App from "../app";
import { ELEMENT_IDS, EVENT_NAMES, URL_HASH } from "../types/DOMConstants";
import { FILE_FORMATS } from "../types/FileConstants";
import { AdminPanelAutoSave } from "../utils/AdminPanelAutoSave";
import { AdminPanelBackgroundPreview } from "../utils/AdminPanelBackgroundPreview";
import { AdminPanelClearStorage } from "../utils/AdminPanelClearStorage";
import { AdminPanelColorTierManager } from "../utils/AdminPanelColorTierManager";
import { AdminPanelEventSetup } from "../utils/AdminPanelEventSetup";
import { AdminPanelImportExport } from "../utils/AdminPanelImportExport";
import { AdminPanelSectionBuilder } from "../utils/AdminPanelSectionBuilder";
import { AdminPanelUIPopulator } from "../utils/AdminPanelUIPopulator";
import CollapsibleSection from "../utils/CollapsibleSection";
import ConfigManager from "./ConfigManager";

/**
 * @class AdminPanel
 * @property {App} app - The main application instance
 * @property {ConfigManager} configManager - Configuration manager instance
 * @method initialize - Initialize the admin panel functionality
 * @method clearLocalStorage - Clear all localStorage data
 * @method setupConfigurationUI - Setup configuration editing interface
 */
export default class AdminPanel {
    #configManager: ConfigManager;
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

        this.setupConfigurationUI();

        // Setup controls after UI is created
        this.setupBasicControls();
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
            const handler = () =>
                AdminPanelClearStorage.clearLocalStorage(this.#configManager);
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
        AdminPanelSectionBuilder.createConfigurationForm(
            this.#collapsibleSections
        );
        AdminPanelUIPopulator.populateConfigurationForm(this.#configManager);
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
            const handler = () =>
                AdminPanelImportExport.exportConfiguration(
                    FILE_FORMATS.JSON,
                    this.#configManager
                );
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
                    AdminPanelImportExport.importFromFile(
                        importFileInput,
                        this.#configManager,
                        () =>
                            AdminPanelUIPopulator.populateConfigurationForm(
                                this.#configManager
                            )
                    );
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
     * Setup event listeners for configuration form with auto-save
     * @returns {void}
     */
    private setupConfigurationEventListeners(): void {
        const resetBtn = document.getElementById(ELEMENT_IDS.RESET_CONFIG_BTN);

        if (resetBtn) {
            const resetHandler = () =>
                AdminPanelImportExport.resetConfiguration(
                    this.#configManager,
                    () =>
                        AdminPanelUIPopulator.populateConfigurationForm(
                            this.#configManager
                        )
                );
            resetBtn.addEventListener(EVENT_NAMES.CLICK, resetHandler);
            this.#eventListeners.set(ELEMENT_IDS.RESET_CONFIG_BTN, {
                element: resetBtn,
                event: EVENT_NAMES.CLICK,
                handler: resetHandler,
            });
        }

        // Setup auto-save for authentication fields
        AdminPanelEventSetup.setupAuthenticationAutoSave(() =>
            AdminPanelAutoSave.autoSaveAuthConfiguration(this.#configManager)
        );

        // Setup auto-save for behavior fields
        AdminPanelEventSetup.setupBehaviorAutoSave(() =>
            AdminPanelAutoSave.autoSaveBehaviorConfiguration(
                this.#configManager
            )
        );

        // Setup color tier checkbox event listeners with auto-save
        AdminPanelEventSetup.setupColorTierEventListeners(
            (tier, enabled) =>
                AdminPanelColorTierManager.updateColorTierState(tier, enabled),
            () =>
                AdminPanelAutoSave.autoSaveColorConfiguration(
                    this.#configManager
                ),
            () => AdminPanelBackgroundPreview.updateBackgroundPreview()
        );

        // Setup row colors opacity event listener with auto-save
        AdminPanelEventSetup.setupRowColorsOpacityEventListener(() =>
            AdminPanelAutoSave.autoSaveColorConfiguration(this.#configManager)
        );

        // Setup background customization event listeners with auto-save
        AdminPanelEventSetup.setupBackgroundEventListeners(
            () =>
                AdminPanelAutoSave.autoSaveBackgroundConfiguration(
                    this.#configManager
                ),
            () => AdminPanelBackgroundPreview.updateBackgroundPreview()
        );
    }
}
