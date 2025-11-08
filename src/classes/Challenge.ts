import { ChallengeStatus } from "../types/ChallengeStatus";
import { CHALLENGE_STATES } from "../types/DOMConstants";
import { TimerEndBehavior } from "../types/TimerEndBehavior";
import Timer from "../utils/Timer";
import { ValidationUtils } from "../utils/ValidationUtils";

/**
 * @class Challenge
 * Enhanced challenge class supporting title, description, progress tracking,
 * and timer functionality for the robust command system.
 */
export default class Challenge {
    title: string;
    description: string;
    amount: number;
    progress: number;
    timer?: Timer;
    status: ChallengeStatus;
    timerEndBehavior: TimerEndBehavior;
    id: string;
    createdAt: number;

    /**
     * @constructor
     * @param title - Challenge title
     * @param options - Optional configuration for enhanced features
     */
    constructor(
        title: string,
        options: {
            description?: string;
            amount?: number;
            timer?: string | number;
            timerEndBehavior?: TimerEndBehavior;
        } = {}
    ) {
        const {
            description = "",
            amount = 1,
            timer,
            timerEndBehavior = TimerEndBehavior.AUTO_FAIL,
        } = options;

        // Validate and set title and description
        this.title = ValidationUtils.validateChallengeTitle(title);

        // Allow empty descriptions for title-only challenges
        this.description = description
            ? ValidationUtils.validateChallengeDescription(description, {
                  allowEmpty: true,
              })
            : "";

        this.amount = ValidationUtils.validateChallengeAmount(amount);
        this.progress = 0;
        this.status = ChallengeStatus.IN_PROGRESS;
        this.timerEndBehavior = timerEndBehavior;
        this.createdAt = Date.now();

        // Generate internal ID for storage (keep timestamp-based for uniqueness)
        this.id = this.#assignId();

        // Set up timer if provided
        if (timer) {
            this.setTimer(timer);
        }
    }

    getTimerEndBehavior(): TimerEndBehavior {
        return this.timerEndBehavior;
    }

    setTimerEndBehavior(timerEndBehavior: TimerEndBehavior): void {
        this.timerEndBehavior = timerEndBehavior;
    }

    /**
     * Validate the title of the challenge
     * @param title - The title to validate
     * @returns Validated title
     * @throws Error if title is invalid
     */
    validateTitle(title: string): string {
        return ValidationUtils.validateChallengeTitle(title);
    }

    /**
     * Validate the amount for the challenge
     * @param amount - The amount to validate
     * @returns Validated amount
     * @throws Error if amount is invalid
     */
    validateAmount(amount: number): number {
        return ValidationUtils.validateChallengeAmount(amount);
    }

