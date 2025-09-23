import { animateScroll } from "../animations/animateScroll";
import Challenge from "../classes/Challenge";
import ChallengeList from "../classes/ChallengeList";
import ChallengeRenderer from "./ChallengeRenderer";
import DOMHelper from "./DOMHelper";
import Timer from "./Timer";
import TimerController from "./TimerController";
import TimerDisplayUtils from "./TimerDisplayUtils";

/**
 * @class UIUpdateHandler
 * Handles all DOM manipulation operations based on command results.
 * Provides separation of concerns between command processing and UI updates.
 */
export default class UIUpdateHandler {
    private challengeList: ChallengeList;
    private timerController: TimerController;

    // DOM element cache for performance optimization
    private challengeContainer: HTMLElement | null = null;
    private challengesList: HTMLElement | null = null;

    /**
     * Map of action strings to their corresponding handler functions
     * This replaces the switch statement for better maintainability
     */
    private readonly actionHandlers: Record<
        string,
        (challengeIndices?: number[], challenges?: Challenge[]) => void
    > = {
        add: (challengeIndices, challenges) =>
            this.handleAddUpdate(challengeIndices, challenges),
        edit: (challengeIndices, challenges) =>
            this.handleEditUpdate(challengeIndices, challenges),
        complete: (challengeIndices, challenges) =>
            this.handleCompleteUpdate(challengeIndices, challenges),
        revert: (challengeIndices, challenges) =>
            this.handleRevertUpdate(challengeIndices, challenges),
        delete: (challengeIndices, challenges) =>
            this.handleDeleteUpdate(challengeIndices, challenges),
        clearAll: () => this.handleClearAllUpdate(),
        clearDone: () => this.handleClearDoneUpdate(),
        refresh: () => this.handleRefreshUpdate(),
    };

    /**
     * @constructor
     * @param challengeList - The challenge list instance
     */
    constructor(challengeList: ChallengeList) {
        this.challengeList = challengeList;
        this.timerController = new TimerController(challengeList);
    }

    /**
     * Handle command result and perform appropriate UI updates
     * @param response - Command response containing UI update data
     * @returns void
     */
    handleCommandResult(response: CommandResponse): void {
        if (response.error || !response.uiUpdate) {
            return;
        }

        const {
            action,
            challengeIndices,
            challenges,
            updateTimers,
            updateCount,
        } = response.uiUpdate;

        // Use lookup map to find and execute the appropriate handler
        const handler = this.actionHandlers[action];
        if (handler) {
            handler(challengeIndices, challenges);
        } else {
            // Graceful fallback for undefined actions
            console.warn(
                `UIUpdateHandler: Unknown action "${action}" - ignoring update`
            );
        }

        // Handle optional updates
        if (updateTimers) {
            this.timerController.updateTimerDisplays();
        }
        if (updateCount) {
            this.updateChallengeCount();
        }
    }

