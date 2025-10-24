/**
 * Enum representing the status of a challenge
 * Replaces the previous boolean-based completionStatus and failureStatus fields
 */
export enum ChallengeStatus {
    /**
     * Challenge is currently active and in progress
     */
    IN_PROGRESS = "in-progress",

    /**
     * Challenge has been completed successfully
     */
    COMPLETED = "completed",

    /**
     * Challenge has failed (e.g., timer expired or manually marked as failed)
     */
    FAILED = "failed",
}

/**
 * Type guard to check if a value is a valid ChallengeStatus
 * @param value - The value to check
 * @returns True if the value is a valid ChallengeStatus
 */
export function isChallengeStatus(value: unknown): value is ChallengeStatus {
    return (
        typeof value === "string" &&
        Object.values(ChallengeStatus).includes(value as ChallengeStatus)
    );
}
