import Challenge from "../classes/Challenge";
import {
    ERROR_MESSAGES,
    HELP_MESSAGES,
    PERMISSION_MESSAGES,
    SUCCESS_MESSAGES,
} from "../types/MessageConstants";
import { formatDisplayPosition } from "./PositionUtils";

/**
 * Response formatting options
 */
export interface ResponseOptions {
    includeEmoji?: boolean;
    includeProgress?: boolean;
    includeTimer?: boolean;
    includeShortId?: boolean;
    maxLength?: number;
}

/**
 * @class ResponseFormatter
 * Centralized utility for formatting user-facing messages and chat responses.
 * Consolidates response formatting logic from CommandHandler methods to ensure
 * consistent messaging across the application.
 */
export class ResponseFormatter {
    /**
     * Format a success response for adding a challenge
     * @param challenge - The added challenge
     * @param index - Array index of the challenge for display position
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatAddResponse(
        challenge: Challenge,
        index: number,
        options: ResponseOptions = {}
    ): string {
        const {
            includeEmoji = true,
            includeProgress = true,
            includeTimer = true,
            includeShortId = true,
        } = options;

        let response = "";

        // Add challenge ID if requested
        if (includeShortId) {
            response += `[#${formatDisplayPosition(index)}] `;
        }

        // Add title
        response += challenge.title;

        // Add progress if requested
        if (includeProgress) {
            response += ` — ${challenge.getProgressString()}`;
        }

        // Add timer info if present and requested
        if (includeTimer && challenge.timer) {
            response += ` • ${challenge.getTimerString()} timer started`;
        }

        // Add status emoji if requested
        if (includeEmoji) {
            response += ` ${challenge.getStatusEmoji()}`;
        }

        response += ` ${SUCCESS_MESSAGES.CHALLENGE_ADDED}`;

        return response;
    }

    /**
     * Format a success response for completing challenges
     * @param challenges - The completed challenges
     * @param indices - Array indices of the challenges for display positions
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatCompleteResponse(
        challenges: Challenge[],
        indices: number[],
        options: ResponseOptions = {}
    ): string {
        const { includeEmoji = true, includeShortId = true } = options;

        if (challenges.length === 0) {
            return ERROR_MESSAGES.NO_CHALLENGES_WERE_COMPLETED;
        }

        if (challenges.length === 1) {
            const challenge = challenges[0];
            const index = indices[0];
            if (!challenge || index === undefined)
                return ERROR_MESSAGES.ERROR_CHALLENGE_NOT_FOUND;

            let response = `${SUCCESS_MESSAGES.GOOD_JOB_COMPLETING} `;

            if (includeShortId) {
                response += `challenge #${formatDisplayPosition(index)}`;
            } else {
                response += `"${challenge.title}"`;
            }

            if (includeEmoji) {
                response += " ✅";
            }

            response += "!";
            return response;
        }

        // Multiple challenges
        const challengeIds = challenges.map((c, i) => {
            const index = indices[i];
            if (index === undefined) {
                throw new Error(
                    `Index mismatch: challenge at position ${i} has no corresponding index`
                );
            }
            return includeShortId
                ? `#${formatDisplayPosition(index)}`
                : `"${c.title}"`;
        });
        let response = `${
            SUCCESS_MESSAGES.GOOD_JOB_COMPLETING_CHALLENGES
        } ${challengeIds.join(", ")}`;

        if (includeEmoji) {
            response += " ✅";
        }

        response += "!";
        return response;
    }

    /**
     * Format a success response for editing a challenge
     * @param challenge - The edited challenge
     * @param index - Array index of the challenge for display position
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatEditResponse(
        challenge: Challenge,
        index: number,
        options: ResponseOptions = {}
    ): string {
        const { includeShortId = true } = options;

        let response = "Challenge ";

        if (includeShortId) {
            response += `#${formatDisplayPosition(index)}`;
        } else {
            response += `"${challenge.title}"`;
        }

        response += ` ${SUCCESS_MESSAGES.CHALLENGE_UPDATED}`;
        return response;
    }

    /**
     * Format a success response for deleting challenges
     * @param challenges - The deleted challenges
     * @param indices - Array indices of the challenges for display positions
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatDeleteResponse(
        challenges: Challenge[],
        indices: number[],
        options: ResponseOptions = {}
    ): string {
        const { includeShortId = true } = options;

        if (challenges.length === 0) {
            return ERROR_MESSAGES.NO_CHALLENGES_WERE_DELETED;
        }

        if (challenges.length === 1) {
            const challenge = challenges[0];
            const index = indices[0];
            if (!challenge || index === undefined)
                return ERROR_MESSAGES.ERROR_CHALLENGE_NOT_FOUND;

            let response = "Challenge ";

            if (includeShortId) {
                response += `#${formatDisplayPosition(index)}`;
            } else {
                response += `"${challenge.title}"`;
            }

            response += ` ${SUCCESS_MESSAGES.CHALLENGE_DELETED}`;
            return response;
        }

        // Multiple challenges
        const challengeIds = challenges.map((c, i) => {
            const index = indices[i];
            if (index === undefined) {
                throw new Error(
                    `Index mismatch: challenge at position ${i} has no corresponding index`
                );
            }
            return includeShortId
                ? `#${formatDisplayPosition(index)}`
                : `"${c.title}"`;
        });
        return `Challenges ${challengeIds.join(", ")} ${
            SUCCESS_MESSAGES.CHALLENGES_DELETED
        }`;
    }

    /**
     * Format a response for failing challenges
     * @param challenges - The failed challenges
     * @param indices - Array indices of the challenges for display positions
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatFailResponse(
        challenges: Challenge[],
        indices: number[],
        options: ResponseOptions = {}
    ): string {
        const { includeEmoji = true, includeShortId = true } = options;

        if (challenges.length === 0) {
            return ERROR_MESSAGES.NO_CHALLENGES_WERE_FAILED;
        }

        if (challenges.length === 1) {
            const challenge = challenges[0];
            const index = indices[0];
            if (!challenge || index === undefined)
                return ERROR_MESSAGES.ERROR_CHALLENGE_NOT_FOUND_DETAILED;

            let response = "Challenge ";

            if (includeShortId) {
                response += `#${formatDisplayPosition(index)}`;
            } else {
                response += `"${challenge.title}"`;
            }

            response += ` ${SUCCESS_MESSAGES.CHALLENGE_MARKED_FAILED}`;

            if (includeEmoji) {
                response += " ❌";
            }

            return response;
        }

        // Multiple challenges
        const challengeIds = challenges.map((c, i) => {
            const index = indices[i];
            if (index === undefined) {
                throw new Error(
                    `Index mismatch: challenge at position ${i} has no corresponding index`
                );
            }
            return includeShortId
                ? `#${formatDisplayPosition(index)}`
                : `"${c.title}"`;
        });
        let response = `Challenges ${challengeIds.join(", ")} ${
            SUCCESS_MESSAGES.CHALLENGE_MARKED_FAILED
        }`;

        if (includeEmoji) {
            response += " ❌";
        }

        return response;
    }

    /**
     * Format a success response for reverting completed challenges back to active status
     * @param challenges - The reverted challenges
     * @param indices - Array indices of the challenges for display positions
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatUndoneResponse(
        challenges: Challenge[],
        indices: number[],
        options: ResponseOptions = {}
    ): string {
        const { includeEmoji = true, includeShortId = true } = options;

        if (challenges.length === 0) {
            return ERROR_MESSAGES.NO_CHALLENGES_WERE_REVERTED;
        }

        if (challenges.length === 1) {
            const challenge = challenges[0];
            const index = indices[0];
            if (!challenge || index === undefined)
                return ERROR_MESSAGES.ERROR_CHALLENGE_NOT_FOUND_DETAILED;

            let response = "Challenge ";

            if (includeShortId) {
                response += `#${formatDisplayPosition(index)}`;
            } else {
                response += `"${challenge.title}"`;
            }

            response += ` ${SUCCESS_MESSAGES.CHALLENGE_REVERTED}`;

            if (includeEmoji) {
                response += " 🔄";
            }

            response += "!";
            return response;
        }

        // Multiple challenges
        const challengeIds = challenges.map((c, i) => {
            const index = indices[i];
            if (index === undefined) {
                throw new Error(
                    `Index mismatch: challenge at position ${i} has no corresponding index`
                );
            }
            return includeShortId
                ? `#${formatDisplayPosition(index)}`
                : `"${c.title}"`;
        });
        let response = `Challenges ${challengeIds.join(", ")} ${
            SUCCESS_MESSAGES.CHALLENGES_REVERTED
        }`;

        if (includeEmoji) {
            response += " 🔄";
        }

        response += "!";
        return response;
    }

    /**
     * Format a response for progress updates
     * @param challenge - The updated challenge
     * @param index - Array index of the challenge for display position
     * @param oldProgress - Previous progress value
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatProgressResponse(
        challenge: Challenge,
        index: number,
        oldProgress: number,
        options: ResponseOptions = {}
    ): string {
        const { includeShortId = true, includeProgress = true } = options;

        let response = "Challenge ";

        if (includeShortId) {
            response += `#${formatDisplayPosition(index)}`;
        } else {
            response += `"${challenge.title}"`;
        }

        if (includeProgress) {
            response += ` progress: ${oldProgress}/${
                challenge.amount
            } → ${challenge.getProgressString()}`;
        } else {
            response += ` ${SUCCESS_MESSAGES.PROGRESS_UPDATED}`;
        }

        // Add completion notice if challenge was completed
        if (challenge.isComplete() && oldProgress < challenge.amount) {
            response += ` ${SUCCESS_MESSAGES.COMPLETED_INDICATOR}`;
        }

        return response;
    }

    /**
     * Format a list of challenges for display
     * @param challenges - Challenges to format
     * @param options - Formatting options
     * @param indices - Optional array of original indices for position numbering
     * @returns Formatted challenge list
     */
    static formatChallengeList(
        challenges: Challenge[],
        options: ResponseOptions = {},
        indices?: number[]
    ): string {
        const {
            includeEmoji = true,
            includeProgress = true,
            includeTimer = false,
            includeShortId = true,
            maxLength = 400,
        } = options;

        if (challenges.length === 0) {
            return ERROR_MESSAGES.NO_CHALLENGES_FOUND;
        }

        const formattedChallenges = challenges.map((challenge, index) => {
            let item = "";

            if (includeShortId) {
                // Use original index if provided, otherwise fall back to sequential numbering
                const displayIndex = indices ? indices[index] : index;
                if (displayIndex === undefined) {
                    throw new Error(
                        `Index mismatch: challenge at position ${index} has no corresponding original index`
                    );
                }
                item += `#${formatDisplayPosition(displayIndex)} `;
            }

            item += challenge.title;

            if (includeProgress) {
                item += ` (${challenge.getProgressString()})`;
            }

            if (includeTimer && challenge.timer && challenge.timer.isActive) {
                item += ` [${challenge.getTimerString()}]`;
            }

            if (includeEmoji) {
                item += ` ${challenge.getStatusEmoji()}`;
            }

            return item;
        });

        let result = formattedChallenges.join(", ");

        // Truncate if too long
        if (maxLength && result.length > maxLength) {
            const truncated = result.substring(0, maxLength - 3) + "...";
            result = truncated;
        }

        return result;
    }