    /**
     * Assign a unique timestamp-based ID to the challenge
     * @returns Unique ID string
     */
    #assignId(): string {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const hour = String(now.getHours()).padStart(2, "0");
        const minute = String(now.getMinutes()).padStart(2, "0");
        const second = String(now.getSeconds()).padStart(2, "0");
        const millisecond = String(now.getMilliseconds()).padStart(3, "0");
        const salt = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
        // format: DDHHMMSSMS + 4 digit salt (15 digits total)
        return `${day}${hour}${minute}${second}${millisecond}${salt}`;
    }

    /**
     * Set the title of the challenge
     * @param title - The new title
     */
    setTitle(title: string): void {
        this.title = ValidationUtils.validateChallengeTitle(title);
    }

    /**
     * Set the description of the challenge
     * @param description - The new description
     */
    setDescription(description: string): void {
        this.description = ValidationUtils.validateChallengeDescription(
            description,
            { allowEmpty: true }
        );
    }

    /**
     * Set the amount for the challenge
     * @param amount - The new amount
     */
    setAmount(amount: number): void {
        this.amount = ValidationUtils.validateChallengeAmount(amount);
        // Reset progress if new amount is less than current progress
        if (this.progress > this.amount) {
            this.progress = this.amount;
        }
    }

    /**
     * Set timer for the challenge
     * @param timer - Timer duration string or seconds
     */
    setTimer(timer: string | number): void {
        if (typeof timer === "string") {
            const duration = Timer.parseDuration(timer);
            this.timer = new Timer(duration);
        } else if (typeof timer === "number") {
            this.timer = new Timer(timer);
        } else {
            throw new Error(
                "Timer must be a duration string or number of seconds"
            );
        }
    }

    clearTimer(): void {
        if (this.timer) {
            this.timer.stop();
        }
        delete this.timer;
    }

    /**
     * Start the challenge timer
     */
    startTimer(): void {
        if (this.timer) {
            this.timer.start();
        }
    }

    /**
     * Stop the challenge timer
     */
    stopTimer(): void {
        if (this.timer) {
            this.timer.stop();
        }
    }

    /**
     * Check if timer has expired
     * @returns Whether timer has expired
     */
    isTimerExpired(): boolean {
        return this.timer ? this.timer.isExpired() : false;
    }

    /**
     * Increment progress by specified amount
     * @param amount - Amount to increment (default: 1)
     * @returns New progress value
     */
    incrementProgress(amount: number = 1): number {
        if (typeof amount !== "number" || amount < 0) {
            throw new Error("Increment amount must be a non-negative number");
        }

        this.progress = Math.min(this.progress + amount, this.amount);

        // Auto-complete if progress reaches amount
        if (
            this.progress >= this.amount &&
            this.status !== ChallengeStatus.COMPLETED
        ) {
            this.setStatus(ChallengeStatus.COMPLETED);
        }

        return this.progress;
    }

    /**
     * Decrement progress by specified amount
     * @param amount - Amount to decrement (default: 1)
     * @returns New progress value
     */
    decrementProgress(amount: number = 1): number {
        if (typeof amount !== "number" || amount < 0) {
            throw new Error("Decrement amount must be a non-negative number");
        }

        this.progress = Math.max(this.progress - amount, 0);

        // Remove completion status if progress drops below amount
        if (
            this.progress < this.amount &&
            this.status === ChallengeStatus.COMPLETED
        ) {
            this.setStatus(ChallengeStatus.IN_PROGRESS);
        }

        return this.progress;
    }

    /**
     * Set progress to specific value
     * @param progress - New progress value
     * @returns New progress value
     */
    setProgress(progress: number): number {
        if (typeof progress !== "number" || progress < 0) {
            throw new Error("Progress must be a non-negative number");
        }

        this.progress = Math.min(progress, this.amount);

        // Update completion status based on progress
        if (
            this.progress >= this.amount &&
            this.status !== ChallengeStatus.COMPLETED
        ) {
            this.setStatus(ChallengeStatus.COMPLETED);
        } else if (
            this.progress < this.amount &&
            this.status === ChallengeStatus.COMPLETED
        ) {
            this.setStatus(ChallengeStatus.IN_PROGRESS);
        }

        return this.progress;
    }

    /**
     * Get the completion status of the challenge
     * @returns Whether the challenge is complete
     */
    isComplete(): boolean {
        return this.status === ChallengeStatus.COMPLETED;
    }

    /**
     * Check if the challenge has failed
     * @returns Whether the challenge has failed
     */
    isFailed(): boolean {
        return this.status === ChallengeStatus.FAILED;
    }

    /**
     * Get the current status of the challenge
     * @returns The current ChallengeStatus
     */
    getStatus(): ChallengeStatus {
        return this.status;
    }

    /**
     * Set the status of the challenge
     * @param newStatus - The new status to set
     */
    setStatus(newStatus: ChallengeStatus): void {
        const previousStatus = this.status;
        this.status = newStatus;

        // Stop timer when completed or failed
        if (
            (newStatus === ChallengeStatus.COMPLETED ||
                newStatus === ChallengeStatus.FAILED) &&
            this.timer
        ) {
            this.timer.stop();
        }

        // Restart timer when returning to in-progress from completed/failed
        if (
            newStatus === ChallengeStatus.IN_PROGRESS &&
            (previousStatus === ChallengeStatus.COMPLETED ||
                previousStatus === ChallengeStatus.FAILED) &&
            this.timer &&
            !this.timer.isActive &&
            this.timer.getRemainingTime() > 0
        ) {
            this.timer.start();
        }
    }

    /**
     * Cycle through challenge states: in-progress → completed → failed → in-progress
     * @returns The new state as a string ("in-progress", "done", or "failed")
     */
    cycleState(): string {
        switch (this.status) {
            case ChallengeStatus.IN_PROGRESS:
                // in-progress → completed
                this.setStatus(ChallengeStatus.COMPLETED);
                return CHALLENGE_STATES.DONE;
            case ChallengeStatus.COMPLETED:
                // completed → failed
                this.setStatus(ChallengeStatus.FAILED);
                return CHALLENGE_STATES.FAILED;
            case ChallengeStatus.FAILED:
                // failed → in-progress
                this.setStatus(ChallengeStatus.IN_PROGRESS);
                return CHALLENGE_STATES.IN_PROGRESS;
            default:
                return CHALLENGE_STATES.IN_PROGRESS;
        }
    }

    /**
     * Get the current state of the challenge as a display string
     * @returns The current state as a string ("in-progress", "done", or "failed")
     */
    getState(): string {
        switch (this.status) {
            case ChallengeStatus.FAILED:
                return CHALLENGE_STATES.FAILED;
            case ChallengeStatus.COMPLETED:
                return CHALLENGE_STATES.DONE;
            case ChallengeStatus.IN_PROGRESS:
            default:
                return CHALLENGE_STATES.IN_PROGRESS;
        }
    }

    /**
     * Get progress as a formatted string
     * @returns Progress string (e.g., "15/30")
     */
    getProgressString(): string {
        return `${this.progress}/${this.amount}`;
    }

    /**
     * Get timer display string
     * @returns Timer string or empty if no timer
     */
    getTimerString(): string {
        if (!this.timer || !this.timer.isActive) return "";
        return this.timer.getFormattedTime();
    }

    /**
     * Get challenge status for display
     * @returns Status emoji
     */
    getStatusEmoji(): string {
        if (this.status === ChallengeStatus.FAILED) return "❌";
        if (this.status === ChallengeStatus.COMPLETED) return "✅";
        if (this.timer?.isActive) return this.timer.getStatusDisplay();
        return "📝";
    }

    /**
     * Create challenge from serialized data (for localStorage)
     * @param data - Serialized challenge data
     * @returns Challenge instance
     */
    static fromSerializedData(data: any): Challenge {
        const challenge = new Challenge(
            data.title || data.description || "Untitled Challenge",
            {
                description: data.description || "",
                amount: data.amount || 1,
            }
        );

        challenge.progress = data.progress || 0;

        // Handle both new status enum and legacy boolean fields for backward compatibility
        if (data.status) {
            challenge.status = data.status as ChallengeStatus;
        } else if (data.failureStatus) {
            challenge.status = ChallengeStatus.FAILED;
        } else if (data.completionStatus) {
            challenge.status = ChallengeStatus.COMPLETED;
        } else {
            challenge.status = ChallengeStatus.IN_PROGRESS;
        }

        challenge.createdAt = data.createdAt || Date.now();

        // Restore timer if present
        if (data.timer) {
            challenge.timer = Timer.fromData(data.timer);
        }

        challenge.timerEndBehavior =
            data.timerEndBehavior ?? TimerEndBehavior.AUTO_FAIL;

        const persistedId =
            typeof data.id === "string" && data.id.trim().length > 0
                ? data.id.trim()
                : null;
        if (persistedId) {
            challenge.id = persistedId;
        }

        return challenge;
    }

    /**
     * Serialize challenge for storage
     * @returns Serialized challenge data
     */
    toSerializedData(): any {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            amount: this.amount,
            progress: this.progress,
            status: this.status,
            createdAt: this.createdAt,
            timer: this.timer?.toData(),
            timerEndBehavior: this.timerEndBehavior,
        };
    }
}
