import type ChallengeList from "../classes/ChallengeList";
import { ChallengeStatus } from "../types/ChallengeStatus";
import { CSS_CLASSES, CSS_SELECTORS } from "../types/DOMConstants";
import { TimerEndBehavior } from "../types/TimerEndBehavior";
import DOMHelper from "./DOMHelper";
import Timer from "./Timer";
import { notifyChallengeStateChanged } from "./windowRefresh";

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
        timerElement.classList.add(CSS_CLASSES.CHALLENGE_TIMER);
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
     * Uses ChallengeList's internal challenge map for quick access
     * Automatically fails challenges when their timers expire
     * @param challengeList - ChallengeList instance containing challenges
     * @returns boolean indicating if any active timers remain
     */
    static updateAllTimerDisplays(challengeList: ChallengeList): boolean {
        const timerElements = document.querySelectorAll(
            CSS_SELECTORS.CHALLENGE_TIMER
        );
        let hasActiveTimers = false;
        let stateChanged = false;

        timerElements.forEach((element) => {
            const challengeId = element.getAttribute("data-challenge-id");
            if (!challengeId) return;

            // Use ChallengeList's lookup instead of creating a new Map
            const challenge = challengeList.getChallengeById(challengeId);
            if (!challenge || !challenge.timer) return;

            if (challenge.timer.isActive) {
                hasActiveTimers = true;

                // Check if timer has expired and challenge is not already failed/completed
                if (
                    challenge.timer.isExpired() &&
                    challenge.getStatus() === ChallengeStatus.IN_PROGRESS
                ) {
                    const timerEndBehavior = challenge.getTimerEndBehavior();
                    let statusUpdated = false;

                    if (timerEndBehavior === TimerEndBehavior.AUTO_COMPLETE) {
                        const completedChallenge =
                            challengeList.completeChallengeById(challengeId);
                        statusUpdated = Boolean(
                            completedChallenge &&
                                completedChallenge.getStatus() ===
                                    ChallengeStatus.COMPLETED
                        );
                        if (statusUpdated) {
                            DOMHelper.completeChallengeFromDOM(challengeId);
                        }
                    } else {
                        const failedChallenge =
                            challengeList.markChallengeAsFailed(challengeId);
                        statusUpdated = Boolean(
                            failedChallenge &&
                                failedChallenge.getStatus() ===
                                    ChallengeStatus.FAILED
                        );
                        if (statusUpdated) {
                            DOMHelper.failChallengeFromDOM(challengeId);
                        }
                    }

                    if (statusUpdated) {
                        stateChanged = true;
                    }
                }

                // Use standardized update method for consistent behavior
                this.updateTimerElement(
                    element as HTMLElement,
                    challenge.timer
                );
            } else if (challenge.timer.isExpired()) {
                // Timer is expired but inactive - keep it visible with expired styling
                this.updateTimerElement(
                    element as HTMLElement,
                    challenge.timer
                );
            } else {
                // Timer is no longer active and not expired, remove the element
                element.remove();
            }
        });

        // If any challenge state changed, persist to localStorage and notify other windows
        if (stateChanged) {
            DOMHelper.updateChallengeCount(
                challengeList.challengesCompleted,
                challengeList.totalChallenges
            );
            challengeList.saveToLocalStorage();

            // Notify other windows about the state change
            notifyChallengeStateChanged();
        }

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