    /**
     * Format an error response with enhanced error information preservation
     * @param error - Error of any type (unknown for maximum type safety)
     * @param context - Optional context for the error
     * @returns Formatted error message
     */
    static formatError(error: unknown, context?: string): string {
        const parts = ResponseFormatter.normalizeError(error);
        const prefix = context ? `Error ${context}` : `Error`;
        const namePart =
            parts.name && parts.name !== "Error" ? ` [${parts.name}]` : "";
        return `${prefix}${namePart}: ${parts.message}`;
    }

    /**
     * Normalize any error type into structured error information
     * @param error - Error of any type
     * @returns Normalized error information
     */
    private static normalizeError(error: unknown): {
        message: string;
        name?: string;
        stack?: string;
        code?: string;
    } {
        if (error instanceof Error) {
            const anyErr = error as Error & { code?: string };
            return {
                message: error.message || String(error),
                name: error.name,
                ...(error.stack && { stack: error.stack }),
                ...(anyErr.code && { code: anyErr.code }),
            };
        }
        if (typeof error === "string") {
            return { message: error, name: "Error" };
        }
        try {
            return { message: JSON.stringify(error), name: "UnknownError" };
        } catch {
            return { message: String(error), name: "UnknownError" };
        }
    }

    /**
     * Format a help response with available commands
     * @param commands - Array of command descriptions
     * @returns Formatted help message
     */
    static formatHelp(commands: string[] = []): string {
        if (commands.length === 0) {
            return HELP_MESSAGES.GENERAL_HELP;
        }

        return `Available commands: ${commands.join(", ")}`;
    }

