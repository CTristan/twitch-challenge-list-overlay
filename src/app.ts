import { animateScroll } from "./animations/animateScroll";
import Challenge from "./classes/Challenge";
import ChallengeList from "./classes/ChallengeList";
import ConfigManager from "./classes/ConfigManager";
import { closeModal, openModal } from "./modal";
import { loadStyles } from "./styleLoader";
import {
    BACKGROUND_CONFIG,
    BACKGROUND_DEFAULTS,
    BEHAVIOR_CONFIG,
    COLOR_CONFIG,
    RESPONSE_CONFIG,
} from "./types/ConfigConstants";
import type { CSSClassValue } from "./types/DOMConstants";
import {
    BUTTON_TEXT,
    COMMAND_CONSTANTS,
    COMMON_STRINGS,
    CSS_CLASSES,
    CSS_SELECTORS,
    DATA_ATTRIBUTES,
    ELEMENT_IDS,
    EVENT_NAMES,
    HTML_ATTRIBUTE_NAMES,
    HTML_ATTRIBUTES,
    HTML_ELEMENTS,
    KEYBOARD_KEYS,
    MODAL_MODES,
    URL_HASH,
} from "./types/DOMConstants";
import {
    ARIA_LABELS,
    ERROR_MESSAGES,
    MODAL_TEXT,
    STATUS_MESSAGES,
    UI_ELEMENTS,
} from "./types/MessageConstants";
import { TIMING_CONSTANTS } from "./types/NumericConstants";
import { TimerEndBehavior } from "./types/TimerEndBehavior";
import {
    VALIDATION_CONSTRAINTS,
    VALIDATION_PATTERNS,
} from "./types/ValidationConstants";
import ChallengeRenderer from "./utils/ChallengeRenderer";
import { combineColorWithOpacity } from "./utils/ColorUtils";
import CommandHandler from "./utils/CommandHandler";
import { getDefaultMaxChallenges } from "./utils/ConfigDefaults";
import DOMHelper from "./utils/DOMHelper";
import TimerController from "./utils/TimerController";
import TimerDisplayUtils from "./utils/TimerDisplayUtils";
import UIUpdateHandler from "./utils/UIUpdateHandler";
import {
    isAdminPanelConnected,
    notifyChallengeStateChanged,
} from "./utils/windowRefresh";

// Commands and responses are loaded from ConfigManager

/**
 * @class App
 * @property {ChallengeList} challengeList - The challenge list
 * @method render - Render the challenge list to the DOM
 * @method chatHandler - Handles chat commands and responses
 */
export default class App {
    #configManager: ConfigManager;
    challengeList: ChallengeList;
    #commandHandler: CommandHandler;
    #uiUpdateHandler: UIUpdateHandler;
    #timerController: TimerController;

    // Track challenges being processed
    private processingCheckboxClicks = new Set<string>();

    // Track delete confirmation timeout handles per button
    private deleteConfirmationTimers: WeakMap<HTMLElement, number> =
        new WeakMap();

    // Track current editing challenge ID for modal mode switching
    private editingChallengeId: string | null = null;

    // Connection warning interval for periodic checks
    private connectionWarningInterval: number | null = null;

