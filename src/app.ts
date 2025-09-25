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

                    // Apply row colors using centralized helper
                    const textColor = ChallengeRenderer.applyChallengeRowColors(
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
                        ChallengeRenderer.decorateChallengeCheckbox(
                            checkbox,
                            textColor
                        );
                    }

                    if (textElement) {
                        ChallengeRenderer.applyChallengeTextColors(
                            textElement,
                            textColor
                        );
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

        // Always append the card to container, even if the list is empty
        // This ensures the header is always visible
        const challengeContainer = document.querySelector(
            ".challenge-container"
        );
        if (!challengeContainer) {
            console.error("Challenge container not found");
            return;
        }
        challengeContainer.innerHTML = "";
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
        // Use UIUpdateHandler for consistent rendering instead of App's own renderChallengeList
        // This ensures all rendering goes through the same path and prevents duplicate headers
        this.#uiUpdateHandler.renderChallengeList();
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
