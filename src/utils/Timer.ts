/**
 * @class Timer
 * Handles challenge timer functionality including duration parsing,
 * countdown management, and formatted time display.
 */
export default class Timer {
    duration: number; // Total duration in seconds
    startTime: number; // Timestamp when timer started
    endTime: number; // Timestamp when timer should end
    isActive: boolean; // Whether timer is currently running
    isPaused: boolean; // Whether timer is paused
    private pausedTime: number = 0; // Time spent paused
    private wasExpired: boolean = false; // Track if timer expired before being stopped

    /**
     * @constructor
     * @param duration - Duration in seconds
     */
    constructor(duration: number) {
        this.duration = duration;
        this.startTime = 0;
        this.endTime = 0;
        this.isActive = false;
        this.isPaused = false;
    }

    /**
     * Parse timer duration from various string formats
     * @param timerString - Duration string (e.g., "90s", "10m", "1h30m", "12:00")
     * @returns Duration in seconds
     * @throws Error if format is invalid
     */
    static parseDuration(timerString: string): number {
        if (!timerString || typeof timerString !== "string") {
            throw new Error("Timer duration must be a string");
        }

        const input = timerString.trim().toLowerCase();

        // Handle clock format (mm:ss or hh:mm:ss)
        if (input.includes(":")) {
            return Timer.parseClockFormat(input);
        }

        // Handle duration format (90s, 10m, 1h30m, etc.)
        return Timer.parseDurationFormat(input);
    }

    /**
     * Parse clock format time (mm:ss or hh:mm:ss)
     * @param clockString - Clock format string
     * @returns Duration in seconds
     */
    private static parseClockFormat(clockString: string): number {
        const parts = clockString.split(":").map((part) => parseInt(part, 10));

        if (parts.some(isNaN)) {
            throw new Error("Invalid clock format. Use mm:ss or hh:mm:ss");
        }

        if (parts.length === 2) {
            // mm:ss format
            const minutes = parts[0];
            const seconds = parts[1];
            if (
                minutes === undefined ||
                seconds === undefined ||
                minutes < 0 ||
                seconds < 0 ||
                seconds >= 60
            ) {
                throw new Error("Invalid time values in clock format");
            }
            return minutes * 60 + seconds;
        } else if (parts.length === 3) {
            // hh:mm:ss format
            const hours = parts[0];
            const minutes = parts[1];
            const seconds = parts[2];
            if (
                hours === undefined ||
                minutes === undefined ||
                seconds === undefined ||
                hours < 0 ||
                minutes < 0 ||
                seconds < 0 ||
                minutes >= 60 ||
                seconds >= 60
            ) {
                throw new Error("Invalid time values in clock format");
            }
            return hours * 3600 + minutes * 60 + seconds;
        } else {
            throw new Error("Invalid clock format. Use mm:ss or hh:mm:ss");
        }
    }

    /**
     * Parse duration format (90s, 10m, 1h30m, etc.)
     * @param durationString - Duration format string
     * @returns Duration in seconds
     */
    private static parseDurationFormat(durationString: string): number {
        let totalSeconds = 0;

        // Check for negative signs first
        if (durationString.includes("-")) {
            throw new Error("Invalid duration value");
        }

        // Match patterns like 1h, 30m, 45s
        const patterns = [
            { regex: /(\d+)h/g, multiplier: 3600 }, // hours
            { regex: /(\d+)m/g, multiplier: 60 }, // minutes
            { regex: /(\d+)s/g, multiplier: 1 }, // seconds
        ];

        let hasMatch = false;

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.regex.exec(durationString)) !== null) {
                if (!match[1]) continue;
                const value = parseInt(match[1], 10);
                if (isNaN(value) || value < 0) {
                    throw new Error("Invalid duration value");
                }
                totalSeconds += value * pattern.multiplier;
                hasMatch = true;
            }
        }

        if (!hasMatch) {
            throw new Error(
                "Invalid timer format. Use: 90s, 10m, 1h30m, or 12:00"
            );
        }

        if (totalSeconds <= 0) {
            throw new Error("Timer duration must be greater than 0");
        }

        return totalSeconds;
    }

    /**
     * Start the timer
     */
    start(): void {
        const now = Date.now();
        this.startTime = now;
        this.endTime = now + this.duration * 1000;
        this.isActive = true;
        this.isPaused = false;
        this.pausedTime = 0;
        this.wasExpired = false;
    }

    /**
     * Pause the timer
     */
    pause(): void {
        if (this.isActive && !this.isPaused) {
            this.isPaused = true;
            this.pausedTime = Date.now();
        }
    }

    /**
     * Resume the timer
     */
    resume(): void {
        if (this.isActive && this.isPaused) {
            const pauseDuration = Date.now() - this.pausedTime;
            this.endTime += pauseDuration;
            this.isPaused = false;
            this.pausedTime = 0;
        }
    }

    /**
     * Stop the timer
     */
    stop(): void {
        // Remember if timer was expired before stopping
        if (this.isActive && this.getRemainingTime() <= 0) {
            this.wasExpired = true;
        }
        this.isActive = false;
        this.isPaused = false;
        this.pausedTime = 0;
    }

    /**
     * Get remaining time in seconds
     * @returns Remaining seconds (0 if expired)
     */
    getRemainingTime(): number {
        if (!this.isActive) return 0;
        if (this.isPaused)
            return Math.max(
                0,
                Math.ceil((this.endTime - this.pausedTime) / 1000)
            );

        const remaining = Math.max(
            0,
            Math.ceil((this.endTime - Date.now()) / 1000)
        );
        return remaining;
    }

    /**
     * Check if timer has expired
     * @returns Whether timer has expired
     */
    isExpired(): boolean {
        // If inactive, check if it was expired when stopped
        if (!this.isActive) return this.wasExpired;
        return this.getRemainingTime() <= 0;
    }

    /**
     * Get formatted time string for display
     * @param remaining - Optional remaining seconds (uses current if not provided)
     * @returns Formatted time string (e.g., "5m 23s", "1h 30m", "45s")
     */
    getFormattedTime(remaining?: number): string {
        const seconds =
            remaining !== undefined ? remaining : this.getRemainingTime();

        if (seconds <= 0) return "0s";

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts: string[] = [];

        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(" ");
    }

    /**
     * Get timer status for display
     * @returns Status string with appropriate emoji
     */
    getStatusDisplay(): string {
        // Show expired emoji if timer has expired, even if inactive
        if (this.isExpired()) return "⏰";
        if (!this.isActive) return "";
        if (this.isPaused) return "⏸️";

        const remaining = this.getRemainingTime();
        if (remaining <= 30) return "🔴"; // Critical
        if (remaining <= 120) return "🟡"; // Warning
        return "⏱️"; // Normal
    }

    /**
     * Create timer from serialized data
     * @param data - Serialized timer data
     * @returns Timer instance
     */
    static fromData(data: ChallengeTimer): Timer {
        const timer = new Timer(data.duration);
        timer.startTime = data.startTime;
        timer.endTime = data.endTime;
        timer.isActive = data.isActive;
        timer.isPaused = data.isPaused;
        timer.pausedTime = data.pausedTime || 0;
        timer.wasExpired = data.wasExpired || false;
        return timer;
    }

    /**
     * Serialize timer to data object
     * @returns Serialized timer data
     */
    toData(): ChallengeTimer {
        return {
            duration: this.duration,
            startTime: this.startTime,
            endTime: this.endTime,
            isActive: this.isActive,
            isPaused: this.isPaused,
            pausedTime: this.pausedTime,
            wasExpired: this.wasExpired,
        };
    }
}
