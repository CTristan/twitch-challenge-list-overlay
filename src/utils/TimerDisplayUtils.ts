import ChallengeList from "../classes/ChallengeList";
import Timer from "./Timer";

/**
 * @class TimerDisplayUtils
 * Shared utilities for timer display management to eliminate duplication
 * between App.ts and UIUpdateHandler.ts timer rendering logic.
 */
export class TimerDisplayUtils {
    /**
     * Create a standardized timer DOM element
     * @param timer - Timer instance
     * @param challengeId - Challenge ID for element identification
     * @returns HTMLElement representing the timer
     */
    static createTimerElement(timer: Timer, challengeId: string): HTMLElement {
        const timerElement = document.createElement("div");
        timerElement.classList.add("challenge-timer");
        timerElement.dataset["challengeId"] = challengeId;

        // Initialize timer content using standardized update method
        this.updateTimerElement(timerElement, timer);

        return timerElement;
    }

    /**
     * Update timer element content and CSS classes based on timer state
     * Standardizes the timer display format and visual state indicators
     * @param element - Timer DOM element to update
     * @param timer - Timer instance
     */
    static updateTimerElement(element: HTMLElement, timer: Timer): void {
        // Get standardized timer content using Timer class methods
        const timeRemaining = timer.getFormattedTime();
        const statusEmoji = timer.getStatusDisplay();
        element.textContent = `Timer: ${timeRemaining} ${statusEmoji}`;

        // Standardized CSS class management - remove all state classes first
        element.classList.remove("warning", "critical", "expired");

        // Apply appropriate state class based on timer status
        if (timer.isExpired()) {
            element.classList.add("expired");
        } else {
            const remaining = timer.getRemainingTime();
            if (remaining <= 30) {
                element.classList.add("critical");
            } else if (remaining <= 120) {
                element.classList.add("warning");
            }
        }
    }

    /**
     * Update all timer displays in the DOM using optimized challenge lookup
     * Eliminates O(n²) complexity by using Map for O(1) challenge access
     * @param challengeList - ChallengeList instance containing challenges
     * @returns boolean indicating if any active timers remain
     */
    static updateAllTimerDisplays(challengeList: ChallengeList): boolean {
        const timerElements = document.querySelectorAll(".challenge-timer");
        let hasActiveTimers = false;

        // Create challenge lookup map for O(1) access instead of O(n) find operations
        // This reduces overall complexity from O(n²) to O(n)
        const challengeMap = new Map(
            challengeList.challenges.map((challenge) => [
                challenge.id,
                challenge,
            ])
        );

        timerElements.forEach((element) => {
            const challengeId = element.getAttribute("data-challenge-id");
            if (!challengeId) return;

            const challenge = challengeMap.get(challengeId);
            if (!challenge || !challenge.timer) return;

            if (challenge.timer.isActive) {
                hasActiveTimers = true;
                // Use standardized update method for consistent behavior
                this.updateTimerElement(
                    element as HTMLElement,
                    challenge.timer
                );
            } else {
                // Timer is no longer active, remove the element
                element.remove();
            }
        });

        return hasActiveTimers;
    }

    /**
     * Check if any challenges have active timers
     * Utility method for determining whether to start/continue timer updates
     * @param challengeList - ChallengeList instance containing challenges
     * @returns boolean indicating if any active timers exist
     */
    static hasActiveTimers(challengeList: ChallengeList): boolean {
        return challengeList.challenges.some(
            (challenge) => challenge.timer && challenge.timer.isActive
        );
    }
}

export default TimerDisplayUtils;
