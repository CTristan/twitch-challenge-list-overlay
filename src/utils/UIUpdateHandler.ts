import { animateScroll } from "../animations/animateScroll";
import Challenge from "../classes/Challenge";
import ChallengeList from "../classes/ChallengeList";
import ChallengeRenderer from "./ChallengeRenderer";
import Timer from "./Timer";
import TimerDisplayUtils from "./TimerDisplayUtils";

/**
 * @class UIUpdateHandler
 * Handles all DOM manipulation operations based on command results.
 * Provides separation of concerns between command processing and UI updates.
 */
export default class UIUpdateHandler {
    private challengeList: ChallengeList;
    private timerUpdateInterval: number | null = null;

    /**
     * @constructor
     * @param challengeList - The challenge list instance
     */
    constructor(challengeList: ChallengeList) {
        this.challengeList = challengeList;
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

        switch (action) {
            case "add":
                this.handleAddUpdate(challengeIndices, challenges);
                break;
            case "edit":
                this.handleEditUpdate(challengeIndices, challenges);
                break;
            case "complete":
                this.handleCompleteUpdate(challengeIndices, challenges);
                break;
            case "revert":
                this.handleRevertUpdate(challengeIndices, challenges);
                break;
            case "delete":
                this.handleDeleteUpdate(challengeIndices, challenges);
                break;
            case "clearAll":
                this.handleClearAllUpdate();
                break;
            case "clearDone":
                this.handleClearDoneUpdate();
                break;
            case "refresh":
                this.handleRefreshUpdate();
                break;
        }

        // Handle optional updates
        if (updateTimers) {
            this.updateTimerDisplays();
        }
        if (updateCount) {
            this.updateChallengeCount();
        }
    }

