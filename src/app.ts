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
import {
    BUTTON_TEXT,
    COMMAND_CONSTANTS,
    COMMON_STRINGS,
    CSS_CLASSES,
    CSS_SELECTORS,
    DATA_ATTRIBUTES,
    ELEMENT_IDS,
    EVENT_NAMES,
    HTML_ATTRIBUTES,
    HTML_ELEMENTS,
    URL_HASH,
} from "./types/DOMConstants";
import { ERROR_MESSAGES, STATUS_MESSAGES } from "./types/MessageConstants";
import {
    VALIDATION_CONSTRAINTS,
    VALIDATION_PATTERNS,
} from "./types/ValidationConstants";
import ChallengeRenderer from "./utils/ChallengeRenderer";
import CommandHandler from "./utils/CommandHandler";
import { getDefaultMaxChallenges } from "./utils/ConfigDefaults";
import DOMHelper from "./utils/DOMHelper";
import TimerController from "./utils/TimerController";
import TimerDisplayUtils from "./utils/TimerDisplayUtils";
import UIUpdateHandler from "./utils/UIUpdateHandler";

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
            this.#configManager
        );
        this.#timerController = new TimerController(this.challengeList);
        loadStyles(this.#configManager.getAll());
    }

    /**
     * Get the ConfigManager instance for testing purposes
     * @returns {ConfigManager} The ConfigManager instance
     */
    getConfigManager(): ConfigManager {
        return this.#configManager;
    }

    /**
     * Initial render the components to the DOM. Should only be called once.
     * @returns {void}
     */
    render(): void {
        this.#uiUpdateHandler.renderChallengeList();

        // Setup admin mode features after rendering
        this.enableAdminCheckboxInteraction();
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

            // Apply overlay background styling if configured
            if (backgroundConfig.overlayBackgroundColor) {
                cardEl.style.backgroundColor =
                    backgroundConfig.overlayBackgroundColor;
                cardEl.classList.add(CSS_CLASSES.CUSTOM_OVERLAY_BACKGROUND);
            }

            this.challengeList
                .getAllChallenges()
                .forEach((challenge, index) => {
                    // Use ChallengeRenderer for consistent element creation
                    // Pass displayPosition as index + 1 for 1-based numbering
                    const listItem = ChallengeRenderer.createChallengeElement(
                        challenge,
                        {
                            displayPosition: index + 1,
                        }
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

                    // Add timer display if timer exists and is active (as sibling to text)
                    if (challenge.timer && challenge.timer.isActive) {
                        const timerElement =
                            TimerDisplayUtils.createTimerElement(
                                challenge.timer,
                                challenge.id
                            );
                        listItem.appendChild(timerElement);
                    }

                    // Append to fragment instead of directly to DOM
                    fragment.appendChild(listItem);
                });

            // Single DOM append operation to reduce reflows
            list.appendChild(fragment);
        }

        // Always append the card to container, even if the list is empty
        // This ensures the header is always visible
        const challengeContainer = document.querySelector(
            CSS_SELECTORS.CHALLENGE_CONTAINER
        );
        if (!challengeContainer) {
            console.error(ERROR_MESSAGES.CHALLENGE_CONTAINER_NOT_FOUND);
            return;
        }
        challengeContainer.innerHTML = COMMON_STRINGS.EMPTY;
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

        // Find all challenge cards
        const challengeCards = document.querySelectorAll(CSS_SELECTORS.CARD);
        challengeCards.forEach((card) => {
            // Check if button container already exists
            let buttonContainer = card.querySelector(
                `.${CSS_CLASSES.ADD_CHALLENGE_CONTAINER}`
            );

            if (!buttonContainer) {
                // Create button container
                buttonContainer = document.createElement(HTML_ELEMENTS.DIV);
                buttonContainer.className = CSS_CLASSES.ADD_CHALLENGE_CONTAINER;

                // Create the Add Challenge button
                const addButton = document.createElement(HTML_ELEMENTS.BUTTON);
                addButton.className = CSS_CLASSES.ADD_CHALLENGE_BTN;
                addButton.textContent = BUTTON_TEXT.ADD_CHALLENGE;
                addButton.type = HTML_ATTRIBUTES.BUTTON_TYPE;

                // Add click event listener
                addButton.addEventListener(
                    EVENT_NAMES.CLICK,
                    this.handleAddChallengeClick
                );

                buttonContainer.appendChild(addButton);

                // Create the Clear Finished Challenges button
                const clearFinishedButton = document.createElement(
                    HTML_ELEMENTS.BUTTON
                );
                clearFinishedButton.className = CSS_CLASSES.CLEAR_FINISHED_BTN;
                clearFinishedButton.textContent = BUTTON_TEXT.CLEAR_FINISHED;
                clearFinishedButton.type = HTML_ATTRIBUTES.BUTTON_TYPE;

                // Add click event listener
                clearFinishedButton.addEventListener(
                    EVENT_NAMES.CLICK,
                    this.handleClearFinishedClick
                );

                buttonContainer.appendChild(clearFinishedButton);

                card.appendChild(buttonContainer);
            }
        });
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
     * Handle clear finished challenges button click
     * Clears all completed challenges from the list
     * @returns {void}
     */
    private handleClearFinishedClick = (): void => {
        // Get completed challenges count before clearing
        const completedChallenges = this.challengeList.challenges.filter((c) =>
            c.isComplete()
        );
        const completedCount = completedChallenges.length;

        // Check if there are any completed challenges to clear
        if (completedCount === 0) {
            return;
        }

        // Clear completed challenges (automatically saves to localStorage)
        this.challengeList.clearDoneChallenges();

        // Re-render the challenge list to reflect the changes
        this.renderChallengeList();
    };

    /**
     * Open the add challenge modal
     * @returns {void}
     */
    private openAddChallengeModal(): void {
        // Clear form data
        this.clearAddChallengeForm();

        // Show modal using the updated modal function
        openModal(ELEMENT_IDS.ADD_CHALLENGE_MODAL);

        // Setup form event listeners
        this.setupAddChallengeFormListeners();
    }

    /**
     * Close the add challenge modal
     * @returns {void}
     */
    private closeAddChallengeModal(): void {
        // Close modal using the updated modal function
        closeModal(ELEMENT_IDS.ADD_CHALLENGE_MODAL);

        // Clear form data
        this.clearAddChallengeForm();
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

        if (titleInput) titleInput.value = COMMON_STRINGS.EMPTY;
        if (descInput) descInput.value = COMMON_STRINGS.EMPTY;
        if (amountInput) amountInput.value = COMMON_STRINGS.EMPTY;
        if (timerInput) timerInput.value = COMMON_STRINGS.EMPTY;

        // Clear any error states
        [titleInput, descInput, amountInput, timerInput].forEach((input) => {
            if (input) {
                input.classList.remove(CSS_CLASSES.ERROR);
            }
        });
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
    }

    /**
     * Handle add challenge form submission
     * @param {Event} event - The form submit event
     * @returns {void}
     */
    private handleAddChallengeSubmit = (event: Event): void => {
        event.preventDefault();

        try {
            const challengeData = this.extractChallengeFormData();
            if (challengeData) {
                this.createChallengeFromForm(challengeData);
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

        // Toggle the challenge completion using the encapsulated method
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
            // Update DOM to reflect the new status
            if (challenge.isComplete()) {
                this.completeChallengeFromDOM(challengeId);
            } else {
                this.revertChallengeFromDOM(challengeId);
            }
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
     * Revert a completed challenge back to active status in the DOM
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

        // Clear any previous error states
        [titleInput, descInput, amountInput, timerInput].forEach((input) => {
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
        }

        const result: {
            title: string;
            description?: string;
            amount?: number;
            timer?: string;
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
    }
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
