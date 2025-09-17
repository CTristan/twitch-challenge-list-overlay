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
    completionStatus: boolean;
    failureStatus: boolean;
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
        } = {}
    ) {
        const { description = "", amount = 1, timer } = options;

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
        this.completionStatus = false;
        this.failureStatus = false;
        this.createdAt = Date.now();

        // Generate internal ID for storage (keep timestamp-based for uniqueness)
        this.id = this.#assignId();

        // Set up timer if provided
        if (timer) {
            this.setTimer(timer);
        }
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
        const salt = Math.floor(Math.random() * 10000);
        // format: DDHHMMSSMS + 4 digit salt
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
        if (this.progress >= this.amount && !this.completionStatus) {
            this.setCompletionStatus(true);
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
        if (this.progress < this.amount && this.completionStatus) {
            this.setCompletionStatus(false);
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
        if (this.progress >= this.amount && !this.completionStatus) {
            this.setCompletionStatus(true);
        } else if (this.progress < this.amount && this.completionStatus) {
            this.setCompletionStatus(false);
        }

        return this.progress;
    }

    /**
     * Get the completion status of the challenge
     * @returns Whether the challenge is complete
     */
    isComplete(): boolean {
        return this.completionStatus;
    }

    /**
     * Set the completion status of the challenge
     * @param status - The new completion status
     */
    setCompletionStatus(status: boolean): void {
        if (typeof status !== "boolean") {
            throw new Error("Completion status must be of type boolean");
        }
        this.completionStatus = status;

        // Stop timer when completed
        if (status && this.timer) {
            this.timer.stop();
        }
    }

    /**
     * Check if the challenge has failed
     * @returns Whether the challenge has failed
     */
    isFailed(): boolean {
        return this.failureStatus;
    }

    /**
     * Set the failure status of the challenge
     * @param status - The new failure status
     */
    setFailureStatus(status: boolean): void {
        if (typeof status !== "boolean") {
            throw new Error("Failure status must be of type boolean");
        }
        this.failureStatus = status;

        // Stop timer when failed
        if (status && this.timer) {
            this.timer.stop();
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
        if (this.failureStatus) return "❌";
        if (this.completionStatus) return "✅";
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
        challenge.completionStatus = data.completionStatus || false;
        challenge.failureStatus = data.failureStatus || false;
        challenge.createdAt = data.createdAt || Date.now();

        // Restore timer if present
        if (data.timer) {
            challenge.timer = Timer.fromData(data.timer);
        }

        return challenge;
    }

    /**
     * Serialize challenge for storage
     * @returns Serialized challenge data
     */
    toSerializedData(): any {
        return {
            title: this.title,
            description: this.description,
            amount: this.amount,
            progress: this.progress,
            completionStatus: this.completionStatus,
            failureStatus: this.failureStatus,
            createdAt: this.createdAt,
            timer: this.timer?.toData(),
        };
    }
}
