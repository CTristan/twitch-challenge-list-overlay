import type Challenge from "../classes/Challenge";
import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to revert completed challenges back to active status
 * Handles: !ch undone 1 or !ch undone 1,3,5
 */
export class UndoneCommand extends BaseCommand {
    /**
     * Execute the undone command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Handle multiple target IDs
            const { challenges, indices, response } =
                this.handleMultipleTargets(parsed.targetId || "", "undone");
            if (response) {
                return response;
            }

            if (challenges.length === 0) {
                return this.createErrorResponse(
                    "No valid challenges found to revert"
                );
            }

            // Revert challenges from completed to active status and track indices
            const revertedChallenges: Challenge[] = [];
            const revertedIndices: number[] = [];
            const alreadyActiveIndices: number[] = [];

            challenges.forEach((challenge, i) => {
                // Ensure the index exists (challenges and indices should be parallel arrays)
                const challengeIndex = indices[i];
                if (challengeIndex === undefined) {
                    throw new Error(
                        `Index mismatch: challenge at position ${i} has no corresponding index`
                    );
                }

                if (challenge.isComplete()) {
                    challenge.setCompletionStatus(false);

                    // Restart timer if it exists and was stopped due to completion
                    if (challenge.timer && !challenge.timer.isActive) {
                        // Restart the timer (it was stopped when challenge was completed)
                        challenge.timer.start();
                    }

                    revertedChallenges.push(challenge);
                    revertedIndices.push(challengeIndex);
                } else {
                    alreadyActiveIndices.push(challengeIndex);
                }
            });

            // Check if any challenges were actually reverted
            if (revertedChallenges.length === 0) {
                const alreadyActive = alreadyActiveIndices
                    .map((index) => `#${index + 1}`)
                    .join(", ");
                return this.createErrorResponse(
                    `Challenge(s) ${alreadyActive} already active`
                );
            }

            // Changes are automatically saved to localStorage

            // Format response
            const responseMessage = ResponseFormatter.formatUndoneResponse(
                revertedChallenges,
                revertedIndices,
                {
                    includeEmoji: true,
                    includeShortId: true,
                }
            );

            return this.createSuccessResponse(responseMessage, "undone");
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    "reverting challenges to active status"
                )
            );
        }
    }
}
