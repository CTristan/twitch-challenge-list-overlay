import type { CommandResponse } from "../types/CommandResponse";
import { ERROR_MESSAGES } from "../types/MessageConstants";
import { UIUpdateAction } from "../types/UIUpdateAction";
import type { UIUpdateData } from "../types/UIUpdateData";
import { ResponseFormatter } from "../utils/ResponseFormatter";
import { BaseCommand } from "./Command";

/**
 * Command to clear completed challenges
 * Handles: !ch cleardone
 */
export class ClearDoneCommand extends BaseCommand {
    /**
     * Execute the clear done command
     * @param _parsed - Parsed command data
     * @param _username - Username of the command sender
     * @returns Command response
     */
    execute(_parsed: ParsedCommand, _username: string): CommandResponse {
        try {
            // Get completed challenges count before clearing
            const completedChallenges = this.challengeList.challenges.filter(
                (c) => c.isComplete()
            );
            const completedCount = completedChallenges.length;

            // Check if there are any completed challenges to clear
            if (completedCount === 0) {
                return this.createSuccessResponse(
                    ERROR_MESSAGES.NO_COMPLETED_CHALLENGES_TO_CLEAR
                );
            }

            // Clear completed challenges (automatically saves to localStorage)
            this.challengeList.clearDoneChallenges();

            // Format response
            const responseMessage = ResponseFormatter.formatClearResponse(
                "done",
                completedCount
            );

            // Create UI update data
            const uiUpdate: UIUpdateData = {
                action: UIUpdateAction.CLEAR_DONE,
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
                    "clearing completed challenges"
                )
            );
        }
    }
}