    /**
     * Handle add challenge UI updates with batched DOM operations for performance
     * @param _challengeIndices - Array indices of added challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were added
     */
    private handleAddUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges || challenges.length === 0) return;

        const challengesList = this.getCachedChallengesList();
        if (!challengesList) {
            console.error(
                "Challenge list container not found - cannot add challenges"
            );
            return;
        }

        // Use DocumentFragment for efficient batch DOM operations
        const fragment = document.createDocumentFragment();

        challenges.forEach((challenge) => {
            const challengeElement = this.createChallengeElement(challenge);
            fragment.appendChild(challengeElement);
        });

        // Single DOM append operation to reduce reflows
        challengesList.appendChild(fragment);

        // Single scroll animation at the end
        animateScroll();

        this.updateChallengeCount();
        this.timerController.startTimerUpdates();
    }

    /**
     * Handle edit challenge UI updates
     * @param _challengeIndices - Array indices of edited challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were edited
     */
    private handleEditUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges) return;

        challenges.forEach((challenge) => {
            this.editChallengeFromDOM(challenge);
        });
        this.timerController.startTimerUpdates();
    }

    /**
     * Handle complete challenge UI updates
     * @param _challengeIndices - Array indices of completed challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were completed
     */
    private handleCompleteUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges) return;

        challenges.forEach((challenge) => {
            DOMHelper.completeChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.timerController.updateTimerDisplays();
    }

    /**
     * Handle revert challenge UI updates
     * @param _challengeIndices - Array indices of reverted challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were reverted
     */
    private handleRevertUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges) return;

        challenges.forEach((challenge) => {
            DOMHelper.revertChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.timerController.updateTimerDisplays();
    }

    /**
     * Handle delete challenge UI updates
     * @param _challengeIndices - Array indices of deleted challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were deleted
     */
    private handleDeleteUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges) return;

        challenges.forEach((challenge) => {
            DOMHelper.deleteChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.timerController.updateTimerDisplays();
    }

    /**
     * Handle clear all challenges UI update
     */
    private handleClearAllUpdate(): void {
        this.clearListFromDOM();
    }

    /**
     * Handle clear done challenges UI update
     */
    private handleClearDoneUpdate(): void {
        const doneChallenges = this.challengeList.challenges.filter((c) =>
            c.isComplete()
        );
        doneChallenges.forEach((challenge) => {
            DOMHelper.deleteChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.timerController.updateTimerDisplays();
    }

    /**
     * Handle refresh UI update
     */
    private handleRefreshUpdate(): void {
        this.renderChallengeList();
    }

    /**
     * Clear the entire challenge list from DOM
     */
    clearListFromDOM(): void {
        // Clear the entire container and then re-render to ensure proper header structure
        const challengeContainer = document.querySelector(
            ".challenge-container"
        );

        if (challengeContainer) {
            challengeContainer.innerHTML = "";
        }

        this.renderChallengeList();
        this.updateChallengeCount();
        this.timerController.updateTimerDisplays();
    }

    /**
     * Add the challenge to the DOM (legacy method - prefer batched handleAddUpdate)
     * @param challenge - Challenge to add
     */
    addChallengeToDOM(challenge: Challenge): void {
        const challengesList = this.getCachedChallengesList();

        if (!challengesList) {
            console.error(
                "Challenge ordered list not found - ensure card is properly initialized"
            );
            return;
        }

        const challengeElement = this.createChallengeElement(challenge);

        // Add to the single challenge list
        challengesList.appendChild(challengeElement);

        // Animate scroll to new challenge
        animateScroll();
    }

    /**
     * Edit the challenge in the DOM
     * @param challenge - Challenge to edit
     */
    editChallengeFromDOM(challenge: Challenge): void {
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
            }

            // Update timer display if challenge has timer
            const timerElement =
                challengeElement.querySelector(".challenge-timer");
            if (challenge.timer && timerElement) {
                this.updateTimerElement(
                    timerElement as HTMLElement,
                    challenge.timer
                );
            } else if (!challenge.timer && timerElement) {
                timerElement.remove();
            } else if (challenge.timer && !timerElement) {
                // Add timer element if challenge now has timer
                const newTimerElement = this.createTimerElement(
                    challenge.timer,
                    challenge.id
                );
                challengeElement.appendChild(newTimerElement);
            }
        }

        // Restart timer updates to handle any timer changes
        this.timerController.startTimerUpdates();
    }

    /**
     * Get cached challenge container element, querying DOM if not cached
     * @returns Challenge container element or null if not found
     */
    private getCachedChallengeContainer(): HTMLElement | null {
        if (!this.challengeContainer) {
            this.challengeContainer = document.querySelector(
                ".challenge-container"
            );
        }
        return this.challengeContainer;
    }

    /**
     * Get cached challenges list element, querying DOM if not cached
     * @returns Challenges list element or null if not found
     */
    private getCachedChallengesList(): HTMLElement | null {
        if (!this.challengesList) {
            const container = this.getCachedChallengeContainer();
            if (container) {
                this.challengesList =
                    container.querySelector(".card .challenges");
            }
        }
        return this.challengesList;
    }

    /**
     * Invalidate DOM element cache (called when card structure is rebuilt)
     */
    private invalidateCache(): void {
        this.challengeContainer = null;
        this.challengesList = null;
    }

    /**
     * Render the complete challenge list to the DOM
     */
    renderChallengeList(): void {
        // Invalidate cache since we're rebuilding the card structure
        this.invalidateCache();

        const challengeContainer = this.getCachedChallengeContainer();

        if (!challengeContainer) {
            console.error("Challenge container not found");
            return;
        }

        // Clear existing content
        challengeContainer.innerHTML = "";

        // Create challenge card with proper header structure
        const challengeCard = DOMHelper.createChallengeCard(
            this.challengeList.challengesCompleted,
            this.challengeList.totalChallenges
        );

        // Append card to container
        challengeContainer.appendChild(challengeCard);

        // Invalidate cache again since DOM structure changed
        this.invalidateCache();

        // Get the ordered list from the card
        const challengeList = challengeCard.querySelector("ol.challenges");

        if (!challengeList) {
            console.error("Challenge ordered list not found in created card");
            return;
        }

        // Use DocumentFragment for efficient batch DOM operations
        const fragment = document.createDocumentFragment();

        // Render all challenges
        this.challengeList.challenges.forEach((challenge) => {
            const challengeElement = this.createChallengeElement(challenge);
            fragment.appendChild(challengeElement);
        });

        // Single DOM append operation to reduce reflows
        challengeList.appendChild(fragment);

        this.updateChallengeCount();
        this.timerController.startTimerUpdates();
    }

    /**
     * Create a challenge DOM element using shared renderer
     * @param challenge - Challenge to create element for
     * @returns HTMLElement representing the challenge
     */
    private createChallengeElement(challenge: Challenge): HTMLElement {
        // Use shared renderer with event handling support
        const challengeElement = ChallengeRenderer.createChallengeElement(
            challenge,
            {
                includeEventListeners: true,
                eventHandler: this.handleCheckboxClick,
            }
        );

        // Add timer element if challenge has timer
        if (challenge.timer) {
            const timerElement = this.createTimerElement(
                challenge.timer,
                challenge.id
            );
            challengeElement.appendChild(timerElement);
        }

        return challengeElement;
    }

    /**
     * Create a timer DOM element using shared utilities
     * @param timer - Timer instance
     * @param challengeId - Challenge ID for element identification
     * @returns HTMLElement representing the timer
     */
    private createTimerElement(timer: Timer, challengeId: string): HTMLElement {
        return TimerDisplayUtils.createTimerElement(timer, challengeId);
    }

    /**
     * Update a timer DOM element using shared utilities
     * @param timerElement - Timer DOM element to update
     * @param timer - Timer instance
     */
    private updateTimerElement(timerElement: HTMLElement, timer: Timer): void {
        TimerDisplayUtils.updateTimerElement(timerElement, timer);
    }

    /**
     * Handle checkbox click events to toggle challenge completion status
     * @param event - The click event
     */
    private handleCheckboxClick = (event: Event): void => {
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

        try {
            // Toggle the challenge completion using the encapsulated method
            const challenge =
                this.challengeList.toggleChallengeCompletion(challengeId);
            if (!challenge) {
                console.error("Could not find challenge with ID:", challengeId);
                return;
            }

            // Update DOM to reflect the new status
            if (challenge.isComplete()) {
                DOMHelper.completeChallengeFromDOM(challengeId);
            } else {
                DOMHelper.revertChallengeFromDOM(challengeId);
            }

            // Update count and timers
            this.updateChallengeCount();
            this.timerController.updateTimerDisplays();
        } catch (error) {
            console.error("Error toggling challenge completion:", error);
        }
    };

    /**
     * Update the challenge count display
     */
    updateChallengeCount(): void {
        // Use shared helper with efficient getters from ChallengeList
        DOMHelper.updateChallengeCount(
            this.challengeList.challengesCompleted,
            this.challengeList.totalChallenges
        );
    }

    /**
     * Update timer displays - delegates to TimerController
     * @public method for testing and external access
     */
    updateTimerDisplays(): void {
        this.timerController.updateTimerDisplays();
    }

    /**
     * Start timer updates - delegates to TimerController
     * @public method for testing and external access
     */
    startTimerUpdates(): void {
        this.timerController.startTimerUpdates();
    }

    /**
     * Stop timer updates - delegates to TimerController
     * @public method for testing and external access
     */
    stopTimerUpdates(): void {
        this.timerController.stopTimerUpdates();
    }

    /**
     * Get timer update interval status - delegates to TimerController
     * @public method for testing access
     */
    get timerUpdateInterval(): number | null {
        return this.timerController.getTimerUpdateInterval();
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.timerController.destroy();
    }
}
