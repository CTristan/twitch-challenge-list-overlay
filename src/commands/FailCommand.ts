import type Challenge from "../classes/Challenge";
import { ChallengeStatus } from "../types/ChallengeStatus";
import type { CommandResponse } from "../types/CommandResponse";
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
            const { challenges, indices, response } =
                this.handleMultipleTargets(parsed.targetId || "", "fail");
            if (response) {
                return response;
            }

            if (challenges.length === 0) {
                return this.createErrorResponse(
                    "No valid challenges found to mark as failed"
                );
            }

            // Mark challenges as failed and track indices
            const failedChallenges: Challenge[] = [];
            const failedIndices: number[] = [];
            const alreadyFailedIndices: number[] = [];

            challenges.forEach((challenge, i) => {
                // Ensure the index exists (challenges and indices should be parallel arrays)
                const challengeIndex = indices[i];
                if (challengeIndex === undefined) {
                    throw new Error(
                        `Index mismatch: challenge at position ${i} has no corresponding index`
                    );
                }

                if (challenge.getStatus() !== ChallengeStatus.FAILED) {
                    challenge.setStatus(ChallengeStatus.FAILED);

                    failedChallenges.push(challenge);
                    failedIndices.push(challengeIndex);
                } else {
                    alreadyFailedIndices.push(challengeIndex);
                }
            });

            // Check if any challenges were actually marked as failed
            if (failedChallenges.length === 0) {
                const alreadyFailed = alreadyFailedIndices
                    .map((index) => `#${index + 1}`)
                    .join(", ");
                return this.createErrorResponse(
                    `Challenge(s) ${alreadyFailed} already marked as failed`
                );
            }

            // Changes are automatically saved to localStorage

            // Format response
            const responseMessage = ResponseFormatter.formatFailResponse(
                failedChallenges,
                failedIndices,
                {
                    includeEmoji: true,
                    includeShortId: true,
                }
            );

            return this.createSuccessResponse(responseMessage);
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
