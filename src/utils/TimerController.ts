import ChallengeList from "../classes/ChallengeList";
import TimerDisplayUtils from "./TimerDisplayUtils";

/**
 * @class TimerController
 * Shared timer lifecycle management to provide centralized timer update coordination with consistent behavior.
 */
export default class TimerController {
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
     * Start timer updates for real-time countdown display
     */
    startTimerUpdates(): void {
        // Clear existing interval
        this.stopTimerUpdates();

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
     * Get timer update interval status
     * @returns The current timer interval ID or null if not running
     */
    getTimerUpdateInterval(): number | null {
        return this.timerUpdateInterval;
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.stopTimerUpdates();
    }
}
