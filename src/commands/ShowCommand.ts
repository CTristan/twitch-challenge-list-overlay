import type Challenge from "../classes/Challenge";
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
                return this.createErrorResponse("Challenge not found");
            }

            // Format detailed challenge information
            const responseMessage = this.formatChallengeDetails(
                challenge,
                index
            );

            return this.createSuccessResponse(responseMessage, "show");
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
            parts.push(`Description: ${challenge.description}`);
        }

        // Progress information
        parts.push(`Progress: ${challenge.getProgressString()}`);

        // Status
        const statusEmoji = challenge.getStatusEmoji();
        let statusText = "In Progress";
        if (challenge.isComplete()) {
            statusText = "Completed";
        } else if (challenge.isFailed()) {
            statusText = "Failed";
        }
        parts.push(`Status: ${statusText} ${statusEmoji}`);

        // Timer information if present
        if (challenge.timer) {
            const timerStatus = challenge.timer.isActive ? "Active" : "Stopped";
            const timeRemaining = challenge.timer.isActive
                ? challenge.getTimerString()
                : "Timer stopped";
            parts.push(`Timer: ${timerStatus} (${timeRemaining})`);
        }

        // Creation time if available
        if (challenge.createdAt !== undefined && challenge.createdAt !== null) {
            const createdTime = new Date(challenge.createdAt).toLocaleString();
            parts.push(`Created: ${createdTime}`);
        } else {
            parts.push(`Created: Unknown`);
        }

        return parts.join(" • ");
    }
}