    /**
     * Handle add challenge UI updates
     * @param _challengeIndices - Array indices of added challenges (unused but kept for interface compatibility)
     * @param challenges - Challenge objects that were added
     */
    private handleAddUpdate(
        _challengeIndices?: number[],
        challenges?: Challenge[]
    ): void {
        if (!challenges) return;

        challenges.forEach((challenge) => {
            this.addChallengeToDOM(challenge);
        });
        this.updateChallengeCount();
        this.startTimerUpdates();
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
        this.startTimerUpdates();
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
            this.completeChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.updateTimerDisplays();
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
            this.revertChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.updateTimerDisplays();
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
            this.deleteChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.updateTimerDisplays();
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
            this.deleteChallengeFromDOM(challenge.id);
        });
        this.updateChallengeCount();
        this.updateTimerDisplays();
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

        this.renderChallengeList();
        this.updateChallengeCount();
        this.updateTimerDisplays();
    }

    /**
     * Add the challenge to the DOM
     * @param challenge - Challenge to add
     */
    addChallengeToDOM(challenge: Challenge): void {
        const primaryContainer = document.querySelector(
            ".challenge-container.primary"
        );
        const secondaryContainer = document.querySelector(
            ".challenge-container.secondary"
        );

        if (!primaryContainer || !secondaryContainer) {
            console.error("Challenge containers not found");
            return;
        }

        const challengeElement = this.createChallengeElement(challenge);

        // Add to both containers for dual-window architecture
        // Optimization: Use original element for primary, clone only once for secondary
        primaryContainer.appendChild(challengeElement);
        const secondaryClone = challengeElement.cloneNode(true) as HTMLElement;
        secondaryContainer.appendChild(secondaryClone);

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
        this.startTimerUpdates();
    }

    /**
     * Complete the challenge in the DOM
     * @param challengeId - ID of challenge to complete
     */
    completeChallengeFromDOM(challengeId: string): void {
        const challengeElements = document.querySelectorAll(
            `[data-challenge-id="${challengeId}"]`
        );

        for (const challengeElement of challengeElements) {
            challengeElement.classList.add("done");

            // Update checkbox to checked state
            const checkbox = challengeElement.querySelector(
                ".challenge-checkbox"
            );
            if (checkbox) {
                checkbox.classList.add("checked");
            }
        }
        this.updateChallengeCount();
        this.updateTimerDisplays();
    }

    /**
     * Delete the challenge in the DOM
     * @param challengeId - ID of challenge to delete
     */
    deleteChallengeFromDOM(challengeId: string): void {
        const challengeElements = document.querySelectorAll(
            `[data-challenge-id="${challengeId}"]`
        );

        for (const challengeElement of challengeElements) {
            challengeElement.remove();
        }
        this.updateChallengeCount();
        this.updateTimerDisplays();
    }

    /**
     * Revert a completed challenge back to active status in the DOM
     * @param challengeId - ID of challenge to revert
     */
    revertChallengeFromDOM(challengeId: string): void {
        const challengeElements = document.querySelectorAll(
            `[data-challenge-id="${challengeId}"]`
        );

        for (const challengeElement of challengeElements) {
            challengeElement.classList.remove("done");

            // Update checkbox to unchecked state
            const checkbox = challengeElement.querySelector(
                ".challenge-checkbox"
            );
            if (checkbox) {
                checkbox.classList.remove("checked");
            }
        }
        this.updateChallengeCount();
        this.updateTimerDisplays();
    }

    /**
     * Render the complete challenge list to the DOM
     */
    renderChallengeList(): void {
        const primaryContainer = document.querySelector(
            ".challenge-container.primary"
        );
        const secondaryContainer = document.querySelector(
            ".challenge-container.secondary"
        );

        if (!primaryContainer || !secondaryContainer) {
            console.error("Challenge containers not found");
            return;
        }

        // Clear existing content
        primaryContainer.innerHTML = "";
        secondaryContainer.innerHTML = "";

        // Render all challenges
        this.challengeList.challenges.forEach((challenge) => {
            const challengeElement = this.createChallengeElement(challenge);

            // Use original element for primary, clone only once for secondary
            primaryContainer.appendChild(challengeElement);
            const secondaryClone = challengeElement.cloneNode(
                true
            ) as HTMLElement;
            secondaryContainer.appendChild(secondaryClone);
        });

        this.updateChallengeCount();
        this.startTimerUpdates();
    }

    /**
     * Create a challenge DOM element
     * @param challenge - Challenge to create element for
     * @returns HTMLElement representing the challenge
     */
    private createChallengeElement(challenge: Challenge): HTMLElement {
        const challengeElement = document.createElement("li");
        challengeElement.className = `challenge ${
            challenge.isComplete() ? "done" : ""
        }`;
        challengeElement.dataset["challengeId"] = challenge.id;

        // Create checkbox for admin mode using shared renderer
        const checkbox = ChallengeRenderer.createChallengeCheckbox(
            challenge.isComplete()
        );
        checkbox.addEventListener("click", this.handleCheckboxClick);

        // Create challenge text using shared renderer
        const textElement =
            ChallengeRenderer.createChallengeTextElement(challenge);

        challengeElement.appendChild(checkbox);
        challengeElement.appendChild(textElement);

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
                this.completeChallengeFromDOM(challengeId);
            } else {
                this.revertChallengeFromDOM(challengeId);
            }
        } catch (error) {
            console.error("Error toggling challenge completion:", error);
        }
    };

    /**
     * Update the challenge count display
     */
    updateChallengeCount(): void {
        const totalChallenges = this.challengeList.challenges.length;
        const completedChallenges = this.challengeList.challenges.filter((c) =>
            c.isComplete()
        ).length;

        const countElements = document.querySelectorAll(".challenge-count");
        countElements.forEach((element) => {
            element.textContent = `${completedChallenges}/${totalChallenges}`;
        });
    }

    /**
     * Start timer updates for real-time countdown display
     */
    startTimerUpdates(): void {
        // Clear existing interval
        if (this.timerUpdateInterval) {
            clearInterval(this.timerUpdateInterval);
        }

        // Check if there are any active timers using shared utility
        const hasActiveTimers = TimerDisplayUtils.hasActiveTimers(
            this.challengeList
        );

        // Only start interval if there are active timers
        if (hasActiveTimers) {
            this.timerUpdateInterval = window.setInterval(() => {
                this.updateTimerDisplays();
            }, 1000);
        }
    }

    /**
     * Update all timer displays using shared utilities
     */
    updateTimerDisplays(): void {
        // Use shared utility for consistent timer display updates
        const hasActiveTimers = TimerDisplayUtils.updateAllTimerDisplays(
            this.challengeList
        );

        // Stop updates if no active timers remain
        if (!hasActiveTimers) {
            this.stopTimerUpdates();
        }
    }

    /**
     * Stop timer updates
     */
    stopTimerUpdates(): void {
        if (this.timerUpdateInterval) {
            clearInterval(this.timerUpdateInterval);
            this.timerUpdateInterval = null;
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.stopTimerUpdates();
    }
}
