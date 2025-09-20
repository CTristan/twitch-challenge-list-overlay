import { animateScroll } from "./animations/animateScroll";
import Challenge from "./classes/Challenge";
import ChallengeList from "./classes/ChallengeList";
import ConfigManager from "./classes/ConfigManager";
import { loadStyles } from "./styleLoader";
import ChallengeRenderer from "./utils/ChallengeRenderer";
import CommandHandler from "./utils/CommandHandler";
import DOMHelper from "./utils/DOMHelper";
import TimerController from "./utils/TimerController";
import TimerDisplayUtils from "./utils/TimerDisplayUtils";
import UIUpdateHandler from "./utils/UIUpdateHandler";

// Commands and responses are loaded from ConfigManager

/**
 * Get a value from an array by rotating through it based on an index
 * @param index - The index to use for rotating (0-based)
 * @param values - Array of values to rotate through
 * @returns The value at the rotated index or null if no values configured
 */
function getRotatingArrayValue<T>(index: number, values: T[]): T | null {
    if (!values || values.length === 0) return null;
    const value = values[index % values.length];
    return value !== undefined ? value : null;
}

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
        this.#uiUpdateHandler = new UIUpdateHandler(this.challengeList);
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
        const cardEl = createChallengeCard(
            this.challengeList.challengesCompleted,
            this.challengeList.totalChallenges
        );
        const list = cardEl.querySelector("ol");

        if (!list) {
            console.error("Challenge list element not found in card");
            return;
        }

        // Only populate the list with challenge items if there are challenges
        if (this.challengeList.challenges.length > 0) {
            // Create DocumentFragment for batch DOM operations to reduce reflows
            const fragment = document.createDocumentFragment();

            // Cache color arrays outside the loop to avoid repeated ConfigManager calls
            const rowColors =
                this.#configManager.get("challengeRowColors") || [];
            const rowTextColors =
                this.#configManager.get("challengeRowTextColors") || [];

            this.challengeList
                .getAllChallenges()
                .forEach((challenge, index) => {
                    // Use ChallengeRenderer for consistent element creation
                    const listItem =
                        ChallengeRenderer.createChallengeElement(challenge);

                    // Apply row colors using shared helper
                    const textColor = applyChallengeRowColors(
                        listItem,
                        index,
                        rowColors,
                        rowTextColors
                    );

                    // Apply styling to the checkbox and text elements
                    const checkbox = listItem.querySelector(
                        ".challenge-checkbox"
                    ) as HTMLElement;
                    const textElement = listItem.querySelector(
                        ".challenge-text"
                    ) as HTMLElement;

                    if (checkbox) {
                        decorateChallengeCheckbox(checkbox, textColor);
                    }

                    if (textElement) {
                        applyChallengeTextColors(textElement, textColor);
                    }

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

        // Always append the card to containers, even if the list is empty
        // This ensures the header is always visible
        const primaryContainer = document.querySelector(
            ".challenge-container.primary"
        );
        if (!primaryContainer) {
            console.error("Primary challenge container not found");
            return;
        }
        primaryContainer.innerHTML = "";
        primaryContainer.appendChild(cardEl);

        const secondaryClone = cardEl.cloneNode(true);
        const secondaryContainer = document.querySelector(
            ".challenge-container.secondary"
        );
        if (!secondaryContainer) {
            console.error("Secondary challenge container not found");
            return;
        }
        secondaryContainer.innerHTML = "";
        secondaryContainer.appendChild(secondaryClone);

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
        const customHeaderEl = document.querySelector(".custom-header");
        const customTextEl = document.querySelector(".custom-text");
        if (customHeaderEl) {
            customHeaderEl.classList.remove("hidden");
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
        command = `!${command.toLowerCase()}`;

        // Use simple guard instead of exception for control flow
        if (command === "!ch" || command.startsWith("!ch ")) {
            try {
                const response = this.#commandHandler.handleCommand(
                    username,
                    command.slice(1), // Remove ! prefix
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
                    this.#configManager.get("responses.invalidCommand"),
                    username,
                    error instanceof Error ? error.message : String(error),
                    true
                );
            }
        }

        // Direct call for invalid commands instead of throwing and catching
        return respondMessage(
            this.#configManager.get("responses.invalidCommand"),
            username,
            "command not found",
            true
        );
    }

    clearListFromDOM() {
        // Clear the entire containers and then re-render to ensure proper header structure
        const primaryContainer = document.querySelector(
            ".challenge-container.primary"
        );
        const secondaryContainer = document.querySelector(
            ".challenge-container.secondary"
        );
        if (primaryContainer) {
            primaryContainer.innerHTML = "";
        }
        if (secondaryContainer) {
            secondaryContainer.innerHTML = "";
        }

        // Re-render the challenge list to ensure headers are displayed even when empty
        this.renderChallengeList();
    }

    /**
     * Add the challenge to the DOM
     * @param {Challenge} challenge
     * @returns {void}
     */
    addChallengeToDOM(challenge: Challenge): void {
        const primaryContainer = document.querySelector(
            ".challenge-container.primary"
        );
        const secondaryContainer = document.querySelector(
            ".challenge-container.secondary"
        );

        if (!primaryContainer || !secondaryContainer) return;

        const challengeCardEls = document.querySelectorAll(".card");

        if (challengeCardEls.length === 0) {
            const challengeCard = createChallengeCard(
                this.challengeList.challengesCompleted,
                this.challengeList.totalChallenges
            );
            const clonedChallengeCard = challengeCard.cloneNode(true);
            primaryContainer.appendChild(challengeCard);
            secondaryContainer.appendChild(clonedChallengeCard);
        }

        const challengeElement = document.createElement("li");
        challengeElement.classList.add("challenge");
        challengeElement.dataset["challengeId"] = `${challenge.id}`;

        // Cache color arrays to avoid repeated ConfigManager calls
        const rowColors = this.#configManager.get("challengeRowColors") || [];
        const rowTextColors =
            this.#configManager.get("challengeRowTextColors") || [];

        // Calculate the row index based on current challenge count (newly added challenge is at the end)
        const rowIndex = this.challengeList.challenges.length - 1;

        // Apply row colors using shared helper
        const textColor = applyChallengeRowColors(
            challengeElement,
            rowIndex,
            rowColors,
            rowTextColors
        );

        // Create checkbox element (new challenges are not completed by default)
        const checkbox = ChallengeRenderer.createChallengeCheckbox(false);

        // Apply checkbox styling using shared helper
        decorateChallengeCheckbox(checkbox, textColor);

        challengeElement.appendChild(checkbox);

        // Create text element for challenge title and description
        const textElement =
            ChallengeRenderer.createChallengeTextElement(challenge);

        // Apply text colors using shared helper
        applyChallengeTextColors(textElement, textColor);

        challengeElement.appendChild(textElement);

        // Add timer display if timer exists and is active (as sibling to text)
        if (challenge.timer && challenge.timer.isActive) {
            const timerElement = TimerDisplayUtils.createTimerElement(
                challenge.timer,
                challenge.id
            );
            challengeElement.appendChild(timerElement);
        }

        // Clone the fully-styled challenge element for the secondary container
        // cloneNode(true) creates a deep copy with all attributes, styles, and child elements
        const cloneChallengeElement = challengeElement.cloneNode(
            true
        ) as HTMLElement;

        const primaryChallengesList =
            primaryContainer.querySelector(".card .challenges");
        const secondaryChallengesList =
            secondaryContainer.querySelector(".card .challenges");

        if (primaryChallengesList) {
            primaryChallengesList.appendChild(challengeElement);
        }
        if (secondaryChallengesList) {
            secondaryChallengesList.appendChild(cloneChallengeElement);
        }

        this.updateChallengeCount();
        animateScroll();

        // Start timer updates if the new challenge has an active timer
        if (challenge.timer && challenge.timer.isActive) {
            this.startTimerUpdates();
        }

        // Enable checkbox interaction for admin mode
        this.enableAdminCheckboxInteraction();
    }

    /**
     * Edit the challenge in the DOM
     * @param {Challenge} challenge
     * @returns {void}
     */
    editChallengeFromDOM(challenge: Challenge): void {
        /** @type {NodeListOf<HTMLElement>} */
        const challengeElements: NodeListOf<HTMLElement> =
            document.querySelectorAll(`[data-challenge-id="${challenge.id}"]`);
        for (const challengeElement of challengeElements) {
            const textElement = challengeElement.querySelector(
                ".challenge-text"
            ) as HTMLElement;
            if (textElement) {
                // Replace the entire text element with new structure
                const newTextElement =
                    ChallengeRenderer.createChallengeTextElement(challenge);

                // Preserve any existing color styling
                const existingColor = textElement.style.color;
                if (existingColor) {
                    newTextElement.style.color = existingColor;
                    const titleElement = newTextElement.querySelector(
                        ".challenge-title"
                    ) as HTMLElement;
                    const descriptionElement = newTextElement.querySelector(
                        ".challenge-description"
                    ) as HTMLElement;
                    const progressElement = newTextElement.querySelector(
                        ".challenge-amount"
                    ) as HTMLElement;
                    if (titleElement) titleElement.style.color = existingColor;
                    if (descriptionElement)
                        descriptionElement.style.color = existingColor;
                    if (progressElement)
                        progressElement.style.color = existingColor;
                }

                textElement.parentNode?.replaceChild(
                    newTextElement,
                    textElement
                );

                // Handle timer display - remove existing timer and add new one if needed
                const existingTimer =
                    challengeElement.querySelector(".challenge-timer");
                if (existingTimer) {
                    existingTimer.remove();
                }

                // Add timer display if timer exists and is active (as sibling to text)
                if (challenge.timer && challenge.timer.isActive) {
                    const timerElement = TimerDisplayUtils.createTimerElement(
                        challenge.timer,
                        challenge.id
                    );
                    challengeElement.appendChild(timerElement);
                }
            }
        }

        // Restart timer updates to handle any timer changes
        this.startTimerUpdates();
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
        if (window.location.hash !== "#admin") {
            return;
        }

        // Use event delegation on containers instead of individual checkboxes
        // This avoids re-querying and re-attaching listeners for every checkbox
        const containers = document.querySelectorAll(".challenge-container");
        containers.forEach((container) => {
            // Remove any existing delegated listeners to prevent duplicates
            container.removeEventListener(
                "click",
                this.handleDelegatedCheckboxClick
            );

            // Add single delegated listener per container
            container.addEventListener(
                "click",
                this.handleDelegatedCheckboxClick
            );
        });

        // Add visual indication that checkboxes are clickable in admin mode
        const checkboxes = document.querySelectorAll(".challenge-checkbox");
        checkboxes.forEach((checkbox) => {
            checkbox.classList.add("admin-interactive");
        });
    }

    /**
     * Handle checkbox click events to toggle challenge completion status
     * @param {Event} event - The click event
     * @returns {void}
     */
    private handleCheckboxClick = (event: Event): void => {
        // Prevent event from bubbling to avoid duplicate processing
        event.stopPropagation();

        // Only handle clicks in admin mode
        if (window.location.hash !== "#admin") {
            return;
        }

        const checkbox = event.target as HTMLElement;
        const challengeElement = checkbox.closest(".challenge") as HTMLElement;

        if (!challengeElement) {
            console.error("Could not find challenge element for checkbox");
            return;
        }

        const challengeId = challengeElement.dataset["challengeId"];
        if (!challengeId) {
            console.error("Could not find challenge ID for checkbox");
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
            console.error(`Challenge with ID ${challengeId} not found`);
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
            console.error("Error toggling challenge completion:", error);
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
        if (!target.classList.contains("challenge-checkbox")) {
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
            console.log(`Timer expired for challenge: ${challenge.title}`);
            // Timer will be stopped when challenge is completed/failed
        }
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

/**
 * Create a challenge card element for the single challenge list
 * @param {number} completedCount - Number of completed challenges
 * @param {number} totalCount - Total number of challenges
 * @returns {HTMLDivElement}
 */
function createChallengeCard(
    completedCount: number = 0,
    totalCount: number = 0
): HTMLDivElement {
    const cardEl = document.createElement("div");
    cardEl.classList.add("card");
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("username");
    headerDiv.innerText = `Challenges ${completedCount}/${totalCount}`;
    cardEl.appendChild(headerDiv);
    const list = document.createElement("ol");
    list.classList.add("challenges");
    cardEl.appendChild(list);
    return cardEl;
}

/**
 * Apply row colors (background and text) to a challenge list item
 * @param listItem - The challenge list item element
 * @param rowIndex - The index of the row (0-based)
 * @param rowColors - Array of background color values to rotate through
 * @param rowTextColors - Array of text color values to rotate through
 * @returns The text color string or null if no text colors configured
 */
function applyChallengeRowColors(
    listItem: HTMLElement,
    rowIndex: number,
    rowColors: string[],
    rowTextColors: string[]
): string | null {
    // Apply row background color if configured
    const backgroundColor = getRotatingArrayValue(rowIndex, rowColors);
    if (backgroundColor) {
        listItem.style.backgroundColor = backgroundColor;
    }

    // Get row text color if configured
    const textColor = getRotatingArrayValue(rowIndex, rowTextColors);
    return textColor;
}

/**
 * Apply color styling to a challenge checkbox element
 * @param checkbox - The checkbox element to style
 * @param textColor - The text color to apply, or null if no color configured
 */
function decorateChallengeCheckbox(
    checkbox: HTMLElement,
    textColor: string | null
): void {
    if (textColor) {
        checkbox.style.setProperty(
            "--challenge-checkbox-border-color",
            textColor
        );
        checkbox.style.setProperty(
            "--challenge-checkbox-checked-border-color",
            textColor
        );
        checkbox.style.setProperty(
            "--challenge-checkbox-checkmark-color",
            textColor
        );
    }
}

/**
 * Apply text color styling to a challenge text element and its children
 * @param textElement - The text element containing challenge content
 * @param textColor - The text color to apply, or null if no color configured
 */
function applyChallengeTextColors(
    textElement: HTMLElement,
    textColor: string | null
): void {
    if (textColor) {
        textElement.style.color = textColor;
        // Also apply to child elements
        const titleElement = textElement.querySelector(
            ".challenge-title"
        ) as HTMLElement;
        const descriptionElement = textElement.querySelector(
            ".challenge-description"
        ) as HTMLElement;
        const progressElement = textElement.querySelector(
            ".challenge-amount"
        ) as HTMLElement;
        if (titleElement) titleElement.style.color = textColor;
        if (descriptionElement) descriptionElement.style.color = textColor;
        if (progressElement) progressElement.style.color = textColor;
    }
}