    /**
     * @constructor
     * @param {string} storeName - The store name
     */
    constructor(storeName: string) {
        this.#configManager = ConfigManager.getInstance();
        this.challengeList = new ChallengeList(storeName);
        this.#commandHandler = new CommandHandler(
            this.challengeList,
            this.#configManager
        );
        this.#uiUpdateHandler = new UIUpdateHandler(
            this.challengeList,
            this.#configManager,
            this.handleEditIconClick,
            this.handleIncrementButtonClick,
            this.handleDecrementButtonClick,
            this.handleCompleteButtonClick,
            this.handleFailButtonClick,
            this.handleUncompleteButtonClick,
            this.handleUnfailButtonClick,
            this.handleDeleteButtonClick
        );
        this.#timerController = new TimerController(this.challengeList);
        loadStyles(this.#configManager.getAll());

        // Setup listener for challenge list refresh events from other windows
        this.setupChallengeListRefreshListener();
    }

    /**
     * Get the ConfigManager instance for testing purposes
     * @returns {ConfigManager} The ConfigManager instance
     */
    getConfigManager(): ConfigManager {
        return this.#configManager;
    }

    /**
     * Setup listener for challenge list refresh events from other windows
     * This enables real-time synchronization when challenges are updated in admin mode
     * @returns {void}
     */
    private setupChallengeListRefreshListener(): void {
        window.addEventListener(
            EVENT_NAMES.CHALLENGE_LIST_REFRESH,
            this.handleChallengeListRefresh
        );
    }

    /**
     * Setup connection warning indicator for viewer mode
     * Shows a warning when admin panel is not connected (API unavailable, not loaded, or not responding)
     * Only runs in viewer mode (not admin mode)
     * @returns {void}
     */
    private setupConnectionWarning(): void {
        // Only show warning in viewer mode
        if (window.location.hash === URL_HASH.ADMIN) {
            return;
        }

        // Check if warning element already exists (prevent duplicates on multiple render calls)
        if (document.getElementById(ELEMENT_IDS.CONNECTION_WARNING)) {
            return;
        }

        // Create warning element
        const warningElement = document.createElement(HTML_ELEMENTS.DIV);
        warningElement.id = ELEMENT_IDS.CONNECTION_WARNING;
        warningElement.className = CSS_CLASSES.CONNECTION_WARNING;
        warningElement.textContent = UI_ELEMENTS.CONNECTION_WARNING_TEXT;

        // Add to DOM
        const appElement = document.getElementById(ELEMENT_IDS.APP);
        if (appElement) {
            appElement.appendChild(warningElement);
        }

        // Initial visibility check
        this.updateConnectionWarningVisibility();

        // Set up periodic checks (every 10 seconds) only if not already set up
        if (this.connectionWarningInterval === null) {
            this.connectionWarningInterval = window.setInterval(() => {
                this.updateConnectionWarningVisibility();
            }, 10000);

            // Clean up interval on window unload
            window.addEventListener(EVENT_NAMES.BEFOREUNLOAD, () => {
                this.cleanupConnectionWarning();
            });
        }
    }

    /**
     * Update the visibility of the connection warning based on admin panel connection status
     * Shows warning if:
     * - BroadcastChannel API is unavailable, OR
     * - Admin panel is not loaded/open, OR
     * - Admin panel is not responding to heartbeat messages
     * @returns {void}
     */
    private updateConnectionWarningVisibility(): void {
        const warningElement = document.getElementById(
            ELEMENT_IDS.CONNECTION_WARNING
        );
        if (!warningElement) {
            return;
        }

        // Check if admin panel is connected (includes API availability and heartbeat check)
        const isConnected = isAdminPanelConnected();

        // Show warning if admin panel is not connected
        if (isConnected) {
            warningElement.classList.add(CSS_CLASSES.CONNECTION_WARNING_HIDDEN);
        } else {
            warningElement.classList.remove(
                CSS_CLASSES.CONNECTION_WARNING_HIDDEN
            );
        }
    }

    /**
     * Clean up connection warning resources
     * @returns {void}
     */
    private cleanupConnectionWarning(): void {
        if (this.connectionWarningInterval !== null) {
            window.clearInterval(this.connectionWarningInterval);
            this.connectionWarningInterval = null;
        }
    }

    /**
     * Handle challenge list refresh event from other windows
     * Reloads the challenge list from localStorage and re-renders the DOM
     * @returns {void}
     */
    private handleChallengeListRefresh = (): void => {
        // Reload the challenge list from localStorage
        this.challengeList.loadFromLocalStorage();

        // Re-render the challenge list to reflect the changes
        this.renderChallengeList();

        // Re-enable admin checkbox interaction if in admin mode
        if (window.location.hash === URL_HASH.ADMIN) {
            this.enableAdminCheckboxInteraction();
        }
    };

    /**
     * Initial render the components to the DOM. Should only be called once.
     * @returns {void}
     */
    render(): void {
        this.#uiUpdateHandler.renderChallengeList();

        // Setup admin mode features after rendering
        this.enableAdminCheckboxInteraction();

        // Setup connection warning for viewer mode
        this.setupConnectionWarning();
    }

    /**
     * Update the challenge count in existing card headers
     * @returns {void}
     */
    updateChallengeCount(): void {
        // Use shared helper with efficient getters from ChallengeList
        DOMHelper.updateChallengeCount(
            this.challengeList.challengesCompleted,
            this.challengeList.totalChallenges
        );
    }

    /**
     * Render the challenge list to the DOM
     * @returns {void}
     */
    renderChallengeList(): void {
        // Always create the challenge card with header, even when there are no challenges
        // This ensures the "Challenges" header remains visible in all states (including 0/0)
        const cardEl = DOMHelper.createChallengeCard(
            this.challengeList.challengesCompleted,
            this.challengeList.totalChallenges
        );
        const list = cardEl.querySelector("ol");

        if (!list) {
            console.error(ERROR_MESSAGES.CHALLENGE_LIST_ELEMENT_NOT_FOUND);
            return;
        }

        // Get background customization configuration
        const backgroundConfig = {
            overlayBackgroundColor: this.#configManager.get(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_COLOR
            ),
            overlayBackgroundOpacity: this.#configManager.get(
                BACKGROUND_CONFIG.OVERLAY_BACKGROUND_OPACITY
            ),
            challengeBackgroundColor: this.#configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_COLOR
            ),
            challengeBackgroundOpacity: this.#configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_BACKGROUND_OPACITY
            ),
            challengeTextColor: this.#configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_COLOR
            ),
            challengeAutoTextColor: this.#configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_AUTO_TEXT_COLOR
            ),
            challengeTextShadow: this.#configManager.get(
                BACKGROUND_CONFIG.CHALLENGE_TEXT_SHADOW
            ),
        };

        const isAdminMode = window.location.hash === URL_HASH.ADMIN;
        const adminTextOnlyMode =
            isAdminMode &&
            (this.#configManager.get(BEHAVIOR_CONFIG.ADMIN_TEXT_ONLY_MODE) ??
                false);

        if (adminTextOnlyMode) {
            cardEl.classList.add(CSS_CLASSES.ADMIN_TEXT_ONLY_CARD);
        } else if (isAdminMode) {
            cardEl.classList.add(CSS_CLASSES.ADMIN_STANDARD_CARD);
        }

        // Apply overlay background styling if configured
        // This must be done outside the challenges.length check to ensure it's always applied
        if (backgroundConfig.overlayBackgroundColor) {
            // Combine color and opacity to create RGBA string
            const overlayBackgroundRGBA = combineColorWithOpacity(
                backgroundConfig.overlayBackgroundColor,
                backgroundConfig.overlayBackgroundOpacity ??
                    BACKGROUND_DEFAULTS.OVERLAY_BACKGROUND_OPACITY
            );
            cardEl.style.backgroundColor = overlayBackgroundRGBA;
            cardEl.classList.add(CSS_CLASSES.CUSTOM_OVERLAY_BACKGROUND);
        }

        // Only populate the list with challenge items if there are challenges
        if (this.challengeList.challenges.length > 0) {
            // Create DocumentFragment for batch DOM operations to reduce reflows
            const fragment = document.createDocumentFragment();

            // Cache color arrays outside the loop to avoid repeated ConfigManager calls
            const rowColors =
                this.#configManager.get(COLOR_CONFIG.CHALLENGE_ROW_COLORS) ||
                [];
            const rowTextColors =
                this.#configManager.get(
                    COLOR_CONFIG.CHALLENGE_ROW_TEXT_COLORS
                ) || [];
            const rowColorsOpacity =
                this.#configManager.get(
                    COLOR_CONFIG.CHALLENGE_ROW_COLORS_OPACITY
                ) ?? BACKGROUND_DEFAULTS.ROW_COLORS_OPACITY;

            this.challengeList
                .getAllChallenges()
                .forEach((challenge, index) => {
                    // Use ChallengeRenderer for consistent element creation
                    // Pass displayPosition as index + 1 for 1-based numbering

                    const options: {
                        displayPosition: number;
                        includeCheckbox: boolean;
                        includeEventListeners?: boolean;
                        editHandler?: (event: Event) => void;
                        incrementHandler?: (event: Event) => void;
                        decrementHandler?: (event: Event) => void;
                        completeHandler?: (event: Event) => void;
                        uncompleteHandler?: (event: Event) => void;
                        failHandler?: (event: Event) => void;
                        unfailHandler?: (event: Event) => void;
                        deleteHandler?: (event: Event) => void;
                        textOnlyMode?: boolean;
                    } = {
                        displayPosition: index + 1,
                        includeCheckbox: isAdminMode && !adminTextOnlyMode,
                    };

                    let listItem: HTMLElement;

                    // Add handlers in admin mode
                    if (isAdminMode) {
                        options.includeEventListeners = true;
                        options.editHandler = this.handleEditIconClick;
                        options.incrementHandler =
                            this.handleIncrementButtonClick;
                        options.decrementHandler =
                            this.handleDecrementButtonClick;
                        options.failHandler = this.handleFailButtonClick;
                        options.unfailHandler = this.handleUnfailButtonClick;
                        options.deleteHandler = this.handleDeleteButtonClick;

                        // Use completely different rendering for text-only mode
                        if (adminTextOnlyMode) {
                            options.completeHandler =
                                this.handleCompleteButtonClick;
                            options.uncompleteHandler =
                                this.handleUncompleteButtonClick;
                            // Create text-only element (no styling needed)
                            listItem =
                                ChallengeRenderer.createTextOnlyChallengeElement(
                                    challenge,
                                    options
                                );
                        } else {
                            options.textOnlyMode = adminTextOnlyMode;
                            listItem = ChallengeRenderer.createChallengeElement(
                                challenge,
                                options
                            );
                            // Apply background customization (includes row colors if configured)
                            ChallengeRenderer.applyBackgroundCustomization(
                                listItem,
                                backgroundConfig,
                                index,
                                rowColors,
                                rowTextColors,
                                rowColorsOpacity
                            );
                        }
                    } else {
                        listItem = ChallengeRenderer.createChallengeElement(
                            challenge,
                            options
                        );
                        // Apply background customization (includes row colors if configured)
                        ChallengeRenderer.applyBackgroundCustomization(
                            listItem,
                            backgroundConfig,
                            index,
                            rowColors,
                            rowTextColors,
                            rowColorsOpacity
                        );
                    }

                    // Add timer display if timer exists and is active (inside metadata row)
                    if (
                        !adminTextOnlyMode &&
                        challenge.timer &&
                        challenge.timer.isActive
                    ) {
                        const timerElement =
                            TimerDisplayUtils.createTimerElement(
                                challenge.timer,
                                challenge.id
                            );
                        // Find the metadata row and append timer to it
                        const metadataRow = listItem.querySelector(
                            CSS_SELECTORS.CHALLENGE_METADATA
                        );
                        if (metadataRow) {
                            metadataRow.appendChild(timerElement);
                        }
                    }

                    // Append to fragment instead of directly to DOM
                    fragment.appendChild(listItem);
                });

            // Single DOM append operation to reduce reflows
            list.appendChild(fragment);
        }

        // Always append the card to container
        const challengeContainer = document.querySelector(
            CSS_SELECTORS.CHALLENGE_CONTAINER
        );
        if (!challengeContainer) {
            console.error(ERROR_MESSAGES.CHALLENGE_CONTAINER_NOT_FOUND);
            return;
        }
        challengeContainer.innerHTML = COMMON_STRINGS.EMPTY;

        // Hide card in viewer mode when there are no challenges
        if (!isAdminMode && this.challengeList.challenges.length === 0) {
            cardEl.classList.add(CSS_CLASSES.HIDDEN);
        }

        challengeContainer.appendChild(cardEl);

        animateScroll();

        // Start timer updates if there are active timers
        this.startTimerUpdates();

        // Enable checkbox interaction for admin mode
        this.enableAdminCheckboxInteraction();
    }

    /**
     * Render custom text to the DOM
     * @param {string} text - The custom text to display
     * @returns {void}
     */
    renderCustomText(text: string): void {
        const customHeaderEl = document.querySelector(
            CSS_SELECTORS.CUSTOM_HEADER
        );
        const customTextEl = document.querySelector(CSS_SELECTORS.CUSTOM_TEXT);
        if (customHeaderEl) {
            customHeaderEl.classList.remove(CSS_CLASSES.HIDDEN);
        }
        if (customTextEl) {
            customTextEl.textContent = text;
        }
    }

    /**
     * Handles chat commands and responses
     * @param {string} username
     * @param {string} command
     * @param {string} message
     * @param {{broadcaster: boolean, mod: boolean}} flags
     * @param {{userColor: string, messageId?: string}} _extra
     * @returns {{error: boolean, message: string}} - Response message
     */
    chatHandler(
        username: string,
        command: string,
        message: string,
        flags: { broadcaster: boolean; mod: boolean },
        _extra: { userColor: string; messageId?: string }
    ): { error: boolean; message: string } {
        command = `${COMMAND_CONSTANTS.PREFIX}${command.toLowerCase()}`;

        // Use simple guard instead of exception for control flow
        if (
            command === COMMAND_CONSTANTS.COMMAND_PREFIX ||
            command.startsWith(COMMAND_CONSTANTS.COMMAND_PREFIX_WITH_SPACE)
        ) {
            try {
                const response = this.#commandHandler.handleCommand(
                    username,
                    command.slice(COMMAND_CONSTANTS.PREFIX_SLICE_INDEX), // Remove ! prefix
                    message,
                    flags
                );

                // Handle UI updates for commands
                this.#uiUpdateHandler.handleCommandResult(response);

                return {
                    error: response.error,
                    message: response.message,
                };
            } catch (error) {
                return respondMessage(
                    this.#configManager.get(RESPONSE_CONFIG.INVALID_COMMAND),
                    username,
                    error instanceof Error ? error.message : String(error),
                    true
                );
            }
        }

        // Direct call for invalid commands instead of throwing and catching
        return respondMessage(
            this.#configManager.get(RESPONSE_CONFIG.INVALID_COMMAND),
            username,
            COMMON_STRINGS.COMMAND_NOT_FOUND,
            true
        );
    }

    clearListFromDOM() {
        // Use UIUpdateHandler for consistent rendering instead of App's own renderChallengeList
        // This ensures all rendering goes through the same path and prevents duplicate headers
        this.#uiUpdateHandler.renderChallengeList();

        // Setup admin mode features after rendering
        this.enableAdminCheckboxInteraction();
    }

    /**
     * Add the challenge to the DOM
     * @param {Challenge} challenge
     * @returns {void}
     */
    addChallengeToDOM(challenge: Challenge): void {
        // Delegate DOM manipulation to UIUpdateHandler
        this.#uiUpdateHandler.addChallengeToDOM(challenge);

        // Handle App-specific concerns
        this.enableAdminCheckboxInteraction();
    }

    /**
     * Edit the challenge in the DOM
     * @param {Challenge} challenge
     * @returns {void}
     */
    editChallengeFromDOM(challenge: Challenge): void {
        // Delegate DOM manipulation to UIUpdateHandler
        this.#uiUpdateHandler.editChallengeFromDOM(challenge);
    }

    /**
     * Complete the challenge in the DOM
     * @param {string} challengeId
     * @returns {void}
     */
    completeChallengeFromDOM(challengeId: string): void {
        DOMHelper.completeChallengeFromDOM(challengeId);
        this.updateChallengeCount();
        this.updateTimerDisplays();
    }

    /**
     * Delete the challenge in the DOM
     * @param {string} challengeId
     * @returns {void}
     */
    deleteChallengeFromDOM(challengeId: string): void {
        DOMHelper.deleteChallengeFromDOM(challengeId);
        this.updateChallengeCount();
        this.updateTimerDisplays();
    }

    /**
     * Enable interactive checkbox functionality for admin mode
     * Uses event delegation for efficient checkbox handling
     * @returns {void}
     */
    enableAdminCheckboxInteraction(): void {
        // Only enable in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        // Use event delegation on the challenge list for efficient handling
        // This single listener handles all checkbox clicks
        const challengeList = document.querySelector(
            CSS_SELECTORS.CHALLENGES_ORDERED_LIST
        );

        if (challengeList) {
            // Remove any existing delegated listeners to prevent duplicates
            challengeList.removeEventListener(
                EVENT_NAMES.CLICK,
                this.handleDelegatedCheckboxClick
            );

            // Add single delegated listener to the challenge list
            challengeList.addEventListener(
                EVENT_NAMES.CLICK,
                this.handleDelegatedCheckboxClick
            );
        }

        // Add visual indication that checkboxes are clickable in admin mode
        const checkboxes = document.querySelectorAll(
            CSS_SELECTORS.CHALLENGE_CHECKBOX
        );
        checkboxes.forEach((checkbox) => {
            checkbox.classList.add(CSS_CLASSES.ADMIN_INTERACTIVE);
        });

        // Setup add challenge button for admin mode
        this.setupAddChallengeButton();
    }

    /**
     * Setup add challenge button for admin mode
     * Creates and manages the button visibility based on admin mode
     * @returns {void}
     */
    setupAddChallengeButton(): void {
        // Only setup in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const adminTextOnlyMode =
            this.#configManager.get(BEHAVIOR_CONFIG.ADMIN_TEXT_ONLY_MODE) ??
            false;

        // Find all challenge cards
        const challengeCards = document.querySelectorAll(CSS_SELECTORS.CARD);
        challengeCards.forEach((card) => {
            let buttonContainer = card.querySelector<HTMLElement>(
                `.${CSS_CLASSES.ADD_CHALLENGE_CONTAINER}`
            );

            if (!buttonContainer) {
                buttonContainer = document.createElement(HTML_ELEMENTS.DIV);
                buttonContainer.className = CSS_CLASSES.ADD_CHALLENGE_CONTAINER;
                card.appendChild(buttonContainer);
            }

            buttonContainer.classList.toggle(
                CSS_CLASSES.ADMIN_TEXT_ONLY_ACTION_CONTAINER,
                adminTextOnlyMode
            );

            buttonContainer.innerHTML = COMMON_STRINGS.EMPTY;

            if (adminTextOnlyMode) {
                this.renderAdminTextOnlyActions(buttonContainer);
            } else {
                this.renderStandardAdminActions(buttonContainer);
            }
        });
    }

    private renderStandardAdminActions(buttonContainer: HTMLElement): void {
        const addButton = document.createElement(HTML_ELEMENTS.BUTTON);
        addButton.className = CSS_CLASSES.ADD_CHALLENGE_BTN;
        addButton.textContent = BUTTON_TEXT.ADD_CHALLENGE;
        addButton.type = HTML_ATTRIBUTES.BUTTON_TYPE;
        addButton.addEventListener(
            EVENT_NAMES.CLICK,
            this.handleAddChallengeClick
        );

        buttonContainer.appendChild(addButton);

        const clearCompletedButton = document.createElement(
            HTML_ELEMENTS.BUTTON
        );
        clearCompletedButton.className = CSS_CLASSES.CLEAR_COMPLETED_BTN;
        clearCompletedButton.textContent = BUTTON_TEXT.CLEAR_COMPLETED;
        clearCompletedButton.type = HTML_ATTRIBUTES.BUTTON_TYPE;
        clearCompletedButton.addEventListener(
            EVENT_NAMES.CLICK,
            this.handleClearCompletedClick
        );

        buttonContainer.appendChild(clearCompletedButton);

        const clearFailedButton = document.createElement(HTML_ELEMENTS.BUTTON);
        clearFailedButton.className = CSS_CLASSES.CLEAR_FAILED_BTN;
        clearFailedButton.textContent = BUTTON_TEXT.CLEAR_FAILED;
        clearFailedButton.type = HTML_ATTRIBUTES.BUTTON_TYPE;
        clearFailedButton.addEventListener(
            EVENT_NAMES.CLICK,
            this.handleClearFailedClick
        );

        buttonContainer.appendChild(clearFailedButton);

        const refreshButton = document.createElement(HTML_ELEMENTS.BUTTON);
        refreshButton.className = CSS_CLASSES.REFRESH_BTN;
        refreshButton.textContent = BUTTON_TEXT.REFRESH;
        refreshButton.type = HTML_ATTRIBUTES.BUTTON_TYPE;
        refreshButton.addEventListener(
            EVENT_NAMES.CLICK,
            this.handleRefreshClick
        );

        buttonContainer.appendChild(refreshButton);
    }

    private renderAdminTextOnlyActions(buttonContainer: HTMLElement): void {
        const fragment = document.createDocumentFragment();

        const label = document.createElement(HTML_ELEMENTS.DIV);
        label.classList.add(CSS_CLASSES.ADMIN_TEXT_ONLY_ACTION_LABEL);
        label.textContent = UI_ELEMENTS.TEXT_ONLY_ADMIN_ACTIONS_LABEL;
        fragment.appendChild(label);

        const addAction = this.createAdminTextOnlyAction(
            UI_ELEMENTS.TEXT_ONLY_ADD_CHALLENGE_ACTION,
            CSS_CLASSES.ADMIN_TEXT_ONLY_ACTION_ADD,
            this.handleAddChallengeClick
        );
        fragment.appendChild(addAction);

        const clearCompletedAction = this.createAdminTextOnlyAction(
            UI_ELEMENTS.TEXT_ONLY_CLEAR_COMPLETED_ACTION,
            CSS_CLASSES.ADMIN_TEXT_ONLY_ACTION_CLEAR,
            this.handleClearCompletedClick
        );
        fragment.appendChild(clearCompletedAction);

        const clearFailedAction = this.createAdminTextOnlyAction(
            UI_ELEMENTS.TEXT_ONLY_CLEAR_FAILED_ACTION,
            CSS_CLASSES.ADMIN_TEXT_ONLY_ACTION_CLEAR_FAILED,
            this.handleClearFailedClick
        );
        fragment.appendChild(clearFailedAction);

        const refreshAction = this.createAdminTextOnlyAction(
            UI_ELEMENTS.TEXT_ONLY_REFRESH_ACTION,
            CSS_CLASSES.ADMIN_TEXT_ONLY_ACTION_REFRESH,
            this.handleRefreshClick
        );
        fragment.appendChild(refreshAction);

        buttonContainer.appendChild(fragment);
    }

    private createAdminTextOnlyAction(
        text: string,
        variantClass: CSSClassValue,
        handler: EventListener
    ): HTMLElement {
        const actionElement = document.createElement(HTML_ELEMENTS.DIV);
        actionElement.classList.add(
            CSS_CLASSES.ADMIN_TEXT_ONLY_ACTION,
            variantClass
        );
        actionElement.textContent = text;
        actionElement.setAttribute(
            HTML_ATTRIBUTE_NAMES.ROLE,
            HTML_ATTRIBUTES.ROLE_BUTTON
        );
        actionElement.setAttribute(
            HTML_ATTRIBUTE_NAMES.TABINDEX,
            HTML_ATTRIBUTES.TABINDEX_ZERO
        );

        actionElement.addEventListener(EVENT_NAMES.CLICK, handler);
        actionElement.addEventListener(EVENT_NAMES.KEYDOWN, (event) => {
            const keyboardEvent = event as KeyboardEvent;
            if (
                keyboardEvent.key === KEYBOARD_KEYS.ENTER ||
                keyboardEvent.key === KEYBOARD_KEYS.SPACE
            ) {
                keyboardEvent.preventDefault();
                (keyboardEvent.currentTarget as HTMLElement)?.click();
            }
        });

        return actionElement;
    }

    /**
     * Handle add challenge button click
     * Opens the add challenge modal
     * @returns {void}
     */
    private handleAddChallengeClick = (): void => {
        this.openAddChallengeModal();
    };

    /**
     * Handle refresh button click
     * Reloads the current page
     * @returns {void}
     */
    private handleRefreshClick = (): void => {
        window.location.reload();
    };

    /**
     * Handle clear completed challenges button click
     * Clears all completed challenges from the list
     * @returns {void}
     */
    private handleClearCompletedClick = (): void => {
        const completedChallenges = this.challengeList.challenges.filter((c) =>
            c.isComplete()
        );

        if (completedChallenges.length === 0) {
            return;
        }

        this.challengeList.clearDoneChallenges();
        this.renderChallengeList();
        notifyChallengeStateChanged();
    };

    /**
     * Handle clear failed challenges button click
     * Clears all failed challenges from the list
     * @returns {void}
     */
    private handleClearFailedClick = (): void => {
        const failedChallenges = this.challengeList.challenges.filter((c) =>
            c.isFailed()
        );

        if (failedChallenges.length === 0) {
            return;
        }

        this.challengeList.clearFailedChallenges();
        this.renderChallengeList();
        notifyChallengeStateChanged();
    };

    /**
     * Open the add challenge modal
     * @returns {void}
     */
    private openAddChallengeModal(): void {
        // Clear editing state
        this.editingChallengeId = null;

        // Update modal title and button text for add mode
        this.setModalMode(MODAL_MODES.ADD);

        // Clear form data
        this.clearAddChallengeForm();

        // Show modal using the updated modal function
        openModal(ELEMENT_IDS.ADD_CHALLENGE_MODAL);

        // Setup form event listeners
        this.setupAddChallengeFormListeners();
    }

    /**
     * Open the edit challenge modal
     * @param {string} challengeId - The ID of the challenge to edit
     * @returns {void}
     */
    private openEditChallengeModal(challengeId: string): void {
        // Set editing state
        this.editingChallengeId = challengeId;

        // Update modal title and button text for edit mode
        this.setModalMode(MODAL_MODES.EDIT);

        // Populate form with challenge data
        this.populateFormForEdit(challengeId);

        // Show modal using the updated modal function
        openModal(ELEMENT_IDS.ADD_CHALLENGE_MODAL);

        // Setup form event listeners
        this.setupAddChallengeFormListeners();
    }

    /**
     * Close the add/edit challenge modal
     * @returns {void}
     */
    private closeAddChallengeModal(): void {
        // Close modal using the updated modal function
        closeModal(ELEMENT_IDS.ADD_CHALLENGE_MODAL);

        // Clear form data and editing state
        this.clearAddChallengeForm();
        this.editingChallengeId = null;
    }

    /**
     * Set modal mode (add or edit)
     * @param {string} mode - The mode to set (MODAL_MODES.ADD or MODAL_MODES.EDIT)
     * @returns {void}
     */
    private setModalMode(
        mode: (typeof MODAL_MODES)[keyof typeof MODAL_MODES]
    ): void {
        const modalTitle = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_MODAL_TITLE
        );
        const submitButton = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_SUBMIT
        );

        if (modalTitle) {
            modalTitle.textContent =
                mode === MODAL_MODES.ADD
                    ? MODAL_TEXT.ADD_CHALLENGE_TITLE
                    : MODAL_TEXT.EDIT_CHALLENGE_TITLE;
        }

        if (submitButton) {
            submitButton.textContent =
                mode === MODAL_MODES.ADD
                    ? MODAL_TEXT.ADD_CHALLENGE_BUTTON
                    : MODAL_TEXT.EDIT_CHALLENGE_BUTTON;
        }
    }

    /**
     * Populate form with challenge data for editing
     * @param {string} challengeId - The ID of the challenge to edit
     * @returns {void}
     */
    private populateFormForEdit(challengeId: string): void {
        const challenge = this.challengeList.getChallengeById(challengeId);
        if (!challenge) {
            console.error(
                MODAL_TEXT.CHALLENGE_NOT_FOUND_FOR_EDIT + " for editing:",
                challengeId
            );
            return;
        }

        const titleInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TITLE
        ) as HTMLInputElement;
        const descInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_DESCRIPTION
        ) as HTMLTextAreaElement;
        const amountInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_AMOUNT
        ) as HTMLInputElement;
        const timerInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER
        ) as HTMLInputElement;
        const timerBehaviorSelect = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER_BEHAVIOR
        ) as HTMLSelectElement | null;

        // Populate title
        if (titleInput) {
            titleInput.value = challenge.title;
        }

        // Populate description
        if (descInput) {
            descInput.value = challenge.description || COMMON_STRINGS.EMPTY;
        }

        // Populate amount (only if > 1)
        if (amountInput) {
            amountInput.value =
                challenge.amount > 1
                    ? challenge.amount.toString()
                    : COMMON_STRINGS.EMPTY;
        }

        // Populate timer (format as human-readable)
        if (timerInput && challenge.timer) {
            const timerString = challenge.timer.getFormattedTime(
                challenge.timer.duration
            );
            timerInput.value = timerString;
            if (timerBehaviorSelect) {
                timerBehaviorSelect.value = challenge.getTimerEndBehavior();
            }
        } else if (timerInput) {
            timerInput.value = COMMON_STRINGS.EMPTY;
            if (timerBehaviorSelect) {
                timerBehaviorSelect.value = TimerEndBehavior.AUTO_FAIL;
            }
        }

        // Clear any error states
        [
            titleInput,
            descInput,
            amountInput,
            timerInput,
            timerBehaviorSelect,
        ].forEach((input) => {
            if (input) {
                input.classList.remove(CSS_CLASSES.ERROR);
            }
        });

        this.updateTimerBehaviorVisibility();
    }

    /**
     * Clear the add challenge form
     * @returns {void}
     */
    private clearAddChallengeForm(): void {
        const titleInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TITLE
        ) as HTMLInputElement;
        const descInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_DESCRIPTION
        ) as HTMLTextAreaElement;
        const amountInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_AMOUNT
        ) as HTMLInputElement;
        const timerInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER
        ) as HTMLInputElement;
        const timerBehaviorSelect = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER_BEHAVIOR
        ) as HTMLSelectElement | null;

        if (titleInput) titleInput.value = COMMON_STRINGS.EMPTY;
        if (descInput) descInput.value = COMMON_STRINGS.EMPTY;
        if (amountInput) amountInput.value = COMMON_STRINGS.EMPTY;
        if (timerInput) timerInput.value = COMMON_STRINGS.EMPTY;
        if (timerBehaviorSelect) {
            timerBehaviorSelect.value = TimerEndBehavior.AUTO_FAIL;
        }

        // Clear any error states
        [
            titleInput,
            descInput,
            amountInput,
            timerInput,
            timerBehaviorSelect,
        ].forEach((input) => {
            if (input) {
                input.classList.remove(CSS_CLASSES.ERROR);
            }
        });

        this.updateTimerBehaviorVisibility();
    }

    private updateTimerBehaviorVisibility(): void {
        const timerInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER
        ) as HTMLInputElement | null;
        const timerBehaviorGroup = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER_BEHAVIOR_GROUP
        );
        const timerBehaviorSelect = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER_BEHAVIOR
        ) as HTMLSelectElement | null;

        if (!timerBehaviorGroup) {
            return;
        }

        const hasTimer = Boolean(timerInput?.value?.trim());

        if (hasTimer) {
            timerBehaviorGroup.classList.remove(CSS_CLASSES.HIDDEN);
        } else {
            timerBehaviorGroup.classList.add(CSS_CLASSES.HIDDEN);
            if (timerBehaviorSelect) {
                timerBehaviorSelect.value = TimerEndBehavior.AUTO_FAIL;
                timerBehaviorSelect.classList.remove(CSS_CLASSES.ERROR);
            }
        }
    }

    /**
     * Setup form event listeners for the add challenge modal
     * @returns {void}
     */
    private setupAddChallengeFormListeners(): void {
        const form = document.getElementById(ELEMENT_IDS.ADD_CHALLENGE_FORM);
        const cancelButton = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_CANCEL
        );
        const timerInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER
        ) as HTMLInputElement | null;

        if (form) {
            // Remove existing listeners to prevent duplicates
            form.removeEventListener(
                EVENT_NAMES.SUBMIT,
                this.handleAddChallengeSubmit
            );
            form.addEventListener(
                EVENT_NAMES.SUBMIT,
                this.handleAddChallengeSubmit
            );
        }

        if (cancelButton) {
            cancelButton.removeEventListener(
                EVENT_NAMES.CLICK,
                this.handleAddChallengeCancelClick
            );
            cancelButton.addEventListener(
                EVENT_NAMES.CLICK,
                this.handleAddChallengeCancelClick
            );
        }

        if (timerInput) {
            timerInput.removeEventListener(
                EVENT_NAMES.INPUT,
                this.handleTimerInputChange
            );
            timerInput.removeEventListener(
                EVENT_NAMES.CHANGE,
                this.handleTimerInputChange
            );
            timerInput.addEventListener(
                EVENT_NAMES.INPUT,
                this.handleTimerInputChange
            );
            timerInput.addEventListener(
                EVENT_NAMES.CHANGE,
                this.handleTimerInputChange
            );
        }
    }

    private handleTimerInputChange = (): void => {
        this.updateTimerBehaviorVisibility();
    };

    /**
     * Handle add/edit challenge form submission
     * @param {Event} event - The form submit event
     * @returns {void}
     */
    private handleAddChallengeSubmit = (event: Event): void => {
        event.preventDefault();

        try {
            const challengeData = this.extractChallengeFormData();
            if (challengeData) {
                if (this.editingChallengeId) {
                    // Edit mode
                    this.updateChallengeFromForm(
                        this.editingChallengeId,
                        challengeData
                    );
                } else {
                    // Add mode
                    this.createChallengeFromForm(challengeData);
                }
                this.closeAddChallengeModal();
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.ERROR_CREATING_CHALLENGE, error);
            // Show error to user (could be enhanced with better error display)
            alert(
                error instanceof Error
                    ? error.message
                    : ERROR_MESSAGES.FAILED_TO_CREATE_CHALLENGE
            );
        }
    };

    /**
     * Handle cancel button click
     * @returns {void}
     */
    private handleAddChallengeCancelClick = (): void => {
        this.closeAddChallengeModal();
    };

    /**
     * Handle checkbox click events to toggle challenge completion status
     * @param {Event} event - The click event
     * @returns {void}
     */
    private handleCheckboxClick = (event: Event): void => {
        // Prevent event from bubbling to avoid duplicate processing
        event.stopPropagation();

        // Only handle clicks in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const checkbox = event.target as HTMLElement;
        const challengeElement = checkbox.closest(
            CSS_SELECTORS.CHALLENGE
        ) as HTMLElement;

        if (!challengeElement) {
            console.error(
                ERROR_MESSAGES.CHALLENGE_ELEMENT_NOT_FOUND_FOR_CHECKBOX
            );
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            console.error(ERROR_MESSAGES.CHALLENGE_ID_NOT_FOUND_FOR_CHECKBOX);
            return;
        }

        // Prevent duplicate processing of the same challenge
        if (this.processingCheckboxClicks.has(challengeId)) {
            return;
        }

        // Mark this challenge as being processed
        this.processingCheckboxClicks.add(challengeId);

        // Toggle completion only: in-progress ↔ done (failure handled via explicit Fail button)
        const challenge =
            this.challengeList.toggleChallengeCompletion(challengeId);
        if (!challenge) {
            console.error(
                ERROR_MESSAGES.CHALLENGE_NOT_FOUND_BY_ID.replace(
                    "{challengeId}",
                    challengeId
                )
            );
            this.processingCheckboxClicks.delete(challengeId); // Clean up
            return;
        }

        try {
            // Update DOM to reflect the new state (only done or in-progress)
            if (challenge.isComplete()) {
                this.completeChallengeFromDOM(challengeId);
            } else {
                this.revertChallengeFromDOM(challengeId);
            }

            // Notify other windows (viewer overlay) about the state change
            notifyChallengeStateChanged();
        } catch (error) {
            console.error(
                ERROR_MESSAGES.ERROR_TOGGLING_CHALLENGE_COMPLETION,
                error
            );
        } finally {
            // Clean up processing flag
            this.processingCheckboxClicks.delete(challengeId);
        }
    };

    /**
     * Handle delegated checkbox click events using event delegation
     * @param {Event} event - The click event
     * @returns {void}
     */
    private handleDelegatedCheckboxClick = (event: Event): void => {
        // Only handle clicks on checkboxes
        const target = event.target as HTMLElement;
        if (!target.classList.contains(CSS_CLASSES.CHALLENGE_CHECKBOX)) {
            return;
        }

        // Delegate to the existing checkbox handler
        this.handleCheckboxClick(event);
    };

    /**
     * Mark a challenge as failed in the DOM
     * @param {string} challengeId
     * @returns {void}
     */
    failChallengeFromDOM(challengeId: string): void {
        DOMHelper.failChallengeFromDOM(challengeId);
        this.updateChallengeCount();
        this.updateTimerDisplays();
    }

    /**
     * Revert a challenge back to active (in-progress) status in the DOM
     * @param {string} challengeId
     * @returns {void}
     */
    revertChallengeFromDOM(challengeId: string): void {
        DOMHelper.revertChallengeFromDOM(challengeId);
        this.updateChallengeCount();
        this.updateTimerDisplays();
    }

    /**
     * Start the timer update system to refresh countdown displays
     */
    startTimerUpdates(): void {
        this.#timerController.startTimerUpdates();
    }

    /**
     * Stop the timer update system
     */
    stopTimerUpdates(): void {
        this.#timerController.stopTimerUpdates();
    }

    /**
     * Update all timer displays in the DOM using shared utilities
     */
    updateTimerDisplays(): void {
        this.#timerController.updateTimerDisplays();
    }

    /**
     * Handle timer expiration for a challenge
     * @param challenge - The challenge whose timer expired
     */
    handleTimerExpiration(challenge: Challenge): void {
        // Log the expiration but don't stop the timer immediately
        // This allows the expired state to be displayed
        if (challenge.timer && challenge.timer.isExpired()) {
            console.log(
                STATUS_MESSAGES.TIMER_EXPIRED_FOR_CHALLENGE.replace(
                    "{title}",
                    challenge.title
                )
            );
            // Timer will be stopped when challenge is completed/failed
        }
    }

    /**
     * Extract challenge data from the form
     * @returns {object|null} Challenge data or null if validation fails
     */
    private extractChallengeFormData(): {
        title: string;
        description?: string;
        amount?: number;
        timer?: string;
        timerEndBehavior?: TimerEndBehavior;
    } | null {
        const titleInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TITLE
        ) as HTMLInputElement;
        const descInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_DESCRIPTION
        ) as HTMLTextAreaElement;
        const amountInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_AMOUNT
        ) as HTMLInputElement;
        const timerInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER
        ) as HTMLInputElement;
        const timerBehaviorSelect = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER_BEHAVIOR
        ) as HTMLSelectElement | null;

        // Clear any previous error states
        [
            titleInput,
            descInput,
            amountInput,
            timerInput,
            timerBehaviorSelect,
        ].forEach((input) => {
            if (input) {
                input.classList.remove(CSS_CLASSES.ERROR);
            }
        });

        // Validate required title
        const title = titleInput?.value?.trim();
        if (!title) {
            if (titleInput) {
                titleInput.classList.add(CSS_CLASSES.ERROR);
                titleInput.focus();
            }
            throw new Error(ERROR_MESSAGES.CHALLENGE_TITLE_REQUIRED);
        }

        // Extract optional fields
        const description = descInput?.value?.trim() || undefined;
        const amountStr = amountInput?.value?.trim();
        const timerStr = timerInput?.value?.trim();

        // Validate amount if provided
        let amount: number | undefined;
        if (amountStr) {
            amount = parseInt(amountStr, 10);
            if (
                isNaN(amount) ||
                amount < VALIDATION_CONSTRAINTS.AMOUNT_MIN ||
                amount > VALIDATION_CONSTRAINTS.AMOUNT_MAX
            ) {
                if (amountInput) {
                    amountInput.classList.add(CSS_CLASSES.ERROR);
                    amountInput.focus();
                }
                throw new Error(ERROR_MESSAGES.AMOUNT_INVALID_RANGE);
            }
        }

        // Basic timer format validation if provided
        let timer: string | undefined;
        let timerEndBehavior: TimerEndBehavior | undefined;
        if (timerStr) {
            // Simple validation - should match patterns like "5m", "30s", "1h"
            const timerPattern = VALIDATION_PATTERNS.TIMER_FORMAT;
            if (!timerPattern.test(timerStr)) {
                if (timerInput) {
                    timerInput.classList.add(CSS_CLASSES.ERROR);
                    timerInput.focus();
                }
                throw new Error(ERROR_MESSAGES.TIMER_FORMAT_INVALID);
            }
            timer = timerStr;

            if (!timerBehaviorSelect) {
                throw new Error(ERROR_MESSAGES.TIMER_BEHAVIOR_INVALID);
            }

            const selectedBehavior =
                timerBehaviorSelect.value as TimerEndBehavior;
            const validTimerBehaviors = Object.values(
                TimerEndBehavior
            ) as TimerEndBehavior[];

            if (!validTimerBehaviors.includes(selectedBehavior)) {
                timerBehaviorSelect.classList.add(CSS_CLASSES.ERROR);
                timerBehaviorSelect.focus();
                throw new Error(ERROR_MESSAGES.TIMER_BEHAVIOR_INVALID);
            }

            timerEndBehavior = selectedBehavior;
        }

        const result: {
            title: string;
            description?: string;
            amount?: number;
            timer?: string;
            timerEndBehavior?: TimerEndBehavior;
        } = { title };

        if (description) {
            result.description = description;
        }
        if (amount !== undefined) {
            result.amount = amount;
        }
        if (timer) {
            result.timer = timer;
        }
        if (timerEndBehavior !== undefined) {
            result.timerEndBehavior = timerEndBehavior;
        }

        return result;
    }

    /**
     * Create a challenge from form data
     * @param {object} challengeData - The challenge data from the form
     * @returns {void}
     */
    private createChallengeFromForm(challengeData: {
        title: string;
        description?: string;
        amount?: number;
        timer?: string;
        timerEndBehavior?: TimerEndBehavior;
    }): void {
        // Check challenge limit
        const maxChallenges =
            this.#configManager.get(BEHAVIOR_CONFIG.MAX_CHALLENGES) ||
            getDefaultMaxChallenges();
        if (this.challengeList.challenges.length >= maxChallenges) {
            throw new Error(
                ERROR_MESSAGES.MAXIMUM_CHALLENGES_ALLOWED.replace(
                    "{maxChallenges}",
                    maxChallenges.toString()
                )
            );
        }

        // Create challenge options
        const challengeOptions: {
            description?: string;
            amount?: number;
            timer?: string;
            timerEndBehavior?: TimerEndBehavior;
        } = {};

        if (challengeData.description) {
            challengeOptions.description = challengeData.description;
        }
        if (challengeData.amount) {
            challengeOptions.amount = challengeData.amount;
        }
        if (challengeData.timer) {
            challengeOptions.timer = challengeData.timer;
        }
        if (challengeData.timerEndBehavior) {
            challengeOptions.timerEndBehavior = challengeData.timerEndBehavior;
        }

        // Create the challenge
        const challenge = new Challenge(challengeData.title, challengeOptions);

        // Start timer if present
        if (challengeData.timer) {
            challenge.startTimer();
        }

        // Add to challenge list
        this.challengeList.addChallengeObjects(challenge);

        // Update DOM
        this.addChallengeToDOM(challenge);

        // Notify other windows (viewer overlay) about the state change
        notifyChallengeStateChanged();
    }

    /**
     * Update a challenge from form data
     * @param {string} challengeId - The ID of the challenge to update
     * @param {object} challengeData - The challenge data from the form
     * @returns {void}
     */
    private updateChallengeFromForm(
        challengeId: string,
        challengeData: {
            title: string;
            description?: string;
            amount?: number;
            timer?: string;
            timerEndBehavior?: TimerEndBehavior;
        }
    ): void {
        const challenge = this.challengeList.getChallengeById(challengeId);
        if (!challenge) {
            throw new Error(MODAL_TEXT.CHALLENGE_NOT_FOUND_FOR_EDIT);
        }

        // Update title
        challenge.setTitle(challengeData.title);

        // Update description
        challenge.setDescription(challengeData.description || "");

        // Update amount
        if (challengeData.amount !== undefined) {
            challenge.setAmount(challengeData.amount);
        }

        if (challengeData.timerEndBehavior) {
            challenge.setTimerEndBehavior(challengeData.timerEndBehavior);
        }

        // Update timer if provided
        if (challengeData.timer) {
            challenge.setTimer(challengeData.timer);
            challenge.startTimer();
        }

        // Save changes to localStorage
        this.challengeList.saveToLocalStorage();

        // Re-render the challenge list to reflect the changes
        this.renderChallengeList();

        // Notify other windows (viewer overlay) about the state change
        notifyChallengeStateChanged();
    }

    /**
     * Handle edit icon click events
     * @param {Event} event - The click event
     * @returns {void}
     */
    private handleEditIconClick = (event: Event): void => {
        // Prevent event from bubbling
        event.stopPropagation();

        // Only handle clicks in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const target = event.target as HTMLElement;
        // Find challenge element (both regular and text-only modes)
        const challengeElement = target.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement | null;

        if (!challengeElement) {
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            return;
        }

        // Open edit modal with challenge data
        this.openEditChallengeModal(challengeId);
    };

    /**
     * Handle increment button click events
     * @param {Event} event - The click event
     * @returns {void}
     */
    private handleIncrementButtonClick = (event: Event): void => {
        // Prevent event from bubbling
        event.stopPropagation();

        // Only handle clicks in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const target = event.target as HTMLElement;
        // Find challenge element (both regular and text-only modes)
        const challengeElement = target.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement | null;

        if (!challengeElement) {
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            return;
        }

        // Increment challenge progress
        const updatedChallenge =
            this.challengeList.incrementChallengeProgress(challengeId);
        if (updatedChallenge) {
            // Re-render the challenge list to reflect the updated progress
            this.renderChallengeList();

            // Notify other windows (viewer overlay) about the state change
            notifyChallengeStateChanged();
        }
    };

    /**
     * Handle decrement button click events
     * @param {Event} event - The click event
     * @returns {void}
     */
    private handleDecrementButtonClick = (event: Event): void => {
        // Prevent event from bubbling
        event.stopPropagation();

        // Only handle clicks in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const target = event.target as HTMLElement;
        // Find challenge element (both regular and text-only modes)
        const challengeElement = target.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement | null;

        if (!challengeElement) {
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            return;
        }

        // Decrement challenge progress
        const updatedChallenge =
            this.challengeList.decrementChallengeProgress(challengeId);
        if (updatedChallenge) {
            // Re-render the challenge list to reflect the updated progress
            this.renderChallengeList();

            // Notify other windows (viewer overlay) about the state change
            notifyChallengeStateChanged();
        }
    };

    private clearDeleteConfirmationTimer(deleteElement: HTMLElement): void {
        const timerId = this.deleteConfirmationTimers.get(deleteElement);

        if (timerId !== undefined) {
            window.clearTimeout(timerId);
            this.deleteConfirmationTimers.delete(deleteElement);
        }
    }

    private clearDeleteConfirmationState(deleteElement: HTMLElement): void {
        this.clearDeleteConfirmationTimer(deleteElement);

        if (
            deleteElement.dataset[DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING] !==
            "true"
        ) {
            return;
        }

        delete deleteElement.dataset[DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING];
        deleteElement.textContent = UI_ELEMENTS.TEXT_ONLY_DELETE_BUTTON;
        deleteElement.classList.remove(CSS_CLASSES.CHALLENGE_DELETE_CONFIRM);
        deleteElement.setAttribute(
            HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
            ARIA_LABELS.DELETE_CHALLENGE
        );
    }

    private setDeleteConfirmationTimer(deleteElement: HTMLElement): void {
        this.clearDeleteConfirmationTimer(deleteElement);

        const timerId = window.setTimeout(() => {
            this.clearDeleteConfirmationState(deleteElement);
        }, TIMING_CONSTANTS.DELETE_CONFIRMATION_TIMEOUT);

        this.deleteConfirmationTimers.set(deleteElement, timerId);
    }

    private resetDeleteConfirmations(
        excludeElement?: HTMLElement | null
    ): void {
        const deleteButtons = document.querySelectorAll(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_DELETE}`
        );

        deleteButtons.forEach((element) => {
            if (excludeElement && element === excludeElement) {
                return;
            }

            this.clearDeleteConfirmationState(element as HTMLElement);
        });
    }

    private handleDeleteButtonClick = (event: Event): void => {
        event.stopPropagation();

        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const deleteButton = event.currentTarget as HTMLElement | null;

        if (!deleteButton) {
            return;
        }

        const challengeElement = deleteButton.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement | null;

        if (!challengeElement) {
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            return;
        }

        const isConfirming =
            deleteButton.dataset[DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING] ===
            "true";

        if (!isConfirming) {
            this.resetDeleteConfirmations(deleteButton);
            deleteButton.dataset[DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING] =
                "true";
            deleteButton.textContent = UI_ELEMENTS.DELETE_CONFIRM_PROMPT;
            deleteButton.classList.add(CSS_CLASSES.CHALLENGE_DELETE_CONFIRM);
            deleteButton.setAttribute(
                HTML_ATTRIBUTE_NAMES.ARIA_LABEL,
                ARIA_LABELS.CONFIRM_DELETE_CHALLENGE
            );
            this.setDeleteConfirmationTimer(deleteButton);
            return;
        }

        this.resetDeleteConfirmations();

        const challenges = this.challengeList.getAllChallenges();
        const challengeIndex = challenges.findIndex(
            (challenge) => challenge.id === challengeId
        );

        if (challengeIndex === -1) {
            return;
        }

        const deletedChallenges =
            this.challengeList.deleteChallenges(challengeIndex);

        if (deletedChallenges.length === 0) {
            return;
        }

        this.renderChallengeList();
        notifyChallengeStateChanged();
    };

    /**
     * Handle Complete button click in text-only mode
     * @param {Event} event - The click event
     * @returns {void}
     */
    private handleCompleteButtonClick = (event: Event): void => {
        event.stopPropagation();

        // Only handle clicks in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const target = event.target as HTMLElement;
        // Find challenge element (standard or text-only modes)
        const challengeElement = target.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement | null;

        if (!challengeElement) {
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            return;
        }

        // Prevent duplicate processing
        if (this.processingCheckboxClicks.has(challengeId)) {
            return;
        }

        this.processingCheckboxClicks.add(challengeId);

        try {
            // Toggle completion
            const challenge =
                this.challengeList.toggleChallengeCompletion(challengeId);
            if (challenge) {
                // Re-render the challenge list to reflect the updated state
                this.renderChallengeList();

                // Notify other windows about the state change
                notifyChallengeStateChanged();
            }
        } finally {
            this.processingCheckboxClicks.delete(challengeId);
        }
    };

    /**
     * Handle Fail button click in admin mode
     * @param {Event} event - The click event
     * @returns {void}
     */
    private handleFailButtonClick = (event: Event): void => {
        event.stopPropagation();

        // Only handle clicks in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const target = event.target as HTMLElement;
        // Find challenge element (both regular and text-only modes)
        const challengeElement = target.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement | null;

        if (!challengeElement) {
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            return;
        }

        // Mark challenge as failed
        const challenge = this.challengeList.markChallengeAsFailed(challengeId);
        if (challenge) {
            // Re-render the challenge list to reflect the failed state
            this.renderChallengeList();

            // Notify other windows about the state change
            notifyChallengeStateChanged();
        }
    };

    /**
     * Handle Uncomplete button click in text-only mode
     * @param {Event} event - The click event
     * @returns {void}
     */
    private handleUncompleteButtonClick = (event: Event): void => {
        event.stopPropagation();

        // Only handle clicks in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const target = event.target as HTMLElement;
        // Find challenge element (text-only mode)
        const challengeElement = target.closest(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement | null;

        if (!challengeElement) {
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            return;
        }

        // Uncomplete the challenge
        const challenge =
            this.challengeList.uncompleteChallengeStatus(challengeId);
        if (challenge) {
            // Re-render the challenge list to reflect the updated state
            this.renderChallengeList();

            // Notify other windows about the state change
            notifyChallengeStateChanged();
        }
    };

    /**
     * Handle Unfail button click in admin mode
     * @param {Event} event - The click event
     * @returns {void}
     */
    private handleUnfailButtonClick = (event: Event): void => {
        event.stopPropagation();

        // Only handle clicks in admin mode
        if (window.location.hash !== URL_HASH.ADMIN) {
            return;
        }

        const target = event.target as HTMLElement;
        // Find challenge element (standard or text-only modes)
        const challengeElement = target.closest(
            `${CSS_SELECTORS.CHALLENGE}, .${CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM}`
        ) as HTMLElement | null;

        if (!challengeElement) {
            return;
        }

        const challengeId =
            challengeElement.dataset[DATA_ATTRIBUTES.CHALLENGE_ID];
        if (!challengeId) {
            return;
        }

        // Unfail the challenge
        const challenge = this.challengeList.unfailChallengeStatus(challengeId);
        if (challenge) {
            // Re-render the challenge list to reflect the updated state
            this.renderChallengeList();

            // Notify other windows about the state change
            notifyChallengeStateChanged();
        }
    };
}

/**
 * Responds with a formatted message
 * @param {string} template - The response template
 * @param {string} username - The username of the user
 * @param {string} message - The message to replace in the template
 * @param {boolean} error - If the response is an error
 * @returns {{message: string, error: boolean}}
 */
function respondMessage(
    template: string,
    username: string,
    message: string,
    error: boolean = false
): { message: string; error: boolean } {
    return {
        message: template
            .replaceAll("{user}", username)
            .replaceAll("{message}", message),
        error,
    };
}
