import type Challenge from "../classes/Challenge";
import type { CommandResponse } from "../types/CommandResponse";
import { UIUpdateAction } from "../types/UIUpdateAction";
import type { UIUpdateData } from "../types/UIUpdateData";
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
            const { challenges, indices, response } =
                this.handleMultipleTargets(parsed.targetId || "", "done");
            if (response) {
                return response;
            }

            if (challenges.length === 0) {
                return this.createErrorResponse(
                    "No valid challenges found to mark as done"
                );
            }

            // Mark challenges as completed and track indices
            const completedChallenges: Challenge[] = [];
            const completedIndices: number[] = [];
            const alreadyCompletedIndices: number[] = [];

            challenges.forEach((challenge, i) => {
                const index = indices[i];
                if (index === undefined) {
                    // This should never happen if handleMultipleTargets works correctly
                    throw new Error(`Index ${i} not found in indices array`);
                }

                if (!challenge.isComplete()) {
                    challenge.setCompletionStatus(true);

                    // Stop timer if running
                    if (challenge.timer && challenge.timer.isActive) {
                        challenge.timer.stop();
                    }

                    completedChallenges.push(challenge);
                    completedIndices.push(index);
                } else {
                    alreadyCompletedIndices.push(index);
                }
            });

            // Check if any challenges were actually completed
            if (completedChallenges.length === 0) {
                const alreadyCompleted = alreadyCompletedIndices
                    .map((index) => `#${index + 1}`)
                    .join(", ");
                return this.createErrorResponse(
                    `Challenge(s) ${alreadyCompleted} already completed`
                );
            }

            // Changes are automatically saved to localStorage

            // Format response
            const responseMessage = ResponseFormatter.formatCompleteResponse(
                completedChallenges,
                completedIndices,
                {
                    includeEmoji: true,
                    includeShortId: true,
                }
            );

            // Create UI update data
            const uiUpdate: UIUpdateData = {
                action: UIUpdateAction.COMPLETE,
                challengeIndices: completedIndices,
                challenges: completedChallenges,
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
                    "marking challenges as done"
                )
            );
        }
    }
}
