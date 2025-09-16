import type Challenge from "../classes/Challenge";
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
            const { challenge, response } = this.handleSingleTarget(
                parsed.targetId || "",
                "show"
            );
            if (response) {
                return response;
            }

            if (!challenge) {
                return this.createErrorResponse("Challenge not found");
            }

            // Format detailed challenge information
            const responseMessage = this.formatChallengeDetails(challenge);

            return this.createSuccessResponse(
                responseMessage,
                "show",
                challenge.shortId
            );
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
     * @returns Formatted challenge details
     */
    private formatChallengeDetails(challenge: Challenge): string {
        const parts: string[] = [];

        // Challenge ID and title
        parts.push(`[#${challenge.shortId}] ${challenge.title}`);

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
        if (challenge.id) {
            const createdTime = new Date(
                parseInt(challenge.id)
            ).toLocaleString();
            parts.push(`Created: ${createdTime}`);
        }

        return parts.join(" • ");
    }
}
