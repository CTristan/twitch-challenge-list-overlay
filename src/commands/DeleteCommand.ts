import type { CommandResponse } from "../types/CommandResponse";
import { ERROR_MESSAGES } from "../types/MessageConstants";
import { UIUpdateAction } from "../types/UIUpdateAction";
import type { UIUpdateData } from "../types/UIUpdateData";
import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to delete challenges
 * Handles: !ch delete 1 or !ch delete 1,3,5
 */
export class DeleteCommand extends BaseCommand {
    /**
     * Execute the delete command
     * @param parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Handle multiple target IDs
            const { challenges, indices, response } =
                this.handleMultipleTargets(parsed.targetId || "", "delete");
            if (response) {
                return response;
            }

            if (challenges.length === 0) {
                return this.createErrorResponse(
                    ERROR_MESSAGES.NO_VALID_CHALLENGES_TO_DELETE
                );
            }

            // Store challenge info before deletion for response
            const challengesToDelete = challenges.map((c, i) => {
                const index = indices[i];
                if (index === undefined) {
                    throw new Error(
                        `Missing index for challenge at position ${i}`
                    );
                }
                return {
                    challenge: c,
                    index: index,
                };
            });

            // Delete challenges by indices (sort in descending order to avoid index shifting)
            const sortedIndices = [...indices].sort((a, b) => b - a);
            this.challengeList.deleteChallenges(sortedIndices);

            const deletedChallenges = challenges;

            // Check if any challenges were actually deleted
            if (deletedChallenges.length === 0) {
                return this.createErrorResponse("No challenges were deleted");
            }

            // Changes are automatically saved to localStorage

            // Format response using the stored challenge info
            const responseMessage = ResponseFormatter.formatDeleteResponse(
                challengesToDelete.map((info) => info.challenge),
                challengesToDelete.map((info) => info.index),
                {
                    includeShortId: true,
                }
            );

            // Create UI update data
            const uiUpdate: UIUpdateData = {
                action: UIUpdateAction.DELETE,
                challengeIndices: challengesToDelete.map((info) => info.index),
                challenges: challengesToDelete.map((info) => info.challenge),
                updateTimers: true,
                updateCount: true,
            };

            return this.createSuccessResponseWithUIUpdate(
                responseMessage,
                uiUpdate
            );
        } catch (error: unknown) {
            return this.createErrorResponse(
                ResponseFormatter.formatError(error, "deleting challenges")
            );
        }
    }
}
