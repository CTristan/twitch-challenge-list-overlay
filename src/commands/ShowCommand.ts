import type Challenge from "../classes/Challenge";
import type { CommandResponse } from "../types/CommandResponse";
import { ERROR_MESSAGES, STATUS_MESSAGES } from "../types/MessageConstants";
import { formatDisplayPosition } from "../utils/PositionUtils";
import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to show specific challenge details
 * Handles: !ch show 1
 */
export class ShowCommand extends BaseCommand {
    /**
     * Execute the show command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Handle single target ID for show
            const { challenge, index, response } = this.handleSingleTarget(
                parsed.targetId || "",
                "show"
            );
            if (response) {
                return response;
            }

            if (!challenge || index === undefined) {
                return this.createErrorResponse(
                    ERROR_MESSAGES.CHALLENGE_NOT_FOUND
                );
            }

            // Format detailed challenge information
            const responseMessage = this.formatChallengeDetails(
                challenge,
                index
            );

            return this.createSuccessResponse(responseMessage);
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    "showing challenge details"
                )
            );
        }
    }

    /**
     * Format detailed challenge information
     * @param challenge - Challenge to format
     * @param index - Array index of the challenge
     * @returns Formatted challenge details
     */
    private formatChallengeDetails(
        challenge: Challenge,
        index: number
    ): string {
        const parts: string[] = [];

        // Challenge ID and title
        parts.push(`[#${formatDisplayPosition(index)}] ${challenge.title}`);

        // Description if present
        if (challenge.description && challenge.description.trim()) {
            parts.push(
                `${STATUS_MESSAGES.DESCRIPTION_LABEL} ${challenge.description}`
            );
        }

        // Progress information
        parts.push(
            `${STATUS_MESSAGES.PROGRESS_LABEL} ${challenge.getProgressString()}`
        );

        // Status
        const statusEmoji = challenge.getStatusEmoji();
        let statusText: string = STATUS_MESSAGES.IN_PROGRESS;
        if (challenge.isComplete()) {
            statusText = STATUS_MESSAGES.COMPLETED;
        } else if (challenge.isFailed()) {
            statusText = STATUS_MESSAGES.FAILED;
        }
        parts.push(
            `${STATUS_MESSAGES.STATUS_LABEL} ${statusText} ${statusEmoji}`
        );

        // Timer information if present
        if (challenge.timer) {
            const timerStatus = challenge.timer.isActive
                ? STATUS_MESSAGES.TIMER_ACTIVE
                : STATUS_MESSAGES.TIMER_STOPPED;
            const timeRemaining = challenge.timer.isActive
                ? challenge.getTimerString()
                : "Timer stopped";
            parts.push(
                `${STATUS_MESSAGES.TIMER_LABEL} ${timerStatus} (${timeRemaining})`
            );
        }

        // Creation time if available
        if (challenge.createdAt !== undefined && challenge.createdAt !== null) {
            const createdTime = new Date(challenge.createdAt).toLocaleString();
            parts.push(`${STATUS_MESSAGES.CREATED_LABEL} ${createdTime}`);
        } else {
            parts.push(
                `${STATUS_MESSAGES.CREATED_LABEL} ${STATUS_MESSAGES.CREATED_UNKNOWN}`
            );
        }

        return parts.join(" • ");
    }
}
