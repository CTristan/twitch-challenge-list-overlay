import { animateScroll } from "../animations/animateScroll";
import Challenge from "../classes/Challenge";
import ChallengeList from "../classes/ChallengeList";
import Timer from "./Timer";

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
        const primaryClone = challengeElement.cloneNode(true) as HTMLElement;
        const secondaryClone = challengeElement.cloneNode(true) as HTMLElement;

        primaryContainer.appendChild(primaryClone);
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
                    this.createChallengeTextElement(challenge);

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
                    challenge.timer
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

            const primaryClone = challengeElement.cloneNode(
                true
            ) as HTMLElement;
            const secondaryClone = challengeElement.cloneNode(
                true
            ) as HTMLElement;

            primaryContainer.appendChild(primaryClone);
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

        // Create checkbox for admin mode
        const checkbox = document.createElement("div");
        checkbox.className = `challenge-checkbox ${
            challenge.isComplete() ? "checked" : ""
        }`;
        checkbox.addEventListener("click", this.handleCheckboxClick);

        // Create challenge text using the same structure as the original App
        const textElement = this.createChallengeTextElement(challenge);

        challengeElement.appendChild(checkbox);
        challengeElement.appendChild(textElement);

        // Add timer element if challenge has timer
        if (challenge.timer) {
            const timerElement = this.createTimerElement(challenge.timer);
            challengeElement.appendChild(timerElement);
        }

        return challengeElement;
    }

    /**
     * Create DOM structure for challenge text with title and description on separate lines
     * @param challenge - The challenge object
     * @returns DOM element containing the formatted challenge text
     */
    private createChallengeTextElement(challenge: Challenge): HTMLElement {
        const textContainer = document.createElement("div");
        textContainer.classList.add("challenge-text");

        // Create title element
        const titleElement = document.createElement("div");
        titleElement.classList.add("challenge-title");
        titleElement.textContent = challenge.title;
        textContainer.appendChild(titleElement);

        // Add description if it's different from title and not empty
        if (
            challenge.title !== challenge.description &&
            challenge.description &&
            challenge.description.trim() !== ""
        ) {
            const descriptionElement = document.createElement("div");
            descriptionElement.classList.add("challenge-description");
            descriptionElement.textContent = challenge.description;
            textContainer.appendChild(descriptionElement);
        }

        // Add progress if it's greater than 1
        if (challenge.amount > 1) {
            const progressElement = document.createElement("div");
            progressElement.classList.add("challenge-amount");
            progressElement.textContent = `Progress: ${challenge.progress}/${challenge.amount}`;
            textContainer.appendChild(progressElement);
        }

        return textContainer;
    }

    /**
     * Create a timer DOM element
     * @param timer - Timer instance
     * @returns HTMLElement representing the timer
     */
    private createTimerElement(timer: Timer): HTMLElement {
        const timerElement = document.createElement("div");
        timerElement.className = "challenge-timer";
        this.updateTimerElement(timerElement, timer);
        return timerElement;
    }

    /**
     * Update a timer DOM element
     * @param timerElement - Timer DOM element to update
     * @param timer - Timer instance
     */
    private updateTimerElement(timerElement: HTMLElement, timer: Timer): void {
        const timeLeft = timer.getRemainingTime();
        const formattedTime = timer.getFormattedTime(timeLeft);

        // Determine timer state for styling
        let timerClass = "challenge-timer";
        let emoji = "⏱️";

        if (timeLeft <= 0) {
            timerClass += " expired";
            emoji = "⏰";
        } else if (timeLeft <= 30) {
            timerClass += " critical";
            emoji = "🔴";
        } else if (timeLeft <= 120) {
            timerClass += " warning";
            emoji = "🟡";
        }

        timerElement.className = timerClass;
        timerElement.textContent = `Timer: ${formattedTime} ${emoji}`;
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

        // Find the challenge object
        const challenge = this.challengeList.challenges.find(
            (c) => c.id === challengeId
        );
        if (!challenge) {
            console.error("Could not find challenge with ID:", challengeId);
            return;
        }

        try {
            // Toggle completion status
            if (challenge.isComplete()) {
                challenge.setCompletionStatus(false);
                this.revertChallengeFromDOM(challengeId);
            } else {
                challenge.setCompletionStatus(true);
                if (challenge.timer && challenge.timer.isActive) {
                    challenge.timer.stop();
                }
                this.completeChallengeFromDOM(challengeId);
            }

            // Update the challenge and recalculate counters, then persist to storage
            this.challengeList.updateChallenge();
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

        // Start new interval for timer updates
        this.timerUpdateInterval = window.setInterval(() => {
            this.updateTimerDisplays();
        }, 1000);
    }

    /**
     * Update all timer displays
     */
    updateTimerDisplays(): void {
        const timerElements = document.querySelectorAll(".challenge-timer");

        timerElements.forEach((timerElement) => {
            const challengeElement = timerElement.closest(
                ".challenge"
            ) as HTMLElement;
            if (!challengeElement) return;

            const challengeId = challengeElement.dataset["challengeId"];
            if (!challengeId) return;

            const challenge = this.challengeList.challenges.find(
                (c) => c.id === challengeId
            );
            if (!challenge || !challenge.timer) return;

            this.updateTimerElement(
                timerElement as HTMLElement,
                challenge.timer
            );
        });
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
