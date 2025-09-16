import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to mark challenges as failed
 * Handles: !ch fail 1 or !ch fail 1,3,5
 */
export class FailCommand extends BaseCommand {
    /**
     * Execute the fail command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Handle multiple target IDs
            const { challenges, response } = this.handleMultipleTargets(
                parsed.targetId || "",
                "fail"
            );
            if (response) {
                return response;
            }

            if (challenges.length === 0) {
                return this.createErrorResponse(
                    "No valid challenges found to mark as failed"
                );
            }

            // Mark challenges as failed
            const failedChallenges = challenges.filter((challenge) => {
                if (!challenge.isFailed()) {
                    challenge.setFailureStatus(true);

                    // Stop timer if running
                    if (challenge.timer && challenge.timer.isActive) {
                        challenge.timer.stop();
                    }

                    return true;
                }
                return false;
            });

            // Check if any challenges were actually marked as failed
            if (failedChallenges.length === 0) {
                const alreadyFailed = challenges
                    .map((c) => `#${c.shortId}`)
                    .join(", ");
                return this.createErrorResponse(
                    `Challenge(s) ${alreadyFailed} already marked as failed`
                );
            }

            // Changes are automatically saved to localStorage

            // Format response
            const responseMessage = ResponseFormatter.formatFailResponse(
                failedChallenges,
                {
                    includeEmoji: true,
                    includeShortId: true,
                }
            );

            return this.createSuccessResponse(
                responseMessage,
                "fail",
                failedChallenges.map((c) => c.shortId).join(",")
            );
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    "marking challenges as failed"
                )
            );
        }
    }
}
