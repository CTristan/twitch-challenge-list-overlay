import type Challenge from "../classes/Challenge";
import { ChallengeStatus } from "../types/ChallengeStatus";
import type { CommandResponse } from "../types/CommandResponse";
import { UIUpdateAction } from "../types/UIUpdateAction";
import type { UIUpdateData } from "../types/UIUpdateData";
import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to revert failed challenges back to active status
 * Handles: !ch unfail 1 or !ch unfail 1,3,5
 */
export class UnfailCommand extends BaseCommand {
    /**
     * Execute the unfail command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Handle multiple target IDs
            const { challenges, indices, response } =
                this.handleMultipleTargets(parsed.targetId || "", "unfail");
            if (response) {
                return response;
            }

            if (challenges.length === 0) {
                return this.createErrorResponse(
                    "No valid challenges found to unfail"
                );
            }

            // Revert challenges from failed to active status and track indices
            const revertedChallenges: Challenge[] = [];
            const revertedIndices: number[] = [];
            const notFailedIndices: number[] = [];

            challenges.forEach((challenge, i) => {
                // Ensure the index exists (challenges and indices should be parallel arrays)
                const challengeIndex = indices[i];
                if (challengeIndex === undefined) {
                    throw new Error(
                        `Index mismatch: challenge at position ${i} has no corresponding index`
                    );
                }

                if (challenge.getStatus() === ChallengeStatus.FAILED) {
                    challenge.setStatus(ChallengeStatus.IN_PROGRESS);

                    revertedChallenges.push(challenge);
                    revertedIndices.push(challengeIndex);
                } else {
                    notFailedIndices.push(challengeIndex);
                }
            });

            // Check if any challenges were actually reverted
            if (revertedChallenges.length === 0) {
                const notFailed = notFailedIndices
                    .map((index) => `#${index + 1}`)
                    .join(", ");
                return this.createErrorResponse(
                    `Challenge(s) ${notFailed} not marked as failed`
                );
            }

            // Changes are automatically saved to localStorage

            // Format response (reuse undone formatter as the logic is similar)
            const responseMessage = `Unfailed ${
                revertedChallenges.length
            } challenge(s): ${revertedIndices
                .map((idx) => `#${idx + 1}`)
                .join(", ")}`;

            // Create UI update data
            const uiUpdate: UIUpdateData = {
                action: UIUpdateAction.REVERT,
                challengeIndices: revertedIndices,
                challenges: revertedChallenges,
                updateTimers: true,
                updateCount: true,
            };

            return this.createSuccessResponseWithUIUpdate(
                responseMessage,
                uiUpdate
            );
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(
                    error,
                    "reverting challenges from failed status"
                )
            );
        }
    }
}
