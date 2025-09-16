import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to mark challenges as completed
 * Handles: !ch done 1 or !ch done 1,3,5
 */
export class DoneCommand extends BaseCommand {
    /**
     * Execute the done command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Handle multiple target IDs
            const { challenges, response } = this.handleMultipleTargets(
                parsed.targetId || "",
                "done"
            );
            if (response) {
                return response;
            }

            if (challenges.length === 0) {
                return this.createErrorResponse(
                    "No valid challenges found to mark as done"
                );
            }

            // Mark challenges as completed
            const completedChallenges = challenges.filter((challenge) => {
                if (!challenge.isComplete()) {
                    challenge.setCompletionStatus(true);

                    // Stop timer if running
                    if (challenge.timer && challenge.timer.isActive) {
                        challenge.timer.stop();
                    }

                    return true;
                }
                return false;
            });

            // Check if any challenges were actually completed
            if (completedChallenges.length === 0) {
                const alreadyCompleted = challenges
                    .map((c) => `#${c.shortId}`)
                    .join(", ");
                return this.createErrorResponse(
                    `Challenge(s) ${alreadyCompleted} already completed`
                );
            }

            // Changes are automatically saved to localStorage

            // Format response
            const responseMessage = ResponseFormatter.formatCompleteResponse(
                completedChallenges,
                {
                    includeEmoji: true,
                    includeShortId: true,
                }
            );

            return this.createSuccessResponse(
                responseMessage,
                "done",
                completedChallenges.map((c) => c.shortId).join(",")
            );
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    "marking challenges as done"
                )
            );
        }
    }
}
