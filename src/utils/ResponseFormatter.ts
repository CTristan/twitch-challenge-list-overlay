import Challenge from "../classes/Challenge";

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
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatAddResponse(
        challenge: Challenge,
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
            response += `[#${challenge.shortId}] `;
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

        response += " added!";

        return response;
    }

    /**
     * Format a success response for completing challenges
     * @param challenges - The completed challenges
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatCompleteResponse(
        challenges: Challenge[],
        options: ResponseOptions = {}
    ): string {
        const { includeEmoji = true, includeShortId = true } = options;

        if (challenges.length === 0) {
            return "No challenges were completed.";
        }

        if (challenges.length === 1) {
            const challenge = challenges[0];
            if (!challenge) return "Error: Challenge not found";

            let response = "Good job on completing ";

            if (includeShortId) {
                response += `challenge #${challenge.shortId}`;
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
        const challengeIds = challenges.map((c) =>
            includeShortId ? `#${c.shortId}` : `"${c.title}"`
        );
        let response = `Good job on completing challenges ${challengeIds.join(
            ", "
        )}`;

        if (includeEmoji) {
            response += " ✅";
        }

        response += "!";
        return response;
    }

    /**
     * Format a success response for editing a challenge
     * @param challenge - The edited challenge
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatEditResponse(
        challenge: Challenge,
        options: ResponseOptions = {}
    ): string {
        const { includeShortId = true } = options;

        let response = "Challenge ";

        if (includeShortId) {
            response += `#${challenge.shortId}`;
        } else {
            response += `"${challenge.title}"`;
        }

        response += " updated!";
        return response;
    }

    /**
     * Format a success response for deleting challenges
     * @param challenges - The deleted challenges
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatDeleteResponse(
        challenges: Challenge[],
        options: ResponseOptions = {}
    ): string {
        const { includeShortId = true } = options;

        if (challenges.length === 0) {
            return "No challenges were deleted.";
        }

        if (challenges.length === 1) {
            const challenge = challenges[0];
            if (!challenge) return "Error: Challenge not found";

            let response = "Challenge ";

            if (includeShortId) {
                response += `#${challenge.shortId}`;
            } else {
                response += `"${challenge.title}"`;
            }

            response += " has been deleted!";
            return response;
        }

        // Multiple challenges
        const challengeIds = challenges.map((c) =>
            includeShortId ? `#${c.shortId}` : `"${c.title}"`
        );
        return `Challenges ${challengeIds.join(", ")} have been deleted!`;
    }

    /**
     * Format a response for failing challenges
     * @param challenges - The failed challenges
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatFailResponse(
        challenges: Challenge[],
        options: ResponseOptions = {}
    ): string {
        const { includeEmoji = true, includeShortId = true } = options;

        if (challenges.length === 0) {
            return "No challenges were marked as failed.";
        }

        if (challenges.length === 1) {
            const challenge = challenges[0];
            if (!challenge) return "Error: Challenge not found";

            let response = "Challenge ";

            if (includeShortId) {
                response += `#${challenge.shortId}`;
            } else {
                response += `"${challenge.title}"`;
            }

            response += " marked as failed";

            if (includeEmoji) {
                response += " ❌";
            }

            return response;
        }

        // Multiple challenges
        const challengeIds = challenges.map((c) =>
            includeShortId ? `#${c.shortId}` : `"${c.title}"`
        );
        let response = `Challenges ${challengeIds.join(", ")} marked as failed`;

        if (includeEmoji) {
            response += " ❌";
        }

        return response;
    }

    /**
     * Format a response for progress updates
     * @param challenge - The updated challenge
     * @param oldProgress - Previous progress value
     * @param options - Formatting options
     * @returns Formatted response message
     */
    static formatProgressResponse(
        challenge: Challenge,
        oldProgress: number,
        options: ResponseOptions = {}
    ): string {
        const { includeShortId = true, includeProgress = true } = options;

        let response = "Challenge ";

        if (includeShortId) {
            response += `#${challenge.shortId}`;
        } else {
            response += `"${challenge.title}"`;
        }

        if (includeProgress) {
            response += ` progress: ${oldProgress}/${
                challenge.amount
            } → ${challenge.getProgressString()}`;
        } else {
            response += " progress updated";
        }

        // Add completion notice if challenge was completed
        if (challenge.isComplete() && oldProgress < challenge.amount) {
            response += " ✅ Completed!";
        }

        return response;
    }

    /**
     * Format a list of challenges for display
     * @param challenges - Challenges to format
     * @param options - Formatting options
     * @returns Formatted challenge list
     */
    static formatChallengeList(
        challenges: Challenge[],
        options: ResponseOptions = {}
    ): string {
        const {
            includeEmoji = true,
            includeProgress = true,
            includeTimer = false,
            includeShortId = true,
            maxLength = 400,
        } = options;

        if (challenges.length === 0) {
            return "No challenges found.";
        }

        const formattedChallenges = challenges.map((challenge) => {
            let item = "";

            if (includeShortId) {
                item += `#${challenge.shortId} `;
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
            return "Available commands: !ch add, !ch edit, !ch done, !ch delete, !ch list, !ch check, !ch clearall, !ch cleardone, !ch help";
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
            return "Invalid command format";
        }

        if (errors.length === 1) {
            return `Invalid command: ${errors[0]}`;
        }

        return `Invalid command: ${errors.join(", ")}`;
    }

    /**
     * Format a permission error response
     * @returns Formatted permission error message
     */
    static formatPermissionError(): string {
        return "Only moderators and the broadcaster can manage challenges";
    }

    /**
     * Format a "not found" error response
     * @param type - Type of item not found
     * @param identifier - Identifier that wasn't found
     * @returns Formatted not found message
     */
    static formatNotFoundError(type: string, identifier: string): string {
        return `${type} ${identifier} not found`;
    }

    /**
     * Format a limit reached error response
     * @param limit - The limit that was reached
     * @returns Formatted limit error message
     */
    static formatLimitError(limit: number): string {
        return `Maximum number of challenges reached (${limit}). Delete some challenges first.`;
    }
}