    /**
     * Format a clear response
     * @param type - Type of clear operation
     * @param count - Number of items cleared
     * @returns Formatted clear message
     */
    static formatClearResponse(type: "all" | "done", count?: number): string {
        if (type === "all") {
            return count !== undefined
                ? `All ${count} challenges have been cleared`
                : "All challenges have been cleared";
        } else {
            return count !== undefined
                ? `All ${count} completed challenges have been cleared`
                : "All completed challenges have been cleared";
        }
    }

    /**
     * Format a validation error response
     * @param errors - Array of validation errors
     * @returns Formatted validation error message
     */
    static formatValidationError(errors: string[]): string {
        if (errors.length === 0) {
            return ERROR_MESSAGES.INVALID_COMMAND_FORMAT;
        }

        if (errors.length === 1) {
            return ERROR_MESSAGES.INVALID_COMMAND_SINGLE.replace(
                "{error}",
                errors[0] || ""
            );
        }

        return ERROR_MESSAGES.INVALID_COMMAND_MULTIPLE.replace(
            "{errors}",
            errors.join(", ")
        );
    }

    /**
     * Format a permission error response
     * @returns Formatted permission error message
     */
    static formatPermissionError(): string {
        return PERMISSION_MESSAGES.MODERATOR_ONLY;
    }

    /**
     * Format a "not found" error response
     * @param type - Type of item not found
     * @param identifier - Identifier that wasn't found
     * @returns Formatted not found message
     */
    static formatNotFoundError(type: string, identifier: string): string {
        return ERROR_MESSAGES.GENERIC_NOT_FOUND.replace("{type}", type).replace(
            "{identifier}",
            identifier
        );
    }

    /**
     * Format a limit reached error response
     * @param limit - The limit that was reached
     * @returns Formatted limit error message
     */
    static formatLimitError(limit: number): string {
        return ERROR_MESSAGES.MAXIMUM_CHALLENGES_REACHED.replace(
            "{limit}",
            limit.toString()
        );
    }
}
