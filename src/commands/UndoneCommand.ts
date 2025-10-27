import type Challenge from "../classes/Challenge";
import { ChallengeStatus } from "../types/ChallengeStatus";
import type { CommandResponse } from "../types/CommandResponse";
import { ERROR_MESSAGES } from "../types/MessageConstants";
import { UIUpdateAction } from "../types/UIUpdateAction";
import type { UIUpdateData } from "../types/UIUpdateData";
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
                    ERROR_MESSAGES.NO_VALID_CHALLENGES_TO_REVERT
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

                if (challenge.getStatus() === ChallengeStatus.COMPLETED) {
                    challenge.setStatus(ChallengeStatus.IN_PROGRESS);

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
                    "reverting challenges to active status"
                )
            );
        }
    }
}
